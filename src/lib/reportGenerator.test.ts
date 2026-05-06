import { describe, it, expect } from 'vitest'
import {
  generateRetrospective,
  compareSprintMetrics,
  aggregateMonthlyReport,
  generateCollaborationReport,
} from './reportGenerator'
import type { SprintSummary, Risk, PlatformIssue } from '@/types/platform'

// ─── Helpers ────────────────────────────────────────────────

function makeIssue(overrides: Partial<PlatformIssue> = {}): PlatformIssue {
  return {
    id: 'DTS-1',
    jiraId: '10001',
    title: 'Test Issue',
    status: 'done',
    priority: 'P1',
    assignee: { id: 'u1', name: 'Alice', avatarUrl: '' },
    storyPoints: 3,
    labels: [],
    isBaseline: true,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    estimatedHours: 8,
    spentHours: 6,
    ...overrides,
  }
}

function makeSprint(overrides: Partial<SprintSummary> = {}): SprintSummary {
  return {
    id: 1,
    name: 'Sprint 1',
    state: 'closed',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-14T23:59:59Z',
    totalIssues: 10,
    completedIssues: 8,
    completionRate: 80,
    issues: [
      makeIssue({ id: 'DTS-1', assignee: { id: 'u1', name: 'Alice', avatarUrl: '' }, status: 'done' }),
      makeIssue({ id: 'DTS-2', assignee: { id: 'u1', name: 'Alice', avatarUrl: '' }, status: 'done' }),
      makeIssue({ id: 'DTS-3', assignee: { id: 'u2', name: 'Bob', avatarUrl: '' }, status: 'done' }),
      makeIssue({ id: 'DTS-4', assignee: { id: 'u2', name: 'Bob', avatarUrl: '' }, status: 'in_progress' }),
      makeIssue({ id: 'DTS-5', assignee: { id: 'u3', name: 'Charlie', avatarUrl: '' }, status: 'done' }),
    ],
    ...overrides,
  }
}

function makeRisk(overrides: Partial<Risk> = {}): Risk {
  return {
    id: 'r1',
    level: 'medium',
    type: 'overtime',
    description: 'Task overtime',
    status: 'open',
    detectedAt: '2025-01-10T10:00:00Z',
    ...overrides,
  }
}

// ─── generateRetrospective ──────────────────────────────────

describe('generateRetrospective', () => {
  it('generates a report with all required sections', () => {
    const sprint = makeSprint()
    const risks = [
      makeRisk({ id: 'r1', level: 'high', status: 'resolved' }),
      makeRisk({ id: 'r2', level: 'medium', status: 'open' }),
    ]

    const report = generateRetrospective(sprint, risks)

    expect(report.sprintName).toBe('Sprint 1')
    expect(report.completionRate).toBe(80)
    expect(report.velocityComparison).toBeNull()
    expect(report.riskReview.total).toBe(2)
    expect(report.riskReview.highCount).toBe(1)
    expect(report.riskReview.resolvedCount).toBe(1)
    expect(report.teamContribution.length).toBeGreaterThan(0)
    expect(report.improvements.length).toBeGreaterThanOrEqual(3)
  })

  it('computes team contribution grouped by assignee', () => {
    const sprint = makeSprint()
    const report = generateRetrospective(sprint, [])

    const alice = report.teamContribution.find((t) => t.name === 'Alice')
    expect(alice).toBeDefined()
    expect(alice!.completed).toBe(2)
    expect(alice!.total).toBe(2)

    const bob = report.teamContribution.find((t) => t.name === 'Bob')
    expect(bob).toBeDefined()
    expect(bob!.completed).toBe(1)
    expect(bob!.total).toBe(2)
  })

  it('includes velocity comparison when previous sprint is provided', () => {
    const current = makeSprint({ completedIssues: 10 })
    const previous = makeSprint({ id: 0, name: 'Sprint 0', completedIssues: 7 })

    const report = generateRetrospective(current, [], previous)

    expect(report.velocityComparison).not.toBeNull()
    expect(report.velocityComparison!.current).toBe(10)
    expect(report.velocityComparison!.previous).toBe(7)
    expect(report.velocityComparison!.delta).toBe(3)
  })

  it('returns null velocity comparison when no previous sprint', () => {
    const report = generateRetrospective(makeSprint(), [], null)
    expect(report.velocityComparison).toBeNull()
  })

  it('handles sprint with no issues', () => {
    const sprint = makeSprint({ issues: [], totalIssues: 0, completedIssues: 0, completionRate: 0 })
    const report = generateRetrospective(sprint, [])

    expect(report.teamContribution).toHaveLength(0)
    expect(report.improvements.length).toBeGreaterThanOrEqual(3)
  })

  it('groups unassigned issues under "Unassigned"', () => {
    const sprint = makeSprint({
      issues: [
        makeIssue({ id: 'DTS-1', assignee: null, status: 'todo' }),
      ],
    })
    const report = generateRetrospective(sprint, [])

    const unassigned = report.teamContribution.find((t) => t.name === 'Unassigned')
    expect(unassigned).toBeDefined()
    expect(unassigned!.total).toBe(1)
    expect(unassigned!.completed).toBe(0)
  })

  it('always produces at least 3 improvements', () => {
    // Sprint with 100% completion, no risks, balanced workload
    const sprint = makeSprint({
      completionRate: 100,
      issues: [
        makeIssue({ id: 'DTS-1', assignee: { id: 'u1', name: 'Alice', avatarUrl: '' }, status: 'done' }),
      ],
    })
    const report = generateRetrospective(sprint, [])
    expect(report.improvements.length).toBeGreaterThanOrEqual(3)
  })
})

// ─── compareSprintMetrics ───────────────────────────────────

describe('compareSprintMetrics', () => {
  it('computes correct deltas between two sprints', () => {
    const current = makeSprint({
      name: 'Sprint 2',
      completionRate: 85,
      completedIssues: 12,
    })
    const previous = makeSprint({
      name: 'Sprint 1',
      completionRate: 75,
      completedIssues: 9,
    })
    const currentRisks = [makeRisk(), makeRisk({ id: 'r2' })]
    const previousRisks = [makeRisk({ id: 'r3' })]

    const comparison = compareSprintMetrics(current, previous, currentRisks, previousRisks)

    expect(comparison.current.name).toBe('Sprint 2')
    expect(comparison.previous.name).toBe('Sprint 1')
    expect(comparison.current.completionRate).toBe(85)
    expect(comparison.previous.completionRate).toBe(75)
    expect(comparison.deltas.completionRate).toBe(10)
    expect(comparison.current.velocity).toBe(12)
    expect(comparison.previous.velocity).toBe(9)
    expect(comparison.deltas.velocity).toBe(3)
    expect(comparison.current.riskCount).toBe(2)
    expect(comparison.previous.riskCount).toBe(1)
    expect(comparison.deltas.riskCount).toBe(1)
  })

  it('handles identical sprints with zero deltas', () => {
    const sprint = makeSprint({ completionRate: 80, completedIssues: 8 })
    const risks = [makeRisk()]

    const comparison = compareSprintMetrics(sprint, sprint, risks, risks)

    expect(comparison.deltas.completionRate).toBe(0)
    expect(comparison.deltas.velocity).toBe(0)
    expect(comparison.deltas.riskCount).toBe(0)
  })

  it('handles negative deltas when current is worse', () => {
    const current = makeSprint({ completionRate: 60, completedIssues: 5 })
    const previous = makeSprint({ completionRate: 90, completedIssues: 12 })

    const comparison = compareSprintMetrics(current, previous, [], [makeRisk()])

    expect(comparison.deltas.completionRate).toBe(-30)
    expect(comparison.deltas.velocity).toBe(-7)
    expect(comparison.deltas.riskCount).toBe(-1)
  })
})

// ─── aggregateMonthlyReport ─────────────────────────────────

describe('aggregateMonthlyReport', () => {
  it('includes sprints that overlap with the specified month', () => {
    const sprints: SprintSummary[] = [
      makeSprint({
        id: 1,
        name: 'Sprint 1',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-14T23:59:59Z',
        totalIssues: 10,
        completedIssues: 8,
      }),
      makeSprint({
        id: 2,
        name: 'Sprint 2',
        startDate: '2025-01-15T00:00:00Z',
        endDate: '2025-01-28T23:59:59Z',
        totalIssues: 12,
        completedIssues: 10,
      }),
      makeSprint({
        id: 3,
        name: 'Sprint 3',
        startDate: '2025-02-01T00:00:00Z',
        endDate: '2025-02-14T23:59:59Z',
        totalIssues: 8,
        completedIssues: 6,
      }),
    ]

    const report = aggregateMonthlyReport(sprints, '2025-01')

    expect(report.month).toBe('2025-01')
    expect(report.sprintsCovered).toContain('Sprint 1')
    expect(report.sprintsCovered).toContain('Sprint 2')
    expect(report.sprintsCovered).not.toContain('Sprint 3')
  })

  it('computes weighted average completion rate', () => {
    const sprints: SprintSummary[] = [
      makeSprint({
        id: 1,
        name: 'Sprint 1',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-14T23:59:59Z',
        totalIssues: 10,
        completedIssues: 8,
      }),
      makeSprint({
        id: 2,
        name: 'Sprint 2',
        startDate: '2025-01-15T00:00:00Z',
        endDate: '2025-01-28T23:59:59Z',
        totalIssues: 20,
        completedIssues: 10,
      }),
    ]

    const report = aggregateMonthlyReport(sprints, '2025-01')

    // Weighted average: (8 + 10) / (10 + 20) * 100 = 60%
    expect(report.aggregatedCompletionRate).toBe(60)
    expect(report.totalTasksCompleted).toBe(18)
    expect(report.totalTasks).toBe(30)
  })

  it('returns empty report for month with no overlapping sprints', () => {
    const sprints: SprintSummary[] = [
      makeSprint({
        startDate: '2025-03-01T00:00:00Z',
        endDate: '2025-03-14T23:59:59Z',
      }),
    ]

    const report = aggregateMonthlyReport(sprints, '2025-01')

    expect(report.sprintsCovered).toHaveLength(0)
    expect(report.aggregatedCompletionRate).toBe(0)
    expect(report.totalTasks).toBe(0)
    expect(report.totalTasksCompleted).toBe(0)
  })

  it('includes sprints that partially overlap with the month', () => {
    const sprints: SprintSummary[] = [
      makeSprint({
        name: 'Cross-month Sprint',
        startDate: '2025-01-25T00:00:00Z',
        endDate: '2025-02-07T23:59:59Z',
        totalIssues: 10,
        completedIssues: 7,
      }),
    ]

    const report = aggregateMonthlyReport(sprints, '2025-01')

    expect(report.sprintsCovered).toContain('Cross-month Sprint')
  })

  it('computes velocity trend as improving when later sprints have higher velocity', () => {
    const sprints: SprintSummary[] = [
      makeSprint({
        id: 1,
        name: 'Sprint 1',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-07T23:59:59Z',
        completedIssues: 5,
      }),
      makeSprint({
        id: 2,
        name: 'Sprint 2',
        startDate: '2025-01-08T00:00:00Z',
        endDate: '2025-01-14T23:59:59Z',
        completedIssues: 10,
      }),
      makeSprint({
        id: 3,
        name: 'Sprint 3',
        startDate: '2025-01-15T00:00:00Z',
        endDate: '2025-01-21T23:59:59Z',
        completedIssues: 15,
      }),
      makeSprint({
        id: 4,
        name: 'Sprint 4',
        startDate: '2025-01-22T00:00:00Z',
        endDate: '2025-01-28T23:59:59Z',
        completedIssues: 20,
      }),
    ]

    const report = aggregateMonthlyReport(sprints, '2025-01')
    expect(report.velocityTrend).toBe('improving')
  })

  it('computes velocity trend as declining when later sprints have lower velocity', () => {
    const sprints: SprintSummary[] = [
      makeSprint({
        id: 1,
        name: 'Sprint 1',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-07T23:59:59Z',
        completedIssues: 20,
      }),
      makeSprint({
        id: 2,
        name: 'Sprint 2',
        startDate: '2025-01-08T00:00:00Z',
        endDate: '2025-01-14T23:59:59Z',
        completedIssues: 15,
      }),
      makeSprint({
        id: 3,
        name: 'Sprint 3',
        startDate: '2025-01-15T00:00:00Z',
        endDate: '2025-01-21T23:59:59Z',
        completedIssues: 10,
      }),
      makeSprint({
        id: 4,
        name: 'Sprint 4',
        startDate: '2025-01-22T00:00:00Z',
        endDate: '2025-01-28T23:59:59Z',
        completedIssues: 5,
      }),
    ]

    const report = aggregateMonthlyReport(sprints, '2025-01')
    expect(report.velocityTrend).toBe('declining')
  })

  it('computes velocity trend as stable for single sprint', () => {
    const sprints: SprintSummary[] = [
      makeSprint({
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-14T23:59:59Z',
      }),
    ]

    const report = aggregateMonthlyReport(sprints, '2025-01')
    expect(report.velocityTrend).toBe('stable')
  })
})

// ─── generateCollaborationReport ────────────────────────────

describe('generateCollaborationReport', () => {
  it('identifies cross-team tasks from team labels', () => {
    const issues: PlatformIssue[] = [
      makeIssue({ id: 'DTS-1', labels: ['team-frontend', 'team-backend'] }),
      makeIssue({ id: 'DTS-2', labels: ['team-frontend', 'team-backend'] }),
      makeIssue({ id: 'DTS-3', labels: ['team-frontend'] }),
    ]

    const report = generateCollaborationReport(issues)

    expect(report.totalCrossTeamTasks).toBe(2)
    expect(report.crossTeamPairs).toHaveLength(1)
    expect(report.crossTeamPairs[0].teamA).toBe('backend')
    expect(report.crossTeamPairs[0].teamB).toBe('frontend')
    expect(report.crossTeamPairs[0].sharedTasks).toBe(2)
  })

  it('handles multiple team pairs', () => {
    const issues: PlatformIssue[] = [
      makeIssue({ id: 'DTS-1', labels: ['team-frontend', 'team-backend'] }),
      makeIssue({ id: 'DTS-2', labels: ['team-frontend', 'team-qa'] }),
      makeIssue({ id: 'DTS-3', labels: ['team-backend', 'team-qa'] }),
    ]

    const report = generateCollaborationReport(issues)

    expect(report.totalCrossTeamTasks).toBe(3)
    expect(report.crossTeamPairs).toHaveLength(3)
  })

  it('handles issues with three or more team labels', () => {
    const issues: PlatformIssue[] = [
      makeIssue({ id: 'DTS-1', labels: ['team-frontend', 'team-backend', 'team-qa'] }),
    ]

    const report = generateCollaborationReport(issues)

    expect(report.totalCrossTeamTasks).toBe(1)
    // 3 teams = 3 pairs: (backend, frontend), (backend, qa), (frontend, qa)
    expect(report.crossTeamPairs).toHaveLength(3)
  })

  it('returns empty report when no cross-team tasks exist', () => {
    const issues: PlatformIssue[] = [
      makeIssue({ id: 'DTS-1', labels: ['team-frontend'] }),
      makeIssue({ id: 'DTS-2', labels: ['team-backend'] }),
      makeIssue({ id: 'DTS-3', labels: ['bug', 'feature'] }),
    ]

    const report = generateCollaborationReport(issues)

    expect(report.totalCrossTeamTasks).toBe(0)
    expect(report.crossTeamPairs).toHaveLength(0)
  })

  it('returns empty report for empty issues array', () => {
    const report = generateCollaborationReport([])

    expect(report.totalCrossTeamTasks).toBe(0)
    expect(report.crossTeamPairs).toHaveLength(0)
  })

  it('supports different team label formats (team-, team:, team_)', () => {
    const issues: PlatformIssue[] = [
      makeIssue({ id: 'DTS-1', labels: ['team-frontend', 'team:backend'] }),
      makeIssue({ id: 'DTS-2', labels: ['team_mobile', 'team-frontend'] }),
    ]

    const report = generateCollaborationReport(issues)

    expect(report.totalCrossTeamTasks).toBe(2)
  })

  it('deduplicates team names within a single issue', () => {
    const issues: PlatformIssue[] = [
      makeIssue({ id: 'DTS-1', labels: ['team-frontend', 'team:frontend', 'team-backend'] }),
    ]

    const report = generateCollaborationReport(issues)

    // Should count as 1 cross-team task with 1 pair (frontend, backend)
    expect(report.totalCrossTeamTasks).toBe(1)
    expect(report.crossTeamPairs).toHaveLength(1)
  })

  it('sorts pairs by shared tasks descending', () => {
    const issues: PlatformIssue[] = [
      makeIssue({ id: 'DTS-1', labels: ['team-frontend', 'team-qa'] }),
      makeIssue({ id: 'DTS-2', labels: ['team-frontend', 'team-backend'] }),
      makeIssue({ id: 'DTS-3', labels: ['team-frontend', 'team-backend'] }),
      makeIssue({ id: 'DTS-4', labels: ['team-frontend', 'team-backend'] }),
    ]

    const report = generateCollaborationReport(issues)

    expect(report.crossTeamPairs[0].sharedTasks).toBeGreaterThanOrEqual(
      report.crossTeamPairs[1].sharedTasks
    )
  })
})
