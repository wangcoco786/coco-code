import { describe, it, expect } from 'vitest'
import { buildPageContext, generateSuggestions } from './aiContextBuilder'
import type { PlatformIssue, Risk, SprintSummary, AIContext } from '@/types/platform'

// ─── helpers ────────────────────────────────────────────────

function makeIssue(overrides: Partial<PlatformIssue> = {}): PlatformIssue {
  return {
    id: 'DTS-100',
    jiraId: '10100',
    title: 'Test Issue',
    status: 'in_progress',
    priority: 'P1',
    assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' },
    storyPoints: 5,
    labels: ['frontend'],
    isBaseline: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    estimatedHours: 8,
    spentHours: 4,
    ...overrides,
  }
}

function makeRisk(overrides: Partial<Risk> = {}): Risk {
  return {
    id: 'risk-1',
    level: 'high',
    type: 'unassigned',
    description: '任务 DTS-101 超过 5 天未分配',
    status: 'open',
    detectedAt: '2025-01-10T00:00:00Z',
    ...overrides,
  }
}

function makeSprint(overrides: Partial<SprintSummary> = {}): SprintSummary {
  return {
    id: 1,
    name: 'Sprint 10',
    state: 'active',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-14T00:00:00Z',
    totalIssues: 20,
    completedIssues: 12,
    completionRate: 60,
    issues: [],
    ...overrides,
  }
}

// ─── buildPageContext: Sprint ───────────────────────────────

describe('buildPageContext - sprint', () => {
  it('builds context with sprint name, completion rate, in-progress count, and P0 count', () => {
    const sprint = makeSprint({ name: 'Sprint 10', completionRate: 60 })
    const issues = [
      makeIssue({ status: 'in_progress', priority: 'P0' }),
      makeIssue({ id: 'DTS-101', status: 'in_progress', priority: 'P1' }),
      makeIssue({ id: 'DTS-102', status: 'done', priority: 'P0' }),
    ]

    const ctx = buildPageContext('sprint', { sprint, issues })

    expect(ctx.pageType).toBe('sprint')
    expect(ctx.summary).toContain('Sprint 10')
    expect(ctx.summary).toContain('60%')
    expect(ctx.summary).toContain('进行中 2')
    expect(ctx.summary).toContain('P0 任务 2')
    expect(ctx.suggestions).toHaveLength(3)
    expect(ctx.metadata.sprintName).toBe('Sprint 10')
    expect(ctx.metadata.completionRate).toBe(60)
    expect(ctx.metadata.inProgressCount).toBe(2)
    expect(ctx.metadata.p0Count).toBe(2)
  })

  it('handles null sprint gracefully', () => {
    const ctx = buildPageContext('sprint', { sprint: null })

    expect(ctx.pageType).toBe('sprint')
    expect(ctx.summary).toContain('无活跃 Sprint')
    expect(ctx.suggestions).toHaveLength(3)
  })

  it('uses sprint.issues when issues param is not provided', () => {
    const sprint = makeSprint({
      issues: [
        makeIssue({ status: 'in_progress', priority: 'P0' }),
      ],
    })

    const ctx = buildPageContext('sprint', { sprint })

    expect(ctx.metadata.inProgressCount).toBe(1)
    expect(ctx.metadata.p0Count).toBe(1)
  })

  it('includes projectKey in context', () => {
    const sprint = makeSprint()
    const ctx = buildPageContext('sprint', { sprint, projectKey: 'DTS' })

    expect(ctx.projectKey).toBe('DTS')
  })
})

// ─── buildPageContext: Requirements ─────────────────────────

describe('buildPageContext - requirements', () => {
  it('builds context with total issues, status distribution, and unassigned count', () => {
    const issues = [
      makeIssue({ status: 'todo', assignee: null }),
      makeIssue({ id: 'DTS-101', status: 'todo', assignee: null }),
      makeIssue({ id: 'DTS-102', status: 'in_progress' }),
      makeIssue({ id: 'DTS-103', status: 'done' }),
    ]

    const ctx = buildPageContext('requirements', { issues })

    expect(ctx.pageType).toBe('requirements')
    expect(ctx.summary).toContain('共 4 项')
    expect(ctx.summary).toContain('未分配 2 项')
    expect(ctx.summary).toContain('todo(2)')
    expect(ctx.summary).toContain('in_progress(1)')
    expect(ctx.summary).toContain('done(1)')
    expect(ctx.suggestions).toHaveLength(3)
    expect(ctx.metadata.totalIssues).toBe(4)
    expect(ctx.metadata.unassignedCount).toBe(2)
  })

  it('includes filter information in summary', () => {
    const issues = [makeIssue()]
    const filters = { priority: 'P0', status: 'todo' }

    const ctx = buildPageContext('requirements', { issues, filters })

    expect(ctx.summary).toContain('筛选')
    expect(ctx.summary).toContain('priority=P0')
    expect(ctx.summary).toContain('status=todo')
  })

  it('handles empty issues list', () => {
    const ctx = buildPageContext('requirements', { issues: [] })

    expect(ctx.summary).toContain('共 0 项')
    expect(ctx.metadata.totalIssues).toBe(0)
    expect(ctx.metadata.unassignedCount).toBe(0)
    expect(ctx.suggestions).toHaveLength(3)
  })
})

// ─── buildPageContext: Risk ─────────────────────────────────

describe('buildPageContext - risk', () => {
  it('builds context with high/medium/low risk counts and top risk descriptions', () => {
    const risks = [
      makeRisk({ level: 'high', description: '高危风险 A' }),
      makeRisk({ id: 'risk-2', level: 'high', description: '高危风险 B' }),
      makeRisk({ id: 'risk-3', level: 'medium', description: '中危风险 C' }),
      makeRisk({ id: 'risk-4', level: 'low', description: '低危风险 D' }),
    ]

    const ctx = buildPageContext('risk', { risks })

    expect(ctx.pageType).toBe('risk')
    expect(ctx.summary).toContain('高危 2')
    expect(ctx.summary).toContain('中危 1')
    expect(ctx.summary).toContain('低危 1')
    expect(ctx.summary).toContain('高危风险 A')
    expect(ctx.summary).toContain('高危风险 B')
    expect(ctx.suggestions).toHaveLength(3)
    expect(ctx.metadata.highCount).toBe(2)
    expect(ctx.metadata.mediumCount).toBe(1)
    expect(ctx.metadata.lowCount).toBe(1)
  })

  it('handles empty risks list', () => {
    const ctx = buildPageContext('risk', { risks: [] })

    expect(ctx.summary).toContain('高危 0')
    expect(ctx.metadata.highCount).toBe(0)
    expect(ctx.suggestions).toHaveLength(3)
  })

  it('limits top risks to 3 descriptions', () => {
    const risks = [
      makeRisk({ id: 'r1', level: 'high', description: 'Risk 1' }),
      makeRisk({ id: 'r2', level: 'high', description: 'Risk 2' }),
      makeRisk({ id: 'r3', level: 'high', description: 'Risk 3' }),
      makeRisk({ id: 'r4', level: 'high', description: 'Risk 4' }),
    ]

    const ctx = buildPageContext('risk', { risks })

    const topRisks = ctx.metadata.topRisks as string[]
    expect(topRisks).toHaveLength(3)
  })
})

// ─── buildPageContext: Dashboard ────────────────────────────

describe('buildPageContext - dashboard', () => {
  it('builds context with overall project health metrics', () => {
    const issues = [
      makeIssue({ status: 'done' }),
      makeIssue({ id: 'DTS-101', status: 'done' }),
      makeIssue({ id: 'DTS-102', status: 'in_progress' }),
      makeIssue({ id: 'DTS-103', status: 'todo' }),
    ]
    const sprint = makeSprint({ name: 'Sprint 10' })

    const ctx = buildPageContext('dashboard', { issues, sprint })

    expect(ctx.pageType).toBe('dashboard')
    expect(ctx.summary).toContain('共 4 项')
    expect(ctx.summary).toContain('已完成 2')
    expect(ctx.summary).toContain('50%')
    expect(ctx.summary).toContain('Sprint 10')
    expect(ctx.suggestions).toHaveLength(3)
    expect(ctx.metadata.overallCompletionRate).toBe(50)
  })

  it('handles no sprint', () => {
    const ctx = buildPageContext('dashboard', { issues: [] })

    expect(ctx.summary).toContain('共 0 项')
    expect(ctx.metadata.activeSprint).toBeNull()
    expect(ctx.suggestions).toHaveLength(3)
  })
})

// ─── buildPageContext: Reports ──────────────────────────────

describe('buildPageContext - reports', () => {
  it('builds context with report types', () => {
    const ctx = buildPageContext('reports', {})

    expect(ctx.pageType).toBe('reports')
    expect(ctx.summary).toContain('报告中心')
    expect(ctx.suggestions).toHaveLength(3)
    expect(ctx.metadata.reportTypes).toEqual(['daily', 'weekly', 'sprint_review'])
  })
})

// ─── buildPageContext: Roadmap ──────────────────────────────

describe('buildPageContext - roadmap', () => {
  it('builds context with roadmap information', () => {
    const ctx = buildPageContext('roadmap', {})

    expect(ctx.pageType).toBe('roadmap')
    expect(ctx.summary).toContain('路线图')
    expect(ctx.suggestions).toHaveLength(3)
  })
})

// ─── generateSuggestions ────────────────────────────────────

describe('generateSuggestions', () => {
  it('always returns exactly 3 suggestions', () => {
    const pageTypes: AIContext['pageType'][] = [
      'sprint', 'requirements', 'risk', 'dashboard', 'reports', 'roadmap',
    ]

    for (const pageType of pageTypes) {
      const ctx: AIContext = {
        pageType,
        projectKey: null,
        summary: 'test',
        suggestions: [],
        metadata: {},
      }
      const suggestions = generateSuggestions(ctx)
      expect(suggestions).toHaveLength(3)
      for (const s of suggestions) {
        expect(s.length).toBeGreaterThan(0)
      }
    }
  })

  it('generates sprint-specific suggestions with P0 info', () => {
    const ctx: AIContext = {
      pageType: 'sprint',
      projectKey: 'DTS',
      summary: 'Sprint "Sprint 10": 完成率 40%',
      suggestions: [],
      metadata: { p0Count: 3, inProgressCount: 2, completionRate: 40 },
    }

    const suggestions = generateSuggestions(ctx)

    expect(suggestions).toHaveLength(3)
    expect(suggestions[0]).toContain('P0')
    expect(suggestions[2]).toContain('完成率偏低')
  })

  it('generates risk-specific suggestions with high risk info', () => {
    const ctx: AIContext = {
      pageType: 'risk',
      projectKey: null,
      summary: '风险概览',
      suggestions: [],
      metadata: { highCount: 5, topRisks: ['Risk A', 'Risk B'] },
    }

    const suggestions = generateSuggestions(ctx)

    expect(suggestions).toHaveLength(3)
    expect(suggestions[0]).toContain('5 项高危风险')
    expect(suggestions[1]).toContain('负责人')
  })

  it('generates requirements-specific suggestions with unassigned info', () => {
    const ctx: AIContext = {
      pageType: 'requirements',
      projectKey: null,
      summary: '需求列表',
      suggestions: [],
      metadata: { unassignedCount: 4, totalIssues: 10, statusDistribution: { todo: 3 } },
    }

    const suggestions = generateSuggestions(ctx)

    expect(suggestions).toHaveLength(3)
    expect(suggestions[0]).toContain('4 项未指派')
  })
})

// ─── projectKey handling ────────────────────────────────────

describe('projectKey handling', () => {
  it('defaults projectKey to null when not provided', () => {
    const ctx = buildPageContext('sprint', { sprint: null })
    expect(ctx.projectKey).toBeNull()
  })

  it('passes projectKey through when provided', () => {
    const ctx = buildPageContext('sprint', { sprint: null, projectKey: 'PROJ' })
    expect(ctx.projectKey).toBe('PROJ')
  })
})
