import { describe, it, expect } from 'vitest'
import { propagateDelay, filterMilestonesByOwner } from './dependencyEngine'
import type { RoadmapMilestone } from '@/types/roadmap'
import type { MilestoneDependency } from '@/types/platform'

function makeMilestone(overrides: Partial<RoadmapMilestone> & { id: string }): RoadmapMilestone {
  return {
    name: `Milestone ${overrides.id}`,
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    description: '',
    status: 'planned',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('propagateDelay', () => {
  it('returns empty array for empty milestones', () => {
    const result = propagateDelay([], [], 'ms-1', '2025-02-15')
    expect(result).toEqual([])
  })

  it('returns empty array for non-existent milestone ID', () => {
    const milestones = [makeMilestone({ id: 'ms-1' })]
    const result = propagateDelay(milestones, [], 'non-existent', '2025-02-15')
    expect(result).toEqual([])
  })

  it('returns empty array when delay is zero', () => {
    const milestones = [makeMilestone({ id: 'ms-1', endDate: '2025-01-31' })]
    const result = propagateDelay(milestones, [], 'ms-1', '2025-01-31')
    expect(result).toEqual([])
  })

  it('includes the changed milestone with isDirectlyAffected=true', () => {
    const milestones = [makeMilestone({ id: 'ms-1', endDate: '2025-01-31' })]
    const result = propagateDelay(milestones, [], 'ms-1', '2025-02-07')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      milestoneId: 'ms-1',
      originalEndDate: '2025-01-31',
      newEndDate: '2025-02-07',
      delayDays: 7,
      isDirectlyAffected: true,
    })
  })

  it('propagates delay to downstream finish-to-start dependency', () => {
    const milestones = [
      makeMilestone({ id: 'ms-1', startDate: '2025-01-01', endDate: '2025-01-31' }),
      makeMilestone({ id: 'ms-2', startDate: '2025-02-01', endDate: '2025-02-28' }),
    ]
    const deps: MilestoneDependency[] = [
      { fromId: 'ms-1', toId: 'ms-2', type: 'finish-to-start' },
    ]
    const result = propagateDelay(milestones, deps, 'ms-1', '2025-02-07')

    expect(result).toHaveLength(2)
    // Changed milestone
    expect(result[0].milestoneId).toBe('ms-1')
    expect(result[0].isDirectlyAffected).toBe(true)
    expect(result[0].delayDays).toBe(7)
    // Downstream milestone
    expect(result[1].milestoneId).toBe('ms-2')
    expect(result[1].isDirectlyAffected).toBe(false)
    expect(result[1].originalEndDate).toBe('2025-02-28')
    expect(result[1].newEndDate).toBe('2025-03-07')
    expect(result[1].delayDays).toBe(7)
  })

  it('propagates delay through a chain of dependencies', () => {
    const milestones = [
      makeMilestone({ id: 'ms-1', endDate: '2025-01-31' }),
      makeMilestone({ id: 'ms-2', endDate: '2025-02-28' }),
      makeMilestone({ id: 'ms-3', endDate: '2025-03-31' }),
    ]
    const deps: MilestoneDependency[] = [
      { fromId: 'ms-1', toId: 'ms-2', type: 'finish-to-start' },
      { fromId: 'ms-2', toId: 'ms-3', type: 'finish-to-start' },
    ]
    const result = propagateDelay(milestones, deps, 'ms-1', '2025-02-10')

    expect(result).toHaveLength(3)
    expect(result[0].milestoneId).toBe('ms-1')
    expect(result[0].delayDays).toBe(10)
    expect(result[1].milestoneId).toBe('ms-2')
    expect(result[1].delayDays).toBe(10)
    expect(result[2].milestoneId).toBe('ms-3')
    expect(result[2].delayDays).toBe(10)
  })

  it('does not affect upstream milestones', () => {
    const milestones = [
      makeMilestone({ id: 'ms-1', endDate: '2025-01-31' }),
      makeMilestone({ id: 'ms-2', endDate: '2025-02-28' }),
      makeMilestone({ id: 'ms-3', endDate: '2025-03-31' }),
    ]
    const deps: MilestoneDependency[] = [
      { fromId: 'ms-1', toId: 'ms-2', type: 'finish-to-start' },
      { fromId: 'ms-2', toId: 'ms-3', type: 'finish-to-start' },
    ]
    // Delay ms-2, should only affect ms-3, not ms-1
    const result = propagateDelay(milestones, deps, 'ms-2', '2025-03-07')

    const affectedIds = result.map((r) => r.milestoneId)
    expect(affectedIds).toContain('ms-2')
    expect(affectedIds).toContain('ms-3')
    expect(affectedIds).not.toContain('ms-1')
  })

  it('handles start-to-start dependencies', () => {
    const milestones = [
      makeMilestone({ id: 'ms-1', startDate: '2025-01-01', endDate: '2025-01-31' }),
      makeMilestone({ id: 'ms-2', startDate: '2025-01-01', endDate: '2025-02-15' }),
    ]
    const deps: MilestoneDependency[] = [
      { fromId: 'ms-1', toId: 'ms-2', type: 'start-to-start' },
    ]
    const result = propagateDelay(milestones, deps, 'ms-1', '2025-02-07')

    expect(result).toHaveLength(2)
    expect(result[1].milestoneId).toBe('ms-2')
    expect(result[1].delayDays).toBe(7)
  })

  it('handles circular dependencies without infinite loop', () => {
    const milestones = [
      makeMilestone({ id: 'ms-1', endDate: '2025-01-31' }),
      makeMilestone({ id: 'ms-2', endDate: '2025-02-28' }),
      makeMilestone({ id: 'ms-3', endDate: '2025-03-31' }),
    ]
    const deps: MilestoneDependency[] = [
      { fromId: 'ms-1', toId: 'ms-2', type: 'finish-to-start' },
      { fromId: 'ms-2', toId: 'ms-3', type: 'finish-to-start' },
      { fromId: 'ms-3', toId: 'ms-1', type: 'finish-to-start' }, // cycle!
    ]
    // Should not hang and should return results
    const result = propagateDelay(milestones, deps, 'ms-1', '2025-02-07')
    expect(result.length).toBeGreaterThanOrEqual(1)
    // ms-1 should not appear twice
    const ms1Entries = result.filter((r) => r.milestoneId === 'ms-1')
    expect(ms1Entries).toHaveLength(1)
  })

  it('handles negative delay (milestone moved earlier)', () => {
    const milestones = [
      makeMilestone({ id: 'ms-1', endDate: '2025-01-31' }),
      makeMilestone({ id: 'ms-2', endDate: '2025-02-28' }),
    ]
    const deps: MilestoneDependency[] = [
      { fromId: 'ms-1', toId: 'ms-2', type: 'finish-to-start' },
    ]
    const result = propagateDelay(milestones, deps, 'ms-1', '2025-01-24')

    expect(result[0].delayDays).toBe(-7)
    expect(result[1].delayDays).toBe(-7)
    expect(result[1].newEndDate).toBe('2025-02-21')
  })

  it('handles multiple downstream dependencies from one milestone', () => {
    const milestones = [
      makeMilestone({ id: 'ms-1', endDate: '2025-01-31' }),
      makeMilestone({ id: 'ms-2', endDate: '2025-02-28' }),
      makeMilestone({ id: 'ms-3', endDate: '2025-03-15' }),
    ]
    const deps: MilestoneDependency[] = [
      { fromId: 'ms-1', toId: 'ms-2', type: 'finish-to-start' },
      { fromId: 'ms-1', toId: 'ms-3', type: 'finish-to-start' },
    ]
    const result = propagateDelay(milestones, deps, 'ms-1', '2025-02-05')

    expect(result).toHaveLength(3)
    expect(result[1].milestoneId).toBe('ms-2')
    expect(result[1].delayDays).toBe(5)
    expect(result[2].milestoneId).toBe('ms-3')
    expect(result[2].delayDays).toBe(5)
  })
})

describe('filterMilestonesByOwner', () => {
  const milestones: RoadmapMilestone[] = [
    makeMilestone({ id: 'ms-1', owner: 'Alice' }),
    makeMilestone({ id: 'ms-2', owner: 'Bob' }),
    makeMilestone({ id: 'ms-3', owner: 'Alice' }),
    makeMilestone({ id: 'ms-4' }), // no owner
  ]

  it('returns all milestones when ownerFilter is null', () => {
    const result = filterMilestonesByOwner(milestones, null)
    expect(result).toHaveLength(4)
    expect(result).toEqual(milestones)
  })

  it('filters milestones by owner', () => {
    const result = filterMilestonesByOwner(milestones, 'Alice')
    expect(result).toHaveLength(2)
    expect(result.every((m) => m.owner === 'Alice')).toBe(true)
  })

  it('returns empty array when no milestones match the owner', () => {
    const result = filterMilestonesByOwner(milestones, 'Charlie')
    expect(result).toHaveLength(0)
  })

  it('handles empty milestones array', () => {
    const result = filterMilestonesByOwner([], 'Alice')
    expect(result).toEqual([])
  })

  it('does not match milestones without owner field', () => {
    const result = filterMilestonesByOwner(milestones, 'Bob')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('ms-2')
  })
})
