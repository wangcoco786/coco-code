import type {
  PlatformIssue,
  IssueStatus,
  IssuePriority,
  DeveloperProfile,
  WorkloadInfo,
  TeamSummary,
} from '@/types/platform'
import { getExcludedUsers } from '@/lib/excludedUsers'

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
 * Group issues by developer field.
 * - Only uses developer field (no fallback to assignee).
 * - If a parent task has no developer but its sub-tasks do,
 *   the parent task is assigned to the sub-task's developer.
 * - Sub-tasks themselves are not shown (only parent tasks).
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

  // Step 1: Build a map of parent key → sub-task developers
  const parentToDeveloper = new Map<string, { id: string; name: string; avatarUrl: string; active?: boolean }>()
  for (const issue of issues) {
    if (issue.isSubTask && issue.parentKey && issue.developer) {
      // First sub-task's developer wins for the parent
      if (!parentToDeveloper.has(issue.parentKey)) {
        parentToDeveloper.set(issue.parentKey, issue.developer)
      }
    }
  }

  // Step 2: Process only non-sub-task issues (main tasks)
  for (const issue of issues) {
    if (issue.isSubTask) continue // Skip sub-tasks in display

    // Determine developer: direct developer field, or inherited from sub-task
    let person: { id: string; name: string; avatarUrl: string; active?: boolean } | null | undefined = issue.developer
    if (!person) {
      person = parentToDeveloper.get(issue.id) ?? null
    }
    if (person === null || person === undefined) continue
    // Skip inactive users
    if (person.active === false) continue
    // Skip excluded users
    const excludedNames = getExcludedUsers()
    if (excludedNames.has(person.name.toLowerCase())) continue

    const { id, name, avatarUrl } = person
    let entry = profileMap.get(id)

    if (!entry) {
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

// ─── isSystemAccount ────────────────────────────────────────

/**
 * Jira 系统账号 / 占位账号识别。
 * 这类账号（如 "+closed_folder"、"Pre Release Box"）常被用作 assignee
 * 来归档或暂存 ticket，但它们不是真实的人，不应出现在人员分组里。
 * 同时匹配 account id 和 显示名（大小写不敏感）。
 */
const SYSTEM_ACCOUNT_IDS = new Set<string>([
  'closefolder',
  'pre-release',
])

const SYSTEM_ACCOUNT_NAMES = new Set<string>([
  '+closed_folder',
  'closed_folder',
  'pre release box',
  'pre-release box',
])

export function isSystemAccount(person: { id?: string; name?: string } | null | undefined): boolean {
  if (!person) return false
  const id = (person.id ?? '').toLowerCase()
  const name = (person.name ?? '').toLowerCase()
  if (id && SYSTEM_ACCOUNT_IDS.has(id)) return true
  if (name && SYSTEM_ACCOUNT_NAMES.has(name)) return true
  // 兜底：名字里带这些关键词的占位账号
  if (name.includes('closed_folder') || name.includes('closed folder')) return true
  if (name.includes('pre release box') || name.includes('pre-release box')) return true
  return false
}

// ─── computeReporterProfiles ────────────────────────────────

/**
 * Group issues by assignee for those without a developer,
 * plus show assignees whose tasks were "claimed" by a developer.
 * This captures Reporter/PM roles who create and assign tasks
 * but don't develop them.
 * Excludes people already in the developer profiles.
 */
export function computeReporterProfiles(
  issues: PlatformIssue[],
  developerIds: Set<string>,
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

  const excludedNames = getExcludedUsers()

  for (const issue of issues) {
    if (issue.isSubTask) continue

    // Case 1: No developer → assignee is the "reporter/owner"
    // Case 2: Has developer but assignee is different → assignee is PM/reporter role
    const assignee = issue.assignee
    if (assignee && assignee.active !== false && !isSystemAccount(assignee) && !excludedNames.has(assignee.name.toLowerCase()) && !developerIds.has(assignee.id)) {
      if (!(issue.developer && issue.developer.id === assignee.id)) {
        const { id, name, avatarUrl } = assignee
        let entry = profileMap.get(id)
        if (!entry) {
          const formattedName = name.includes('@') ? name.split('@')[0] : name
          entry = { name: formattedName, avatarUrl: avatarUrl || null, labels: new Set<string>(), tasks: [] }
          profileMap.set(id, entry)
        }
        entry.tasks.push(issue)
        for (const label of issue.labels ?? []) entry.labels.add(label)
      }
    }

    // Case 3: reporter 字段有人，且不是 Developer，也不是系统账号
    // 这样能捕获 reporter 只填了 Reporter 字段、assignee 是系统账号的情况（如 APS 中的 Charles Zeng / Yuna Wu）
    const reporter = issue.reporter
    if (reporter && reporter.id && reporter.id !== 'unknown' && !isSystemAccount(reporter)) {
      const rName = reporter.name ?? ''
      if (!developerIds.has(reporter.id) && !excludedNames.has(rName.toLowerCase())) {
        // 避免把 developer（assignee 和 reporter 同一人）重复加入
        const isDeveloperAssignee = issue.developer?.id === reporter.id || assignee?.id === reporter.id && developerIds.has(assignee.id)
        if (!isDeveloperAssignee) {
          let entry = profileMap.get(reporter.id)
          if (!entry) {
            const formattedName = rName.includes('@') ? rName.split('@')[0] : rName
            entry = { name: formattedName, avatarUrl: null, labels: new Set<string>(), tasks: [] }
            profileMap.set(reporter.id, entry)
          }
          // 只添加这个 issue 到 reporter 的任务列表（如未添加过）
          if (!entry.tasks.find(t => t.id === issue.id)) {
            entry.tasks.push(issue)
            for (const label of issue.labels ?? []) entry.labels.add(label)
          }
        }
      }
    }
  }

  // Also include sub-task assignees who don't appear in developer or parent task profiles
  for (const issue of issues) {
    if (!issue.isSubTask) continue
    const assignee = issue.assignee
    if (!assignee) continue
    if (assignee.active === false) continue
    if (isSystemAccount(assignee)) continue
    if (excludedNames.has(assignee.name.toLowerCase())) continue
    if (developerIds.has(assignee.id)) continue
    // Only add if not already captured via a parent task
    if (!profileMap.has(assignee.id)) {
      const formattedName = assignee.name.includes('@') ? assignee.name.split('@')[0] : assignee.name
      profileMap.set(assignee.id, {
        name: formattedName,
        avatarUrl: assignee.avatarUrl || null,
        labels: new Set<string>(),
        tasks: [],
      })
    }
    const entry = profileMap.get(assignee.id)!
    entry.tasks.push(issue)
    for (const label of issue.labels ?? []) entry.labels.add(label)
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
