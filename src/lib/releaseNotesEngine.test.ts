import { describe, it, expect } from 'vitest'
import {
  classifyIssue,
  categorizeIssues,
  computeCompletionSummary,
  detectStaleIssues,
  identifyUnplannedIssues,
  buildReleaseNotesData,
} from './releaseNotesEngine'
import type { PlatformIssue, CategorizedIssues, ClassifiedIssue } from '@/types/platform'

// ─── Test helpers ───────────────────────────────────────────

function makePlatformIssue(overrides: Partial<PlatformIssue> = {}): PlatformIssue {
  return {
    id: 'DTS-1001',
    jiraId: '10001',
    title: 'Test Issue',
    status: 'in_progress',
    priority: 'P2',
    assignee: { id: 'u1', name: 'Alice', avatarUrl: '' },
    storyPoints: 3,
    labels: [],
    isBaseline: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    estimatedHours: 8,
    spentHours: 4,
    ...overrides,
  }
}

const SPRINT_START = '2024-01-08T00:00:00Z'
const SPRINT_END = '2024-01-22T00:00:00Z'

// ─── classifyIssue ──────────────────────────────────────────

describe('classifyIssue', () => {
  it('classifies issue with hotfix label as hot_fix', () => {
    const issue = makePlatformIssue({ labels: ['HotFix-123', 'urgent'] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.category).toBe('hot_fix')
  })

  it('classifies issue with hot-fix label as hot_fix', () => {
    const issue = makePlatformIssue({ labels: ['hot-fix'] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.category).toBe('hot_fix')
  })

  it('classifies issue with bug label as bug_fix', () => {
    const issue = makePlatformIssue({ labels: ['bug'] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.category).toBe('bug_fix')
  })

  it('classifies issue with Bug issueType as bug_fix', () => {
    const issue = makePlatformIssue({ labels: [] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END, 'Bug')
    expect(result.category).toBe('bug_fix')
  })

  it('classifies issue with feature label as feature', () => {
    const issue = makePlatformIssue({ labels: ['feature'] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.category).toBe('feature')
  })

  it('classifies issue with Story issueType as feature', () => {
    const issue = makePlatformIssue({ labels: [] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END, 'Story')
    expect(result.category).toBe('feature')
  })

  it('classifies issue with improvement label as improvement', () => {
    const issue = makePlatformIssue({ labels: ['improvement'] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.category).toBe('improvement')
  })

  it('classifies issue with enhancement label as improvement', () => {
    const issue = makePlatformIssue({ labels: ['enhancement'] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.category).toBe('improvement')
  })

  it('classifies issue with no matching labels as other', () => {
    const issue = makePlatformIssue({ labels: ['documentation'] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.category).toBe('other')
  })

  it('classifies issue with empty labels as other', () => {
    const issue = makePlatformIssue({ labels: [] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.category).toBe('other')
  })

  it('hot_fix takes priority over bug label', () => {
    const issue = makePlatformIssue({ labels: ['hotfix', 'bug'] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.category).toBe('hot_fix')
  })

  it('bug_fix takes priority over feature label', () => {
    const issue = makePlatformIssue({ labels: ['bug', 'feature'] })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.category).toBe('bug_fix')
  })

  it('marks issue as unplanned when created after sprint start', () => {
    const issue = makePlatformIssue({ createdAt: '2024-01-10T00:00:00Z' })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.isUnplanned).toBe(true)
  })

  it('marks issue as planned when created before sprint start', () => {
    const issue = makePlatformIssue({ createdAt: '2024-01-01T00:00:00Z' })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.isUnplanned).toBe(false)
  })

  it('marks issue as planned when created exactly at sprint start', () => {
    const issue = makePlatformIssue({ createdAt: SPRINT_START })
    const result = classifyIssue(issue, SPRINT_START, SPRINT_END)
    expect(result.isUnplanned).toBe(false)
  })
})

// ─── categorizeIssues ───────────────────────────────────────

describe('categorizeIssues', () => {
  it('groups issues into correct categories', () => {
    const issues = [
      makePlatformIssue({ id: 'DTS-1', labels: ['hotfix'] }),
      makePlatformIssue({ id: 'DTS-2', labels: ['bug'] }),
      makePlatformIssue({ id: 'DTS-3', labels: ['feature'] }),
      makePlatformIssue({ id: 'DTS-4', labels: ['improvement'] }),
      makePlatformIssue({ id: 'DTS-5', labels: [] }),
    ]

    const result = categorizeIssues(issues, SPRINT_START, SPRINT_END)

    expect(result.hot_fix).toHaveLength(1)
    expect(result.bug_fix).toHaveLength(1)
    expect(result.feature).toHaveLength(1)
    expect(result.improvement).toHaveLength(1)
    expect(result.other).toHaveLength(1)
  })

  it('returns empty categories for empty input', () => {
    const result = categorizeIssues([], SPRINT_START, SPRINT_END)
    expect(result.feature).toHaveLength(0)
    expect(result.bug_fix).toHaveLength(0)
    expect(result.hot_fix).toHaveLength(0)
    expect(result.improvement).toHaveLength(0)
    expect(result.other).toHaveLength(0)
  })

  it('uses issueTypes map for classification', () => {
    const issues = [
      makePlatformIssue({ id: 'DTS-1', jiraId: '100', labels: [] }),
      makePlatformIssue({ id: 'DTS-2', jiraId: '200', labels: [] }),
    ]
    const issueTypes = new Map([
      ['100', 'Bug'],
      ['200', 'Story'],
    ])

    const result = categorizeIssues(issues, SPRINT_START, SPRINT_END, issueTypes)
    expect(result.bug_fix).toHaveLength(1)
    expect(result.feature).toHaveLength(1)
  })
})

// ─── computeCompletionSummary ───────────────────────────────

describe('computeCompletionSummary', () => {
  it('computes correct totals and completion rate', () => {
    const categorized: CategorizedIssues = {
      feature: [
        { ...makePlatformIssue({ status: 'done' }), category: 'feature', isUnplanned: false, isStaleStatus: false },
        { ...makePlatformIssue({ status: 'in_progress' }), category: 'feature', isUnplanned: false, isStaleStatus: false },
      ],
      bug_fix: [
        { ...makePlatformIssue({ status: 'done' }), category: 'bug_fix', isUnplanned: false, isStaleStatus: false },
      ],
      hot_fix: [
        { ...makePlatformIssue({ status: 'done' }), category: 'hot_fix', isUnplanned: true, isStaleStatus: false },
      ],
      improvement: [],
      other: [],
    }

    const summary = computeCompletionSummary(categorized)

    expect(summary.totalCount).toBe(4)
    expect(summary.completedCount).toBe(3)
    expect(summary.completionRate).toBe(75)
    expect(summary.hotFixCount).toBe(1)
    expect(summary.unplannedCount).toBe(1)
    expect(summary.baselineCount).toBe(3)
    expect(summary.isCompletionWarning).toBe(true)
  })

  it('handles empty issues (zero division)', () => {
    const categorized: CategorizedIssues = {
      feature: [],
      bug_fix: [],
      hot_fix: [],
      improvement: [],
      other: [],
    }

    const summary = computeCompletionSummary(categorized)

    expect(summary.totalCount).toBe(0)
    expect(summary.completedCount).toBe(0)
    expect(summary.completionRate).toBe(0)
    expect(summary.isCompletionWarning).toBe(true) // 0 < 80
  })

  it('sets isCompletionWarning to false when rate >= 80', () => {
    const issues: ClassifiedIssue[] = Array.from({ length: 5 }, (_, i) => ({
      ...makePlatformIssue({ id: `DTS-${i}`, status: 'done' }),
      category: 'feature' as const,
      isUnplanned: false,
      isStaleStatus: false,
    }))

    const categorized: CategorizedIssues = {
      feature: issues,
      bug_fix: [],
      hot_fix: [],
      improvement: [],
      other: [],
    }

    const summary = computeCompletionSummary(categorized)
    expect(summary.completionRate).toBe(100)
    expect(summary.isCompletionWarning).toBe(false)
  })
})

// ─── detectStaleIssues ──────────────────────────────────────

describe('detectStaleIssues', () => {
  it('returns in_progress and in_testing issues when near sprint end', () => {
    const sprintEnd = '2024-01-22T00:00:00Z'
    const now = new Date('2024-01-21T00:00:00Z') // 1 day before end

    const issues: ClassifiedIssue[] = [
      { ...makePlatformIssue({ status: 'in_progress' }), category: 'feature', isUnplanned: false, isStaleStatus: false },
      { ...makePlatformIssue({ status: 'in_testing' }), category: 'bug_fix', isUnplanned: false, isStaleStatus: false },
      { ...makePlatformIssue({ status: 'done' }), category: 'feature', isUnplanned: false, isStaleStatus: false },
      { ...makePlatformIssue({ status: 'todo' }), category: 'other', isUnplanned: false, isStaleStatus: false },
    ]

    const stale = detectStaleIssues(issues, sprintEnd, now)
    expect(stale).toHaveLength(2)
    expect(stale[0].status).toBe('in_progress')
    expect(stale[1].status).toBe('in_testing')
  })

  it('returns empty when sprint end is more than 2 days away', () => {
    const sprintEnd = '2024-01-22T00:00:00Z'
    const now = new Date('2024-01-15T00:00:00Z') // 7 days before end

    const issues: ClassifiedIssue[] = [
      { ...makePlatformIssue({ status: 'in_progress' }), category: 'feature', isUnplanned: false, isStaleStatus: false },
    ]

    const stale = detectStaleIssues(issues, sprintEnd, now)
    expect(stale).toHaveLength(0)
  })

  it('returns stale issues when sprint end has passed', () => {
    const sprintEnd = '2024-01-22T00:00:00Z'
    const now = new Date('2024-01-23T00:00:00Z') // 1 day after end

    const issues: ClassifiedIssue[] = [
      { ...makePlatformIssue({ status: 'in_progress' }), category: 'feature', isUnplanned: false, isStaleStatus: false },
    ]

    const stale = detectStaleIssues(issues, sprintEnd, now)
    expect(stale).toHaveLength(1)
  })
})

// ─── identifyUnplannedIssues ────────────────────────────────

describe('identifyUnplannedIssues', () => {
  it('filters only unplanned issues', () => {
    const issues: ClassifiedIssue[] = [
      { ...makePlatformIssue(), category: 'feature', isUnplanned: true, isStaleStatus: false },
      { ...makePlatformIssue(), category: 'bug_fix', isUnplanned: false, isStaleStatus: false },
      { ...makePlatformIssue(), category: 'hot_fix', isUnplanned: true, isStaleStatus: false },
    ]

    const unplanned = identifyUnplannedIssues(issues)
    expect(unplanned).toHaveLength(2)
  })
})

// ─── buildReleaseNotesData ──────────────────────────────────

describe('buildReleaseNotesData', () => {
  it('builds complete release notes data', () => {
    const issues = [
      makePlatformIssue({ id: 'DTS-1', labels: ['hotfix'], status: 'done', createdAt: '2024-01-10T00:00:00Z' }),
      makePlatformIssue({ id: 'DTS-2', labels: ['bug'], status: 'done', createdAt: '2024-01-01T00:00:00Z' }),
      makePlatformIssue({ id: 'DTS-3', labels: ['feature'], status: 'in_progress', createdAt: '2024-01-01T00:00:00Z' }),
    ]

    const sprint = { name: 'Sprint 10', startDate: SPRINT_START, endDate: SPRINT_END }
    const result = buildReleaseNotesData(issues, sprint, 'DTS')

    expect(result.sprintName).toBe('Sprint 10')
    expect(result.sprintStartDate).toBe(SPRINT_START)
    expect(result.sprintEndDate).toBe(SPRINT_END)
    expect(result.projectKey).toBe('DTS')
    expect(result.summary.totalCount).toBe(3)
    expect(result.summary.completedCount).toBe(2)
    expect(result.categorizedIssues.hot_fix).toHaveLength(1)
    expect(result.categorizedIssues.bug_fix).toHaveLength(1)
    expect(result.categorizedIssues.feature).toHaveLength(1)
    expect(result.generatedAt).toBeTruthy()
  })

  it('handles empty issues list', () => {
    const sprint = { name: 'Sprint 11', startDate: SPRINT_START, endDate: SPRINT_END }
    const result = buildReleaseNotesData([], sprint, 'DTS')

    expect(result.summary.totalCount).toBe(0)
    expect(result.summary.completionRate).toBe(0)
    expect(result.categorizedIssues.feature).toHaveLength(0)
  })
})
