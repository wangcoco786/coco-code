import type {
  PlatformIssue,
  IssueCategory,
  ClassifiedIssue,
  CategorizedIssues,
  ReleaseNotesSummary,
  ReleaseNotesData,
} from '@/types/platform'
import { CATEGORY_RULES } from '@/types/platform'

// ============================================================
// Release Notes Engine — pure functions for classification,
// statistics, and aggregation
// ============================================================

// ─── classifyIssue ──────────────────────────────────────────

/**
 * Classify a single issue based on its labels and issueType.
 * Rules are applied in priority order: hot_fix > bug_fix > feature > improvement > other.
 *
 * Also determines:
 * - isUnplanned: whether the issue was created after the Sprint startDate
 * - isStaleStatus: whether the issue has a stale status near Sprint end
 */
export function classifyIssue(
  issue: PlatformIssue,
  sprintStartDate: string,
  sprintEndDate: string,
  issueType?: string,
): ClassifiedIssue {
  const category = determineCategory(issue.labels, issueType)
  const isUnplanned = detectUnplanned(issue.createdAt, sprintStartDate)
  const isStaleStatus = detectStaleStatus(issue.status, sprintEndDate)

  return {
    ...issue,
    category,
    isUnplanned,
    isStaleStatus,
  }
}

// ─── categorizeIssues ───────────────────────────────────────

/**
 * Classify all issues and group them by category.
 * Returns a CategorizedIssues object with arrays for each category.
 */
export function categorizeIssues(
  issues: PlatformIssue[],
  sprintStartDate: string,
  sprintEndDate: string,
  issueTypes?: Map<string, string>,
): CategorizedIssues {
  const result: CategorizedIssues = {
    feature: [],
    bug_fix: [],
    hot_fix: [],
    improvement: [],
    other: [],
  }

  for (const issue of issues) {
    const issueType = issueTypes?.get(issue.jiraId) ?? issueTypes?.get(issue.id)
    const classified = classifyIssue(issue, sprintStartDate, sprintEndDate, issueType)
    result[classified.category].push(classified)
  }

  return result
}

// ─── computeCompletionSummary ───────────────────────────────

/**
 * Compute completion statistics from categorized issues.
 * Returns total count, completed count, completion rate, hotfix count,
 * baseline/unplanned counts, and warning flag.
 */
export function computeCompletionSummary(
  categorizedIssues: CategorizedIssues,
): ReleaseNotesSummary {
  const allIssues = getAllClassifiedIssues(categorizedIssues)
  const totalCount = allIssues.length
  const completedCount = allIssues.filter((i) => i.status === 'done').length
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const hotFixCount = categorizedIssues.hot_fix.length
  const unplannedCount = allIssues.filter((i) => i.isUnplanned).length
  const baselineCount = totalCount - unplannedCount

  return {
    totalCount,
    completedCount,
    completionRate,
    hotFixCount,
    baselineCount,
    unplannedCount,
    isCompletionWarning: completionRate < 80,
  }
}

// ─── detectStaleIssues ──────────────────────────────────────

/**
 * Detect issues with potentially stale statuses.
 * An issue is considered stale if:
 * - Its status is "in_progress" or "in_testing"
 * - The current time is within 2 days of the Sprint endDate
 */
export function detectStaleIssues(
  issues: ClassifiedIssue[],
  sprintEndDate: string,
  now?: Date,
): ClassifiedIssue[] {
  const currentTime = now ?? new Date()
  const endTime = new Date(sprintEndDate).getTime()
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000

  // Only flag stale if we are within 2 days of Sprint end
  const timeUntilEnd = endTime - currentTime.getTime()
  if (timeUntilEnd > twoDaysMs || timeUntilEnd < 0) {
    // If Sprint end has passed or is more than 2 days away, no stale detection
    // Actually, per requirement: "Sprint endDate is within 2 days" means
    // current time is within 2 days before the end date.
    // If endDate has passed, we still check (sprint end already passed scenario)
    // Let's re-read: "WHEN a Sprint_Issue has status 'in_progress' or 'in_testing'
    // and the Sprint endDate is within 2 days"
    // This means: the end date is approaching (within 2 days from now)
    // So: endDate - now <= 2 days AND endDate >= now (or endDate already passed)
  }

  // Simplified: flag if within 2 days of end (including past end)
  const isNearEnd = timeUntilEnd <= twoDaysMs

  if (!isNearEnd) return []

  return issues.filter(
    (issue) => issue.status === 'in_progress' || issue.status === 'in_testing',
  )
}

// ─── identifyUnplannedIssues ────────────────────────────────

/**
 * Filter issues that were created after the Sprint startDate (unplanned/插队).
 */
export function identifyUnplannedIssues(
  issues: ClassifiedIssue[],
): ClassifiedIssue[] {
  return issues.filter((issue) => issue.isUnplanned)
}

// ─── buildReleaseNotesData ──────────────────────────────────

/**
 * Aggregate all data into a complete ReleaseNotesData object.
 * This is the main entry point for generating release notes.
 */
export function buildReleaseNotesData(
  issues: PlatformIssue[],
  sprint: { name: string; startDate: string; endDate: string },
  projectKey: string,
  issueTypes?: Map<string, string>,
): ReleaseNotesData {
  const categorizedIssues = categorizeIssues(
    issues,
    sprint.startDate,
    sprint.endDate,
    issueTypes,
  )

  const summary = computeCompletionSummary(categorizedIssues)

  const allClassified = getAllClassifiedIssues(categorizedIssues)
  const staleIssues = detectStaleIssues(allClassified, sprint.endDate)

  return {
    sprintName: sprint.name,
    sprintStartDate: sprint.startDate,
    sprintEndDate: sprint.endDate,
    projectKey,
    summary,
    categorizedIssues,
    staleIssues,
    generatedAt: new Date().toISOString(),
  }
}

// ─── Internal helpers ───────────────────────────────────────

/**
 * Determine the category for an issue based on labels and issueType.
 * Applies CATEGORY_RULES in priority order (hot_fix > bug_fix > feature > improvement).
 * Falls back to 'other' if no rule matches.
 */
function determineCategory(labels: string[], issueType?: string): IssueCategory {
  for (const rule of CATEGORY_RULES) {
    // Check label patterns
    for (const pattern of rule.labelPatterns) {
      for (const label of labels) {
        if (pattern.test(label)) {
          return rule.category
        }
      }
    }

    // Check issue type
    if (issueType && rule.issueTypes.includes(issueType)) {
      return rule.category
    }
  }

  return 'other'
}

/**
 * Determine if an issue is unplanned (created after Sprint start).
 */
function detectUnplanned(createdAt: string, sprintStartDate: string): boolean {
  if (!sprintStartDate || !createdAt) return false
  return new Date(createdAt).getTime() > new Date(sprintStartDate).getTime()
}

/**
 * Determine if an issue has a stale status (in_progress or in_testing near Sprint end).
 * This is a per-issue check used during classification.
 * Note: The actual stale detection also requires checking proximity to Sprint end,
 * which is handled by detectStaleIssues. This helper marks the status type only.
 */
function detectStaleStatus(status: string, sprintEndDate: string): boolean {
  if (!sprintEndDate) return false

  const now = new Date()
  const endTime = new Date(sprintEndDate).getTime()
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000
  const timeUntilEnd = endTime - now.getTime()

  // Only mark as stale if within 2 days of Sprint end
  if (timeUntilEnd > twoDaysMs) return false

  return status === 'in_progress' || status === 'in_testing'
}

/**
 * Flatten all classified issues from a CategorizedIssues object into a single array.
 */
function getAllClassifiedIssues(categorized: CategorizedIssues): ClassifiedIssue[] {
  return [
    ...categorized.feature,
    ...categorized.bug_fix,
    ...categorized.hot_fix,
    ...categorized.improvement,
    ...categorized.other,
  ]
}
