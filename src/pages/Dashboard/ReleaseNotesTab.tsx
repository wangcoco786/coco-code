import { useState } from 'react'
import { useReleaseNotes } from '@/hooks/useReleaseNotes'
import type { ReleaseNotesData, ReleaseNotesSummary, ClassifiedIssue, IssueCategory, CategorizedIssues } from '@/types/platform'
import styles from './ReleaseNotesTab.module.css'

/** 明细弹窗的筛选类型 */
type DetailFilter = 'all' | 'completed' | 'incomplete' | 'hotfix' | 'unplanned' | 'stale' | null

interface ReleaseNotesTabProps {
  projectKey: string
}

// ============================================================
// ReleaseNotesTab — Release Notes 容器组件
// 渲染 Sprint header、筛选栏、统计摘要、分类区块、导出按钮
// 处理加载骨架屏和错误重试状态
// ============================================================

export default function ReleaseNotesTab({ projectKey }: ReleaseNotesTabProps) {
  const {
    releaseNotesData,
    sprint,
    isLoading,
    error,
    refetch,
    showOnlyUnplanned,
    showOnlyStale,
    toggleShowOnlyUnplanned,
    toggleShowOnlyStale,
    filteredIssues,
  } = useReleaseNotes(projectKey)

  // 明细弹窗状态
  const [detailFilter, setDetailFilter] = useState<DetailFilter>(null)

  // ─── Loading State ────────────────────────────────────────
  if (isLoading) {
    return <LoadingSkeleton />
  }

  // ─── Error State ──────────────────────────────────────────
  if (error) {
    return (
      <div className={styles.errorState}>
        <span className={styles.errorIcon}>⚠️</span>
        <p className={styles.errorMessage}>
          加载 Release Notes 失败：{error.message}
        </p>
        <button className={styles.retryButton} onClick={refetch}>
          重试
        </button>
      </div>
    )
  }

  // ─── Empty State ──────────────────────────────────────────
  if (!releaseNotesData || !sprint) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📋</div>
        <p className={styles.emptyText}>当前 Sprint 暂无数据</p>
      </div>
    )
  }

  // ─── Determine which issues to show per category ──────────
  const displayIssues = getDisplayIssues(
    releaseNotesData.categorizedIssues,
    filteredIssues,
    showOnlyUnplanned || showOnlyStale,
  )

  return (
    <div className={styles.container}>
      {/* Sprint Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.sprintName}>{sprint.name}</h2>
          <p className={styles.dateRange}>
            {sprint.startDate?.slice(0, 10)} ~ {sprint.endDate?.slice(0, 10)}
          </p>
        </div>
        <ExportDropdown
          releaseNotesData={releaseNotesData}
          projectKey={projectKey}
          sprintName={sprint.name}
        />
      </div>

      {/* Completion Summary */}
      <CompletionSummary
        summary={releaseNotesData.summary}
        staleWarningCount={releaseNotesData.staleIssues.length}
        onMetricClick={setDetailFilter}
      />

      {/* Filter Bar */}
      <div className={styles.toolbar}>
        <FilterBar
          showOnlyUnplanned={showOnlyUnplanned}
          showOnlyStale={showOnlyStale}
          onToggleUnplanned={toggleShowOnlyUnplanned}
          onToggleStale={toggleShowOnlyStale}
        />
      </div>

      {/* Issue Category Sections */}
      <div className={styles.content}>
        {(['feature', 'bug_fix', 'hot_fix', 'improvement', 'other'] as IssueCategory[]).map(
          (category) => {
            const issues = displayIssues[category]
            if (issues.length === 0) return null
            return (
              <IssueCategorySection
                key={category}
                category={category}
                issues={issues}
                defaultExpanded={true}
              />
            )
          },
        )}
      </div>

      {/* Detail Modal */}
      {detailFilter && releaseNotesData && (
        <DetailModal
          filter={detailFilter}
          releaseNotesData={releaseNotesData}
          onClose={() => setDetailFilter(null)}
        />
      )}
    </div>
  )
}

// ============================================================
// Helper: determine displayed issues per category
// ============================================================

function getDisplayIssues(
  categorizedIssues: CategorizedIssues,
  filteredIssues: ClassifiedIssue[],
  isFiltering: boolean,
): CategorizedIssues {
  if (!isFiltering) {
    return categorizedIssues
  }

  // When filtering, group the filtered issues by category
  const result: CategorizedIssues = {
    feature: [],
    bug_fix: [],
    hot_fix: [],
    improvement: [],
    other: [],
  }

  for (const issue of filteredIssues) {
    result[issue.category].push(issue)
  }

  return result
}

// ============================================================
// Loading Skeleton
// ============================================================

function LoadingSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonSubtitle} />
      </div>
      <div className={styles.skeletonSummary}>
        <div className={styles.skeletonMetric} />
        <div className={styles.skeletonMetric} />
        <div className={styles.skeletonMetric} />
        <div className={styles.skeletonMetric} />
      </div>
      <div className={styles.skeletonSection}>
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
      </div>
      <div className={styles.skeletonSection}>
        <div className={styles.skeletonRow} />
        <div className={styles.skeletonRow} />
      </div>
    </div>
  )
}

// ============================================================
// Sub-Components
// ============================================================

// ============================================================
// CompletionSummary — 统计摘要组件 (Task 6.2)
// 展示总数、已完成数、完成率、Hot Fix 数量、计划内/插队比例
// 完成率低于 80% 时显示警告指示器
// 有状态待更新 Issue 时显示提醒消息
// ============================================================

function CompletionSummary({
  summary,
  staleWarningCount,
  onMetricClick,
}: {
  summary: ReleaseNotesSummary
  staleWarningCount: number
  onMetricClick: (filter: DetailFilter) => void
}) {
  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryGrid}>
        {/* 总计 */}
        <div className={`${styles.metricCard} ${styles.metricClickable}`} onClick={() => onMetricClick('all')}>
          <span className={styles.metricLabel}>总计</span>
          <span className={styles.metricValue}>{summary.totalCount}</span>
        </div>

        {/* 已完成 */}
        <div className={`${styles.metricCard} ${styles.metricClickable}`} onClick={() => onMetricClick('completed')}>
          <span className={styles.metricLabel}>已完成</span>
          <span className={`${styles.metricValue} ${styles.metricValueSuccess}`}>
            {summary.completedCount}
          </span>
        </div>

        {/* 完成率 */}
        <div className={`${styles.metricCard} ${styles.metricClickable}`} onClick={() => onMetricClick('incomplete')}>
          <span className={styles.metricLabel}>完成率</span>
          <span
            className={`${styles.metricValue} ${
              summary.isCompletionWarning
                ? styles.metricValueDanger
                : styles.metricValueSuccess
            }`}
          >
            {summary.completionRate}%
          </span>
          {summary.isCompletionWarning && (
            <span className={styles.warningIndicator}>⚠ 低于 80%</span>
          )}
        </div>

        {/* Hot Fix */}
        <div className={`${styles.metricCard} ${styles.metricClickable}`} onClick={() => onMetricClick('hotfix')}>
          <span className={styles.metricLabel}>🔥 Hot Fix</span>
          <span className={`${styles.metricValue} ${styles.metricValueWarning}`}>
            {summary.hotFixCount}
          </span>
        </div>

        {/* 计划内 vs 插队 */}
        <div className={`${styles.metricCard} ${styles.metricClickable}`} onClick={() => onMetricClick('unplanned')}>
          <span className={styles.metricLabel}>计划内 / 插队</span>
          <span className={`${styles.metricValue} ${styles.metricValueSmall}`}>
            计划内: {summary.baselineCount}, 插队: {summary.unplannedCount}
          </span>
        </div>
      </div>

      {/* 状态待更新提醒 */}
      {staleWarningCount > 0 && (
        <div className={`${styles.staleWarning} ${styles.metricClickable}`} onClick={() => onMetricClick('stale')}>
          <span className={styles.staleWarningIcon}>⚠️</span>
          <span>有 {staleWarningCount} 个 Issue 状态可能未及时更新</span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// IssueCategorySection — 可折叠分类区块组件
// 显示分类名称、Issue 数量，内部渲染 IssueRow 列表
// Requirements: 2.7, 3.1, 3.2, 3.3, 3.4, 5.1, 7.1
// ============================================================

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  feature: '🚀 新功能',
  bug_fix: '🐛 Bug 修复',
  hot_fix: '🔥 紧急修复',
  improvement: '⚡ 优化改进',
  other: '📋 其他',
}

function IssueCategorySection({
  category,
  issues,
  defaultExpanded = true,
}: {
  category: IssueCategory
  issues: ClassifiedIssue[]
  defaultExpanded?: boolean
}) {
  return (
    <details open={defaultExpanded} className={styles.categorySection}>
      <summary className={styles.categorySummary}>
        <span className={styles.categoryLabel}>
          {CATEGORY_LABELS[category]}
        </span>
        <span className={styles.categoryCount}>{issues.length}</span>
      </summary>
      <div className={styles.issueList}>
        {issues.map((issue) => (
          <IssueRow key={issue.id} issue={issue} />
        ))}
      </div>
    </details>
  )
}

// ============================================================
// IssueRow — 单条 Issue 展示组件
// 展示 issue key、title、status、priority、assignee
// 已完成显示 ✓ 图标，未完成显示状态 colored badge
// 插队 Issue 显示 "插队" badge
// 状态待更新 Issue 显示 "状态待更新" 警告 badge
// Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 7.1
// ============================================================

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  done: { label: '已完成', className: 'statusDone' },
  in_progress: { label: '进行中', className: 'statusInProgress' },
  in_testing: { label: '测试中', className: 'statusInTesting' },
  in_review: { label: '评审中', className: 'statusInProgress' },
  todo: { label: '待办', className: 'statusTodo' },
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  P0: { label: 'P0', className: 'priorityP0' },
  P1: { label: 'P1', className: 'priorityP1' },
  P2: { label: 'P2', className: 'priorityP2' },
  P3: { label: 'P3', className: 'priorityP3' },
}

function IssueRow({ issue }: { issue: ClassifiedIssue }) {
  const statusInfo = STATUS_CONFIG[issue.status] || { label: issue.status, className: 'statusTodo' }
  const priorityInfo = PRIORITY_CONFIG[issue.priority] || { label: issue.priority, className: 'priorityP3' }

  return (
    <div className={styles.issueRow}>
      {/* Status indicator: ✓ for done, colored badge for others */}
      <span className={styles.issueStatus}>
        {issue.status === 'done' ? (
          <span className={styles.doneIcon}>✓</span>
        ) : (
          <span className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
            {statusInfo.label}
          </span>
        )}
      </span>

      {/* Issue key */}
      <span className={styles.issueKey}>{issue.id}</span>

      {/* Issue title */}
      <span className={styles.issueTitle}>{issue.title}</span>

      {/* Badges: 插队 + 状态待更新 */}
      <span className={styles.issueBadges}>
        {issue.isUnplanned && (
          <span className={styles.unplannedBadge}>插队</span>
        )}
        {issue.isStaleStatus && (
          <span className={styles.staleBadge}>状态待更新</span>
        )}
      </span>

      {/* Priority */}
      <span className={`${styles.priorityBadge} ${styles[priorityInfo.className]}`}>
        {priorityInfo.label}
      </span>

      {/* Assignee */}
      <span className={styles.issueAssignee}>
        {issue.assignee?.name || '未分配'}
      </span>
    </div>
  )
}

// ============================================================
// DetailModal — 点击统计数字后展示的明细弹窗
// ============================================================

const DETAIL_FILTER_LABELS: Record<Exclude<DetailFilter, null>, string> = {
  all: '全部 Issue',
  completed: '已完成 Issue',
  incomplete: '未完成 Issue',
  hotfix: 'Hot Fix Issue',
  unplanned: '插队 Issue',
  stale: '状态待更新 Issue',
}

function DetailModal({
  filter,
  releaseNotesData,
  onClose,
}: {
  filter: Exclude<DetailFilter, null>
  releaseNotesData: ReleaseNotesData
  onClose: () => void
}) {
  // 根据 filter 类型筛选 Issue
  const allIssues: ClassifiedIssue[] = [
    ...releaseNotesData.categorizedIssues.feature,
    ...releaseNotesData.categorizedIssues.bug_fix,
    ...releaseNotesData.categorizedIssues.hot_fix,
    ...releaseNotesData.categorizedIssues.improvement,
    ...releaseNotesData.categorizedIssues.other,
  ]

  let detailIssues: ClassifiedIssue[]
  switch (filter) {
    case 'all':
      detailIssues = allIssues
      break
    case 'completed':
      detailIssues = allIssues.filter((i) => i.status === 'done')
      break
    case 'incomplete':
      detailIssues = allIssues.filter((i) => i.status !== 'done')
      break
    case 'hotfix':
      detailIssues = releaseNotesData.categorizedIssues.hot_fix
      break
    case 'unplanned':
      detailIssues = allIssues.filter((i) => i.isUnplanned)
      break
    case 'stale':
      detailIssues = releaseNotesData.staleIssues
      break
    default:
      detailIssues = allIssues
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {DETAIL_FILTER_LABELS[filter]} ({detailIssues.length})
          </h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {detailIssues.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text2)', padding: 20 }}>暂无数据</p>
          ) : (
            <div className={styles.issueList}>
              {detailIssues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** ExportDropdown — 导出按钮组件 */
function ExportDropdown({
  releaseNotesData,
  projectKey,
  sprintName,
}: {
  releaseNotesData: ReleaseNotesData
  projectKey: string
  sprintName: string
}) {
  const handleExport = () => {
    // 生成简单的 HTML release notes 并下载
    const categories: IssueCategory[] = ['feature', 'bug_fix', 'hot_fix', 'improvement', 'other']
    const categoryNames: Record<IssueCategory, string> = {
      feature: '🚀 新功能',
      bug_fix: '🐛 Bug 修复',
      hot_fix: '🔥 紧急修复',
      improvement: '⚡ 优化改进',
      other: '📋 其他',
    }

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Release Notes - ${sprintName}</title>
<style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#333}
h1{color:#667eea}h2{margin-top:24px;border-bottom:2px solid #eee;padding-bottom:8px}
table{width:100%;border-collapse:collapse;margin:16px 0}th,td{padding:8px 12px;border:1px solid #eee;text-align:left}
th{background:#f8f9fa}tr:hover{background:#f5f5ff}.done{color:#52c41a}.badge{font-size:11px;padding:2px 8px;border-radius:4px;background:#e6f7ff;color:#1890ff}
</style></head><body>`
    html += `<h1>Release Notes: ${sprintName}</h1>`
    html += `<p><strong>项目:</strong> ${projectKey} | <strong>周期:</strong> ${releaseNotesData.sprintStartDate} ~ ${releaseNotesData.sprintEndDate}</p>`
    html += `<p><strong>总计:</strong> ${releaseNotesData.summary.totalCount} | <strong>已完成:</strong> ${releaseNotesData.summary.completedCount} | <strong>完成率:</strong> ${releaseNotesData.summary.completionRate}%</p>`

    for (const cat of categories) {
      const issues = releaseNotesData.categorizedIssues[cat].filter(i => i.status === 'done')
      if (issues.length === 0) continue
      html += `<h2>${categoryNames[cat]} (${issues.length})</h2>`
      html += `<table><tr><th>ID</th><th>标题</th><th>负责人</th></tr>`
      for (const issue of issues) {
        html += `<tr><td>${issue.id}</td><td>${issue.title}</td><td>${issue.assignee?.name ?? '-'}</td></tr>`
      }
      html += `</table>`
    }
    html += `<p style="margin-top:32px;color:#999;font-size:12px">Generated at ${new Date().toISOString()}</p></body></html>`

    // 触发下载
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `release-notes-${projectKey}-${sprintName.replace(/[^a-zA-Z0-9\u4e00-\u9fff-]/g, '-')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <button
      onClick={handleExport}
      style={{
        padding: '8px 20px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: 'var(--card)',
        cursor: 'pointer',
        fontSize: 13,
        color: 'var(--text2)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      📥 导出
    </button>
  )
}

/** FilterBar — 筛选栏组件 (stub, Task 6.5) */
function FilterBar({
  showOnlyUnplanned,
  showOnlyStale,
  onToggleUnplanned,
  onToggleStale,
}: {
  showOnlyUnplanned: boolean
  showOnlyStale: boolean
  onToggleUnplanned: () => void
  onToggleStale: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={onToggleUnplanned}
        style={{
          padding: '4px 12px',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${showOnlyUnplanned ? 'var(--primary)' : 'var(--border)'}`,
          background: showOnlyUnplanned ? 'var(--primary)' : 'var(--card)',
          color: showOnlyUnplanned ? '#fff' : 'var(--text2)',
          cursor: 'pointer',
          fontSize: 12,
          transition: 'var(--transition)',
        }}
      >
        仅插队
      </button>
      <button
        onClick={onToggleStale}
        style={{
          padding: '4px 12px',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${showOnlyStale ? 'var(--danger)' : 'var(--border)'}`,
          background: showOnlyStale ? 'var(--danger)' : 'var(--card)',
          color: showOnlyStale ? '#fff' : 'var(--text2)',
          cursor: 'pointer',
          fontSize: 12,
          transition: 'var(--transition)',
        }}
      >
        仅状态待更新
      </button>
    </div>
  )
}
