import type {
  PageType,
  AIContext,
  PlatformIssue,
  Risk,
  SprintSummary,
} from '@/types/platform'

/**
 * Build a structured AI context based on the current page type and available data.
 * This is a pure function that produces an AIContext object for the AI assistant.
 */
export function buildPageContext(
  pageType: PageType,
  data: {
    issues?: PlatformIssue[]
    risks?: Risk[]
    sprint?: SprintSummary | null
    filters?: Record<string, string>
    projectKey?: string | null
  }
): AIContext {
  const projectKey = data.projectKey ?? null
  const metadata: Record<string, unknown> = {}

  let summary: string

  switch (pageType) {
    case 'sprint': {
      summary = buildSprintSummary(data.sprint, data.issues, metadata)
      break
    }
    case 'requirements': {
      summary = buildRequirementsSummary(data.issues, data.filters, metadata)
      break
    }
    case 'risk': {
      summary = buildRiskSummary(data.risks, metadata)
      break
    }
    case 'dashboard': {
      summary = buildDashboardSummary(data.issues, data.sprint, metadata)
      break
    }
    case 'reports': {
      summary = buildReportsSummary(metadata)
      break
    }
    case 'roadmap': {
      summary = buildRoadmapSummary(metadata)
      break
    }
    default: {
      summary = `当前页面: ${pageType}`
    }
  }

  const context: AIContext = {
    pageType,
    projectKey,
    summary,
    suggestions: [],
    metadata,
  }

  context.suggestions = generateSuggestions(context)

  return context
}

/**
 * Generate exactly 3 actionable suggestions based on the AI context.
 */
export function generateSuggestions(context: AIContext): string[] {
  switch (context.pageType) {
    case 'sprint':
      return generateSprintSuggestions(context)
    case 'requirements':
      return generateRequirementsSuggestions(context)
    case 'risk':
      return generateRiskSuggestions(context)
    case 'dashboard':
      return generateDashboardSuggestions(context)
    case 'reports':
      return generateReportsSuggestions()
    case 'roadmap':
      return generateRoadmapSuggestions()
    default:
      return [
        '查看项目整体进度',
        '检查待处理的任务',
        '查看最新通知',
      ]
  }
}

// ─── Sprint Context ─────────────────────────────────────────

function buildSprintSummary(
  sprint: SprintSummary | null | undefined,
  issues: PlatformIssue[] | undefined,
  metadata: Record<string, unknown>
): string {
  if (!sprint) {
    return '当前无活跃 Sprint'
  }

  const sprintIssues = issues ?? sprint.issues ?? []
  const inProgressCount = sprintIssues.filter((i) => i.status === 'in_progress').length
  const p0Count = sprintIssues.filter((i) => i.priority === 'P0').length

  metadata.sprintName = sprint.name
  metadata.completionRate = sprint.completionRate
  metadata.inProgressCount = inProgressCount
  metadata.p0Count = p0Count
  metadata.totalIssues = sprint.totalIssues
  metadata.completedIssues = sprint.completedIssues

  return `Sprint "${sprint.name}": 完成率 ${sprint.completionRate}%, 进行中 ${inProgressCount} 项, P0 任务 ${p0Count} 项`
}

function generateSprintSuggestions(context: AIContext): string[] {
  const suggestions: string[] = []
  const meta = context.metadata

  const p0Count = (meta.p0Count as number) ?? 0
  const inProgressCount = (meta.inProgressCount as number) ?? 0
  const completionRate = (meta.completionRate as number) ?? 0

  if (p0Count > 0) {
    suggestions.push(`分配未指派的 P0 任务，当前有 ${p0Count} 项 P0 任务需要关注`)
  } else {
    suggestions.push('检查是否有停滞超过 3 天的任务需要跟进')
  }

  if (inProgressCount > 5) {
    suggestions.push(`当前有 ${inProgressCount} 项任务进行中，建议检查是否有阻塞项`)
  } else {
    suggestions.push('审查进行中的任务，确保按时交付')
  }

  if (completionRate < 50) {
    suggestions.push('Sprint 完成率偏低，建议评估是否需要调整范围')
  } else {
    suggestions.push('检查风险项，确保 Sprint 目标按计划达成')
  }

  return suggestions.slice(0, 3)
}

// ─── Requirements Context ───────────────────────────────────

function buildRequirementsSummary(
  issues: PlatformIssue[] | undefined,
  filters: Record<string, string> | undefined,
  metadata: Record<string, unknown>
): string {
  const allIssues = issues ?? []
  const total = allIssues.length

  const statusDistribution: Record<string, number> = {}
  for (const issue of allIssues) {
    statusDistribution[issue.status] = (statusDistribution[issue.status] ?? 0) + 1
  }

  const unassignedCount = allIssues.filter((i) => i.assignee === null).length

  metadata.totalIssues = total
  metadata.statusDistribution = statusDistribution
  metadata.unassignedCount = unassignedCount
  metadata.filters = filters ?? {}

  const filterDesc = filters && Object.keys(filters).length > 0
    ? ` (筛选: ${Object.entries(filters).map(([k, v]) => `${k}=${v}`).join(', ')})`
    : ''

  return `需求列表${filterDesc}: 共 ${total} 项, 未分配 ${unassignedCount} 项, 状态分布: ${Object.entries(statusDistribution).map(([s, c]) => `${s}(${c})`).join(', ')}`
}

function generateRequirementsSuggestions(context: AIContext): string[] {
  const suggestions: string[] = []
  const meta = context.metadata

  const unassignedCount = (meta.unassignedCount as number) ?? 0
  const totalIssues = (meta.totalIssues as number) ?? 0
  const statusDistribution = (meta.statusDistribution as Record<string, number>) ?? {}

  const todoCount = statusDistribution['todo'] ?? 0

  if (unassignedCount > 0) {
    suggestions.push(`分配 ${unassignedCount} 项未指派的需求给合适的团队成员`)
  } else {
    suggestions.push('所有需求已分配，建议检查优先级是否合理')
  }

  if (todoCount > 0) {
    suggestions.push(`优先处理 Backlog 中的 ${todoCount} 项待办需求，关注 P0 优先级`)
  } else {
    suggestions.push('检查是否有逾期未完成的需求需要跟进')
  }

  if (totalIssues > 20) {
    suggestions.push('需求数量较多，建议按优先级和里程碑进行分组管理')
  } else {
    suggestions.push('审查需求状态，确保进度符合预期')
  }

  return suggestions.slice(0, 3)
}

// ─── Risk Context ───────────────────────────────────────────

function buildRiskSummary(
  risks: Risk[] | undefined,
  metadata: Record<string, unknown>
): string {
  const allRisks = risks ?? []

  const highCount = allRisks.filter((r) => r.level === 'high').length
  const mediumCount = allRisks.filter((r) => r.level === 'medium').length
  const lowCount = allRisks.filter((r) => r.level === 'low').length

  const topRisks = allRisks
    .filter((r) => r.level === 'high')
    .slice(0, 3)
    .map((r) => r.description)

  metadata.highCount = highCount
  metadata.mediumCount = mediumCount
  metadata.lowCount = lowCount
  metadata.topRisks = topRisks

  return `风险概览: 高危 ${highCount} 项, 中危 ${mediumCount} 项, 低危 ${lowCount} 项${topRisks.length > 0 ? `. 高危风险: ${topRisks.join('; ')}` : ''}`
}

function generateRiskSuggestions(context: AIContext): string[] {
  const suggestions: string[] = []
  const meta = context.metadata

  const highCount = (meta.highCount as number) ?? 0
  const topRisks = (meta.topRisks as string[]) ?? []

  if (highCount > 0) {
    suggestions.push(`通知团队关注 ${highCount} 项高危风险，确保及时处理`)
  } else {
    suggestions.push('当前无高危风险，建议定期检查中危风险的演变趋势')
  }

  if (topRisks.length > 0) {
    suggestions.push('为高危风险指定负责人并制定缓解计划')
  } else {
    suggestions.push('检查是否有新的潜在风险需要识别')
  }

  suggestions.push('审查现有风险的缓解措施执行情况')

  return suggestions.slice(0, 3)
}

// ─── Dashboard Context ──────────────────────────────────────

function buildDashboardSummary(
  issues: PlatformIssue[] | undefined,
  sprint: SprintSummary | null | undefined,
  metadata: Record<string, unknown>
): string {
  const allIssues = issues ?? []
  const total = allIssues.length
  const doneCount = allIssues.filter((i) => i.status === 'done').length
  const overallRate = total > 0 ? Math.round((doneCount / total) * 100) : 0

  metadata.totalIssues = total
  metadata.doneCount = doneCount
  metadata.overallCompletionRate = overallRate
  metadata.activeSprint = sprint?.name ?? null

  return `项目概览: 共 ${total} 项任务, 已完成 ${doneCount} 项 (${overallRate}%)${sprint ? `, 当前 Sprint: ${sprint.name}` : ''}`
}

function generateDashboardSuggestions(context: AIContext): string[] {
  const meta = context.metadata
  const overallRate = (meta.overallCompletionRate as number) ?? 0

  const suggestions: string[] = []

  if (overallRate < 50) {
    suggestions.push('项目整体完成率偏低，建议检查阻塞因素')
  } else {
    suggestions.push('查看本周团队的工作负载分布情况')
  }

  suggestions.push('检查即将到期的里程碑和关键交付物')
  suggestions.push('查看最新的风险预警和通知')

  return suggestions.slice(0, 3)
}

// ─── Reports Context ────────────────────────────────────────

function buildReportsSummary(
  metadata: Record<string, unknown>
): string {
  metadata.reportTypes = ['daily', 'weekly', 'sprint_review']
  return '报告中心: 支持日报、周报、Sprint 回顾报告的生成与推送'
}

function generateReportsSuggestions(): string[] {
  return [
    '生成本周的项目周报并推送至企业微信',
    '查看最近的 Sprint 回顾报告和改进建议',
    '对比最近两个 Sprint 的关键指标变化',
  ]
}

// ─── Roadmap Context ────────────────────────────────────────

function buildRoadmapSummary(
  metadata: Record<string, unknown>
): string {
  metadata.viewType = 'timeline'
  return '路线图: 查看项目里程碑和关键节点的时间规划'
}

function generateRoadmapSuggestions(): string[] {
  return [
    '检查即将到期的里程碑是否存在延期风险',
    '审查里程碑之间的依赖关系是否合理',
    '更新路线图以反映最新的项目计划变更',
  ]
}
