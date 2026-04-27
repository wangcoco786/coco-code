import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useI18n } from '@/context/I18nContext'
import { useJiraProjects } from '@/hooks/useJiraBoard'
import { LOCALES } from '@/i18n'
import GlobalSearch from '@/components/GlobalSearch/GlobalSearch'
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

  const { data: projects, isLoading } = useJiraProjects()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {onMenuToggle && (
          <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="菜单">☰</button>
        )}
        <div className={styles.logo}>🤖 AI-PM</div>

        {/* 项目选择器 */}
        <select
          className={styles.projectSelect}
          value={currentProjectKey ?? ''}
          onChange={(e) => setCurrentProjectKey(e.target.value || null)}
          aria-label={t('topbar.selectBoard')}
          disabled={isLoading}
        >
          <option value="">{isLoading ? t('common.loading') : t('common.selectProject')}</option>
          {projects?.map((p) => (
            <option key={p.key} value={p.key}>
              [{p.key}] {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.center}>
        <GlobalSearch placeholder={t('topbar.search')} />
      </div>

      <div className={styles.right}>
        <button className={styles.bell} aria-label={`通知 ${notificationCount}`}>
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
            <span className={`${styles.roleTag} ${currentUser.role === 'PM' ? styles.pm : styles.dev}`}>
              {currentUser.role}
            </span>
          </button>
          {showUserMenu && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>{t('topbar.switchRole')}</div>
              {USERS.map((user) => (
                <button
                  key={user.id}
                  className={`${styles.dropdownItem} ${currentUser.id === user.id ? styles.active : ''}`}
                  onClick={() => { setCurrentUser(user); setShowUserMenu(false) }}
                >
                  <span className={`${styles.roleTag} ${user.role === 'PM' ? styles.pm : styles.dev}`}>
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
