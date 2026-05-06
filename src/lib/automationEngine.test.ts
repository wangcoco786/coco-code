import { describe, it, expect } from 'vitest'
import {
  validateRule,
  evaluateCondition,
  getPresetTemplates,
} from './automationEngine'
import type { AutomationRule, PlatformIssue } from '@/types/platform'

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

function makeValidRule(overrides: Partial<AutomationRule> = {}): Partial<AutomationRule> {
  return {
    name: 'Test Rule',
    condition: { type: 'status_change', params: {} },
    action: { type: 'send_wecom', params: { message: 'hello' } },
    ...overrides,
  }
}

// ─── validateRule ───────────────────────────────────────────

describe('validateRule', () => {
  it('accepts a valid rule with all correct fields', () => {
    const result = validateRule(makeValidRule())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a rule with empty name', () => {
    const result = validateRule(makeValidRule({ name: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Rule name is required')
  })

  it('rejects a rule with whitespace-only name', () => {
    const result = validateRule(makeValidRule({ name: '   ' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Rule name is required')
  })

  it('rejects a rule with missing name', () => {
    const rule = makeValidRule()
    delete rule.name
    const result = validateRule(rule)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Rule name is required')
  })

  it('rejects a rule with invalid condition type', () => {
    const result = validateRule(
      makeValidRule({
        condition: { type: 'invalid_type' as any, params: {} },
      })
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Invalid condition type'))).toBe(true)
  })

  it('rejects a rule with missing condition', () => {
    const rule = makeValidRule()
    delete (rule as any).condition
    const result = validateRule(rule)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Invalid condition type'))).toBe(true)
  })

  it('rejects a rule with invalid action type', () => {
    const result = validateRule(
      makeValidRule({
        action: { type: 'invalid_action' as any, params: {} },
      })
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Invalid action type'))).toBe(true)
  })

  it('rejects a rule with missing action', () => {
    const rule = makeValidRule()
    delete (rule as any).action
    const result = validateRule(rule)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Invalid action type'))).toBe(true)
  })

  it('returns multiple errors when multiple fields are invalid', () => {
    const result = validateRule({})
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBe(3)
  })

  it('accepts all valid condition types', () => {
    const conditionTypes = [
      'status_change',
      'priority_change',
      'timeout_no_update',
      'assignee_change',
      'scope_change',
    ] as const

    for (const type of conditionTypes) {
      const result = validateRule(makeValidRule({ condition: { type, params: {} } }))
      expect(result.valid).toBe(true)
    }
  })

  it('accepts all valid action types', () => {
    const actionTypes = [
      'send_wecom',
      'change_status',
      'assign_member',
      'add_label',
      'generate_report',
    ] as const

    for (const type of actionTypes) {
      const result = validateRule(makeValidRule({ action: { type, params: {} } }))
      expect(result.valid).toBe(true)
    }
  })
})

// ─── evaluateCondition ──────────────────────────────────────

describe('evaluateCondition', () => {
  describe('status_change', () => {
    it('returns true when status differs from previous state', () => {
      const issue = makeIssue({ status: 'in_progress' })
      const result = evaluateCondition(
        { type: 'status_change', params: {} },
        { issue, previousState: { status: 'todo' } }
      )
      expect(result).toBe(true)
    })

    it('returns false when status is the same', () => {
      const issue = makeIssue({ status: 'in_progress' })
      const result = evaluateCondition(
        { type: 'status_change', params: {} },
        { issue, previousState: { status: 'in_progress' } }
      )
      expect(result).toBe(false)
    })

    it('returns true when previousState is undefined', () => {
      const issue = makeIssue({ status: 'in_progress' })
      const result = evaluateCondition(
        { type: 'status_change', params: {} },
        { issue }
      )
      expect(result).toBe(true)
    })
  })

  describe('priority_change', () => {
    it('returns true when priority differs from previous state', () => {
      const issue = makeIssue({ priority: 'P0' })
      const result = evaluateCondition(
        { type: 'priority_change', params: {} },
        { issue, previousState: { priority: 'P2' } }
      )
      expect(result).toBe(true)
    })

    it('returns false when priority is the same', () => {
      const issue = makeIssue({ priority: 'P1' })
      const result = evaluateCondition(
        { type: 'priority_change', params: {} },
        { issue, previousState: { priority: 'P1' } }
      )
      expect(result).toBe(false)
    })
  })

  describe('timeout_no_update', () => {
    it('returns true when issue has not been updated for more than specified days', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      const issue = makeIssue({ updatedAt: tenDaysAgo })
      const result = evaluateCondition(
        { type: 'timeout_no_update', params: { days: 3 } },
        { issue }
      )
      expect(result).toBe(true)
    })

    it('returns false when issue was recently updated', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const issue = makeIssue({ updatedAt: oneHourAgo })
      const result = evaluateCondition(
        { type: 'timeout_no_update', params: { days: 3 } },
        { issue }
      )
      expect(result).toBe(false)
    })

    it('defaults to 3 days when params.days is not specified', () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      const issue = makeIssue({ updatedAt: fourDaysAgo })
      const result = evaluateCondition(
        { type: 'timeout_no_update', params: {} },
        { issue }
      )
      expect(result).toBe(true)
    })
  })

  describe('assignee_change', () => {
    it('returns true when assignee id differs from previous state', () => {
      const issue = makeIssue({ assignee: { id: 'user-2', name: 'Bob', avatarUrl: '' } })
      const result = evaluateCondition(
        { type: 'assignee_change', params: {} },
        { issue, previousState: { assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' } } }
      )
      expect(result).toBe(true)
    })

    it('returns false when assignee is the same', () => {
      const issue = makeIssue({ assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' } })
      const result = evaluateCondition(
        { type: 'assignee_change', params: {} },
        { issue, previousState: { assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' } } }
      )
      expect(result).toBe(false)
    })

    it('returns true when assignee changes from null to someone', () => {
      const issue = makeIssue({ assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' } })
      const result = evaluateCondition(
        { type: 'assignee_change', params: {} },
        { issue, previousState: { assignee: null } }
      )
      expect(result).toBe(true)
    })

    it('returns true when assignee changes from someone to null', () => {
      const issue = makeIssue({ assignee: null })
      const result = evaluateCondition(
        { type: 'assignee_change', params: {} },
        { issue, previousState: { assignee: { id: 'user-1', name: 'Alice', avatarUrl: '' } } }
      )
      expect(result).toBe(true)
    })
  })

  describe('scope_change', () => {
    it('returns true when labels change', () => {
      const issue = makeIssue({ labels: ['frontend', 'urgent'] })
      const result = evaluateCondition(
        { type: 'scope_change', params: {} },
        { issue, previousState: { labels: ['frontend'] } }
      )
      expect(result).toBe(true)
    })

    it('returns true when storyPoints change', () => {
      const issue = makeIssue({ storyPoints: 8 })
      const result = evaluateCondition(
        { type: 'scope_change', params: {} },
        { issue, previousState: { storyPoints: 5, labels: ['frontend'] } }
      )
      expect(result).toBe(true)
    })

    it('returns false when labels and storyPoints are the same', () => {
      const issue = makeIssue({ labels: ['frontend'], storyPoints: 5 })
      const result = evaluateCondition(
        { type: 'scope_change', params: {} },
        { issue, previousState: { labels: ['frontend'], storyPoints: 5 } }
      )
      expect(result).toBe(false)
    })

    it('returns true when previousState has no labels (undefined)', () => {
      const issue = makeIssue({ labels: ['frontend'] })
      const result = evaluateCondition(
        { type: 'scope_change', params: {} },
        { issue, previousState: {} }
      )
      expect(result).toBe(true)
    })
  })
})

// ─── getPresetTemplates ─────────────────────────────────────

describe('getPresetTemplates', () => {
  it('returns exactly 3 preset templates', () => {
    const templates = getPresetTemplates()
    expect(templates).toHaveLength(3)
  })

  it('returns templates with valid structure', () => {
    const templates = getPresetTemplates()
    for (const template of templates) {
      expect(template.id).toBeTruthy()
      expect(template.name).toBeTruthy()
      expect(template.enabled).toBe(false)
      expect(template.executionCount).toBe(0)
      expect(template.createdAt).toBeTruthy()
      expect(template.condition).toBeDefined()
      expect(template.action).toBeDefined()
    }
  })

  it('includes 高危风险自动通知 template', () => {
    const templates = getPresetTemplates()
    const highRisk = templates.find((t) => t.name === '高危风险自动通知')
    expect(highRisk).toBeDefined()
    expect(highRisk!.condition.type).toBe('status_change')
    expect(highRisk!.action.type).toBe('send_wecom')
  })

  it('includes 超时任务提醒 template', () => {
    const templates = getPresetTemplates()
    const timeout = templates.find((t) => t.name === '超时任务提醒')
    expect(timeout).toBeDefined()
    expect(timeout!.condition.type).toBe('timeout_no_update')
    expect(timeout!.condition.params.days).toBe(3)
    expect(timeout!.action.type).toBe('send_wecom')
  })

  it('includes 每日进度汇总 template', () => {
    const templates = getPresetTemplates()
    const daily = templates.find((t) => t.name === '每日进度汇总')
    expect(daily).toBeDefined()
    expect(daily!.condition.type).toBe('status_change')
    expect(daily!.action.type).toBe('generate_report')
  })

  it('all templates pass validation', () => {
    const templates = getPresetTemplates()
    for (const template of templates) {
      const result = validateRule(template)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    }
  })
})
