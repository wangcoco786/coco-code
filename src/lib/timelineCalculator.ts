import type {
  RoadmapMilestone,
  KeyNode,
  TimelineRange,
  MonthColumn,
} from '@/types/roadmap'

// ============================================================
// Timeline Calculator — pure functions for Roadmap TimelineView
// ============================================================

// ─── addDays ────────────────────────────────────────────────

/** Add (or subtract) days to a date. Returns a new Date. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// ─── formatDateStr ──────────────────────────────────────────

/** Format a Date as YYYY-MM-DD string. */
export function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ─── computeTimelineRange ───────────────────────────────────

/**
 * Compute the visible timeline range from milestones and nodes.
 * - Finds the earliest and latest dates across all items.
 * - Pads 1 month before the earliest and 1 month after the latest.
 * - Generates a MonthColumn array covering the full range.
 * - If no items exist, defaults to current month ± 3 months.
 */
export function computeTimelineRange(
  milestones: RoadmapMilestone[],
  nodes: KeyNode[],
): TimelineRange {
  const dates: Date[] = []

  for (const m of milestones) {
    dates.push(new Date(m.startDate))
    dates.push(new Date(m.endDate))
  }
  for (const n of nodes) {
    dates.push(new Date(n.date))
  }

  let rangeStart: Date
  let rangeEnd: Date

  if (dates.length === 0) {
    // Default: current month ± 3 months
    const now = new Date()
    rangeStart = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    rangeEnd = new Date(now.getFullYear(), now.getMonth() + 4, 0) // last day of month+3
  } else {
    const minTime = Math.min(...dates.map((d) => d.getTime()))
    const maxTime = Math.max(...dates.map((d) => d.getTime()))
    const minDate = new Date(minTime)
    const maxDate = new Date(maxTime)

    // Pad 1 month before / after
    rangeStart = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1)
    rangeEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0) // last day of month+1
  }

  const totalDays = Math.round(
    (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24),
  )

  const months = generateMonthColumns(rangeStart, rangeEnd)

  return { startDate: rangeStart, endDate: rangeEnd, totalDays, months }
}

// ─── generateMonthColumns (internal) ────────────────────────

function generateMonthColumns(start: Date, end: Date): MonthColumn[] {
  const columns: MonthColumn[] = []
  let year = start.getFullYear()
  let month = start.getMonth()

  while (
    year < end.getFullYear() ||
    (year === end.getFullYear() && month <= end.getMonth())
  ) {
    const monthStart = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDay = Math.round(
      (monthStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    )
    const label = `${year}-${String(month + 1).padStart(2, '0')}`

    columns.push({ year, month, label, startDay, days: daysInMonth })

    month++
    if (month > 11) {
      month = 0
      year++
    }
  }

  return columns
}

// ─── computePixelPosition ───────────────────────────────────

/**
 * Convert a date to a pixel X position within the timeline.
 * Formula: ((date - rangeStart) / totalDays) * totalWidth
 */
export function computePixelPosition(
  date: Date,
  range: TimelineRange,
  totalWidth: number,
): number {
  const dayOffset =
    (date.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24)
  return (dayOffset / range.totalDays) * totalWidth
}

// ─── computeMilestoneBar ────────────────────────────────────

/**
 * Compute the left offset and width (in pixels) for a milestone bar.
 */
export function computeMilestoneBar(
  milestone: RoadmapMilestone,
  range: TimelineRange,
  totalWidth: number,
): { left: number; width: number } {
  const left = computePixelPosition(new Date(milestone.startDate), range, totalWidth)
  const right = computePixelPosition(new Date(milestone.endDate), range, totalWidth)
  return { left, width: right - left }
}

// ─── isOverdue ──────────────────────────────────────────────

/**
 * A milestone is overdue if its endDate is strictly before today
 * AND its status is not 'completed'.
 */
export function isOverdue(milestone: RoadmapMilestone): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(milestone.endDate)
  end.setHours(0, 0, 0, 0)
  return end < today && milestone.status !== 'completed'
}
