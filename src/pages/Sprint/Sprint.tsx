import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import {
  useActiveSprintIssuesByProject,
  useActiveSprintsByProject,
  useProjectIssues,
  useRefreshProjectIssues,
} from '@/hooks/useProjectIssues'
import { useI18n } from '@/context/I18nContext'
import type { IssueStatus, IssuePriority, PlatformIssue } from '@/types/platform'
import ResourceTab from './ResourceTab'
import ChangeTab from './ChangeTab'
import AIInsight from '@/components/AIInsight/AIInsight'
import styles from './Sprint.module.css'

// ─── helpers ────────────────────────────────────────────────

type SprintTab = 'board' | 'resource' | 'change' | 'plan'

const PRIORITY_CLASS: Record<IssuePriority, string> = {
  P0: styles.p0,
  P1: styles.p1,
  P2: styles.p2,
  P3: styles.p3,
}

// formatDate 保留备用
function _formatDate(iso: string) {
  return iso ? iso.slice(0, 10) : ''
}
void _formatDate

const JIRA_BASE_URL = import.meta.env.VITE_JIRA_BASE_URL || ''

function getJiraUrl(issueKey: string): string {
  return JIRA_BASE_URL ? `${JIRA_BASE_URL}/browse/${issueKey}` : ''
}

// ─── sub-components ─────────────────────────────────────────

interface IssueCardProps {
  issue: PlatformIssue
  isMine: boolean
}

function IssueCard({ issue, isMine }: IssueCardProps) {
  const { t } = useI18n()
  const initials = issue.assignee
    ? issue.assignee.name.slice(0, 2)
    : '?'
  const jiraUrl = getJiraUrl(issue.id)

  return (
    <div className={`${styles.issueCard} ${isMine ? styles.mine : ''}`}>
      {jiraUrl ? (
        <a href={jiraUrl} target="_blank" rel="noopener noreferrer" className={styles.issueIdLink}>{issue.id}</a>
      ) : (
        <div className={styles.issueId}>{issue.id}</div>
      )}
      <div className={styles.issueTitle}>{issue.title}</div>
      <div className={styles.issueMeta}>
        <span className={`${styles.priorityBadge} ${PRIORITY_CLASS[issue.priority]}`}>
          {issue.priority}
        </span>
        <span
          className={styles.assigneeAvatar}
          title={issue.assignee?.name ?? t('sprint.unassigned')}
        >
          {initials}
        </span>
      </div>
    </div>
  )
}

// ─── Board Tab ───────────────────────────────────────────────

interface BoardTabProps {
  issues: PlatformIssue[]
  currentUserId: string
  isDev: boolean
}

function BoardTab({ issues, currentUserId, isDev }: BoardTabProps) {
  const { t } = useI18n()
  const [priorityFilter, setPriorityFilter] = useState<'' | IssuePriority>('')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')
  const [keyword, setKeyword] = useState<string>('')

  const boardColumns: { status: IssueStatus; label: string }[] = [
    { status: 'todo', label: t('sprint.todo') },
    { status: 'in_progress', label: t('sprint.inProgress') },
    { status: 'in_review', label: t('sprint.inReview') },
    { status: 'in_testing', label: t('sprint.inTesting') },
    { status: 'done', label: t('sprint.done') },
  ]

  // 动态提取负责人列表（去重）
  const assigneeOptions = useMemo(() => {
    const names = new Set<string>()
    for (const issue of issues) {
      if (issue.assignee?.name) names.add(issue.assignee.name)
    }
    return Array.from(names).sort()
  }, [issues])

  // 客户端过滤
  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (priorityFilter && i.priority !== priorityFilter) return false
      if (assigneeFilter) {
        if (assigneeFilter === '__unassigned__') {
          if (i.assignee) return false
        } else {
          if (i.assignee?.name !== assigneeFilter) return false
        }
      }
      if (keyword.trim()) {
        const kw = keyword.toLowerCase()
        if (!i.id.toLowerCase().includes(kw) && !i.title.toLowerCase().includes(kw)) return false
      }
      return true
    })
  }, [issues, priorityFilter, assigneeFilter, keyword])

  const hasFilter = priorityFilter !== '' || assigneeFilter !== '' || keyword.trim() !== ''

  function resetFilters() {
    setPriorityFilter('')
    setAssigneeFilter('')
    setKeyword('')
  }

  return (
    <>
      {/* 筛选栏 */}
      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as '' | IssuePriority)}
        >
          <option value="">{t('sprint.filterPriority')}</option>
          <option value="P0">P0</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
        </select>

        <select
          className={styles.filterSelect}
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">{t('sprint.filterAssignee')}</option>
          <option value="__unassigned__">{t('sprint.unassigned')}</option>
          {assigneeOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <input
          className={styles.filterInput}
          type="text"
          placeholder={t('sprint.filterKeyword')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        {hasFilter && (
          <button className={styles.filterReset} onClick={resetFilters}>
            {t('sprint.resetFilter')}
          </button>
        )}
      </div>

      <div className={styles.kanban}>
        {boardColumns.map((col) => {
          const colIssues = filteredIssues.filter((i) => i.status === col.status)
          return (
            <div key={col.status} className={styles.kanbanCol}>
              <div className={styles.kanbanColHeader}>
                <span className={styles.kanbanColTitle}>{col.label}</span>
                <span className={styles.kanbanColCount}>{colIssues.length}</span>
              </div>
              {colIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  isMine={isDev && issue.assignee?.id === currentUserId}
                />
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export default function Sprint() {
  const { currentUser, currentProjectKey } = useApp()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<SprintTab>('board')
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null)

  const sprintTabs: { key: SprintTab; label: string }[] = [
    { key: 'board', label: t('sprint.board') },
    { key: 'resource', label: t('sprint.resource') },
    { key: 'change', label: t('sprint.change') },
    { key: 'plan', label: t('sprint.plan') },
  ]

  // 获取所有活跃 Sprint
  const { data: activeSprints = [] } = useActiveSprintsByProject(currentProjectKey)

  // 当前选中的 Sprint（默认第一个）
  const currentSprint = selectedSprintId
    ? activeSprints.find(s => s.id === selectedSprintId) ?? activeSprints[0] ?? null
    : activeSprints[0] ?? null

  const { data: issues = [], isLoading: rawLoading, isError, error } = useActiveSprintIssuesByProject(
    currentProjectKey,
    currentSprint?.id ?? null  // null 时不查（等 Sprint 加载完）
  )
  const isLoading = rawLoading && !!currentProjectKey
  const refresh = useRefreshProjectIssues()

  const isDev = currentUser?.role === 'DEV'
  const completedCount = issues.filter((i) => i.status === 'done').length

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            {currentSprint ? currentSprint.name : t('sprint.title')}
          </h1>
          <div className={styles.subtitle}>
            {currentSprint
              ? `${currentSprint.startDate?.slice(0, 10)} ~ ${currentSprint.endDate?.slice(0, 10)} · ${completedCount} / ${issues.length} ${t('sprint.completed')}`
              : currentProjectKey ? t('sprint.noActiveSprint') : t('common.selectProjectFirst')}
          </div>
        </div>
        <div className={styles.headerRight}>
          {/* 多 Sprint 切换器 */}
          {activeSprints.length > 1 && (
            <select
              className={styles.sprintSelect}
              value={currentSprint?.id ?? ''}
              onChange={e => setSelectedSprintId(Number(e.target.value) || null)}
            >
              {activeSprints.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <button
            className={styles.btnPrimary}
            onClick={refresh}
            disabled={isLoading}
          >
            {isLoading ? t('sprint.syncing') : t('sprint.syncNow')}
          </button>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className={styles.errorBanner}>
          ⚠️ {t('sprint.errorLoad')}：{error instanceof Error ? error.message : t('common.error')}
        </div>
      )}

      {/* AI 分析 */}
      {currentProjectKey && issues.length > 0 && currentSprint && (
        <AIInsight
          title={t('ai.insight')}
          buildPrompt={() => {
            const done = issues.filter(i => i.status === 'done').length
            const inProgress = issues.filter(i => i.status === 'in_progress').length
            const p0 = issues.filter(i => i.priority === 'P0' && i.status !== 'done').length
            const unassigned = issues.filter(i => !i.assignee && i.status !== 'done').length
            return `请分析以下 Sprint 数据并给出洞察：\n` +
              `- Sprint: ${currentSprint.name}\n` +
              `- 周期: ${currentSprint.startDate?.slice(0, 10)} ~ ${currentSprint.endDate?.slice(0, 10)}\n` +
              `- 总任务: ${issues.length}，已完成: ${done}，进行中: ${inProgress}\n` +
              `- 完成率: ${Math.round((done / issues.length) * 100)}%\n` +
              `- P0未完成: ${p0} 个，未分配: ${unassigned} 个\n` +
              `请用中文回答，简洁给出：1. Sprint 进度评估 2. 交付风险 3. 建议行动`
          }}
        />
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        {sprintTabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </>
      ) : (
        <>
          {activeTab === 'board' && (
            <BoardTab
              issues={issues}
              currentUserId={currentUser?.id ?? ''}
              isDev={isDev}
            />
          )}
          {activeTab === 'resource' && <ResourceTab issues={issues} />}
          {activeTab === 'change' && (
            <ChangeTab issues={issues} sprint={currentSprint ?? null} />
          )}
          {activeTab === 'plan' && (
            <PlanTab projectKey={currentProjectKey} sprintIssues={issues} />
          )}
        </>
      )}
    </div>
  )
}

// ─── 规划 Tab ────────────────────────────────────────────────

interface PlanTabProps {
  projectKey: string | null
  sprintIssues: PlatformIssue[]
}

function PlanTab({ projectKey, sprintIssues }: PlanTabProps) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // 从项目 Backlog 拉取候选任务（未在当前 Sprint 中的）
  const { data: backlogIssues = [], isLoading } = useProjectIssues(
    projectKey,
    { daysBack: 90 }
  )

  // 过滤掉已在 Sprint 中的任务
  const sprintIds = new Set(sprintIssues.map(i => i.id))
  const candidates = backlogIssues
    .filter(i => !sprintIds.has(i.id) && i.status !== 'done')
    .slice(0, 30)

  // AI 评分：P0/P1 优先，最近更新的优先
  const scored = useMemo(() => {
    return candidates.map(issue => {
      let score = 50
      if (issue.priority === 'P0') score += 40
      else if (issue.priority === 'P1') score += 25
      else if (issue.priority === 'P2') score += 10
      const daysSinceUpdate = (Date.now() - new Date(issue.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceUpdate < 7) score += 15
      else if (daysSinceUpdate < 30) score += 5
      if (!issue.assignee) score -= 10
      return { ...issue, score: Math.min(99, score) }
    }).sort((a, b) => b.score - a.score)
  }, [candidates])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedIssues = scored.filter(i => selected.has(i.id))

  return (
    <div>
      {/* 规划助手说明 */}
      <div className={styles.planBanner}>
        <div className={styles.planBannerTitle}>{t('sprint.planBannerTitle')}</div>
        <div className={styles.planBannerDesc}>
          {t('sprint.planBannerDesc')}
        </div>
        <div className={styles.planStats}>
          <span>📊 {t('sprint.currentSprint')}：<strong>{sprintIssues.length}</strong> {t('dashboard.subtitle.tasks')}</span>
          <span>📥 {t('sprint.backlogCandidates')}：<strong>{candidates.length}</strong></span>
          <span>✅ {t('sprint.selected')}：<strong>{selected.size}</strong></span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* 候选任务列表 */}
        <div className={styles.planCard}>
          <div className={styles.planCardTitle}>
            {t('sprint.backlogTitle')}
            <button
              className={styles.btnSm}
              onClick={() => setSelected(new Set(scored.slice(0, 10).map(i => i.id)))}
            >
              {t('sprint.selectTop10')}
            </button>
          </div>
          {isLoading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>{t('common.loading')}</div>
          ) : scored.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>{t('sprint.noBacklog')}</div>
          ) : (
            <table className={styles.planTable}>
              <thead>
                <tr>
                  <th style={{ width: 30 }}>
                    <input type="checkbox" onChange={e => {
                      if (e.target.checked) setSelected(new Set(scored.map(i => i.id)))
                      else setSelected(new Set())
                    }} />
                  </th>
                  <th>ID</th>
                  <th>{t('sprint.thTitle')}</th>
                  <th>{t('sprint.thPriority')}</th>
                  <th>{t('sprint.thAssignee')}</th>
                  <th>{t('sprint.thAiScore')}</th>
                </tr>
              </thead>
              <tbody>
                {scored.map(issue => (
                  <tr
                    key={issue.id}
                    style={{ background: issue.score >= 80 ? '#f6ffed' : undefined, cursor: 'pointer' }}
                    onClick={() => toggleSelect(issue.id)}
                  >
                    <td><input type="checkbox" checked={selected.has(issue.id)} onChange={() => toggleSelect(issue.id)} onClick={e => e.stopPropagation()} /></td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>
                      {JIRA_BASE_URL
                        ? <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{issue.id}</a>
                        : issue.id
                      }
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 3,
                        color: issue.priority === 'P0' ? 'var(--danger)' : issue.priority === 'P1' ? 'var(--warning)' : 'var(--primary)',
                        background: issue.priority === 'P0' ? 'var(--danger-light)' : issue.priority === 'P1' ? 'var(--warning-light)' : 'var(--primary-light)',
                      }}>{issue.priority}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>{issue.assignee?.name ?? <span style={{ color: 'var(--text2)' }}>{t('sprint.unassigned')}</span>}</td>
                    <td>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: issue.score >= 80 ? 'var(--success)' : issue.score >= 60 ? 'var(--primary)' : 'var(--text2)'
                      }}>{issue.score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 已选任务 + AI 建议 */}
        <div>
          <div className={styles.planCard} style={{ marginBottom: 12 }}>
            <div className={styles.planCardTitle}>{t('sprint.aiPlanSuggestion')}</div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div>{t('sprint.currentSprint')}：<strong>{sprintIssues.length}</strong> {t('dashboard.subtitle.tasks')}</div>
              <div>{t('sprint.selected')}：<strong style={{ color: 'var(--primary)' }}>{selected.size}</strong></div>
              <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--primary-light)', borderRadius: 6, fontSize: 12 }}>
                {selected.size === 0
                  ? `💡 ${t('sprint.selectHint')}`
                  : selected.size <= 10
                  ? `✅ ${selected.size} ${t('sprint.sizeOk')}`
                  : `⚠️ ${selected.size} ${t('sprint.sizeTooMany')}`}
              </div>
            </div>
          </div>

          {selectedIssues.length > 0 && (
            <div className={styles.planCard}>
              <div className={styles.planCardTitle}>
                ✅ {t('sprint.selectedTasks')}（{selectedIssues.length}）
                <button className={styles.btnSm} onClick={() => setSelected(new Set())}>{t('sprint.clearSelection')}</button>
              </div>
              {selectedIssues.map(issue => (
                <div key={issue.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, marginRight: 8 }}>
                    {JIRA_BASE_URL
                      ? <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{issue.id}</a>
                      : issue.id
                    }
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</span>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 14 }}
                    onClick={() => toggleSelect(issue.id)}
                  >✕</button>
                </div>
              ))}
              <button
                className={styles.btnPrimary}
                style={{ marginTop: 12, width: '100%' }}
                onClick={() => {
                  const text = selectedIssues.map(i => `${i.id}: ${i.title}`).join('\n')
                  navigator.clipboard?.writeText(text).catch(() => {})
                  alert(`${t('sprint.copiedAlert')} (${selectedIssues.length})`)
                }}
              >
                {t('sprint.copyPlan')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 工具函数 ────────────────────────────────────────────────

function _statusLabel(status: IssueStatus): string {
  const map: Record<IssueStatus, string> = {
    todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review',
    in_testing: 'In Testing', done: 'Done',
  }
  return map[status] ?? status
}
void _statusLabel

function _daysSince(isoDate: string): string {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}
void _daysSince
