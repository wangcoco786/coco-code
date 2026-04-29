import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { useActiveSprintIssuesByProject } from '@/hooks/useProjectIssues'
import { useI18n } from '@/context/I18nContext'
import type { PlatformIssue } from '@/types/platform'
import styles from './GlobalSearch.module.css'

const PRIORITY_COLOR: Record<string, string> = {
  P0: 'var(--danger)', P1: 'var(--warning)', P2: 'var(--primary)', P3: 'var(--text2)',
}

interface SearchResult {
  type: 'issue' | 'page'
  id: string
  title: string
  subtitle?: string
  priority?: string
  status?: string
  path: string
}

// 静态页面搜索项
const PAGE_ITEMS: { keywords: string[]; titleKey: string; subtitleKey: string; path: string }[] = [
  { keywords: ['dashboard', '驾驶舱', 'panel'], titleKey: 'nav.dashboard', subtitleKey: 'dashboard.title', path: '/dashboard' },
  { keywords: ['requirements', '需求', 'requisitos', '要件'], titleKey: 'nav.requirements', subtitleKey: 'req.title', path: '/requirements' },
  { keywords: ['sprint', '看板', 'board'], titleKey: 'nav.sprint', subtitleKey: 'sprint.title', path: '/sprint' },
  { keywords: ['risk', '风险', 'riesgo', 'リスク'], titleKey: 'nav.risk', subtitleKey: 'risk.title', path: '/risk' },
  { keywords: ['reports', '报告', 'informe', 'レポート'], titleKey: 'nav.reports', subtitleKey: 'reports.title', path: '/reports' },
  { keywords: ['settings', '设置', 'configuración', '設定'], titleKey: 'nav.settings', subtitleKey: 'settings.title', path: '/settings' },
]

interface Props {
  placeholder: string
}

export default function GlobalSearch({ placeholder }: Props) {
  const { currentProjectKey } = useApp()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: issues = [] } = useActiveSprintIssuesByProject(currentProjectKey)

  // 直接通过 Jira 搜索 ticket（当本地没找到时）
  const [jiraResults, setJiraResults] = useState<PlatformIssue[]>([])
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q || !currentProjectKey) {
      setJiraResults([])
      return
    }
    // 如果本地已有结果，不需要远程搜索
    const localMatch = issues.some((i: PlatformIssue) =>
      i.id.toLowerCase().includes(q.toLowerCase()) || i.title.toLowerCase().includes(q.toLowerCase())
    )
    if (localMatch) {
      setJiraResults([])
      return
    }
    // 防抖远程搜索
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const { jiraClient } = await import('@/lib/jiraClient')
        const { mapJiraIssueToPlatform } = await import('@/lib/statusMapper')
        // 搜索 ticket key 或 summary
        const isTicketId = /^[A-Z]+-\d+$/i.test(q)
        const jql = isTicketId
          ? `key = "${q.toUpperCase()}"`
          : `project = ${currentProjectKey} AND summary ~ "${q}" ORDER BY updated DESC`
        const result = await jiraClient.searchIssues(
          jql,
          ['summary', 'status', 'priority', 'assignee', 'labels', 'created', 'updated', 'timeoriginalestimate', 'timespent', 'customfield_10016'],
          0, 10
        )
        setJiraResults(result.issues.map(mapJiraIssueToPlatform))
      } catch {
        setJiraResults([])
      }
    }, 400)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [query, currentProjectKey, issues])

  // 搜索结果
  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase()
    if (!q || q.length < 1) return []

    const out: SearchResult[] = []

    // 搜索页面
    PAGE_ITEMS.forEach(p => {
      const pTitle = t(p.titleKey as any)
      const pSubtitle = t(p.subtitleKey as any)
      if (p.keywords.some(k => k.includes(q)) || pTitle.toLowerCase().includes(q) || pSubtitle.toLowerCase().includes(q)) {
        out.push({ type: 'page', id: p.path, title: pTitle, subtitle: pSubtitle, path: p.path })
      }
    })

    // 搜索 Issue（ID 或标题）— 本地 Sprint issues + 远程 Jira 结果
    const allIssues = [...issues, ...jiraResults]
    const seenIds = new Set<string>()
    const issueResults = allIssues.filter((i: PlatformIssue) => {
      if (seenIds.has(i.id)) return false
      const match = i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)
      if (match) seenIds.add(i.id)
      return match
    }).slice(0, 10)

    issueResults.forEach((i: PlatformIssue) => {
      const statusLabel = i.status === 'todo' ? t('common.todo') : i.status === 'in_progress' ? t('common.inProgress') : i.status === 'in_review' ? t('common.inReview') : i.status === 'in_testing' ? t('common.inTesting') : t('common.completed')
      out.push({
        type: 'issue',
        id: i.id,
        title: i.title,
        subtitle: `${i.id} · ${statusLabel} · ${i.assignee?.name ?? t('common.unassigned')}`,
        priority: i.priority,
        status: i.status,
        path: '/sprint',
      })
    })

    return out.slice(0, 12)
  }, [query, issues, jiraResults])

  // 键盘导航
  useEffect(() => {
    setActiveIdx(0)
  }, [results])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[activeIdx]) { selectResult(results[activeIdx]) }
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  function selectResult(r: SearchResult) {
    navigate(r.path)
    setOpen(false)
    setQuery('')
  }

  // 点击外部关闭
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 高亮匹配文字
  function highlight(text: string, q: string) {
    if (!q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'rgba(22,119,255,0.2)', color: 'var(--primary)', borderRadius: 2 }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        aria-label={t('topbar.search')}
        autoComplete="off"
      />
      {query && (
        <button className={styles.clearBtn} onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }}>✕</button>
      )}

      {open && query.trim() && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {results.length === 0 ? (
            <div className={styles.empty}>
              <span>🔍</span> {t('search.noResults')} "<strong>{query}</strong>"
            </div>
          ) : (
            <>
              {/* 页面结果 */}
              {results.filter(r => r.type === 'page').length > 0 && (
                <div className={styles.group}>
                  <div className={styles.groupLabel}>{t('search.pages')}</div>
                  {results.filter(r => r.type === 'page').map((r, i) => (
                    <div
                      key={r.id}
                      className={`${styles.item} ${activeIdx === i ? styles.active : ''}`}
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => selectResult(r)}
                    >
                      <span className={styles.itemIcon}>📄</span>
                      <div className={styles.itemContent}>
                        <div className={styles.itemTitle}>{highlight(r.title, query)}</div>
                        <div className={styles.itemSub}>{r.subtitle}</div>
                      </div>
                      <span className={styles.itemArrow}>→</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Issue 结果 */}
              {results.filter(r => r.type === 'issue').length > 0 && (
                <div className={styles.group}>
                  <div className={styles.groupLabel}>{t('search.tasks')} · {currentProjectKey}</div>
                  {results.filter(r => r.type === 'issue').map((r, i) => {
                    const globalIdx = results.filter(x => x.type === 'page').length + i
                    return (
                      <div
                        key={r.id}
                        className={`${styles.item} ${activeIdx === globalIdx ? styles.active : ''}`}
                        onMouseEnter={() => setActiveIdx(globalIdx)}
                        onClick={() => selectResult(r)}
                      >
                        <span
                          className={styles.priorityDot}
                          style={{ background: PRIORITY_COLOR[r.priority ?? 'P2'] }}
                        />
                        <div className={styles.itemContent}>
                          <div className={styles.itemTitle}>{highlight(r.title, query)}</div>
                          <div className={styles.itemSub}>{r.subtitle}</div>
                        </div>
                        <span className={styles.itemArrow}>→</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className={styles.footer}>
                <span>{t('search.navigate')}</span>
                <span>{t('search.jump')}</span>
                <span>{t('search.close')}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
