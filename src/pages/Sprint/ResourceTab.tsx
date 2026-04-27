import { useState, useMemo } from 'react'
import type { PlatformIssue, DeveloperProfile, DeveloperSortKey } from '@/types/platform'
import {
  computeDeveloperProfiles,
  computeWorkloadInfo,
  sortTasks,
  computeTeamSummary,
} from '@/lib/workloadCalculator'
import { useI18n } from '@/context/I18nContext'
import type { TranslationKey } from '@/i18n'
import styles from './ResourceTab.module.css'

const JIRA_BASE_URL = import.meta.env.VITE_JIRA_BASE_URL || ''

// ─── Status / Priority display helpers ──────────────────────

const STATUS_KEYS: Record<string, TranslationKey> = {
  todo: 'common.todo',
  in_progress: 'common.inProgress',
  in_review: 'common.inReview',
  in_testing: 'common.inTesting',
  done: 'common.completed',
}

const LOAD_STATUS_KEYS: Record<string, TranslationKey> = {
  overloaded: 'resource.overloaded',
  balanced: 'resource.balanced',
  underloaded: 'resource.underloaded',
}

// ─── WorkloadIndicator ──────────────────────────────────────

interface WorkloadIndicatorProps {
  loadPercentage: number
  status: 'overloaded' | 'balanced' | 'underloaded'
}

function WorkloadIndicator({ loadPercentage, status }: WorkloadIndicatorProps) {
  const { t } = useI18n()
  const fillWidth = Math.min(loadPercentage, 100)

  return (
    <div className={`${styles.workloadBar} ${styles[status]}`}>
      <div className={styles.workloadHeader}>
        <span className={styles.workloadLabel}>{t('resource.load')}</span>
        <span className={styles.workloadPct}>{Math.round(loadPercentage)}%</span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
      <span className={styles.statusBadge}>
        {LOAD_STATUS_KEYS[status] ? t(LOAD_STATUS_KEYS[status]) : status}
      </span>
    </div>
  )
}


// ─── TaskListPanel ──────────────────────────────────────────

interface TaskListPanelProps {
  tasks: PlatformIssue[]
  isExpanded: boolean
  onToggleExpand: () => void
}

function TaskListPanel({ tasks, isExpanded, onToggleExpand }: TaskListPanelProps) {
  const { t } = useI18n()
  const sorted = useMemo(() => sortTasks(tasks), [tasks])

  if (sorted.length === 0) {
    return (
      <div className={styles.taskList}>
        <div className={styles.emptyTasks}>{t('resource.noTasks')}</div>
      </div>
    )
  }

  const THRESHOLD = 5
  const visible = isExpanded ? sorted : sorted.slice(0, THRESHOLD)
  const hasMore = sorted.length > THRESHOLD

  return (
    <div className={styles.taskList}>
      {visible.map((task) => (
        <div key={task.id} className={styles.taskItem}>
          {JIRA_BASE_URL ? (
            <a href={`${JIRA_BASE_URL}/browse/${task.id}`} target="_blank" rel="noopener noreferrer" className={styles.taskIdLink}>{task.id}</a>
          ) : (
            <span className={styles.taskId}>{task.id}</span>
          )}
          <span className={styles.taskTitle} title={task.title}>
            {task.title}
          </span>
          <span className={styles.taskStatusBadge}>
            {STATUS_KEYS[task.status] ? t(STATUS_KEYS[task.status]) : task.status}
          </span>
          <span className={`${styles.taskPriorityBadge} ${styles[task.priority.toLowerCase()]}`}>
            {task.priority}
          </span>
        </div>
      ))}
      {hasMore && (
        <button className={styles.toggleBtn} onClick={onToggleExpand}>
          {isExpanded ? t('resource.collapse') : `${t('resource.expandMore')} (${sorted.length - THRESHOLD})`}
        </button>
      )}
    </div>
  )
}


// ─── DeveloperProfileCard ───────────────────────────────────

interface DeveloperProfileCardProps {
  developer: DeveloperProfile
  tasks: PlatformIssue[]
  loadPercentage: number
  loadStatus: 'overloaded' | 'balanced' | 'underloaded'
  onToggleExpand: () => void
  isExpanded: boolean
}

function DeveloperProfileCard({
  developer,
  tasks,
  loadPercentage,
  loadStatus,
  onToggleExpand,
  isExpanded,
}: DeveloperProfileCardProps) {
  const { t } = useI18n()
  const MAX_TAGS = 5
  const visibleTags = developer.skillTags.slice(0, MAX_TAGS)

  return (
    <div className={styles.devCard}>
      <div className={styles.devCardHeader}>
        {developer.avatarUrl ? (
          <img
            className={styles.avatar}
            src={developer.avatarUrl}
            alt={developer.name}
          />
        ) : (
          <div className={styles.avatarFallback}>
            {developer.name.slice(0, 2)}
          </div>
        )}
        <div className={styles.devInfo}>
          <div className={styles.devName}>{developer.name}</div>
          <div className={styles.devRole}>{t('resource.developer')}</div>
        </div>
      </div>

      {visibleTags.length > 0 && (
        <div className={styles.skillTags}>
          {visibleTags.map((tag) => (
            <span key={tag} className={styles.skillTag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <WorkloadIndicator loadPercentage={loadPercentage} status={loadStatus} />

      <TaskListPanel
        tasks={tasks}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />
    </div>
  )
}


// ─── TeamSummaryBar ─────────────────────────────────────────

type SummaryFilter = 'total' | 'assigned' | 'unassigned' | 'overloaded' | 'balanced' | 'underloaded' | null

interface TeamSummaryBarProps {
  totalTasks: number
  assignedTasks: number
  unassignedTasks: number
  averageLoad: number
  overloadedCount: number
  balancedCount: number
  underloadedCount: number
  activeFilter: SummaryFilter
  onFilterClick: (filter: SummaryFilter) => void
}

function TeamSummaryBar({
  totalTasks,
  assignedTasks,
  unassignedTasks,
  averageLoad,
  overloadedCount,
  balancedCount,
  underloadedCount,
  activeFilter,
  onFilterClick,
}: TeamSummaryBarProps) {
  const { t } = useI18n()
  const toggle = (f: SummaryFilter) => onFilterClick(activeFilter === f ? null : f)

  return (
    <div className={styles.teamSummary}>
      <div className={`${styles.summaryCard} ${styles.summaryClickable} ${activeFilter === 'total' ? styles.summaryActive : ''}`} onClick={() => toggle('total')}>
        <div className={styles.summaryValue}>{totalTasks}</div>
        <div className={styles.summaryLabel}>{t('resource.totalTasks')}</div>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryClickable} ${activeFilter === 'assigned' ? styles.summaryActive : ''}`} onClick={() => toggle('assigned')}>
        <div className={styles.summaryValue}>{assignedTasks}</div>
        <div className={styles.summaryLabel}>{t('resource.assigned')}</div>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryClickable} ${activeFilter === 'unassigned' ? styles.summaryActive : ''}`} onClick={() => toggle('unassigned')}>
        <div className={styles.summaryValue}>{unassignedTasks}</div>
        <div className={styles.summaryLabel}>{t('resource.unassigned')}</div>
      </div>
      <div className={styles.summaryCard}>
        <div className={styles.summaryValue}>{Math.round(averageLoad)}%</div>
        <div className={styles.summaryLabel}>{t('resource.avgLoad')}</div>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryOverloaded} ${styles.summaryClickable} ${activeFilter === 'overloaded' ? styles.summaryActive : ''}`} onClick={() => toggle('overloaded')}>
        <div className={styles.summaryValue}>{overloadedCount}</div>
        <div className={styles.summaryLabel}>{t('resource.overloaded')}</div>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryBalanced} ${styles.summaryClickable} ${activeFilter === 'balanced' ? styles.summaryActive : ''}`} onClick={() => toggle('balanced')}>
        <div className={styles.summaryValue}>{balancedCount}</div>
        <div className={styles.summaryLabel}>{t('resource.balanced')}</div>
      </div>
      <div className={`${styles.summaryCard} ${styles.summaryUnderloaded} ${styles.summaryClickable} ${activeFilter === 'underloaded' ? styles.summaryActive : ''}`} onClick={() => toggle('underloaded')}>
        <div className={styles.summaryValue}>{underloadedCount}</div>
        <div className={styles.summaryLabel}>{t('resource.underloaded')}</div>
      </div>
    </div>
  )
}


// ─── Sort toggle buttons ────────────────────────────────────

const SORT_OPTIONS: { key: DeveloperSortKey; labelKey: TranslationKey }[] = [
  { key: 'load', labelKey: 'resource.sortLoad' },
  { key: 'taskCount', labelKey: 'resource.sortTaskCount' },
  { key: 'name', labelKey: 'resource.sortName' },
]

// ─── ResourceTab (main export) ──────────────────────────────

interface ResourceTabProps {
  issues: PlatformIssue[]
}

export default function ResourceTab({ issues }: ResourceTabProps) {
  const { t } = useI18n()
  const [sortKey, setSortKey] = useState<DeveloperSortKey>('load')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>(null)

  const profiles = useMemo(() => computeDeveloperProfiles(issues), [issues])

  const teamSummary = useMemo(
    () => computeTeamSummary(profiles, issues),
    [profiles, issues],
  )

  // Pre-compute workload info per developer for sorting & display
  const profilesWithLoad = useMemo(() => {
    return profiles.map((p) => {
      const info = computeWorkloadInfo(p.tasks)
      return { profile: p, info }
    })
  }, [profiles])

  // Sort developers based on selected sort key
  const sortedProfiles = useMemo(() => {
    const arr = [...profilesWithLoad]
    switch (sortKey) {
      case 'load':
        arr.sort((a, b) => b.info.loadPercentage - a.info.loadPercentage)
        break
      case 'taskCount':
        arr.sort((a, b) => b.profile.tasks.length - a.profile.tasks.length)
        break
      case 'name':
        arr.sort((a, b) => a.profile.name.localeCompare(b.profile.name))
        break
    }
    return arr
  }, [profilesWithLoad, sortKey])

  // Filtered issues for detail panel
  const detailIssues = useMemo(() => {
    if (!summaryFilter) return []
    if (summaryFilter === 'total') return sortTasks(issues)
    if (summaryFilter === 'assigned') return sortTasks(issues.filter(i => i.assignee !== null))
    if (summaryFilter === 'unassigned') return sortTasks(issues.filter(i => i.assignee === null))
    // overloaded / balanced / underloaded — collect tasks from matching developers
    const matchingTasks: PlatformIssue[] = []
    for (const { profile, info } of profilesWithLoad) {
      if (info.status === summaryFilter) {
        matchingTasks.push(...profile.tasks)
      }
    }
    return sortTasks(matchingTasks)
  }, [issues, summaryFilter, profilesWithLoad])

  const DETAIL_TITLES: Record<string, TranslationKey> = {
    total: 'resource.detailAll',
    assigned: 'resource.detailAssigned',
    unassigned: 'resource.detailUnassigned',
    overloaded: 'resource.detailOverloaded',
    balanced: 'resource.detailBalanced',
    underloaded: 'resource.detailUnderloaded',
  }
  const detailTitle = summaryFilter ? t(DETAIL_TITLES[summaryFilter]) : ''

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (issues.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📋</div>
        <div className={styles.emptyText}>{t('resource.noData')}</div>
      </div>
    )
  }

  return (
    <div>
      <TeamSummaryBar
        totalTasks={teamSummary.totalTasks}
        assignedTasks={teamSummary.assignedTasks}
        unassignedTasks={teamSummary.unassignedTasks}
        averageLoad={teamSummary.averageLoadPercentage}
        overloadedCount={teamSummary.overloadedCount}
        balancedCount={teamSummary.balancedCount}
        underloadedCount={teamSummary.underloadedCount}
        activeFilter={summaryFilter}
        onFilterClick={setSummaryFilter}
      />

      {/* 点击统计卡片后展开的明细面板 */}
      {summaryFilter && detailIssues.length > 0 && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <span className={styles.detailTitle}>{detailTitle}（{detailIssues.length}）</span>
            <button className={styles.detailClose} onClick={() => setSummaryFilter(null)}>✕</button>
          </div>
          <div className={styles.detailList}>
            {detailIssues.map((task) => (
              <div key={task.id} className={styles.taskItem}>
                {JIRA_BASE_URL ? (
                  <a href={`${JIRA_BASE_URL}/browse/${task.id}`} target="_blank" rel="noopener noreferrer" className={styles.taskIdLink}>{task.id}</a>
                ) : (
                  <span className={styles.taskId}>{task.id}</span>
                )}
                <span className={styles.taskTitle} title={task.title}>{task.title}</span>
                <span className={styles.taskStatusBadge}>{STATUS_KEYS[task.status] ? t(STATUS_KEYS[task.status]) : task.status}</span>
                <span className={`${styles.taskPriorityBadge} ${styles[task.priority.toLowerCase()]}`}>{task.priority}</span>
                <span className={styles.detailAssignee}>{task.assignee?.name ?? t('resource.unassigned')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {teamSummary.unassignedTasks > 0 && (
        <div className={styles.unassignedBanner}>
          <span className={styles.unassignedBannerIcon}>⚠️</span>
          <span>
            {t('resource.unassigned')} <strong>{teamSummary.unassignedTasks}</strong> {t('resource.unassignedBanner')}
          </span>
        </div>
      )}

      <div className={styles.sortBar}>
        <span className={styles.sortLabel}>{t('resource.sortBy')}</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`${styles.sortBtn} ${sortKey === opt.key ? styles.sortBtnActive : ''}`}
            onClick={() => setSortKey(opt.key)}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      <div className={styles.devGrid}>
        {sortedProfiles.map(({ profile, info }) => (
          <DeveloperProfileCard
            key={profile.id}
            developer={profile}
            tasks={profile.tasks}
            loadPercentage={info.loadPercentage}
            loadStatus={info.status}
            isExpanded={expandedIds.has(profile.id)}
            onToggleExpand={() => toggleExpand(profile.id)}
          />
        ))}
      </div>
    </div>
  )
}
