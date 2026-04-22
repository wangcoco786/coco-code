import { useState, useMemo, useCallback, useRef } from 'react'
import type { PlatformIssue, ChangeType, DetectedChange, ScopeCreepMetrics, ImpactAnalysis } from '@/types/platform'
import type { JiraSprint } from '@/types/jira'
import {
  detectChanges,
  computeScopeCreepMetrics,
  computeImpactAnalysis,
  buildAISummaryPrompt,
} from '@/lib/changeDetector'
import { useAgentForce } from '@/hooks/useAgentForce'
import styles from './ChangeTab.module.css'

// ─── Constants ──────────────────────────────────────────────

const JIRA_BASE_URL = import.meta.env.VITE_JIRA_BASE_URL || ''

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  priority_change: '优先级变更',
  new_addition: '新增需求',
  scope_change: '范围变更',
  status_regression: '状态回退',
}

const CHANGE_TYPE_BADGE_STYLES: Record<ChangeType, string> = {
  priority_change: styles.badgePriorityChange,
  new_addition: styles.badgeNewAddition,
  scope_change: styles.badgeScopeChange,
  status_regression: styles.badgeStatusRegression,
}

const CHANGE_TYPE_TAB_STYLES: Record<ChangeType, string> = {
  priority_change: styles.typePriority,
  new_addition: styles.typeAddition,
  scope_change: styles.typeScope,
  status_regression: styles.typeRegression,
}

const IMPACT_LEVEL_LABELS: Record<string, string> = {
  high: '高影响',
  medium: '中影响',
  low: '低影响',
}

const SEVERITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const ALL_CHANGE_TYPES: ChangeType[] = [
  'priority_change',
  'new_addition',
  'scope_change',
  'status_regression',
]

// ─── ImpactDashboard ────────────────────────────────────────

interface ImpactDashboardProps {
  impact: ImpactAnalysis
  scopeMetrics: ScopeCreepMetrics
}

function ImpactDashboard({ impact, scopeMetrics }: ImpactDashboardProps) {
  const impactLevelClass =
    impact.impactLevel === 'high'
      ? styles.impactLevelHigh
      : impact.impactLevel === 'medium'
        ? styles.impactLevelMedium
        : styles.impactLevelLow

  const impactStatClass =
    impact.impactLevel === 'high'
      ? styles.impactHigh
      : impact.impactLevel === 'medium'
        ? styles.impactMedium
        : styles.impactLow

  const currentIssueCount = scopeMetrics.currentIssueCount
  const baselineIssueCount = scopeMetrics.baselineIssueCount
  const issueDiff = currentIssueCount - baselineIssueCount

  const currentSP = impact.affectedStoryPoints + impact.baselineStoryPoints
  const spDiff = currentSP - impact.baselineStoryPoints

  return (
    <div className={styles.impactDashboard}>
      <div className={styles.impactGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{impact.totalChanges}</div>
          <div className={styles.statLabel}>总变更数</div>
        </div>
        {ALL_CHANGE_TYPES.map((type) => (
          <div key={type} className={styles.statCard}>
            <div className={styles.statValue}>{impact.changesByType[type]}</div>
            <div className={styles.statLabel}>{CHANGE_TYPE_LABELS[type]}</div>
          </div>
        ))}
        <div className={`${styles.statCard} ${impactStatClass}`}>
          <div className={styles.statValue}>{impact.affectedStoryPoints}</div>
          <div className={styles.statLabel}>受影响任务数</div>
          <span className={`${styles.impactLevelBadge} ${impactLevelClass}`}>
            {IMPACT_LEVEL_LABELS[impact.impactLevel]}
          </span>
        </div>
      </div>

      <div className={styles.comparisonSection}>
        <div className={styles.comparisonCard}>
          <div className={styles.comparisonTitle}>基线 vs 当前</div>
          <div className={styles.comparisonRow}>
            <span>需求数</span>
            <span className={styles.comparisonValue}>
              {baselineIssueCount} → {currentIssueCount}
            </span>
            {issueDiff !== 0 && (
              <span className={`${styles.comparisonDiff} ${issueDiff > 0 ? styles.diffPositive : styles.diffNeutral}`}>
                {issueDiff > 0 ? '+' : ''}{issueDiff}
              </span>
            )}
          </div>
          <div className={styles.comparisonRow}>
            <span>变更任务</span>
            <span className={styles.comparisonValue}>
              {impact.baselineStoryPoints} → {currentSP}
            </span>
            {spDiff !== 0 && (
              <span className={`${styles.comparisonDiff} ${spDiff > 0 ? styles.diffPositive : styles.diffNeutral}`}>
                {spDiff > 0 ? '+' : ''}{spDiff}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ChangeDetectionSection ─────────────────────────────────

interface ChangeDetectionSectionProps {
  changes: DetectedChange[]
}

function ChangeDetectionSection({ changes }: ChangeDetectionSectionProps) {
  const [activeFilter, setActiveFilter] = useState<ChangeType | 'all'>('all')

  const grouped = useMemo(() => {
    const map: Record<ChangeType, DetectedChange[]> = {
      priority_change: [],
      new_addition: [],
      scope_change: [],
      status_regression: [],
    }
    for (const c of changes) {
      map[c.changeType].push(c)
    }
    return map
  }, [changes])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return changes
    return grouped[activeFilter]
  }, [changes, grouped, activeFilter])

  return (
    <div className={styles.changeDetection}>
      <div className={styles.sectionTitle}>变更检测</div>

      <div className={styles.changeTypeTabs}>
        <button
          className={`${styles.changeTypeTab} ${activeFilter === 'all' ? styles.changeTypeTabActive : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          全部
          <span className={styles.countBadge}>{changes.length}</span>
        </button>
        {ALL_CHANGE_TYPES.map((type) => (
          <button
            key={type}
            className={`${styles.changeTypeTab} ${activeFilter === type ? `${styles.changeTypeTabActive} ${CHANGE_TYPE_TAB_STYLES[type]}` : ''}`}
            onClick={() => setActiveFilter(type)}
          >
            {CHANGE_TYPE_LABELS[type]}
            <span className={styles.countBadge}>{grouped[type].length}</span>
          </button>
        ))}
      </div>

      <div className={styles.changeList}>
        {filtered.map((change) => {
          const isP0 = change.issue.priority === 'P0'
          return (
            <div
              key={`${change.issue.id}-${change.changeType}`}
              className={`${styles.changeItem} ${isP0 ? styles.p0Alert : ''}`}
            >
              <div className={styles.changeItemInfo}>
                <div className={styles.changeIssueId}>
                  {JIRA_BASE_URL ? (
                    <a href={`${JIRA_BASE_URL}/browse/${change.issue.id}`} target="_blank" rel="noopener noreferrer" className={styles.changeIssueIdLink}>{change.issue.id}</a>
                  ) : change.issue.id}
                </div>
                <div className={styles.changeIssueTitle}>{change.issue.title}</div>
                <div className={styles.changeDescription}>{change.description}</div>
              </div>
              <div className={styles.changeItemBadges}>
                <span className={`${styles.changeTypeBadge} ${CHANGE_TYPE_BADGE_STYLES[change.changeType]}`}>
                  {CHANGE_TYPE_LABELS[change.changeType]}
                </span>
                <span className={`${styles.severityBadge} ${
                  change.severity === 'high'
                    ? styles.severityHigh
                    : change.severity === 'medium'
                      ? styles.severityMedium
                      : styles.severityLow
                }`}>
                  {SEVERITY_LABELS[change.severity]}
                </span>
                {isP0 && <span className={styles.p0AlertBadge}>P0</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── ScopeCreepPanel ────────────────────────────────────────

interface ScopeCreepPanelProps {
  metrics: ScopeCreepMetrics
  newIssues: PlatformIssue[]
}

function ScopeCreepPanel({ metrics, newIssues }: ScopeCreepPanelProps) {
  const sortedNewIssues = useMemo(
    () => [...newIssues].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [newIssues],
  )

  return (
    <div className={styles.scopeCreepPanel}>
      <div className={styles.sectionTitle}>范围蔓延分析</div>

      {metrics.isCreeping && (
        <div className={styles.scopeCreepWarning}>
          <span className={styles.scopeCreepWarningIcon}>⚠️</span>
          <div className={styles.scopeCreepWarningText}>
            <strong>范围蔓延警告</strong> — Sprint 范围增长 {metrics.scopeIncreasePercentage.toFixed(1)}%，
            新增 {metrics.addedIssueCount} 个需求（{metrics.addedStoryPoints} 个任务）
          </div>
        </div>
      )}

      <div className={styles.scopeMetrics}>
        <div className={styles.scopeMetricCard}>
          <div className={styles.scopeMetricValue}>{metrics.baselineIssueCount}</div>
          <div className={styles.scopeMetricLabel}>基线需求数</div>
        </div>
        <div className={styles.scopeMetricCard}>
          <div className={styles.scopeMetricValue}>{metrics.currentIssueCount}</div>
          <div className={styles.scopeMetricLabel}>当前需求数</div>
        </div>
        <div className={styles.scopeMetricCard}>
          <div className={styles.scopeMetricValue}>{metrics.addedIssueCount}</div>
          <div className={styles.scopeMetricLabel}>新增需求</div>
        </div>
        <div className={styles.scopeMetricCard}>
          <div className={styles.scopeMetricValue}>{metrics.addedStoryPoints}</div>
          <div className={styles.scopeMetricLabel}>新增任务数</div>
        </div>
        <div className={styles.scopeMetricCard}>
          <div className={styles.scopeMetricValue}>{metrics.scopeIncreasePercentage.toFixed(1)}%</div>
          <div className={styles.scopeMetricLabel}>范围增长</div>
        </div>
      </div>

      {sortedNewIssues.length > 0 && (
        <>
          <div className={styles.sectionTitle}>新增需求时间线</div>
          <div className={styles.scopeTimeline}>
            {sortedNewIssues.map((issue) => (
              <div key={issue.id} className={styles.scopeTimelineItem}>
                <span className={styles.scopeTimelineDate}>
                  {new Date(issue.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                </span>
                <span className={styles.scopeTimelineId}>
                  {JIRA_BASE_URL ? (
                    <a href={`${JIRA_BASE_URL}/browse/${issue.id}`} target="_blank" rel="noopener noreferrer" className={styles.changeIssueIdLink}>{issue.id}</a>
                  ) : issue.id}
                </span>
                <span className={styles.scopeTimelineTitle}>{issue.title}</span>
                <span className={styles.scopeTimelineSP}>{issue.storyPoints || 1} 任务</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── AISummaryPanel ─────────────────────────────────────────

interface AISummaryPanelProps {
  changes: DetectedChange[]
  scopeMetrics: ScopeCreepMetrics
  sprint: JiraSprint | null
}

function AISummaryPanel({ changes, scopeMetrics, sprint }: AISummaryPanelProps) {
  const [cachedSummary, setCachedSummary] = useState<string | null>(null)
  const [streamedContent, setStreamedContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const streamedRef = useRef('')

  const { sendMessage, isLoading, disconnect } = useAgentForce({
    onMessage: (content: string) => {
      streamedRef.current += content
      setStreamedContent(streamedRef.current)
    },
    onComplete: (fullContent: string) => {
      setCachedSummary(fullContent)
      setStreamedContent('')
      streamedRef.current = ''
      disconnect()
    },
    onError: (err: string) => {
      setError(err)
      setStreamedContent('')
      streamedRef.current = ''
      disconnect()
    },
  })

  const handleGenerate = useCallback(() => {
    if (cachedSummary) return

    setError(null)
    setStreamedContent('')
    streamedRef.current = ''

    const prompt = buildAISummaryPrompt(changes, scopeMetrics, sprint?.name ?? 'Sprint')
    sendMessage(prompt)
  }, [cachedSummary, sendMessage, changes, scopeMetrics, sprint])

  const handleRetry = useCallback(() => {
    setCachedSummary(null)
    setError(null)
    setStreamedContent('')
    streamedRef.current = ''
    handleGenerate()
  }, [handleGenerate])

  return (
    <div className={styles.aiSummaryPanel}>
      <div className={styles.sectionTitle}>AI 变更分析</div>

      {!cachedSummary && !isLoading && !streamedContent && (
        <button
          className={styles.aiGenerateBtn}
          onClick={handleGenerate}
          disabled={isLoading}
        >
          <span className={styles.aiGenerateBtnIcon}>🤖</span>
          AI 变更分析
        </button>
      )}

      {isLoading && !streamedContent && (
        <div className={styles.aiLoading}>
          <span>AI 正在分析变更</span>
          <span className={styles.aiLoadingDots}>
            <span />
            <span />
            <span />
          </span>
        </div>
      )}

      {streamedContent && (
        <div className={styles.aiSummaryContent}>{streamedContent}</div>
      )}

      {cachedSummary && (
        <>
          <div className={styles.aiSummaryContent}>{cachedSummary}</div>
          <div className={styles.aiCachedIndicator}>
            <span className={styles.aiCachedDot} />
            已缓存
          </div>
        </>
      )}

      {error && (
        <div className={styles.aiError}>
          <span className={styles.aiErrorText}>{error}</span>
          <button className={styles.aiRetryBtn} onClick={handleRetry}>
            重试
          </button>
        </div>
      )}
    </div>
  )
}

// ─── ChangeTab (main export) ────────────────────────────────

interface ChangeTabProps {
  issues: PlatformIssue[]
  sprint: JiraSprint | null
}

export default function ChangeTab({ issues, sprint }: ChangeTabProps) {
  const sprintStartDate = sprint?.startDate ?? ''

  const changes = useMemo(
    () => sprintStartDate ? detectChanges(issues, sprintStartDate) : [],
    [issues, sprintStartDate],
  )

  const scopeMetrics = useMemo(
    () => sprintStartDate ? computeScopeCreepMetrics(issues, sprintStartDate) : computeScopeCreepMetrics([], ''),
    [issues, sprintStartDate],
  )

  const impact = useMemo(
    () => sprintStartDate ? computeImpactAnalysis(changes, issues, sprintStartDate) : computeImpactAnalysis([], [], ''),
    [changes, issues, sprintStartDate],
  )

  const newIssues = useMemo(
    () => sprintStartDate
      ? issues.filter((i) => new Date(i.createdAt).getTime() > new Date(sprintStartDate).getTime())
      : [],
    [issues, sprintStartDate],
  )

  // Guard: no sprint start date
  if (!sprintStartDate) {
    return (
      <div>
        <div className={styles.infoMessage}>
          <span className={styles.infoMessageIcon}>ℹ️</span>
          <span>Sprint 开始日期不可用，无法进行变更检测</span>
        </div>
      </div>
    )
  }

  // Empty state: no changes detected
  if (changes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>✅</div>
        <div className={styles.emptyText}>未检测到需求变更</div>
      </div>
    )
  }

  return (
    <div>
      <ImpactDashboard impact={impact} scopeMetrics={scopeMetrics} />
      <ChangeDetectionSection changes={changes} />
      <ScopeCreepPanel metrics={scopeMetrics} newIssues={newIssues} />
      <AISummaryPanel changes={changes} scopeMetrics={scopeMetrics} sprint={sprint} />
    </div>
  )
}
