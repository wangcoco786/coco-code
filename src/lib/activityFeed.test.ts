import { describe, it, expect } from 'vitest'
import { sortAndLimitActivities } from './activityFeed'
import type { ActivityItem } from '@/types/platform'

// ─── Helpers ────────────────────────────────────────────────

function makeActivity(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id: 'act-1',
    type: 'task_created',
    actor: { id: 'user-1', name: 'Alice' },
    target: { type: 'issue', id: 'DTS-1', title: 'Test Issue' },
    description: 'Created a task',
    timestamp: '2025-01-15T10:00:00Z',
    ...overrides,
  }
}

// ─── sortAndLimitActivities ─────────────────────────────────

describe('sortAndLimitActivities', () => {
  it('sorts activities by timestamp descending (newest first)', () => {
    const activities = [
      makeActivity({ id: 'a1', timestamp: '2025-01-10T10:00:00Z' }),
      makeActivity({ id: 'a3', timestamp: '2025-01-12T10:00:00Z' }),
      makeActivity({ id: 'a2', timestamp: '2025-01-11T10:00:00Z' }),
    ]
    const result = sortAndLimitActivities(activities)
    expect(result[0].id).toBe('a3')
    expect(result[1].id).toBe('a2')
    expect(result[2].id).toBe('a1')
  })

  it('limits to 50 items by default', () => {
    const activities = Array.from({ length: 60 }, (_, i) =>
      makeActivity({ id: `act-${i}`, timestamp: `2025-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z` })
    )
    const result = sortAndLimitActivities(activities)
    expect(result.length).toBe(50)
  })

  it('respects custom limit', () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `act-${i}`, timestamp: `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z` })
    )
    const result = sortAndLimitActivities(activities, 5)
    expect(result.length).toBe(5)
  })

  it('returns all items when fewer than limit', () => {
    const activities = [
      makeActivity({ id: 'a1', timestamp: '2025-01-10T10:00:00Z' }),
      makeActivity({ id: 'a2', timestamp: '2025-01-11T10:00:00Z' }),
    ]
    const result = sortAndLimitActivities(activities, 50)
    expect(result.length).toBe(2)
  })

  it('returns empty array for empty input', () => {
    const result = sortAndLimitActivities([])
    expect(result).toHaveLength(0)
  })

  it('does not mutate the original array', () => {
    const activities = [
      makeActivity({ id: 'a1', timestamp: '2025-01-10T10:00:00Z' }),
      makeActivity({ id: 'a2', timestamp: '2025-01-12T10:00:00Z' }),
    ]
    const original = [...activities]
    sortAndLimitActivities(activities)
    expect(activities[0].id).toBe(original[0].id)
    expect(activities[1].id).toBe(original[1].id)
  })

  it('handles limit of 0', () => {
    const activities = [makeActivity()]
    const result = sortAndLimitActivities(activities, 0)
    expect(result).toHaveLength(0)
  })

  it('keeps the newest items when limiting', () => {
    const activities = [
      makeActivity({ id: 'old', timestamp: '2025-01-01T10:00:00Z' }),
      makeActivity({ id: 'new', timestamp: '2025-01-15T10:00:00Z' }),
      makeActivity({ id: 'mid', timestamp: '2025-01-10T10:00:00Z' }),
    ]
    const result = sortAndLimitActivities(activities, 2)
    expect(result[0].id).toBe('new')
    expect(result[1].id).toBe('mid')
  })
})
