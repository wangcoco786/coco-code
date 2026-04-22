import type {
  PlatformIssue,
  IssueStatus,
  IssuePriority,
  DeveloperProfile,
  WorkloadInfo,
  TeamSummary,
} from '@/types/platform'

// ============================================================
// Workload Calculator — pure functions for Resource Tab
// ============================================================

export const DEFAULT_CAPACITY = 10 // 每人每 Sprint 默认容量（任务数）

// ─── Sort order maps ────────────────────────────────────────

const TASK_STATUS_SORT: Record<IssueStatus, number> = {
  in_progress: 0,
  todo: 1,
  in_review: 2,
  in_testing: 3,
  done: 4,
}

const TASK_PRIORITY_SORT: Record<IssuePriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
}

// ─── getLoadStatus ──────────────────────────────────────────

/**
 * Classify a load percentage into overloaded / balanced / underloaded.
 *  >100  → overloaded
 *  60–100 → balanced
 *  <60   → underloaded
 */
export function getLoadStatus(
  percentage: number,
): 'overloaded' | 'balanced' | 'underloaded' {
  if (percentage > 100) return 'overloaded'
  if (percentage >= 60) return 'balanced'
  return 'underloaded'
}

// ─── sortTasks ──────────────────────────────────────────────

/**
 * Sort issues by status order then by priority within each status group.
 * Returns a new array (does not mutate input).
 */
export function sortTasks(tasks: PlatformIssue[]): PlatformIssue[] {
  return [...tasks].sort((a, b) => {
    const statusDiff = TASK_STATUS_SORT[a.status] - TASK_STATUS_SORT[b.status]
    if (statusDiff !== 0) return statusDiff
    return TASK_PRIORITY_SORT[a.priority] - TASK_PRIORITY_SORT[b.priority]
  })
}


// ─── computeDeveloperProfiles ───────────────────────────────

/**
 * Group issues by assignee and build a DeveloperProfile per unique assignee.
 * - Skips issues with null assignee.
 * - Formats name: if it looks like an email, take the part before '@'.
 * - Extracts deduplicated skill tags from all labels across the developer's issues.
 */
export function computeDeveloperProfiles(
  issues: PlatformIssue[],
): DeveloperProfile[] {
  const profileMap = new Map<
    string,
    {
      name: string
      avatarUrl: string | null
      labels: Set<string>
      tasks: PlatformIssue[]
    }
  >()

  for (const issue of issues) {
    if (issue.assignee === null) continue

    const { id, name, avatarUrl } = issue.assignee
    let entry = profileMap.get(id)

    if (!entry) {
      // Format name: strip email domain if applicable
      const formattedName = name.includes('@') ? name.split('@')[0] : name

      entry = {
        name: formattedName,
        avatarUrl: avatarUrl || null,
        labels: new Set<string>(),
        tasks: [],
      }
      profileMap.set(id, entry)
    }

    entry.tasks.push(issue)

    // Collect labels (handle undefined / null gracefully)
    const labels = issue.labels ?? []
    for (const label of labels) {
      entry.labels.add(label)
    }
  }

  const profiles: DeveloperProfile[] = []
  for (const [id, entry] of profileMap) {
    profiles.push({
      id,
      name: entry.name,
      avatarUrl: entry.avatarUrl,
      skillTags: Array.from(entry.labels),
      tasks: entry.tasks,
    })
  }

  return profiles
}

// ─── computeWorkloadInfo ────────────────────────────────────

/**
 * Compute workload information from a set of issues.
 * Uses task count (not Story Points) for load calculation.
 * - activeTaskCount = number of non-done issues
 * - loadPercentage = (activeTaskCount / capacity) * 100
 */
export function computeWorkloadInfo(
  issues: PlatformIssue[],
  capacity: number = DEFAULT_CAPACITY,
): WorkloadInfo {
  let activeTaskCount = 0
  let doneCount = 0
  let inProgressCount = 0
  let todoCount = 0

  for (const issue of issues) {
    if (issue.status === 'done') {
      doneCount++
    } else {
      activeTaskCount++

      if (issue.status === 'in_progress') {
        inProgressCount++
      } else {
        todoCount++
      }
    }
  }

  const effectiveCapacity = capacity > 0 ? capacity : DEFAULT_CAPACITY
  const loadPercentage = (activeTaskCount / effectiveCapacity) * 100

  return {
    totalStoryPoints: activeTaskCount, // 现在表示未完成任务数
    capacity: effectiveCapacity,
    loadPercentage,
    status: getLoadStatus(loadPercentage),
    doneCount,
    inProgressCount,
    todoCount,
  }
}

// ─── computeTeamSummary ─────────────────────────────────────

/**
 * Compute team-level summary statistics.
 * - totalTasks = all issues count
 * - assignedTasks = issues with non-null assignee
 * - unassignedTasks = issues with null assignee
 * - averageLoadPercentage = mean of each profile's load percentage
 * - overloaded/balanced/underloaded counts from profiles
 */
export function computeTeamSummary(
  profiles: DeveloperProfile[],
  allIssues: PlatformIssue[],
): TeamSummary {
  const totalTasks = allIssues.length
  const unassignedTasks = allIssues.filter((i) => i.assignee === null).length
  const assignedTasks = totalTasks - unassignedTasks

  let overloadedCount = 0
  let balancedCount = 0
  let underloadedCount = 0
  let totalLoad = 0

  for (const profile of profiles) {
    const info = computeWorkloadInfo(profile.tasks)
    totalLoad += info.loadPercentage

    switch (info.status) {
      case 'overloaded':
        overloadedCount++
        break
      case 'balanced':
        balancedCount++
        break
      case 'underloaded':
        underloadedCount++
        break
    }
  }

  const averageLoadPercentage =
    profiles.length > 0 ? totalLoad / profiles.length : 0

  return {
    totalTasks,
    assignedTasks,
    unassignedTasks,
    averageLoadPercentage,
    overloadedCount,
    balancedCount,
    underloadedCount,
  }
}
