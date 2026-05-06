import type {
  AutomationRule,
  ConditionType,
  ActionType,
  PlatformIssue,
} from '@/types/platform'

// ─── Valid types ────────────────────────────────────────────

const VALID_CONDITION_TYPES: ConditionType[] = [
  'status_change',
  'priority_change',
  'timeout_no_update',
  'assignee_change',
  'scope_change',
]

const VALID_ACTION_TYPES: ActionType[] = [
  'send_wecom',
  'change_status',
  'assign_member',
  'add_label',
  'generate_report',
]

// ─── validateRule ───────────────────────────────────────────

/**
 * Validates an automation rule definition.
 * Checks that condition.type, action.type are valid and name is non-empty.
 */
export function validateRule(rule: Partial<AutomationRule>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check name is non-empty
  if (!rule.name || rule.name.trim() === '') {
    errors.push('Rule name is required')
  }

  // Check condition type
  if (!rule.condition || !VALID_CONDITION_TYPES.includes(rule.condition.type as ConditionType)) {
    errors.push(
      `Invalid condition type. Must be one of: ${VALID_CONDITION_TYPES.join(', ')}`
    )
  }

  // Check action type
  if (!rule.action || !VALID_ACTION_TYPES.includes(rule.action.type as ActionType)) {
    errors.push(
      `Invalid action type. Must be one of: ${VALID_ACTION_TYPES.join(', ')}`
    )
  }

  return { valid: errors.length === 0, errors }
}

// ─── evaluateCondition ──────────────────────────────────────

/**
 * Evaluates whether a condition is met given the current issue and its previous state.
 */
export function evaluateCondition(
  condition: AutomationRule['condition'],
  context: { issue: PlatformIssue; previousState?: Partial<PlatformIssue> }
): boolean {
  const { issue, previousState } = context

  switch (condition.type) {
    case 'status_change':
      return issue.status !== previousState?.status

    case 'priority_change':
      return issue.priority !== previousState?.priority

    case 'timeout_no_update': {
      const days = (condition.params.days as number) || 3
      const now = Date.now()
      const updatedAt = new Date(issue.updatedAt).getTime()
      const thresholdMs = days * 24 * 60 * 60 * 1000
      return now - updatedAt > thresholdMs
    }

    case 'assignee_change':
      return issue.assignee?.id !== previousState?.assignee?.id

    case 'scope_change': {
      const labelsChanged =
        JSON.stringify(issue.labels) !== JSON.stringify(previousState?.labels)
      const pointsChanged = issue.storyPoints !== previousState?.storyPoints
      return labelsChanged || pointsChanged
    }

    default:
      return false
  }
}

// ─── getPresetTemplates ─────────────────────────────────────

/**
 * Returns preset automation rule templates that users can enable with one click.
 */
export function getPresetTemplates(): AutomationRule[] {
  return [
    {
      id: 'preset-high-risk-notify',
      name: '高危风险自动通知',
      enabled: false,
      condition: {
        type: 'status_change',
        params: { toStatus: 'in_progress', priority: 'P0' },
      },
      action: {
        type: 'send_wecom',
        params: { message: 'P0 任务已进入开发阶段，请关注进度' },
      },
      createdAt: new Date().toISOString(),
      executionCount: 0,
    },
    {
      id: 'preset-timeout-reminder',
      name: '超时任务提醒',
      enabled: false,
      condition: {
        type: 'timeout_no_update',
        params: { days: 3 },
      },
      action: {
        type: 'send_wecom',
        params: { message: '任务已超过 3 天未更新，请确认进展' },
      },
      createdAt: new Date().toISOString(),
      executionCount: 0,
    },
    {
      id: 'preset-daily-summary',
      name: '每日进度汇总',
      enabled: false,
      condition: {
        type: 'status_change',
        params: {},
      },
      action: {
        type: 'generate_report',
        params: { reportType: 'daily' },
      },
      createdAt: new Date().toISOString(),
      executionCount: 0,
    },
  ]
}
