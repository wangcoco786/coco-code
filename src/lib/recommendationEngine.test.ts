import { describe, it, expect } from 'vitest'
import { recommendAssignees, computeMemberScore } from './recommendationEngine'
import type { MemberProfile } from '@/types/platform'

// ─── Helpers ────────────────────────────────────────────────

function makeMember(overrides: Partial<MemberProfile> = {}): MemberProfile {
  return {
    id: 'member-1',
    name: 'Alice',
    skills: ['frontend', 'react'],
    currentLoad: 5,
    capacity: 10,
    completionRate: 0.85,
    avgCompletionDays: 3,
    ...overrides,
  }
}

const defaultTask = { labels: ['frontend'], priority: 'P1' as const, storyPoints: 5 }

// ─── computeMemberScore ─────────────────────────────────────

describe('computeMemberScore', () => {
  it('returns a score between 0 and 100', () => {
    const member = makeMember()
    const score = computeMemberScore(member, defaultTask)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('gives higher score to members with matching skills', () => {
    const matched = makeMember({ skills: ['frontend', 'react'], currentLoad: 5, completionRate: 0.8 })
    const unmatched = makeMember({ id: 'member-2', skills: ['backend', 'java'], currentLoad: 5, completionRate: 0.8 })
    const task = { labels: ['frontend'], priority: 'P1' as const, storyPoints: 5 }

    const scoreMatched = computeMemberScore(matched, task)
    const scoreUnmatched = computeMemberScore(unmatched, task)
    expect(scoreMatched).toBeGreaterThan(scoreUnmatched)
  })

  it('gives higher score to members with lower workload', () => {
    const light = makeMember({ currentLoad: 2, capacity: 10, skills: ['frontend'], completionRate: 0.8 })
    const heavy = makeMember({ id: 'member-2', currentLoad: 9, capacity: 10, skills: ['frontend'], completionRate: 0.8 })

    const scoreLight = computeMemberScore(light, defaultTask)
    const scoreHeavy = computeMemberScore(heavy, defaultTask)
    expect(scoreLight).toBeGreaterThan(scoreHeavy)
  })

  it('gives higher score to members with better completion rate', () => {
    const high = makeMember({ completionRate: 0.95, skills: ['frontend'], currentLoad: 5 })
    const low = makeMember({ id: 'member-2', completionRate: 0.3, skills: ['frontend'], currentLoad: 5 })

    const scoreHigh = computeMemberScore(high, defaultTask)
    const scoreLow = computeMemberScore(low, defaultTask)
    expect(scoreHigh).toBeGreaterThan(scoreLow)
  })

  it('handles zero capacity gracefully', () => {
    const member = makeMember({ capacity: 0, currentLoad: 5 })
    const score = computeMemberScore(member, defaultTask)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('handles empty task labels', () => {
    const member = makeMember()
    const task = { labels: [], priority: 'P1' as const, storyPoints: 5 }
    const score = computeMemberScore(member, task)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ─── recommendAssignees ─────────────────────────────────────

describe('recommendAssignees', () => {
  it('returns insufficient_data when fewer than 2 members', () => {
    const result = recommendAssignees(defaultTask, [makeMember()])
    expect(result.status).toBe('insufficient_data')
    expect(result.candidates).toHaveLength(0)
    expect(result.message).toBeDefined()
  })

  it('returns insufficient_data for empty team', () => {
    const result = recommendAssignees(defaultTask, [])
    expect(result.status).toBe('insufficient_data')
    expect(result.candidates).toHaveLength(0)
  })

  it('returns success with candidates when team has >= 2 members', () => {
    const team = [
      makeMember({ id: 'a', name: 'Alice' }),
      makeMember({ id: 'b', name: 'Bob' }),
    ]
    const result = recommendAssignees(defaultTask, team)
    expect(result.status).toBe('success')
    expect(result.candidates.length).toBeGreaterThanOrEqual(1)
  })

  it('returns at most topN candidates', () => {
    const team = Array.from({ length: 10 }, (_, i) =>
      makeMember({ id: `m-${i}`, name: `Member ${i}`, completionRate: Math.random() })
    )
    const result = recommendAssignees(defaultTask, team, 3)
    expect(result.candidates.length).toBeLessThanOrEqual(3)
  })

  it('returns candidates sorted by score descending', () => {
    const team = [
      makeMember({ id: 'a', name: 'Alice', completionRate: 0.9, currentLoad: 2 }),
      makeMember({ id: 'b', name: 'Bob', completionRate: 0.5, currentLoad: 8 }),
      makeMember({ id: 'c', name: 'Charlie', completionRate: 0.7, currentLoad: 5 }),
    ]
    const result = recommendAssignees(defaultTask, team)
    for (let i = 1; i < result.candidates.length; i++) {
      expect(result.candidates[i - 1].score).toBeGreaterThanOrEqual(result.candidates[i].score)
    }
  })

  it('all candidate scores are in [0, 100]', () => {
    const team = [
      makeMember({ id: 'a', name: 'Alice' }),
      makeMember({ id: 'b', name: 'Bob', skills: ['backend'] }),
      makeMember({ id: 'c', name: 'Charlie', currentLoad: 10, capacity: 10 }),
    ]
    const result = recommendAssignees(defaultTask, team)
    for (const candidate of result.candidates) {
      expect(candidate.score).toBeGreaterThanOrEqual(0)
      expect(candidate.score).toBeLessThanOrEqual(100)
    }
  })

  it('each candidate has non-empty reasons', () => {
    const team = [
      makeMember({ id: 'a', name: 'Alice' }),
      makeMember({ id: 'b', name: 'Bob' }),
    ]
    const result = recommendAssignees(defaultTask, team)
    for (const candidate of result.candidates) {
      expect(candidate.reasons.length).toBeGreaterThan(0)
    }
  })

  it('respects custom topN parameter', () => {
    const team = Array.from({ length: 5 }, (_, i) =>
      makeMember({ id: `m-${i}`, name: `Member ${i}` })
    )
    const result = recommendAssignees(defaultTask, team, 2)
    expect(result.candidates.length).toBeLessThanOrEqual(2)
  })
})
