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
import { useI18n } from '@/context/I18nContext'
import styles from './ChangeTab.module.css'

// ─── Constants ──────────────────────────────────────────────

const JIRA_BASE_URL = import.meta.env.VITE_JIRA_BASE_URL || ''

const CHANGE_TYPE_LABEL_KEYS: Record<ChangeType, string> = {
  priority_change: 'change.priorityChange',
  new_addition: 'change.newAddition',
  scope_change: 'change.scopeChange',
  status_regression: 'change.statusRegression',
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

const IMPACT_LEVEL_LABEL_KEYS: Record<string, string> = {
  high: 'change.highImpact',
  medium: 'change.mediumImpact',
  low: 'change.lowImpact',
}

const SEVERITY_LABEL_KEYS: Record<string, string> = {
  high: 'change.severityHigh',
  medium: 'change.severityMedium',
  low: 'change.severityLow',
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
  const { t } = useI18n()
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
          <div className={styles.statLabel}>{t('change.totalChanges')}</div>
        </div>
        {ALL_CHANGE_TYPES.map((type) => (
          <div key={type} className={styles.statCard}>
            <div className={styles.statValue}>{impact.changesByType[type]}</div>
            <div className={styles.statLabel}>{t(CHANGE_TYPE_LABEL_KEYS[type] as any)}</div>
          </div>
        ))}
        <div className={`${styles.statCard} ${impactStatClass}`}>
          <div className={styles.statValue}>{impact.affectedStoryPoints}</div>
          <div className={styles.statLabel}>{t('change.affectedTasks')}</div>
          <span className={`${styles.impactLevelBadge} ${impactLevelClass}`}>
            {t(IMPACT_LEVEL_LABEL_KEYS[impact.impactLevel] as any)}
          </span>
        </div>
      </div>

      <div className={styles.comparisonSection}>
        <div className={styles.comparisonCard}>
          <div className={styles.comparisonTitle}>{t('change.baselineVsCurrent')}</div>
          <div className={styles.comparisonRow}>
            <span>{t('change.reqCount')}</span>
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
            <span>{t('change.changeTasks')}</span>
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
  const { t } = useI18n()
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
      <div className={styles.sectionTitle}>{t('change.detection')}</div>

      <div className={styles.changeTypeTabs}>
        <button
          className={`${styles.changeTypeTab} ${activeFilter === 'all' ? styles.changeTypeTabActive : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          {t('common.all')}
          <span className={styles.countBadge}>{changes.length}</span>
        </button>
        {ALL_CHANGE_TYPES.map((type) => (
          <button
            key={type}
            className={`${styles.changeTypeTab} ${activeFilter === type ? `${styles.changeTypeTabActive} ${CHANGE_TYPE_TAB_STYLES[type]}` : ''}`}
            onClick={() => setActiveFilter(type)}
          >
            {t(CHANGE_TYPE_LABEL_KEYS[type] as any)}
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
                  {t(CHANGE_TYPE_LABEL_KEYS[change.changeType] as any)}
                </span>
                <span className={`${styles.severityBadge} ${
                  change.severity === 'high'
                    ? styles.severityHigh
                    : change.severity === 'medium'
                      ? styles.severityMedium
                      : styles.severityLow
                }`}>
                  {t(SEVERITY_LABEL_KEYS[change.severity] as any)}
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
  const { t } = useI18n()
  const sortedNewIssues = useMemo(
    () => [...newIssues].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [newIssues],
  )

  return (
    <div className={styles.scopeCreepPanel}>
      <div className={styles.sectionTitle}>{t('change.scopeCreepAnalysis')}</div>

      {metrics.isCreeping && (
        <div className={styles.scopeCreepWarning}>
          <span className={styles.scopeCreepWarningIcon}>⚠️</span>
          <div className={styles.scopeCreepWarningText}>
            <strong>{t('change.scopeCreepWarning')}</strong> — {t('change.scopeGrowth')} {metrics.scopeIncreasePercentage.toFixed(1)}%，
            {t('change.addedReqs')} {metrics.addedIssueCount}（{metrics.addedStoryPoints} {t('dashboard.subtitle.tasks')}）
          </div>
        </div>
      )}

      <div className={styles.scopeMetrics}>
        <div className={styles.scopeMetricCard}>
          <div className={styles.scopeMetricValue}>{metrics.baselineIssueCount}</div>
          <div className={styles.scopeMetricLabel}>{t('change.baselineReqs')}</div>
        </div>
        <div className={styles.scopeMetricCard}>
          <div className={styles.scopeMetricValue}>{metrics.currentIssueCount}</div>
          <div className={styles.scopeMetricLabel}>{t('change.currentReqs')}</div>
        </div>
        <div className={styles.scopeMetricCard}>
          <div className={styles.scopeMetricValue}>{metrics.addedIssueCount}</div>
          <div className={styles.scopeMetricLabel}>{t('change.addedReqs')}</div>
        </div>
        <div className={styles.scopeMetricCard}>
          <div className={styles.scopeMetricValue}>{metrics.addedStoryPoints}</div>
          <div className={styles.scopeMetricLabel}>{t('change.addedTasks')}</div>
        </div>
        <div className={styles.scopeMetricCard}>
          <div className={styles.scopeMetricValue}>{metrics.scopeIncreasePercentage.toFixed(1)}%</div>
          <div className={styles.scopeMetricLabel}>{t('change.scopeGrowth')}</div>
        </div>
      </div>

      {sortedNewIssues.length > 0 && (
        <>
          <div className={styles.sectionTitle}>{t('change.newReqTimeline')}</div>
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
                <span className={styles.scopeTimelineSP}>{issue.storyPoints || 1} {t('dashboard.subtitle.tasks')}</span>
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
  const { t } = useI18n()
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
      <div className={styles.sectionTitle}>{t('change.aiAnalysis')}</div>

      {!cachedSummary && !isLoading && !streamedContent && (
        <button
          className={styles.aiGenerateBtn}
          onClick={handleGenerate}
          disabled={isLoading}
        >
          <span className={styles.aiGenerateBtnIcon}>🤖</span>
          {t('change.aiAnalyzeBtn')}
        </button>
      )}

      {isLoading && !streamedContent && (
        <div className={styles.aiLoading}>
          <span>{t('change.aiAnalyzing')}</span>
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
            {t('ai.cached')}
          </div>
        </>
      )}

      {error && (
        <div className={styles.aiError}>
          <span className={styles.aiErrorText}>{error}</span>
          <button className={styles.aiRetryBtn} onClick={handleRetry}>
            {t('ai.retry')}
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
  const { t } = useI18n()
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
          <span>{t('change.noSprintDate')}</span>
        </div>
      </div>
    )
  }

  // Empty state: no changes detected
  if (changes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>✅</div>
        <div className={styles.emptyText}>{t('change.noChanges')}</div>
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
