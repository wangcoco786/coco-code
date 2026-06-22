import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { useI18n } from '@/context/I18nContext'
import { useJiraProjects } from '@/hooks/useJiraBoard'
import { PROJECT_GROUPS } from '@/lib/projectGroups'
import { LOCALES } from '@/i18n'
import GlobalSearch from '@/components/GlobalSearch/GlobalSearch'
import { getRefreshToken, clearTokens } from '@/lib/tokenManager'
import type { CurrentUser } from '@/types/platform'
import styles from './Topbar.module.css'

const USERS: CurrentUser[] = [
  { id: 'user-1', name: '张三', role: 'PM' },
  { id: 'user-2', name: '李四', role: 'DEV' },
  { id: 'user-3', name: '王五', role: 'DEV' },
]

export default function Topbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const {
    currentUser, currentProjectKey, notificationCount,
    setCurrentUser, setCurrentProjectKey,
  } = useApp()
  const { locale, setLocale, t } = useI18n()
  const navigate = useNavigate()

  const { data: projects, isLoading } = useJiraProjects()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  const handleLogout = async () => {
    try {
      const refreshToken = getRefreshToken()
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
    } catch {
      // Ignore network errors — still clear tokens and redirect
    } finally {
      clearTokens()
      window.location.href = '/login'
    }
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {onMenuToggle && (
          <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="菜单">☰</button>
        )}
        <div className={styles.logo}>🤖 AI-PM</div>

        {/* 项目选择器（支持搜索） */}
        <ProjectSearchSelect
          projects={projects ?? []}
          isLoading={isLoading}
          value={currentProjectKey}
          onChange={setCurrentProjectKey}
          placeholder={isLoading ? t('common.loading') : t('common.selectProject')}
          projectGroups={PROJECT_GROUPS}
        />
      </div>

      <div className={styles.center}>
        <GlobalSearch placeholder={t('topbar.search')} />
      </div>

      <div className={styles.right}>
        <button className={styles.bell} aria-label={`通知 ${notificationCount}`} onClick={() => navigate('/notifications')}>
          🔔
          {notificationCount > 0 && (
            <span className={styles.badge}>{notificationCount}</span>
          )}
        </button>

        {/* 语言切换 */}
        <div className={styles.userMenu}>
          <button
            className={styles.langBtn}
            onClick={() => setShowLangMenu(v => !v)}
            aria-label="切换语言"
          >
            {LOCALES.find(l => l.code === locale)?.flag} {locale.toUpperCase()}
          </button>
          {showLangMenu && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>Language / 语言</div>
              {LOCALES.map(l => (
                <button
                  key={l.code}
                  className={`${styles.dropdownItem} ${locale === l.code ? styles.active : ''}`}
                  onClick={() => { setLocale(l.code); setShowLangMenu(false) }}
                >
                  <span>{l.flag} {l.label}</span>
                  {locale === l.code && <span style={{ color: 'var(--primary)', fontSize: 12 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 用户菜单 */}
        <div className={styles.userMenu}>
          <button
            className={styles.avatar}
            onClick={() => setShowUserMenu((v) => !v)}
            aria-label={t('topbar.switchRole')}
          >
            <span className={`${styles.roleTag} ${currentUser?.role === 'PM' ? styles.pm : styles.dev}`}>
              {currentUser?.role ?? ''}
            </span>
          </button>
          {showUserMenu && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>{t('topbar.switchRole')}</div>
              {USERS.map((user) => (
                <button
                  key={user.id}
                  className={`${styles.dropdownItem} ${currentUser?.id === user.id ? styles.active : ''}`}
                  onClick={() => { setCurrentUser(user); setShowUserMenu(false) }}
                >
                  <span className={`${styles.roleTag} ${user.role === 'PM' ? styles.pm : styles.dev}`}>
                    {user.role}
                  </span>
                </button>
              ))}
              <div className={styles.dropdownDivider} />
              <button
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={handleLogout}
              >
                🚪 {t('topbar.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ============================================================
// ProjectSearchSelect — 支持搜索的项目选择器
// ============================================================

interface ProjectSearchSelectProps {
  projects: { key: string; name: string }[]
  isLoading: boolean
  value: string | null
  onChange: (key: string | null) => void
  placeholder: string
  projectGroups?: { key: string; name: string; projects: string[] }[]
}

function ProjectSearchSelect({ projects, isLoading, value, onChange, placeholder, projectGroups = [] }: ProjectSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // 打开时聚焦输入框
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // 过滤项目（排除已被分组的项目，在列表顶部显示项目组）
  const filtered = useMemo(() => {
    const groupedProjectKeys = new Set(projectGroups.flatMap(g => g.projects))
    const ungroupedProjects = projects.filter(p => !groupedProjectKeys.has(p.key))

    if (!search) {
      // 项目组 + 未分组的项目
      const groupItems = projectGroups.map(g => ({ key: g.key, name: `${g.name} (${g.projects.join(', ')})`, isGroup: true }))
      const projectItems = ungroupedProjects.map(p => ({ ...p, isGroup: false }))
      return [...groupItems, ...projectItems]
    }
    const kw = search.toLowerCase()
    const groupItems = projectGroups
      .filter(g => g.key.toLowerCase().includes(kw) || g.name.toLowerCase().includes(kw) || g.projects.some(p => p.toLowerCase().includes(kw)))
      .map(g => ({ key: g.key, name: `${g.name} (${g.projects.join(', ')})`, isGroup: true }))
    const projectItems = ungroupedProjects
      .filter(p => p.key.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw))
      .map(p => ({ ...p, isGroup: false }))
    return [...groupItems, ...projectItems]
  }, [projects, projectGroups, search])

  // 当前选中项目的显示文本
  const selectedProject = projects.find(p => p.key === value)
  const selectedGroup = projectGroups.find(g => g.key === value)
  const displayText = selectedGroup
    ? `[${selectedGroup.key}] ${selectedGroup.name}`
    : selectedProject
      ? `[${selectedProject.key}] ${selectedProject.name}`
      : placeholder

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* 触发按钮 */}
      <button
        className={styles.projectSelect}
        onClick={() => { setOpen(v => !v); setSearch('') }}
        disabled={isLoading}
        style={{ cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayText}
        </span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
      </button>

      {/* 下拉面板 */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 4,
          width: '100%',
          minWidth: 260,
          background: 'var(--card, #fff)',
          border: '1px solid var(--border, #e0e0e0)',
          borderRadius: 'var(--radius-md, 8px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* 搜索框 */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border, #f0f0f0)' }}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 搜索项目..."
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid var(--border, #e0e0e0)',
                borderRadius: 'var(--radius-sm, 4px)',
                fontSize: 13,
                outline: 'none',
                background: 'var(--bg, #f8f9fa)',
                color: 'var(--text, #333)',
              }}
            />
          </div>

          {/* 项目列表 */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text2, #999)', textAlign: 'center' }}>
                无匹配项目
              </div>
            ) : (
              filtered.map(p => (
                <button
                  key={p.key}
                  onClick={() => { onChange(p.key); setOpen(false); setSearch('') }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 14px',
                    border: 'none',
                    background: value === p.key ? 'var(--primary-light, #e6f0ff)' : 'none',
                    textAlign: 'left',
                    fontSize: 13,
                    cursor: 'pointer',
                    color: 'var(--text, #333)',
                    transition: 'background 0.15s',
                    fontWeight: p.isGroup ? 700 : 400,
                    borderBottom: p.isGroup ? '1px solid var(--border, #f0f0f0)' : 'none',
                  }}
                  onMouseEnter={(e) => { if (value !== p.key) e.currentTarget.style.background = 'var(--bg, #f8f9fa)' }}
                  onMouseLeave={(e) => { if (value !== p.key) e.currentTarget.style.background = 'none' }}
                >
                  <span style={{ fontWeight: 600, color: p.isGroup ? 'var(--success, #52c41a)' : 'var(--primary, #667eea)' }}>[{p.key}]</span>{' '}
                  {p.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
