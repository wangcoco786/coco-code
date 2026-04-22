import type {
  PlatformIssue,
  IssueStatus,
  ChangeType,
  DetectedChange,
  ScopeCreepMetrics,
  ImpactAnalysis,
} from '@/types/platform'

// ============================================================
// Change Detector — pure functions for Change Tab
// ============================================================

// ─── Status workflow order (for regression detection) ───────

export const STATUS_ORDER: Record<IssueStatus, number> = {
  todo: 0,
  in_progress: 1,
  in_review: 2,
  in_testing: 3,
  done: 4,
}

// ─── categorizeChange ───────────────────────────────────────

/**
 * Determine the change type for a single issue relative to the Sprint start.
 *
 * Priority:
 *  1. new_addition — created after Sprint start
 *  2. priority_change — P0/P1 updated after Sprint start (and not new)
 *  3. scope_change — SP changed (proxy: isBaseline=false) and updated after start (and not new)
 *  4. status_regression — status is lower in workflow than expected
 *
 * Returns null when no change is detected.
 */
export function categorizeChange(
  issue: PlatformIssue,
  sprintStartDate: string,
): ChangeType | null {
  if (!sprintStartDate) return null

  const start = new Date(sprintStartDate).getTime()
  const created = new Date(issue.createdAt).getTime()
  const updated = new Date(issue.updatedAt).getTime()

  // 1. New addition — created after Sprint start
  if (created > start) {
    return 'new_addition'
  }

  // 2. Priority change — high-priority issue updated during Sprint
  if (
    (issue.priority === 'P0' || issue.priority === 'P1') &&
    updated > start
  ) {
    return 'priority_change'
  }

  // 3. Scope change — SP modified (proxy: not baseline) and updated during Sprint
  if (!issue.isBaseline && updated > start) {
    return 'scope_change'
  }

  // 4. Status regression — status is lower than in_progress (i.e. moved back to todo)
  //    We detect regression when an issue that was updated during the Sprint
  //    has a status lower than expected forward progress.
  if (updated > start && STATUS_ORDER[issue.status] < STATUS_ORDER['in_progress']) {
    return 'status_regression'
  }

  return null
}


// ─── detectChanges ──────────────────────────────────────────

/**
 * Apply change categorization to all issues and return DetectedChange objects.
 * Filters out issues with no detected change (null).
 */
export function detectChanges(
  issues: PlatformIssue[],
  sprintStartDate: string,
): DetectedChange[] {
  if (!issues.length || !sprintStartDate) return []

  const changes: DetectedChange[] = []

  for (const issue of issues) {
    const changeType = categorizeChange(issue, sprintStartDate)
    if (changeType === null) continue

    changes.push({
      issue,
      changeType,
      description: buildChangeDescription(issue, changeType),
      severity: deriveSeverity(issue),
      detectedAt: issue.updatedAt,
    })
  }

  return changes
}

// ─── helpers for detectChanges ──────────────────────────────

function buildChangeDescription(
  issue: PlatformIssue,
  changeType: ChangeType,
): string {
  switch (changeType) {
    case 'new_addition':
      return `新增需求 ${issue.id}「${issue.title}」在 Sprint 启动后加入`
    case 'priority_change':
      return `${issue.id}「${issue.title}」优先级变更为 ${issue.priority}`
    case 'scope_change':
      return `${issue.id}「${issue.title}」范围发生变更（Story Points 或标签修改）`
    case 'status_regression':
      return `${issue.id}「${issue.title}」状态回退至 ${issue.status}`
  }
}

function deriveSeverity(issue: PlatformIssue): 'high' | 'medium' | 'low' {
  if (issue.priority === 'P0') return 'high'
  if (issue.priority === 'P1') return 'medium'
  return 'low'
}

// ─── computeScopeCreepMetrics ───────────────────────────────

/**
 * Compute scope creep metrics by comparing baseline (pre-Sprint) vs added issues.
 */
export function computeScopeCreepMetrics(
  issues: PlatformIssue[],
  sprintStartDate: string,
): ScopeCreepMetrics {
  if (!issues.length || !sprintStartDate) {
    return {
      baselineIssueCount: 0,
      currentIssueCount: issues.length,
      addedIssueCount: 0,
      addedStoryPoints: 0,
      scopeIncreasePercentage: 0,
      isCreeping: false,
    }
  }

  const start = new Date(sprintStartDate).getTime()

  let baselineIssueCount = 0
  let addedIssueCount = 0
  let addedStoryPoints = 0

  for (const issue of issues) {
    const created = new Date(issue.createdAt).getTime()
    if (created > start) {
      addedIssueCount++
      addedStoryPoints += 1 // 每个任务计为 1
    } else {
      baselineIssueCount++
    }
  }

  const scopeIncreasePercentage =
    baselineIssueCount > 0
      ? (addedIssueCount / baselineIssueCount) * 100
      : 0

  return {
    baselineIssueCount,
    currentIssueCount: issues.length,
    addedIssueCount,
    addedStoryPoints,
    scopeIncreasePercentage,
    isCreeping: scopeIncreasePercentage > 20,
  }
}


// ─── computeImpactAnalysis ──────────────────────────────────

/**
 * Compute impact analysis from detected changes and the full issue set.
 */
export function computeImpactAnalysis(
  changes: DetectedChange[],
  allIssues: PlatformIssue[],
  sprintStartDate: string,
): ImpactAnalysis {
  const totalChanges = changes.length

  // Count changes by type
  const changesByType: Record<ChangeType, number> = {
    priority_change: 0,
    new_addition: 0,
    scope_change: 0,
    status_regression: 0,
  }
  for (const change of changes) {
    changesByType[change.changeType]++
  }

  // Affected = count of changed issues (task-based, not SP-based)
  const affectedStoryPoints = changes.length

  // Baseline = count of issues created before Sprint start
  let baselineStoryPoints = 0
  if (sprintStartDate) {
    const start = new Date(sprintStartDate).getTime()
    for (const issue of allIssues) {
      if (new Date(issue.createdAt).getTime() <= start) {
        baselineStoryPoints += 1
      }
    }
  }

  const impactPercentage =
    baselineStoryPoints > 0
      ? (affectedStoryPoints / baselineStoryPoints) * 100
      : 0

  let impactLevel: 'high' | 'medium' | 'low'
  if (impactPercentage > 30) {
    impactLevel = 'high'
  } else if (impactPercentage >= 10) {
    impactLevel = 'medium'
  } else {
    impactLevel = 'low'
  }

  return {
    totalChanges,
    changesByType,
    affectedStoryPoints,
    baselineStoryPoints,
    impactPercentage,
    impactLevel,
  }
}

// ─── buildAISummaryPrompt ───────────────────────────────────

/**
 * Build a Chinese prompt string for AgentForce that includes all change
 * issue IDs, change types, metrics, and asks for summary + impact + suggestions.
 */
export function buildAISummaryPrompt(
  changes: DetectedChange[],
  metrics: ScopeCreepMetrics,
  sprintName: string,
): string {
  const changeLines = changes
    .map(
      (c) =>
        `- ${c.issue.id}（${c.changeType}）: ${c.description}`,
    )
    .join('\n')

  return (
    `请分析以下 Sprint「${sprintName}」的需求变更情况，并给出总结、影响评估和建议：\n` +
    `\n` +
    `## 变更列表\n` +
    `${changeLines || '无变更'}\n` +
    `\n` +
    `## 范围蔓延指标\n` +
    `- 基线需求数: ${metrics.baselineIssueCount}\n` +
    `- 当前需求数: ${metrics.currentIssueCount}\n` +
    `- 新增需求数: ${metrics.addedIssueCount}\n` +
    `- 新增 Story Points: ${metrics.addedStoryPoints}\n` +
    `- 范围增长百分比: ${metrics.scopeIncreasePercentage.toFixed(1)}%\n` +
    `- 是否存在范围蔓延: ${metrics.isCreeping ? '是' : '否'}\n` +
    `\n` +
    `请提供：\n` +
    `1. 变更摘要：概述本 Sprint 发生了哪些关键变更\n` +
    `2. 影响分析：这些变更对 Sprint 交付目标的影响\n` +
    `3. 建议措施：PM 应采取的应对措施`
  )
}
