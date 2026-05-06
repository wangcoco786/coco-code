import type {
  VelocityRecord,
  VelocityChartData,
  CFDDataPoint,
  HeatmapCell,
  TimeRange,
  PlatformIssue,
} from '@/types/platform'

// ============================================================
// Chart Data Engine — pure functions for advanced visualizations
// ============================================================

// ─── Time Range Helpers ─────────────────────────────────────

/**
 * Convert a TimeRange to milliseconds.
 */
function timeRangeToMs(range: TimeRange): number {
  switch (range) {
    case '1w':
      return 7 * 24 * 60 * 60 * 1000
    case '2w':
      return 14 * 24 * 60 * 60 * 1000
    case '1m':
      return 30 * 24 * 60 * 60 * 1000
    case '3m':
      return 90 * 24 * 60 * 60 * 1000
  }
}

/**
 * Generate an array of date strings (YYYY-MM-DD) between start and end (inclusive).
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return []
  }

  const current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}

// ─── computeVelocityChart ───────────────────────────────────

/**
 * Compute velocity chart data from sprint history.
 * Takes the last N (default 6) sprint records and computes:
 * - Per-sprint velocity (completedPoints)
 * - Average velocity across the selected sprints
 * - Trend direction based on last 3 sprints vs average
 *
 * Edge cases:
 * - Empty input returns empty sprints with 0 average and 'stable' trend
 * - Single record returns that record with its velocity as average
 */
export function computeVelocityChart(
  sprintHistory: VelocityRecord[],
  limit: number = 6,
): VelocityChartData {
  if (sprintHistory.length === 0) {
    return {
      sprints: [],
      averageVelocity: 0,
      trend: 'stable',
    }
  }

  const effectiveLimit = Math.max(1, limit)
  const selected = sprintHistory.slice(-effectiveLimit)

  const sprints = selected.map((record) => ({
    name: record.sprintName,
    velocity: Math.max(0, record.completedPoints),
    planned: Math.max(0, record.plannedPoints),
  }))

  const totalVelocity = sprints.reduce((sum, s) => sum + s.velocity, 0)
  const averageVelocity = sprints.length > 0 ? totalVelocity / sprints.length : 0

  // Determine trend: compare last 3 sprints' average to overall average
  const trend = computeTrend(sprints.map((s) => s.velocity), averageVelocity)

  return {
    sprints,
    averageVelocity,
    trend,
  }
}

/**
 * Compute trend direction based on recent velocities vs average.
 * - If fewer than 3 data points, trend is 'stable'
 * - If average of last 3 > overall average → 'improving'
 * - If average of last 3 < overall average → 'declining'
 * - Otherwise → 'stable'
 */
function computeTrend(
  velocities: number[],
  overallAverage: number,
): 'improving' | 'stable' | 'declining' {
  if (velocities.length < 3) return 'stable'

  const last3 = velocities.slice(-3)
  const last3Average = last3.reduce((sum, v) => sum + v, 0) / 3

  if (last3Average > overallAverage) return 'improving'
  if (last3Average < overallAverage) return 'declining'
  return 'stable'
}

// ─── computeCFD ─────────────────────────────────────────────

/**
 * Compute Cumulative Flow Diagram data points.
 * For each day in the date range, count issues in each status.
 *
 * Simplified approach: since we don't have status history, we use
 * the issue's current status for all dates on or after its createdAt.
 * Issues not yet created on a given date are not counted.
 *
 * The 'done' count is monotonically non-decreasing because once an issue
 * is done, it stays done for all subsequent dates.
 *
 * Edge cases:
 * - Empty issues array returns data points with all zeros
 * - Invalid date range returns empty array
 */
export function computeCFD(
  issues: PlatformIssue[],
  startDate: string,
  endDate: string,
): CFDDataPoint[] {
  const dates = generateDateRange(startDate, endDate)

  if (dates.length === 0) {
    return []
  }

  // Sort issues by updatedAt to simulate status progression over time
  const sortedIssues = [...issues].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  )

  // Status progression order (higher index = more advanced)
  const STATUS_ORDER: Record<string, number> = {
    todo: 0,
    in_progress: 1,
    in_review: 2,
    in_testing: 3,
    done: 4,
  }

  return dates.map((date) => {
    const dateEnd = new Date(date + 'T23:59:59.999Z')
    const dateStart = new Date(date + 'T00:00:00.000Z')

    let todo = 0
    let inProgress = 0
    let inReview = 0
    let inTesting = 0
    let done = 0

    for (const issue of sortedIssues) {
      const createdAt = new Date(issue.createdAt)
      // Only count issues that existed on or before this date
      if (createdAt > dateEnd) continue

      const updatedAt = new Date(issue.updatedAt)
      const currentStatusOrder = STATUS_ORDER[issue.status] ?? 0

      // Simulate: if the issue was updated after this date, it was likely
      // in an earlier status on this date. Estimate based on time progression.
      let effectiveStatus = issue.status
      if (updatedAt > dateEnd && currentStatusOrder > 0) {
        // Issue hadn't reached its current status yet on this date
        // Estimate it was one or more steps back
        const totalDuration = updatedAt.getTime() - createdAt.getTime()
        const elapsed = dateEnd.getTime() - createdAt.getTime()
        const progress = totalDuration > 0 ? Math.max(0, Math.min(1, elapsed / totalDuration)) : 1
        const estimatedOrder = Math.floor(progress * currentStatusOrder)
        const statusNames = ['todo', 'in_progress', 'in_review', 'in_testing', 'done']
        effectiveStatus = statusNames[Math.min(estimatedOrder, 4)] as typeof issue.status
      }

      switch (effectiveStatus) {
        case 'todo':
          todo++
          break
        case 'in_progress':
          inProgress++
          break
        case 'in_review':
          inReview++
          break
        case 'in_testing':
          inTesting++
          break
        case 'done':
          done++
          break
      }
    }

    return { date, todo, inProgress, inReview, inTesting, done }
  })
}

// ─── computeHeatmap ─────────────────────────────────────────

/**
 * Compute team performance heatmap data.
 * Groups issues by assignee and time period, then normalizes intensity.
 *
 * Time periods are determined by the timeRange:
 * - '1w': daily periods (Mon, Tue, ...)
 * - '2w': daily periods
 * - '1m': weekly periods (Week 1, Week 2, ...)
 * - '3m': monthly periods (Month 1, Month 2, Month 3)
 *
 * Intensity is normalized: taskCount / maxTaskCount across all cells.
 *
 * Edge cases:
 * - Empty issues returns empty array
 * - Issues with no assignee are skipped
 * - Division by zero protection: if maxTaskCount is 0, intensity is 0
 */
export function computeHeatmap(
  issues: PlatformIssue[],
  timeRange: TimeRange,
): HeatmapCell[] {
  if (issues.length === 0) return []

  const periods = getPeriodsForRange(timeRange)
  const referenceDate = new Date()
  const rangeMs = timeRangeToMs(timeRange)
  const rangeStart = new Date(referenceDate.getTime() - rangeMs)

  // Group issues by assignee and period
  const cellMap = new Map<string, { memberId: string; memberName: string; period: string; taskCount: number }>()

  for (const issue of issues) {
    if (!issue.assignee) continue

    const issueDate = new Date(issue.createdAt)
    if (issueDate < rangeStart || issueDate > referenceDate) continue

    const period = getPeriodForDate(issueDate, rangeStart, timeRange, periods)
    if (!period) continue

    const key = `${issue.assignee.id}::${period}`
    const existing = cellMap.get(key)

    if (existing) {
      existing.taskCount++
    } else {
      cellMap.set(key, {
        memberId: issue.assignee.id,
        memberName: issue.assignee.name,
        period,
        taskCount: 1,
      })
    }
  }

  // Find max task count for normalization
  let maxTaskCount = 0
  for (const cell of cellMap.values()) {
    if (cell.taskCount > maxTaskCount) {
      maxTaskCount = cell.taskCount
    }
  }

  // Build result with normalized intensity
  const result: HeatmapCell[] = []
  for (const cell of cellMap.values()) {
    result.push({
      memberId: cell.memberId,
      memberName: cell.memberName,
      period: cell.period,
      intensity: maxTaskCount > 0 ? cell.taskCount / maxTaskCount : 0,
      taskCount: cell.taskCount,
    })
  }

  return result
}

/**
 * Get period labels for a given time range.
 */
function getPeriodsForRange(timeRange: TimeRange): string[] {
  switch (timeRange) {
    case '1w':
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    case '2w':
      return [
        'W1-Mon', 'W1-Tue', 'W1-Wed', 'W1-Thu', 'W1-Fri', 'W1-Sat', 'W1-Sun',
        'W2-Mon', 'W2-Tue', 'W2-Wed', 'W2-Thu', 'W2-Fri', 'W2-Sat', 'W2-Sun',
      ]
    case '1m':
      return ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
    case '3m':
      return ['Month 1', 'Month 2', 'Month 3']
  }
}

/**
 * Determine which period a date falls into based on the time range.
 */
function getPeriodForDate(
  date: Date,
  rangeStart: Date,
  timeRange: TimeRange,
  periods: string[],
): string | null {
  const elapsed = date.getTime() - rangeStart.getTime()
  const totalRange = timeRangeToMs(timeRange)

  if (elapsed < 0 || elapsed > totalRange) return null

  switch (timeRange) {
    case '1w': {
      const dayIndex = Math.floor(elapsed / (24 * 60 * 60 * 1000))
      return periods[Math.min(dayIndex, periods.length - 1)] ?? null
    }
    case '2w': {
      const dayIndex = Math.floor(elapsed / (24 * 60 * 60 * 1000))
      return periods[Math.min(dayIndex, periods.length - 1)] ?? null
    }
    case '1m': {
      const weekIndex = Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000))
      return periods[Math.min(weekIndex, periods.length - 1)] ?? null
    }
    case '3m': {
      const monthIndex = Math.floor(elapsed / (30 * 24 * 60 * 60 * 1000))
      return periods[Math.min(monthIndex, periods.length - 1)] ?? null
    }
  }
}

// ─── filterByTimeRange ──────────────────────────────────────

/**
 * Filter timestamped data by a time range.
 * Uses the item's `date` or `createdAt` field (prefers `date`).
 * Items without a valid timestamp are excluded.
 *
 * The range is calculated backwards from referenceDate (default: now).
 * An item is included if its timestamp is within [referenceDate - range, referenceDate].
 *
 * Edge cases:
 * - Empty array returns empty array
 * - Items with neither date nor createdAt are excluded
 * - Invalid date strings are excluded
 */
export function filterByTimeRange<T extends { date?: string; createdAt?: string }>(
  data: T[],
  range: TimeRange,
  referenceDate?: Date,
): T[] {
  if (data.length === 0) return []

  const ref = referenceDate ?? new Date()
  const rangeMs = timeRangeToMs(range)
  const rangeStart = new Date(ref.getTime() - rangeMs)

  return data.filter((item) => {
    const dateStr = item.date ?? item.createdAt
    if (!dateStr) return false

    const itemDate = new Date(dateStr)
    if (isNaN(itemDate.getTime())) return false

    return itemDate >= rangeStart && itemDate <= ref
  })
}
