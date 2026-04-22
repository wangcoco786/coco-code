import { describe, it, expect } from 'vitest'
import {
  addDays,
  formatDateStr,
  computeTimelineRange,
  computePixelPosition,
  computeMilestoneBar,
  isOverdue,
} from './timelineCalculator'
import type { RoadmapMilestone, KeyNode } from '@/types/roadmap'

// ─── helpers ────────────────────────────────────────────────

function makeMilestone(
  overrides: Partial<RoadmapMilestone> = {},
): RoadmapMilestone {
  return {
    id: 'ms-1',
    name: 'Test Milestone',
    startDate: '2025-03-01',
    endDate: '2025-03-31',
    description: '',
    status: 'planned',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeNode(overrides: Partial<KeyNode> = {}): KeyNode {
  return {
    id: 'nd-1',
    name: 'Test Node',
    date: '2025-04-15',
    type: 'release',
    description: '',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

// ─── addDays ────────────────────────────────────────────────

describe('addDays', () => {
  it('adds positive days', () => {
    const result = addDays(new Date(2025, 0, 1), 10)
    expect(result.getFullYear()).toBe(2025)
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(11)
  })

  it('subtracts days with negative value', () => {
    const result = addDays(new Date(2025, 0, 15), -5)
    expect(result.getDate()).toBe(10)
  })

  it('does not mutate the original date', () => {
    const original = new Date(2025, 5, 1)
    const originalTime = original.getTime()
    addDays(original, 30)
    expect(original.getTime()).toBe(originalTime)
  })
})

// ─── formatDateStr ──────────────────────────────────────────

describe('formatDateStr', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(formatDateStr(new Date(2025, 0, 5))).toBe('2025-01-05')
  })

  it('pads single-digit month and day', () => {
    expect(formatDateStr(new Date(2025, 2, 9))).toBe('2025-03-09')
  })

  it('handles December correctly', () => {
    expect(formatDateStr(new Date(2025, 11, 31))).toBe('2025-12-31')
  })
})

// ─── computeTimelineRange ───────────────────────────────────

describe('computeTimelineRange', () => {
  it('returns default range (±3 months) when no data', () => {
    const range = computeTimelineRange([], [])
    const now = new Date()
    expect(range.startDate.getMonth()).toBe(
      (now.getMonth() - 3 + 12) % 12,
    )
    expect(range.months.length).toBeGreaterThanOrEqual(7)
    expect(range.totalDays).toBeGreaterThan(0)
  })

  it('pads 1 month before earliest and 1 month after latest', () => {
    const ms = makeMilestone({
      startDate: '2025-03-10',
      endDate: '2025-05-20',
    })
    const range = computeTimelineRange([ms], [])
    // Start should be Feb 1 2025 (1 month before March)
    expect(range.startDate.getFullYear()).toBe(2025)
    expect(range.startDate.getMonth()).toBe(1) // Feb
    expect(range.startDate.getDate()).toBe(1)
    // End should be last day of June 2025 (1 month after May)
    expect(range.endDate.getMonth()).toBe(5) // June
  })

  it('includes nodes in range calculation', () => {
    const node = makeNode({ date: '2025-08-01' })
    const ms = makeMilestone({
      startDate: '2025-03-01',
      endDate: '2025-04-01',
    })
    const range = computeTimelineRange([ms], [node])
    // End should extend to cover August + 1 month padding
    expect(range.endDate.getMonth()).toBe(8) // September
  })

  it('generates correct month columns', () => {
    const ms = makeMilestone({
      startDate: '2025-03-01',
      endDate: '2025-03-31',
    })
    const range = computeTimelineRange([ms], [])
    // Should have Feb, Mar, Apr columns
    expect(range.months.length).toBe(3)
    expect(range.months[0].label).toBe('2025-02')
    expect(range.months[1].label).toBe('2025-03')
    expect(range.months[2].label).toBe('2025-04')
  })
})

// ─── computePixelPosition ───────────────────────────────────

describe('computePixelPosition', () => {
  it('returns 0 for range start date', () => {
    const ms = makeMilestone({
      startDate: '2025-03-01',
      endDate: '2025-03-31',
    })
    const range = computeTimelineRange([ms], [])
    const pos = computePixelPosition(range.startDate, range, 1000)
    expect(pos).toBe(0)
  })

  it('returns totalWidth for range end date', () => {
    const ms = makeMilestone({
      startDate: '2025-03-01',
      endDate: '2025-03-31',
    })
    const range = computeTimelineRange([ms], [])
    const pos = computePixelPosition(range.endDate, range, 1000)
    expect(pos).toBeCloseTo(1000, 0)
  })

  it('returns proportional position for midpoint', () => {
    const ms = makeMilestone({
      startDate: '2025-03-01',
      endDate: '2025-03-31',
    })
    const range = computeTimelineRange([ms], [])
    const mid = new Date(
      (range.startDate.getTime() + range.endDate.getTime()) / 2,
    )
    const pos = computePixelPosition(mid, range, 1000)
    expect(pos).toBeCloseTo(500, 0)
  })
})

// ─── computeMilestoneBar ────────────────────────────────────

describe('computeMilestoneBar', () => {
  it('returns left and width in pixels', () => {
    const ms = makeMilestone({
      startDate: '2025-03-01',
      endDate: '2025-03-31',
    })
    const range = computeTimelineRange([ms], [])
    const bar = computeMilestoneBar(ms, range, 1000)
    expect(bar.left).toBeGreaterThan(0)
    expect(bar.width).toBeGreaterThan(0)
  })

  it('width equals right - left', () => {
    const ms = makeMilestone({
      startDate: '2025-03-10',
      endDate: '2025-04-10',
    })
    const range = computeTimelineRange([ms], [])
    const bar = computeMilestoneBar(ms, range, 2000)
    const leftPos = computePixelPosition(
      new Date(ms.startDate),
      range,
      2000,
    )
    const rightPos = computePixelPosition(
      new Date(ms.endDate),
      range,
      2000,
    )
    expect(bar.left).toBeCloseTo(leftPos)
    expect(bar.width).toBeCloseTo(rightPos - leftPos)
  })
})

// ─── isOverdue ──────────────────────────────────────────────

describe('isOverdue', () => {
  it('returns true when endDate is past and status is not completed', () => {
    const ms = makeMilestone({
      endDate: '2020-01-01',
      status: 'in_progress',
    })
    expect(isOverdue(ms)).toBe(true)
  })

  it('returns false when status is completed even if endDate is past', () => {
    const ms = makeMilestone({
      endDate: '2020-01-01',
      status: 'completed',
    })
    expect(isOverdue(ms)).toBe(false)
  })

  it('returns false when endDate is in the future', () => {
    const ms = makeMilestone({
      endDate: '2099-12-31',
      status: 'planned',
    })
    expect(isOverdue(ms)).toBe(false)
  })

  it('returns true for delayed status with past endDate', () => {
    const ms = makeMilestone({
      endDate: '2020-06-15',
      status: 'delayed',
    })
    expect(isOverdue(ms)).toBe(true)
  })
})
