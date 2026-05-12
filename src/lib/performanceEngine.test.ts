import { describe, it, expect } from 'vitest'
import {
  calculateThroughputScore,
  calculateEfficiencyScore,
  calculateQualityScore,
  calculateImpactScore,
  calculateCollaborationScore,
  calculateMemberPerformance,
  calculateDepartmentPerformance,
  DEFAULT_WEIGHTS,
  type PerformanceIssue,
} from './performanceEngine'

// ─── Helpers ────────────────────────────────────────────────

function makePerformanceIssue(overrides: Partial<PerformanceIssue> = {}): PerformanceIssue {
  return {
    id: 'DTS-1',
    jiraId: '10001',
    title: 'Test Issue',
    status: 'done',
    priority: 'P2',
    assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
    storyPoints: 3,
    labels: [],
    isBaseline: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
    estimatedHours: null,
    spentHours: null,
    subtaskCount: 0,
    linkedIssueCount: 0,
    commentCount: 0,
    sprintChanges: 0,
    isReopened: false,
    linkedBugCount: 0,
    statusTransitions: [],
    comments: [],
    projectKey: 'DTS',
    projectName: 'Test Project',
    ...overrides,
  }
}

// ─── calculateThroughputScore ───────────────────────────────

describe('calculateThroughputScore', () => {
  it('returns score 100 for single-person team', () => {
    const issues = [makePerformanceIssue({ status: 'done' })]
    const allStats = [{ completedCount: 1, weightedOutput: 1.0 }]

    const result = calculateThroughputScore(issues, allStats)

    expect(result.score).toBe(100)
    expect(result.completedCount).toBe(1)
    expect(result.weightedOutput).toBeGreaterThan(0)
  })

  it('returns score 100 for single-person team even with empty allMemberStats', () => {
    const issues = [makePerformanceIssue({ status: 'done' })]
    const allStats: { completedCount: number; weightedOutput: number }[] = []

    const result = calculateThroughputScore(issues, allStats)

    expect(result.score).toBe(100)
  })

  it('counts only done tasks as completed', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done' }),
      makePerformanceIssue({ id: 'DTS-2', status: 'in_progress' }),
      makePerformanceIssue({ id: 'DTS-3', status: 'todo' }),
      makePerformanceIssue({ id: 'DTS-4', status: 'done' }),
    ]
    const allStats = [{ completedCount: 2, weightedOutput: 2.0 }]

    const result = calculateThroughputScore(issues, allStats)

    expect(result.completedCount).toBe(2)
  })

  it('calculates weighted output using complexity factor', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        subtaskCount: 7, // >6 → +1.0
        linkedIssueCount: 0,
        commentCount: 0,
        sprintChanges: 0,
      }),
    ]
    const allStats = [{ completedCount: 1, weightedOutput: 2.0 }]

    const result = calculateThroughputScore(issues, allStats)

    // complexity = 1.0 + 1.0 = 2.0
    expect(result.weightedOutput).toBe(2.0)
  })

  it('gives higher score to member with more completed tasks in a team', () => {
    // Member A: 5 completed tasks
    const memberAIssues = Array.from({ length: 5 }, (_, i) =>
      makePerformanceIssue({ id: `A-${i}`, status: 'done' })
    )
    // Member B: 2 completed tasks
    const memberBIssues = Array.from({ length: 2 }, (_, i) =>
      makePerformanceIssue({ id: `B-${i}`, status: 'done' })
    )

    const memberAWeighted = 5 * 1.0 // all simple tasks, complexity = 1.0
    const memberBWeighted = 2 * 1.0

    const allStats = [
      { completedCount: 5, weightedOutput: memberAWeighted },
      { completedCount: 2, weightedOutput: memberBWeighted },
    ]

    const resultA = calculateThroughputScore(memberAIssues, allStats)
    const resultB = calculateThroughputScore(memberBIssues, allStats)

    expect(resultA.score).toBeGreaterThan(resultB.score)
  })

  it('returns 0 completedCount and 0 weightedOutput when no tasks are done', () => {
    const issues = [
      makePerformanceIssue({ status: 'in_progress' }),
      makePerformanceIssue({ status: 'todo' }),
    ]
    const allStats = [
      { completedCount: 0, weightedOutput: 0 },
      { completedCount: 3, weightedOutput: 3.0 },
    ]

    const result = calculateThroughputScore(issues, allStats)

    expect(result.completedCount).toBe(0)
    expect(result.weightedOutput).toBe(0)
  })

  it('produces score in [0, 100] range', () => {
    const issues = [makePerformanceIssue({ status: 'done' })]
    const allStats = [
      { completedCount: 1, weightedOutput: 1.0 },
      { completedCount: 5, weightedOutput: 10.0 },
      { completedCount: 10, weightedOutput: 20.0 },
    ]

    const result = calculateThroughputScore(issues, allStats)

    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('handles team where all members have equal stats', () => {
    const issues = [makePerformanceIssue({ status: 'done' })]
    const allStats = [
      { completedCount: 1, weightedOutput: 1.0 },
      { completedCount: 1, weightedOutput: 1.0 },
      { completedCount: 1, weightedOutput: 1.0 },
    ]

    const result = calculateThroughputScore(issues, allStats)

    // All equal → percentile = (0 + 3*0.5) / 3 = 0.5 → score = 50
    expect(result.score).toBe(50)
  })

  it('gives top score to the best performer in a large team', () => {
    const issues = Array.from({ length: 10 }, (_, i) =>
      makePerformanceIssue({ id: `TOP-${i}`, status: 'done' })
    )
    const allStats = [
      { completedCount: 10, weightedOutput: 10.0 }, // top performer
      { completedCount: 1, weightedOutput: 1.0 },
      { completedCount: 2, weightedOutput: 2.0 },
      { completedCount: 3, weightedOutput: 3.0 },
      { completedCount: 4, weightedOutput: 4.0 },
    ]

    const result = calculateThroughputScore(issues, allStats)

    // Top performer: 4 below, 1 equal → (4 + 0.5) / 5 = 0.9 → score = 90
    expect(result.score).toBe(90)
  })
})


// ─── calculateEfficiencyScore ───────────────────────────────

describe('calculateEfficiencyScore', () => {
  const defaultSprint = {
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-14T23:59:59Z',
  }

  it('returns score 0, avgCycleTime 0, deliveryRate 0 when no completed tasks', () => {
    const issues = [
      makePerformanceIssue({ status: 'in_progress' }),
      makePerformanceIssue({ status: 'todo' }),
    ]

    const result = calculateEfficiencyScore(issues, defaultSprint)

    expect(result.score).toBe(0)
    expect(result.avgCycleTime).toBe(0)
    expect(result.deliveryRate).toBe(0)
  })

  it('calculates cycle time from statusTransitions (In Progress → Done)', () => {
    const issues = [
      makePerformanceIssue({
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-05T00:00:00Z' },
        ],
      }),
    ]

    const result = calculateEfficiencyScore(issues, defaultSprint)

    // Cycle time = 3 days
    expect(result.avgCycleTime).toBe(3)
    // Delivery rate = 1/1 = 1.0 (completed before sprint end)
    expect(result.deliveryRate).toBe(1)
    // Score: cycleTimeScore = max(0, 100 - 3*5) = 85
    // deliveryRateScore = 1.0 * 100 = 100
    // score = (85 + 100) / 2 = 92.5
    expect(result.score).toBe(92.5)
  })

  it('uses lowercase status names in transitions', () => {
    const issues = [
      makePerformanceIssue({
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'in_progress', timestamp: '2025-01-03T00:00:00Z' },
          { from: 'in_progress', to: 'done', timestamp: '2025-01-07T00:00:00Z' },
        ],
      }),
    ]

    const result = calculateEfficiencyScore(issues, defaultSprint)

    // Cycle time = 4 days
    expect(result.avgCycleTime).toBe(4)
    expect(result.deliveryRate).toBe(1)
  })

  it('uses createdAt → updatedAt as fallback when no valid transitions', () => {
    const issues = [
      makePerformanceIssue({
        status: 'done',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-06T00:00:00Z',
        statusTransitions: [], // no transitions
      }),
    ]

    const result = calculateEfficiencyScore(issues, defaultSprint)

    // Cycle time = 5 days (Jan 1 → Jan 6)
    expect(result.avgCycleTime).toBe(5)
  })

  it('calculates average cycle time across multiple tasks', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-04T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-03T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-09T00:00:00Z' },
        ],
      }),
    ]

    const result = calculateEfficiencyScore(issues, defaultSprint)

    // Task 1: 2 days, Task 2: 6 days → avg = 4 days
    expect(result.avgCycleTime).toBe(4)
  })

  it('calculates delivery rate as completed before sprint end / total assigned', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-10T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-05T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-20T00:00:00Z' }, // after sprint end
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-3',
        status: 'in_progress', // not completed
      }),
    ]

    const result = calculateEfficiencyScore(issues, defaultSprint)

    // 1 completed before sprint end out of 3 total assigned
    expect(result.deliveryRate).toBeCloseTo(1 / 3, 2)
  })

  it('produces score in [0, 100] range for very long cycle times', () => {
    const issues = [
      makePerformanceIssue({
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2024-01-01T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2024-04-01T00:00:00Z' }, // ~90 days
        ],
      }),
    ]

    const sprint = {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-04-30T00:00:00Z',
    }

    const result = calculateEfficiencyScore(issues, sprint)

    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('gives higher score for shorter cycle time', () => {
    const fastIssues = [
      makePerformanceIssue({
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-03T00:00:00Z' }, // 1 day
        ],
      }),
    ]

    const slowIssues = [
      makePerformanceIssue({
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-12T00:00:00Z' }, // 10 days
        ],
      }),
    ]

    const fastResult = calculateEfficiencyScore(fastIssues, defaultSprint)
    const slowResult = calculateEfficiencyScore(slowIssues, defaultSprint)

    expect(fastResult.score).toBeGreaterThan(slowResult.score)
  })

  it('gives higher score for higher delivery rate', () => {
    // All tasks completed before sprint end
    const highDeliveryIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-05T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-05T00:00:00Z' },
        ],
      }),
    ]

    // One task completed after sprint end
    const lowDeliveryIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-05T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-20T00:00:00Z' }, // after sprint end
        ],
      }),
    ]

    const highResult = calculateEfficiencyScore(highDeliveryIssues, defaultSprint)
    const lowResult = calculateEfficiencyScore(lowDeliveryIssues, defaultSprint)

    expect(highResult.score).toBeGreaterThan(lowResult.score)
  })

  it('uses first In Progress transition and last Done transition', () => {
    const issues = [
      makePerformanceIssue({
        status: 'done',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' }, // first in progress
          { from: 'In Progress', to: 'todo', timestamp: '2025-01-03T00:00:00Z' }, // moved back
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-04T00:00:00Z' }, // second in progress
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-06T00:00:00Z' }, // first done
          { from: 'Done', to: 'In Progress', timestamp: '2025-01-07T00:00:00Z' }, // reopened
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-10T00:00:00Z' }, // last done
        ],
      }),
    ]

    const result = calculateEfficiencyScore(issues, defaultSprint)

    // First In Progress: Jan 2, Last Done: Jan 10 → 8 days
    expect(result.avgCycleTime).toBe(8)
  })

  it('handles empty issues array', () => {
    const result = calculateEfficiencyScore([], defaultSprint)

    expect(result.score).toBe(0)
    expect(result.avgCycleTime).toBe(0)
    expect(result.deliveryRate).toBe(0)
  })
})


// ─── calculateQualityScore ──────────────────────────────────

describe('calculateQualityScore', () => {
  it('returns score 0, reworkRate 0, bugIntroductionRate null when no completed tasks', () => {
    const issues = [
      makePerformanceIssue({ status: 'in_progress' }),
      makePerformanceIssue({ status: 'todo' }),
    ]

    const result = calculateQualityScore(issues)

    expect(result.score).toBe(0)
    expect(result.reworkRate).toBe(0)
    expect(result.bugIntroductionRate).toBeNull()
  })

  it('returns score 0, reworkRate 0, bugIntroductionRate null for empty array', () => {
    const result = calculateQualityScore([])

    expect(result.score).toBe(0)
    expect(result.reworkRate).toBe(0)
    expect(result.bugIntroductionRate).toBeNull()
  })

  it('returns perfect score when no rework and no bugs', () => {
    const issues = [
      makePerformanceIssue({ status: 'done', isReopened: false, linkedBugCount: 0 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', isReopened: false, linkedBugCount: 0 }),
    ]

    const result = calculateQualityScore(issues)

    expect(result.score).toBe(100)
    expect(result.reworkRate).toBe(0)
    expect(result.bugIntroductionRate).toBe(0)
  })

  it('calculates rework rate correctly', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', isReopened: true, linkedBugCount: 0 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', isReopened: false, linkedBugCount: 0 }),
      makePerformanceIssue({ id: 'DTS-3', status: 'done', isReopened: false, linkedBugCount: 0 }),
      makePerformanceIssue({ id: 'DTS-4', status: 'done', isReopened: true, linkedBugCount: 0 }),
    ]

    const result = calculateQualityScore(issues)

    // reworkRate = 2/4 = 0.5
    expect(result.reworkRate).toBe(0.5)
  })

  it('calculates bug introduction rate correctly', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', isReopened: false, linkedBugCount: 2 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', isReopened: false, linkedBugCount: 0 }),
      makePerformanceIssue({ id: 'DTS-3', status: 'done', isReopened: false, linkedBugCount: 1 }),
      makePerformanceIssue({ id: 'DTS-4', status: 'done', isReopened: false, linkedBugCount: 0 }),
    ]

    const result = calculateQualityScore(issues)

    // bugIntroductionRate = 2/4 = 0.5 (issues with linkedBugCount > 0)
    expect(result.bugIntroductionRate).toBe(0.5)
  })

  it('calculates combined score with both rework and bug data', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', isReopened: true, linkedBugCount: 1 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', isReopened: false, linkedBugCount: 0 }),
    ]

    const result = calculateQualityScore(issues)

    // reworkRate = 1/2 = 0.5
    // bugIntroductionRate = 1/2 = 0.5
    // reworkComponent = (1 - 0.5) * 100 = 50
    // bugComponent = (1 - 0.5) * 100 = 50
    // score = (50 + 50) / 2 = 50
    expect(result.score).toBe(50)
    expect(result.reworkRate).toBe(0.5)
    expect(result.bugIntroductionRate).toBe(0.5)
  })

  it('uses only rework rate when bug data is unavailable (all linkedBugCount < 0)', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', isReopened: true, linkedBugCount: -1 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', isReopened: false, linkedBugCount: -1 }),
      makePerformanceIssue({ id: 'DTS-3', status: 'done', isReopened: false, linkedBugCount: -1 }),
    ]

    const result = calculateQualityScore(issues)

    // reworkRate = 1/3 ≈ 0.3333
    // Bug data unavailable → score = (1 - 1/3) * 100 ≈ 66.67
    expect(result.reworkRate).toBeCloseTo(1 / 3, 4)
    expect(result.bugIntroductionRate).toBeNull()
    expect(result.score).toBeCloseTo(66.67, 1)
  })

  it('only counts done tasks for calculations', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', isReopened: true, linkedBugCount: 1 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'in_progress', isReopened: true, linkedBugCount: 5 }),
      makePerformanceIssue({ id: 'DTS-3', status: 'done', isReopened: false, linkedBugCount: 0 }),
    ]

    const result = calculateQualityScore(issues)

    // Only 2 completed tasks: DTS-1 (reopened, has bugs) and DTS-3 (not reopened, no bugs)
    // reworkRate = 1/2 = 0.5
    // bugIntroductionRate = 1/2 = 0.5
    expect(result.reworkRate).toBe(0.5)
    expect(result.bugIntroductionRate).toBe(0.5)
  })

  it('produces score in [0, 100] range when all tasks are reopened with bugs', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', isReopened: true, linkedBugCount: 3 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', isReopened: true, linkedBugCount: 2 }),
    ]

    const result = calculateQualityScore(issues)

    // reworkRate = 1.0, bugIntroductionRate = 1.0
    // reworkComponent = 0, bugComponent = 0
    // score = 0
    expect(result.score).toBe(0)
    expect(result.reworkRate).toBe(1)
    expect(result.bugIntroductionRate).toBe(1)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('produces score in [0, 100] range for perfect quality', () => {
    const issues = Array.from({ length: 10 }, (_, i) =>
      makePerformanceIssue({ id: `DTS-${i}`, status: 'done', isReopened: false, linkedBugCount: 0 })
    )

    const result = calculateQualityScore(issues)

    expect(result.score).toBe(100)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('handles mixed bug data availability (some >= 0, some < 0) as available', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', isReopened: false, linkedBugCount: 0 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', isReopened: false, linkedBugCount: -1 }),
      makePerformanceIssue({ id: 'DTS-3', status: 'done', isReopened: false, linkedBugCount: 2 }),
    ]

    const result = calculateQualityScore(issues)

    // At least one issue has linkedBugCount >= 0, so bug data is available
    // bugIntroductionRate = 1/3 (only DTS-3 has linkedBugCount > 0)
    expect(result.bugIntroductionRate).not.toBeNull()
    expect(result.bugIntroductionRate).toBeCloseTo(1 / 3, 4)
  })
})


// ─── calculateImpactScore ───────────────────────────────────

describe('calculateImpactScore', () => {
  it('returns score 0, highPriorityRatio 0, blockingResolutionSpeed 0 when no completed tasks', () => {
    const issues = [
      makePerformanceIssue({ status: 'in_progress' }),
      makePerformanceIssue({ status: 'todo' }),
    ]

    const result = calculateImpactScore(issues)

    expect(result.score).toBe(0)
    expect(result.highPriorityRatio).toBe(0)
    expect(result.blockingResolutionSpeed).toBe(0)
  })

  it('returns score 0 for empty array', () => {
    const result = calculateImpactScore([])

    expect(result.score).toBe(0)
    expect(result.highPriorityRatio).toBe(0)
    expect(result.blockingResolutionSpeed).toBe(0)
  })

  it('calculates highPriorityRatio correctly for Highest/High priorities', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', priority: 'Highest' }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', priority: 'High' }),
      makePerformanceIssue({ id: 'DTS-3', status: 'done', priority: 'Medium' }),
      makePerformanceIssue({ id: 'DTS-4', status: 'done', priority: 'Low' }),
    ]

    const result = calculateImpactScore(issues)

    // 2 high priority out of 4 completed = 0.5
    expect(result.highPriorityRatio).toBe(0.5)
  })

  it('calculates highPriorityRatio correctly for P0/P1 priorities', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', priority: 'P0' }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', priority: 'P1' }),
      makePerformanceIssue({ id: 'DTS-3', status: 'done', priority: 'P2' }),
    ]

    const result = calculateImpactScore(issues)

    // 2 high priority out of 3 completed
    expect(result.highPriorityRatio).toBeCloseTo(2 / 3, 4)
  })

  it('handles case-insensitive priority matching', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', priority: 'highest' }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', priority: 'HIGH' }),
      makePerformanceIssue({ id: 'DTS-3', status: 'done', priority: 'p0' }),
      makePerformanceIssue({ id: 'DTS-4', status: 'done', priority: 'p1' }),
    ]

    const result = calculateImpactScore(issues)

    // All 4 are high priority
    expect(result.highPriorityRatio).toBe(1)
  })

  it('returns highPriorityRatio 0 when no high priority tasks', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', priority: 'Medium' }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', priority: 'Low' }),
      makePerformanceIssue({ id: 'DTS-3', status: 'done', priority: 'Lowest' }),
    ]

    const result = calculateImpactScore(issues)

    expect(result.highPriorityRatio).toBe(0)
  })

  it('calculates blockingResolutionSpeed from cycle time of blocking tasks', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        priority: 'High',
        linkedIssueCount: 3, // blocking task
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-06T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        priority: 'Medium',
        linkedIssueCount: 2, // blocking task
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-03T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-05T00:00:00Z' },
        ],
      }),
    ]

    const result = calculateImpactScore(issues)

    // Task 1: 4 days, Task 2: 2 days → avg = 3 days
    expect(result.blockingResolutionSpeed).toBe(3)
  })

  it('returns blockingResolutionSpeed 0 when no blocking tasks', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        priority: 'High',
        linkedIssueCount: 0, // not blocking
      }),
    ]

    const result = calculateImpactScore(issues)

    expect(result.blockingResolutionSpeed).toBe(0)
  })

  it('uses neutral blockingComponent (50) when no blocking tasks', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        priority: 'High',
        linkedIssueCount: 0,
      }),
    ]

    const result = calculateImpactScore(issues)

    // highPriorityRatio = 1.0
    // highPriorityComponent = 100
    // blockingComponent = 50 (neutral, no blocking tasks)
    // score = 100 * 0.6 + 50 * 0.4 = 60 + 20 = 80
    expect(result.score).toBe(80)
  })

  it('gives higher score for faster blocking resolution', () => {
    const fastIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        priority: 'High',
        linkedIssueCount: 2,
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-03T00:00:00Z' }, // 1 day
        ],
      }),
    ]

    const slowIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        priority: 'High',
        linkedIssueCount: 2,
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-12T00:00:00Z' }, // 10 days
        ],
      }),
    ]

    const fastResult = calculateImpactScore(fastIssues)
    const slowResult = calculateImpactScore(slowIssues)

    expect(fastResult.score).toBeGreaterThan(slowResult.score)
  })

  it('gives higher score for higher high-priority ratio', () => {
    const highRatioIssues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', priority: 'High', linkedIssueCount: 0 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', priority: 'High', linkedIssueCount: 0 }),
    ]

    const lowRatioIssues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', priority: 'High', linkedIssueCount: 0 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', priority: 'Low', linkedIssueCount: 0 }),
    ]

    const highResult = calculateImpactScore(highRatioIssues)
    const lowResult = calculateImpactScore(lowRatioIssues)

    expect(highResult.score).toBeGreaterThan(lowResult.score)
  })

  it('produces score in [0, 100] range', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', priority: 'Low', linkedIssueCount: 5 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', priority: 'Low', linkedIssueCount: 3 }),
    ]

    const result = calculateImpactScore(issues)

    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('produces score in [0, 100] for all high priority with fast resolution', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        priority: 'Highest',
        linkedIssueCount: 2,
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-02T12:00:00Z' }, // 0.5 days
        ],
      }),
    ]

    const result = calculateImpactScore(issues)

    // highPriorityRatio = 1.0 → highPriorityComponent = 100
    // blockingResolutionSpeed = 0.5 → blockingComponent = max(0, 100 - 0.5*5) = 97.5
    // score = 100 * 0.6 + 97.5 * 0.4 = 60 + 39 = 99
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.score).toBe(99)
  })

  it('only counts done tasks for calculations', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', priority: 'High', linkedIssueCount: 0 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'in_progress', priority: 'Highest', linkedIssueCount: 5 }),
      makePerformanceIssue({ id: 'DTS-3', status: 'done', priority: 'Low', linkedIssueCount: 0 }),
    ]

    const result = calculateImpactScore(issues)

    // Only 2 completed: DTS-1 (High) and DTS-3 (Low)
    // highPriorityRatio = 1/2 = 0.5
    expect(result.highPriorityRatio).toBe(0.5)
  })

  it('uses createdAt → updatedAt fallback for blocking tasks without transitions', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        priority: 'High',
        linkedIssueCount: 2,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
        statusTransitions: [], // no transitions
      }),
    ]

    const result = calculateImpactScore(issues)

    // Fallback cycle time = 3 days (Jan 1 → Jan 4)
    expect(result.blockingResolutionSpeed).toBe(3)
  })

  it('handles null priority gracefully', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', status: 'done', priority: null as unknown as string, linkedIssueCount: 0 }),
      makePerformanceIssue({ id: 'DTS-2', status: 'done', priority: 'High', linkedIssueCount: 0 }),
    ]

    const result = calculateImpactScore(issues)

    // 1 high priority out of 2 completed
    expect(result.highPriorityRatio).toBe(0.5)
  })
})

// ─── calculateCollaborationScore ────────────────────────────

describe('calculateCollaborationScore', () => {
  it('returns score 0 when allIssues is empty', () => {
    const memberIssues = [makePerformanceIssue({ status: 'done' })]

    const result = calculateCollaborationScore(memberIssues, [], 'user-1')

    expect(result.score).toBe(0)
    expect(result.crossTeamComments).toBe(0)
    expect(result.crossTeamTaskRatio).toBe(0)
  })

  it('returns score 0 when there are no other members tasks', () => {
    const issues = [
      makePerformanceIssue({ id: 'DTS-1', assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' } }),
      makePerformanceIssue({ id: 'DTS-2', assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' } }),
    ]

    const result = calculateCollaborationScore(issues, issues, 'user-1')

    expect(result.score).toBe(0)
    expect(result.crossTeamComments).toBe(0)
    expect(result.crossTeamTaskRatio).toBe(0)
  })

  it('counts comments on other members tasks correctly', () => {
    const allIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        comments: [],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        comments: [
          { authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-05T00:00:00Z' },
          { authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-06T00:00:00Z' },
          { authorId: 'user-3', authorName: 'Charlie', createdAt: '2025-01-07T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-3',
        assignee: { id: 'user-3', name: 'Charlie', avatarUrl: '' },
        comments: [
          { authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-08T00:00:00Z' },
        ],
      }),
    ]

    const memberIssues = [allIssues[0]]
    const result = calculateCollaborationScore(memberIssues, allIssues, 'user-1')

    // user-1 commented 2 times on DTS-2 and 1 time on DTS-3 = 3 cross-team comments
    expect(result.crossTeamComments).toBe(3)
  })

  it('calculates crossTeamTaskRatio correctly', () => {
    const allIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        comments: [],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        comments: [
          { authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-05T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-3',
        assignee: { id: 'user-3', name: 'Charlie', avatarUrl: '' },
        comments: [],
      }),
      makePerformanceIssue({
        id: 'DTS-4',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        comments: [],
      }),
    ]

    const memberIssues = [allIssues[0]]
    const result = calculateCollaborationScore(memberIssues, allIssues, 'user-1')

    // Other members' tasks: DTS-2, DTS-3, DTS-4 (3 tasks)
    // user-1 commented on DTS-2 only (1 task)
    // crossTeamTaskRatio = 1/3
    expect(result.crossTeamTaskRatio).toBeCloseTo(1 / 3, 4)
  })

  it('calculates score correctly with commentComponent and taskRatioComponent', () => {
    const allIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        comments: [],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        comments: [
          { authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-05T00:00:00Z' },
          { authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-06T00:00:00Z' },
          { authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-07T00:00:00Z' },
        ],
      }),
    ]

    const memberIssues = [allIssues[0]]
    const result = calculateCollaborationScore(memberIssues, allIssues, 'user-1')

    // crossTeamComments = 3
    // commentComponent = min(100, 3 * 10) = 30
    // crossTeamTaskRatio = 1/1 = 1.0
    // taskRatioComponent = 1.0 * 100 = 100
    // score = (30 + 100) / 2 = 65
    expect(result.score).toBe(65)
  })

  it('caps commentComponent at 100 for 10+ comments', () => {
    const allIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        comments: [],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        comments: Array.from({ length: 15 }, (_, i) => ({
          authorId: 'user-1',
          authorName: 'Alice',
          createdAt: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        })),
      }),
    ]

    const memberIssues = [allIssues[0]]
    const result = calculateCollaborationScore(memberIssues, allIssues, 'user-1')

    // crossTeamComments = 15
    // commentComponent = min(100, 15 * 10) = 100 (capped)
    // crossTeamTaskRatio = 1/1 = 1.0
    // taskRatioComponent = 100
    // score = (100 + 100) / 2 = 100
    expect(result.score).toBe(100)
    expect(result.crossTeamComments).toBe(15)
  })

  it('does not count comments on own tasks', () => {
    const allIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        comments: [
          { authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-05T00:00:00Z' },
          { authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-06T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        comments: [],
      }),
    ]

    const memberIssues = [allIssues[0]]
    const result = calculateCollaborationScore(memberIssues, allIssues, 'user-1')

    // user-1's own task (DTS-1) has comments by user-1, but those don't count
    // DTS-2 has no comments by user-1
    expect(result.crossTeamComments).toBe(0)
    expect(result.crossTeamTaskRatio).toBe(0)
    expect(result.score).toBe(0)
  })

  it('handles tasks with null assignee as other members tasks', () => {
    const allIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        comments: [],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        assignee: null,
        comments: [
          { authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-05T00:00:00Z' },
        ],
      }),
    ]

    const memberIssues = [allIssues[0]]
    const result = calculateCollaborationScore(memberIssues, allIssues, 'user-1')

    // DTS-2 has null assignee, so it's treated as "not assigned to user-1"
    // user-1 commented on it → counts as cross-team
    expect(result.crossTeamComments).toBe(1)
    expect(result.crossTeamTaskRatio).toBe(1)
  })

  it('produces score in [0, 100] range', () => {
    const allIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        comments: [],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        comments: Array.from({ length: 20 }, (_, i) => ({
          authorId: 'user-1',
          authorName: 'Alice',
          createdAt: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        })),
      }),
    ]

    const memberIssues = [allIssues[0]]
    const result = calculateCollaborationScore(memberIssues, allIssues, 'user-1')

    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('gives higher score for more cross-team comments', () => {
    const makeAllIssues = (commentCount: number) => [
      makePerformanceIssue({
        id: 'DTS-1',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        comments: [],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        comments: Array.from({ length: commentCount }, (_, i) => ({
          authorId: 'user-1',
          authorName: 'Alice',
          createdAt: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        })),
      }),
    ]

    const memberIssues = [makePerformanceIssue({
      id: 'DTS-1',
      assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
    })]

    const fewComments = calculateCollaborationScore(memberIssues, makeAllIssues(2), 'user-1')
    const manyComments = calculateCollaborationScore(memberIssues, makeAllIssues(8), 'user-1')

    expect(manyComments.score).toBeGreaterThan(fewComments.score)
  })

  it('gives higher score for higher cross-team task ratio', () => {
    // Scenario 1: user-1 comments on 1 out of 4 other tasks
    const allIssuesLowRatio = [
      makePerformanceIssue({ id: 'DTS-1', assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' }, comments: [] }),
      makePerformanceIssue({
        id: 'DTS-2', assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        comments: [{ authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-05T00:00:00Z' }],
      }),
      makePerformanceIssue({ id: 'DTS-3', assignee: { id: 'user-3', name: 'Charlie', avatarUrl: '' }, comments: [] }),
      makePerformanceIssue({ id: 'DTS-4', assignee: { id: 'user-4', name: 'Dave', avatarUrl: '' }, comments: [] }),
      makePerformanceIssue({ id: 'DTS-5', assignee: { id: 'user-5', name: 'Eve', avatarUrl: '' }, comments: [] }),
    ]

    // Scenario 2: user-1 comments on 3 out of 4 other tasks (1 comment each for same total)
    const allIssuesHighRatio = [
      makePerformanceIssue({ id: 'DTS-1', assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' }, comments: [] }),
      makePerformanceIssue({
        id: 'DTS-2', assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        comments: [{ authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-05T00:00:00Z' }],
      }),
      makePerformanceIssue({
        id: 'DTS-3', assignee: { id: 'user-3', name: 'Charlie', avatarUrl: '' },
        comments: [{ authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-06T00:00:00Z' }],
      }),
      makePerformanceIssue({
        id: 'DTS-4', assignee: { id: 'user-4', name: 'Dave', avatarUrl: '' },
        comments: [{ authorId: 'user-1', authorName: 'Alice', createdAt: '2025-01-07T00:00:00Z' }],
      }),
      makePerformanceIssue({ id: 'DTS-5', assignee: { id: 'user-5', name: 'Eve', avatarUrl: '' }, comments: [] }),
    ]

    const memberIssues = [makePerformanceIssue({ id: 'DTS-1', assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' } })]

    const lowRatioResult = calculateCollaborationScore(memberIssues, allIssuesLowRatio, 'user-1')
    const highRatioResult = calculateCollaborationScore(memberIssues, allIssuesHighRatio, 'user-1')

    expect(highRatioResult.score).toBeGreaterThan(lowRatioResult.score)
  })

  it('returns 0 score when member has no comments on other tasks', () => {
    const allIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        comments: [],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        comments: [
          { authorId: 'user-2', authorName: 'Bob', createdAt: '2025-01-05T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-3',
        assignee: { id: 'user-3', name: 'Charlie', avatarUrl: '' },
        comments: [
          { authorId: 'user-3', authorName: 'Charlie', createdAt: '2025-01-06T00:00:00Z' },
        ],
      }),
    ]

    const memberIssues = [allIssues[0]]
    const result = calculateCollaborationScore(memberIssues, allIssues, 'user-1')

    expect(result.score).toBe(0)
    expect(result.crossTeamComments).toBe(0)
    expect(result.crossTeamTaskRatio).toBe(0)
  })
})


// ─── calculateMemberPerformance ─────────────────────────────

describe('calculateMemberPerformance', () => {
  const defaultSprint = {
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-14T23:59:59Z',
  }

  it('returns a valid MemberPerformance object with correct memberId and memberName', () => {
    const memberIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: 'http://avatar.png' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-05T00:00:00Z' },
        ],
      }),
    ]

    const result = calculateMemberPerformance(memberIssues, memberIssues, defaultSprint)

    expect(result.memberId).toBe('user-1')
    expect(result.memberName).toBe('Alice')
    expect(result.avatarUrl).toBe('http://avatar.png')
    expect(result.tasks).toBe(memberIssues)
  })

  it('uses "unknown" for memberId and memberName when no assignee', () => {
    const memberIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: null,
      }),
    ]

    const result = calculateMemberPerformance(memberIssues, memberIssues, defaultSprint)

    expect(result.memberId).toBe('unknown')
    expect(result.memberName).toBe('unknown')
    expect(result.avatarUrl).toBeNull()
  })

  it('calculates performanceScore as weighted sum of five dimensions', () => {
    const memberIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        priority: 'High',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-04T00:00:00Z' },
        ],
      }),
    ]

    const result = calculateMemberPerformance(memberIssues, memberIssues, defaultSprint)

    // Verify the score is the weighted sum
    const expectedScore = Math.min(100, Math.max(0, Math.round((
      result.throughputScore * DEFAULT_WEIGHTS.throughput +
      result.efficiencyScore * DEFAULT_WEIGHTS.efficiency +
      result.qualityScore * DEFAULT_WEIGHTS.quality +
      result.impactScore * DEFAULT_WEIGHTS.impact +
      result.collaborationScore * DEFAULT_WEIGHTS.collaboration
    ) * 100) / 100))

    expect(result.performanceScore).toBe(expectedScore)
  })

  it('uses custom weights when provided', () => {
    const memberIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        priority: 'High',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-04T00:00:00Z' },
        ],
      }),
    ]

    const customWeights = {
      throughput: 0.40,
      efficiency: 0.20,
      quality: 0.20,
      impact: 0.10,
      collaboration: 0.10,
    }

    const _resultDefault = calculateMemberPerformance(memberIssues, memberIssues, defaultSprint)
    void _resultDefault // verify default weights work without error
    const resultCustom = calculateMemberPerformance(memberIssues, memberIssues, defaultSprint, customWeights)

    // With different weights, scores should differ (unless all dimension scores are equal)
    // At minimum, both should be valid
    expect(resultCustom.performanceScore).toBeGreaterThanOrEqual(0)
    expect(resultCustom.performanceScore).toBeLessThanOrEqual(100)
    // The custom result should use the custom weights
    const expectedCustomScore = Math.min(100, Math.max(0, Math.round((
      resultCustom.throughputScore * customWeights.throughput +
      resultCustom.efficiencyScore * customWeights.efficiency +
      resultCustom.qualityScore * customWeights.quality +
      resultCustom.impactScore * customWeights.impact +
      resultCustom.collaborationScore * customWeights.collaboration
    ) * 100) / 100))
    expect(resultCustom.performanceScore).toBe(expectedCustomScore)
  })

  it('all scores are in [0, 100] range', () => {
    const memberIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'in_progress',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
      }),
    ]

    const result = calculateMemberPerformance(memberIssues, memberIssues, defaultSprint)

    expect(result.performanceScore).toBeGreaterThanOrEqual(0)
    expect(result.performanceScore).toBeLessThanOrEqual(100)
    expect(result.throughputScore).toBeGreaterThanOrEqual(0)
    expect(result.throughputScore).toBeLessThanOrEqual(100)
    expect(result.efficiencyScore).toBeGreaterThanOrEqual(0)
    expect(result.efficiencyScore).toBeLessThanOrEqual(100)
    expect(result.qualityScore).toBeGreaterThanOrEqual(0)
    expect(result.qualityScore).toBeLessThanOrEqual(100)
    expect(result.impactScore).toBeGreaterThanOrEqual(0)
    expect(result.impactScore).toBeLessThanOrEqual(100)
    expect(result.collaborationScore).toBeGreaterThanOrEqual(0)
    expect(result.collaborationScore).toBeLessThanOrEqual(100)
  })

  it('assigns correct grade based on performanceScore', () => {
    // Create a scenario that should produce a high score
    const highPerformerIssues = Array.from({ length: 5 }, (_, i) =>
      makePerformanceIssue({
        id: `DTS-${i}`,
        status: 'done',
        priority: 'High',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        isReopened: false,
        linkedBugCount: 0,
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-03T00:00:00Z' },
        ],
      })
    )

    const result = calculateMemberPerformance(highPerformerIssues, highPerformerIssues, defaultSprint)

    // Grade should match the score
    if (result.performanceScore >= 80) expect(result.grade).toBe('excellent')
    else if (result.performanceScore >= 60) expect(result.grade).toBe('good')
    else if (result.performanceScore >= 40) expect(result.grade).toBe('average')
    else expect(result.grade).toBe('needs_improvement')
  })

  it('populates details correctly from dimension results', () => {
    const memberIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        priority: 'High',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        isReopened: true,
        linkedBugCount: 1,
        linkedIssueCount: 2,
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-06T00:00:00Z' },
        ],
      }),
    ]

    const result = calculateMemberPerformance(memberIssues, memberIssues, defaultSprint)

    expect(result.details.completedTaskCount).toBe(1)
    expect(result.details.complexityWeightedOutput).toBeGreaterThan(0)
    expect(result.details.averageCycleTime).toBe(4)
    expect(result.details.deliveryRate).toBeGreaterThanOrEqual(0)
    expect(result.details.reworkRate).toBe(1) // 1 reopened out of 1 completed
    expect(result.details.bugIntroductionRate).toBe(1) // 1 with bugs out of 1 completed
    expect(result.details.highPriorityCompletionRatio).toBe(1) // all high priority
    expect(result.details.crossTeamCommentCount).toBeGreaterThanOrEqual(0)
    expect(result.details.crossTeamTaskRatio).toBeGreaterThanOrEqual(0)
  })

  it('is idempotent - same input produces same output', () => {
    const memberIssues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-05T00:00:00Z' },
        ],
      }),
    ]

    const result1 = calculateMemberPerformance(memberIssues, memberIssues, defaultSprint)
    const result2 = calculateMemberPerformance(memberIssues, memberIssues, defaultSprint)

    expect(result1).toEqual(result2)
  })
})

// ─── calculateDepartmentPerformance ─────────────────────────

describe('calculateDepartmentPerformance', () => {
  const defaultSprint = {
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-14T23:59:59Z',
  }

  it('returns empty result when no issues', () => {
    const result = calculateDepartmentPerformance([], defaultSprint)

    expect(result.averageScore).toBe(0)
    expect(result.averageThroughput).toBe(0)
    expect(result.averageEfficiency).toBe(0)
    expect(result.averageQuality).toBe(0)
    expect(result.averageImpact).toBe(0)
    expect(result.averageCollaboration).toBe(0)
    expect(result.totalCompletedTasks).toBe(0)
    expect(result.averageCycleTime).toBe(0)
    expect(result.members).toHaveLength(0)
    expect(result.distribution).toEqual({ excellent: 0, good: 0, average: 0, needsImprovement: 0 })
  })

  it('groups issues by assignee and calculates per-member performance', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-04T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-03T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-07T00:00:00Z' },
        ],
      }),
    ]

    const result = calculateDepartmentPerformance(issues, defaultSprint)

    expect(result.members).toHaveLength(2)
    expect(result.members.map(m => m.memberId).sort()).toEqual(['user-1', 'user-2'])
  })

  it('calculates correct averages across members', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-04T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-03T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-07T00:00:00Z' },
        ],
      }),
    ]

    const result = calculateDepartmentPerformance(issues, defaultSprint)

    // Average score should be the mean of both members' scores
    const expectedAvgScore = Math.round(
      (result.members[0].performanceScore + result.members[1].performanceScore) / 2 * 100
    ) / 100
    expect(result.averageScore).toBe(expectedAvgScore)
  })

  it('calculates totalCompletedTasks as sum of all members completed tasks', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
      }),
      makePerformanceIssue({
        id: 'DTS-3',
        status: 'done',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
      }),
      makePerformanceIssue({
        id: 'DTS-4',
        status: 'in_progress',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
      }),
    ]

    const result = calculateDepartmentPerformance(issues, defaultSprint)

    expect(result.totalCompletedTasks).toBe(3) // 2 from Alice + 1 from Bob
  })

  it('calculates averageCycleTime from members with cycle time > 0', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-06T00:00:00Z' }, // 4 days
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-03T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-09T00:00:00Z' }, // 6 days
        ],
      }),
    ]

    const result = calculateDepartmentPerformance(issues, defaultSprint)

    // Average cycle time = (4 + 6) / 2 = 5
    expect(result.averageCycleTime).toBe(5)
  })

  it('calculates performance distribution correctly', () => {
    // Create issues that will produce different grades for different members
    const issues = [
      // User 1: high performer - fast, high priority, no rework
      ...Array.from({ length: 5 }, (_, i) =>
        makePerformanceIssue({
          id: `A-${i}`,
          status: 'done',
          priority: 'High',
          assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
          isReopened: false,
          linkedBugCount: 0,
          statusTransitions: [
            { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
            { from: 'In Progress', to: 'Done', timestamp: '2025-01-03T00:00:00Z' },
          ],
        })
      ),
      // User 2: low performer - slow, low priority, all reworked
      makePerformanceIssue({
        id: 'B-1',
        status: 'done',
        priority: 'Low',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        isReopened: true,
        linkedBugCount: 2,
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-14T00:00:00Z' },
        ],
      }),
    ]

    const result = calculateDepartmentPerformance(issues, defaultSprint)

    // Distribution should sum to total members
    const totalDistribution =
      result.distribution.excellent +
      result.distribution.good +
      result.distribution.average +
      result.distribution.needsImprovement

    expect(totalDistribution).toBe(result.members.length)
  })

  it('distribution matches member grades', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-04T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-03T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-07T00:00:00Z' },
        ],
      }),
    ]

    const result = calculateDepartmentPerformance(issues, defaultSprint)

    // Count grades from members
    let excellent = 0, good = 0, average = 0, needsImprovement = 0
    for (const member of result.members) {
      switch (member.grade) {
        case 'excellent': excellent++; break
        case 'good': good++; break
        case 'average': average++; break
        case 'needs_improvement': needsImprovement++; break
      }
    }

    expect(result.distribution.excellent).toBe(excellent)
    expect(result.distribution.good).toBe(good)
    expect(result.distribution.average).toBe(average)
    expect(result.distribution.needsImprovement).toBe(needsImprovement)
  })

  it('is idempotent - same input produces same output', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-05T00:00:00Z' },
        ],
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-03T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-07T00:00:00Z' },
        ],
      }),
    ]

    const result1 = calculateDepartmentPerformance(issues, defaultSprint)
    const result2 = calculateDepartmentPerformance(issues, defaultSprint)

    expect(result1).toEqual(result2)
  })

  it('handles unassigned issues by grouping them under "unknown"', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: null,
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
      }),
    ]

    const result = calculateDepartmentPerformance(issues, defaultSprint)

    expect(result.members).toHaveLength(2)
    const unassignedMember = result.members.find(m => m.memberId === 'unknown')
    expect(unassignedMember).toBeDefined()
    expect(unassignedMember!.memberName).toBe('unknown')
  })

  it('uses custom weights when provided', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
        priority: 'High',
        statusTransitions: [
          { from: 'todo', to: 'In Progress', timestamp: '2025-01-02T00:00:00Z' },
          { from: 'In Progress', to: 'Done', timestamp: '2025-01-04T00:00:00Z' },
        ],
      }),
    ]

    const customWeights = {
      throughput: 0.50,
      efficiency: 0.10,
      quality: 0.10,
      impact: 0.20,
      collaboration: 0.10,
    }

    const _resultDefault = calculateDepartmentPerformance(issues, defaultSprint)
    void _resultDefault // verify default weights work without error
    const resultCustom = calculateDepartmentPerformance(issues, defaultSprint, customWeights)

    // Both should be valid
    expect(resultCustom.averageScore).toBeGreaterThanOrEqual(0)
    expect(resultCustom.averageScore).toBeLessThanOrEqual(100)
    // Custom weights should produce different results (unless all dimensions are equal)
    expect(resultCustom.members[0].performanceScore).toBeGreaterThanOrEqual(0)
  })

  it('all average scores are in [0, 100] range', () => {
    const issues = [
      makePerformanceIssue({
        id: 'DTS-1',
        status: 'done',
        assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
      }),
      makePerformanceIssue({
        id: 'DTS-2',
        status: 'in_progress',
        assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' },
      }),
    ]

    const result = calculateDepartmentPerformance(issues, defaultSprint)

    expect(result.averageScore).toBeGreaterThanOrEqual(0)
    expect(result.averageScore).toBeLessThanOrEqual(100)
    expect(result.averageThroughput).toBeGreaterThanOrEqual(0)
    expect(result.averageThroughput).toBeLessThanOrEqual(100)
    expect(result.averageEfficiency).toBeGreaterThanOrEqual(0)
    expect(result.averageEfficiency).toBeLessThanOrEqual(100)
    expect(result.averageQuality).toBeGreaterThanOrEqual(0)
    expect(result.averageQuality).toBeLessThanOrEqual(100)
    expect(result.averageImpact).toBeGreaterThanOrEqual(0)
    expect(result.averageImpact).toBeLessThanOrEqual(100)
    expect(result.averageCollaboration).toBeGreaterThanOrEqual(0)
    expect(result.averageCollaboration).toBeLessThanOrEqual(100)
  })
})
