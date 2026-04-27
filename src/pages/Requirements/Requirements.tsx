import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { useProjectIssues, useRefreshProjectIssues } from '@/hooks/useProjectIssues'
import { useI18n } from '@/context/I18nContext'
import type { IssueStatus, IssuePriority, PlatformIssue } from '@/types/platform'
import type { TranslationKey } from '@/i18n'
import styles from './Requirements.module.css'
import AIInsight from '@/components/AIInsight/AIInsight'

const JIRA_BASE_URL = import.meta.env.VITE_JIRA_BASE_URL || ''

// ─── helpers ────────────────────────────────────────────────

type ViewMode = 'list' | 'kanban'

// Kanban columns for requirements (backlog statuses)
const KANBAN_COLUMN_KEYS: { status: IssueStatus | 'draft'; labelKey: TranslationKey }[] = [
  { status: 'todo', labelKey: 'req.draft' },
  { status: 'in_review', labelKey: 'req.pendingReview' },
  { status: 'in_testing', labelKey: 'req.confirmed' },
  { status: 'in_progress', labelKey: 'req.inDev' },
  { status: 'done', labelKey: 'req.done' },
]

const STATUS_LABEL_KEYS: Record<IssueStatus, TranslationKey> = {
  todo: 'common.todo',
  in_progress: 'common.inProgress',
  in_review: 'common.inReview',
  in_testing: 'common.inTesting',
  done: 'common.completed',
}

const STATUS_TAG_CLASS: Record<IssueStatus, string> = {
  todo: styles.tagDefault,
  in_progress: styles.tagInfo,
  in_review: styles.tagWarning,
  in_testing: styles.tagWarning,
  done: styles.tagSuccess,
}

const PRIORITY_CLASS: Record<IssuePriority, string> = {
  P0: styles.p0,
  P1: styles.p1,
  P2: styles.p2,
  P3: styles.p3,
}

// ─── List View ───────────────────────────────────────────────

function ListView({ issues }: { issues: PlatformIssue[] }) {
  const { t } = useI18n()
  if (issues.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📭</div>
        <div className={styles.emptyText}>{t('req.noMatch')}</div>
      </div>
    )
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('req.id')}</th>
            <th>{t('req.title2')}</th>
            <th>{t('req.status')}</th>
            <th>{t('req.priority')}</th>
            <th>{t('req.assignee')}</th>
            <th>{t('req.labels')}</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td>{JIRA_BASE_URL
                ? <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>{issue.id}</a>
                : <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{issue.id}</span>
              }</td>
              <td>{issue.title}</td>
              <td>
                <span className={`${styles.tag} ${STATUS_TAG_CLASS[issue.status]}`}>
                  {t(STATUS_LABEL_KEYS[issue.status])}
                </span>
              </td>
              <td>
                <span className={`${styles.priorityBadge} ${PRIORITY_CLASS[issue.priority]}`}>
                  {issue.priority}
                </span>
              </td>
              <td>{issue.assignee?.name ?? <span style={{ color: 'var(--text2)' }}>{t('common.unassigned')}</span>}</td>
              <td>
                {issue.labels.length > 0
                  ? issue.labels.map((l) => (
                      <span key={l} className={`${styles.tag} ${styles.tagDefault}`}>{l}</span>
                    ))
                  : <span style={{ color: 'var(--text2)' }}>—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Kanban View ─────────────────────────────────────────────

function KanbanView({ issues }: { issues: PlatformIssue[] }) {
  const { t } = useI18n()
  return (
    <div className={styles.kanban}>
      {KANBAN_COLUMN_KEYS.map((col) => {
        const colIssues = issues.filter((i) => i.status === col.status)
        return (
          <div key={col.status} className={styles.kanbanCol}>
            <div className={styles.kanbanColHeader}>
              <span className={styles.kanbanColTitle}>{t(col.labelKey)}</span>
              <span className={styles.kanbanColCount}>{colIssues.length}</span>
            </div>
            {colIssues.map((issue) => (
              <div key={issue.id} className={styles.issueCard}>
                <div className={styles.issueId}>
                  {JIRA_BASE_URL
                    ? <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: 11, textDecoration: 'none' }}>{issue.id}</a>
                    : issue.id
                  }
                </div>
                <div className={styles.issueTitle}>{issue.title}</div>
                <div className={styles.issueMeta}>
                  <span className={`${styles.priorityBadge} ${PRIORITY_CLASS[issue.priority]}`}>
                    {issue.priority}
                  </span>
                  {issue.assignee && (
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {issue.assignee.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export default function Requirements() {
  const { currentProjectKey } = useApp()
  const { t } = useI18n()

  const [statusFilter, setStatusFilter] = useState<'' | IssueStatus>('')
  const [priorityFilter, setPriorityFilter] = useState<'' | IssuePriority>('')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const filters = useMemo(
    () => ({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
    }),
    [statusFilter, priorityFilter]
  )

  const {
    data: rawIssues = [],
    isLoading: rawLoading,
    isError,
    error,
  } = useProjectIssues(currentProjectKey, { ...filters, daysBack: 365 })  // 查一年内所有需求
  const isLoading = rawLoading && !!currentProjectKey

  const refresh = useRefreshProjectIssues()

  // 动态提取负责人列表（去重）
  const assigneeOptions = useMemo(() => {
    const names = new Set<string>()
    for (const issue of rawIssues) {
      if (issue.assignee?.name) names.add(issue.assignee.name)
    }
    return Array.from(names).sort()
  }, [rawIssues])

  // Client-side keyword + assignee filter
  const issues = useMemo(() => {
    return rawIssues.filter((i) => {
      if (keyword.trim()) {
        const kw = keyword.toLowerCase()
        if (!i.title.toLowerCase().includes(kw) && !i.id.toLowerCase().includes(kw)) return false
      }
      if (assigneeFilter) {
        if (assigneeFilter === '__unassigned__') {
          if (i.assignee) return false
        } else {
          if (i.assignee?.name !== assigneeFilter) return false
        }
      }
      return true
    })
  }, [rawIssues, keyword, assigneeFilter])

  const hasFilter = statusFilter !== '' || priorityFilter !== '' || assigneeFilter !== '' || keyword.trim() !== ''

  function resetFilters() {
    setStatusFilter('')
    setPriorityFilter('')
    setAssigneeFilter('')
    setKeyword('')
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{t('req.title')}</h1>
          <div className={styles.subtitle}>
            {currentProjectKey
              ? `${currentProjectKey} · 共 ${rawIssues.length} 条需求（近一年）· 筛选后 ${issues.length} 条`
              : t('common.selectProjectFirst')}
          </div>
        </div>
      </div>

      {/* AI 分析 */}
      {currentProjectKey && rawIssues.length > 0 && (
        <AIInsight
          title="AI 需求分析"
          buildPrompt={() => {
            const todo = rawIssues.filter(i => i.status === 'todo').length
            const done = rawIssues.filter(i => i.status === 'done').length
            const p0 = rawIssues.filter(i => i.priority === 'P0').length
            const unassigned = rawIssues.filter(i => !i.assignee).length
            return `请分析以下需求管理数据并给出洞察：\n` +
              `- 项目: ${currentProjectKey}\n` +
              `- 总需求: ${rawIssues.length}，待办: ${todo}，已完成: ${done}\n` +
              `- P0紧急需求: ${p0} 个\n` +
              `- 未分配需求: ${unassigned} 个\n` +
              `请用中文回答，简洁给出：1. 需求健康度 2. 积压风险 3. 优先级建议`
          }}
        />
      )}

      {/* Error */}
      {isError && (
        <div className={styles.errorBanner}>
          ⚠️ 数据加载失败：{error instanceof Error ? error.message : '未知错误'}
        </div>
      )}

      {/* 未选择项目 */}
      {!currentProjectKey && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyText}>{t('common.selectProjectHint')}</div>
        </div>
      )}

      {/* 需求状态统计 */}
      {rawIssues.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: '待办/草稿', status: 'todo', color: 'var(--text2)', bg: '#f5f5f5' },
            { label: '评审中', status: 'in_review', color: '#d48806', bg: 'var(--warning-light)' },
            { label: '开发中', status: 'in_progress', color: 'var(--primary)', bg: 'var(--primary-light)' },
            { label: '测试中', status: 'in_testing', color: '#722ed1', bg: '#f9f0ff' },
            { label: '已完成', status: 'done', color: '#389e0d', bg: 'var(--success-light)' },
          ].map(({ label, status, color, bg }) => {
            const count = rawIssues.filter(i => i.status === status).length
            return (
              <div
                key={status}
                style={{ padding: '6px 14px', borderRadius: 6, background: bg, cursor: 'pointer', fontSize: 13 }}
                onClick={() => setStatusFilter(statusFilter === status ? '' : status as IssueStatus)}
              >
                <span style={{ color, fontWeight: 700 }}>{count}</span>
                <span style={{ color: 'var(--text2)', marginLeft: 6 }}>{label}</span>
                {statusFilter === status && <span style={{ marginLeft: 4, color }}>✓</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | IssueStatus)}
        >
          <option value="">{t('req.allStatus')}</option>
          <option value="todo">草稿 / 待办</option>
          <option value="in_review">评审中</option>
          <option value="in_progress">开发中</option>
          <option value="in_testing">测试中</option>
          <option value="done">已完成</option>
        </select>

        <select
          className={styles.select}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as '' | IssuePriority)}
        >
          <option value="">{t('req.allPriority')}</option>
          <option value="P0">P0 紧急</option>
          <option value="P1">P1 高</option>
          <option value="P2">P2 中</option>
          <option value="P3">P3 低</option>
        </select>

        <select
          className={styles.select}
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">{t('req.allAssignee')}</option>
          <option value="__unassigned__">{t('common.unassigned')}</option>
          {assigneeOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <input
          className={styles.searchInput}
          type="text"
          placeholder={t('req.searchPlaceholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <div className={styles.toolbarRight}>
          {hasFilter && (
            <button className={styles.filterReset} onClick={resetFilters}>
              {t('common.reset')}
            </button>
          )}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰ {t('req.list')}
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'kanban' ? styles.active : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              ⊞ {t('req.kanban')}
            </button>
          </div>

          <button
            className={styles.btnPrimary}
            onClick={refresh}
            disabled={isLoading}
          >
            {isLoading ? '同步中…' : t('req.syncJira')}
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </>
      ) : viewMode === 'list' ? (
        <ListView issues={issues} />
      ) : (
        <KanbanView issues={issues} />
      )}
    </div>
  )
}
