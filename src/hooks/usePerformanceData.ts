import { useQuery } from '@tanstack/react-query'
import { authFetch } from '@/lib/authFetch'
import { mapJiraStatus, mapJiraPriority, formatDisplayName } from '@/lib/statusMapper'
import { calculateDepartmentPerformance } from '@/lib/performanceEngine'
import type { PerformanceIssue, StatusTransition, IssueComment, DepartmentPerformance } from '@/lib/performanceEngine'
import type { JiraSprint } from '@/types/jira'
import { useActiveSprintByProject } from '@/hooks/useProjectIssues'
import { useJiraProjects } from '@/hooks/useJiraBoard'

// ============================================================
// Jira 扩展字段列表（绩效计算所需）
// ============================================================
const PERFORMANCE_FIELDS = [
  'summary', 'status', 'priority', 'assignee',
  'labels', 'created', 'updated', 'project',
  'subtasks',       // 子任务列表
  'issuelinks',    // 关联 issue
  'comment',       // 评论
]

// ============================================================
// Jira 原始数据 → PerformanceIssue 转换
// ============================================================

/**
 * 从 Jira changelog 中解析状态变更历史。
 * changelog 格式：{ histories: [{ created, items: [{ field, fromString, toString }] }] }
 */
function parseStatusTransitions(changelog: unknown): StatusTransition[] {
  if (!changelog || typeof changelog !== 'object') return []
  const histories = (changelog as { histories?: unknown[] }).histories
  if (!Array.isArray(histories)) return []

  const transitions: StatusTransition[] = []
  for (const history of histories) {
    if (!history || typeof history !== 'object') continue
    const { created, items } = history as { created?: string; items?: unknown[] }
    if (!created || !Array.isArray(items)) continue

    for (const item of items) {
      if (!item || typeof item !== 'object') continue
      const { field, fromString, toString } = item as { field?: string; fromString?: string; toString?: string }
      if (field === 'status' && fromString && toString) {
        transitions.push({
          from: fromString,
          to: toString,
          timestamp: created,
        })
      }
    }
  }

  return transitions
}

/**
 * 从 Jira changelog 中计算跨 Sprint 次数。
 * Sprint 变更在 changelog 中表现为 field === 'Sprint' 的变更记录。
 */
function parseSprintChanges(changelog: unknown): number {
  if (!changelog || typeof changelog !== 'object') return 0
  const histories = (changelog as { histories?: unknown[] }).histories
  if (!Array.isArray(histories)) return 0

  let changes = 0
  for (const history of histories) {
    if (!history || typeof history !== 'object') continue
    const { items } = history as { items?: unknown[] }
    if (!Array.isArray(items)) continue

    for (const item of items) {
      if (!item || typeof item !== 'object') continue
      const { field } = item as { field?: string }
      if (field === 'Sprint') {
        changes++
      }
    }
  }

  return changes
}

/**
 * 判断 issue 是否被 reopen 过（从 changelog 中检测状态回退）。
 */
function parseIsReopened(changelog: unknown): boolean {
  if (!changelog || typeof changelog !== 'object') return false
  const histories = (changelog as { histories?: unknown[] }).histories
  if (!Array.isArray(histories)) return false

  for (const history of histories) {
    if (!history || typeof history !== 'object') continue
    const { items } = history as { items?: unknown[] }
    if (!Array.isArray(items)) continue

    for (const item of items) {
      if (!item || typeof item !== 'object') continue
      const { field, fromString, toString } = item as { field?: string; fromString?: string; toString?: string }
      if (field === 'status') {
        const fromNorm = (fromString ?? '').toLowerCase()
        const toNorm = (toString ?? '').toLowerCase()
        // 从 Done/Closed/Resolved 回退到其他状态视为 reopen
        const doneStatuses = ['done', 'closed', 'resolved', 'completed', 'released']
        if (doneStatuses.includes(fromNorm) && !doneStatuses.includes(toNorm)) {
          return true
        }
        // 或者目标状态为 Reopened
        if (toNorm === 'reopened') {
          return true
        }
      }
    }
  }

  return false
}

/**
 * 从 Jira comment 字段解析评论列表。
 * comment 格式：{ comments: [{ author: { accountId, displayName }, created }] }
 */
function parseComments(commentField: unknown): IssueComment[] {
  if (!commentField || typeof commentField !== 'object') return []
  const comments = (commentField as { comments?: unknown[] }).comments
  if (!Array.isArray(comments)) return []

  return comments.map(c => {
    if (!c || typeof c !== 'object') return null
    const { author, created } = c as { author?: unknown; created?: string }
    if (!author || typeof author !== 'object' || !created) return null
    const { accountId, key, name, displayName } = author as {
      accountId?: string; key?: string; name?: string; displayName?: string
    }
    const authorId = accountId || key || name || displayName || 'unknown'
    return {
      authorId,
      authorName: displayName || name || 'Unknown',
      createdAt: created,
    }
  }).filter((c): c is IssueComment => c !== null)
}

/**
 * 计算关联的 Bug 类型 issue 数量。
 * issuelinks 格式：[{ type: { name }, outwardIssue/inwardIssue: { fields: { issuetype: { name } } } }]
 */
function parseLinkedBugCount(issuelinks: unknown): number {
  if (!Array.isArray(issuelinks)) return 0

  let bugCount = 0
  for (const link of issuelinks) {
    if (!link || typeof link !== 'object') continue
    // 检查 outwardIssue 和 inwardIssue
    for (const direction of ['outwardIssue', 'inwardIssue'] as const) {
      const linkedIssue = (link as Record<string, unknown>)[direction]
      if (!linkedIssue || typeof linkedIssue !== 'object') continue
      const fields = (linkedIssue as { fields?: unknown }).fields
      if (!fields || typeof fields !== 'object') continue
      const issuetype = (fields as { issuetype?: unknown }).issuetype
      if (!issuetype || typeof issuetype !== 'object') continue
      const typeName = (issuetype as { name?: string }).name ?? ''
      if (typeName.toLowerCase() === 'bug') {
        bugCount++
      }
    }
  }

  return bugCount
}

/**
 * 将 Jira 原始 issue 数据转换为 PerformanceIssue 格式。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformToPerformanceIssue(issue: any): PerformanceIssue {
  const fields = issue.fields ?? {}

  // 基础 PlatformIssue 字段
  const status = mapJiraStatus(fields.status?.name ?? 'To Do')
  const priority = mapJiraPriority(fields.priority?.name ?? 'Medium')
  const storyPoints = fields.customfield_10016 ?? 0
  const estimatedHours = fields.timeoriginalestimate != null ? fields.timeoriginalestimate / 3600 : null
  const spentHours = fields.timespent != null ? fields.timespent / 3600 : null
  const labels: string[] = fields.labels ?? []
  const isBaseline = labels.some((l: string) => l.toLowerCase() === 'baseline')

  const assignee = fields.assignee
    ? {
        id: fields.assignee.accountId || fields.assignee.key || fields.assignee.name || fields.assignee.emailAddress || fields.assignee.displayName || 'unknown',
        name: formatDisplayName(fields.assignee.displayName ?? ''),
        avatarUrl: fields.assignee.avatarUrls?.['48x48'] ?? '',
      }
    : null

  // 扩展字段
  const subtasks: unknown[] = fields.subtasks ?? []
  const issuelinks: unknown[] = fields.issuelinks ?? []
  const changelog = issue.changelog ?? null
  const commentField = fields.comment ?? null

  const statusTransitions = parseStatusTransitions(changelog)
  const sprintChanges = parseSprintChanges(changelog)
  const isReopened = parseIsReopened(changelog)
  const comments = parseComments(commentField)
  const linkedBugCount = parseLinkedBugCount(issuelinks)

  return {
    // PlatformIssue fields
    id: issue.key ?? '',
    jiraId: issue.id ?? '',
    title: fields.summary ?? '',
    status,
    priority,
    assignee,
    storyPoints,
    labels,
    isBaseline,
    createdAt: fields.created ?? new Date().toISOString(),
    updatedAt: fields.updated ?? new Date().toISOString(),
    estimatedHours,
    spentHours,
    // PerformanceIssue extended fields
    subtaskCount: subtasks.length,
    linkedIssueCount: issuelinks.length,
    commentCount: comments.length,
    sprintChanges,
    isReopened,
    linkedBugCount,
    statusTransitions,
    comments,
    projectKey: (issue.key ?? '').split('-')[0] || 'UNKNOWN',
    projectName: fields.project?.name ?? (issue.key ?? '').split('-')[0] ?? 'Unknown',
  }
}

// ============================================================
// usePerformanceData Hook
// ============================================================

export interface UsePerformanceDataResult {
  data: DepartmentPerformance | null
  /** 按项目（部门）分组的绩效数据 */
  departments: { projectKey: string; projectName: string; performance: DepartmentPerformance }[]
  isLoading: boolean
  error: Error | null
  sprint: JiraSprint | null
}

/**
 * 获取绩效数据的 Hook。
 *
 * 1. 获取当前活跃 Sprint 信息
 * 2. 查询 Sprint Issues（含扩展字段：subtasks、issuelinks、comment、changelog）
 * 3. 将 Jira 原始数据转换为 PerformanceIssue[] 格式
 * 4. 调用 calculateDepartmentPerformance 返回计算结果
 *
 * @param projectKey - 项目 Key（如 "DTS"）
 */
export function usePerformanceData(projectKey: string | null): UsePerformanceDataResult {
  // 获取所有项目列表（用于全局模式）
  const { data: allProjects } = useJiraProjects()

  // 获取活跃 Sprint
  const { data: sprint, isLoading: isSprintLoading } = useActiveSprintByProject(projectKey)

  // 构建全局模式的项目 key 列表
  const allProjectKeys = allProjects?.map(p => p.key) ?? []

  // 获取含扩展字段的 Sprint Issues
  const {
    data: performanceData,
    isLoading: isIssuesLoading,
    error: issuesError,
  } = useQuery({
    queryKey: ['performance-issues', projectKey ?? 'all', sprint?.id, allProjectKeys.join(',')],
    queryFn: async () => {
      let jql: string
      if (projectKey) {
        jql = sprint?.id
          ? `project = ${projectKey} AND sprint = ${sprint.id} ORDER BY priority ASC, updated DESC`
          : `project = ${projectKey} AND sprint in openSprints() ORDER BY priority ASC, updated DESC`
      } else {
        // 全局模式：用所有项目 key 查询
        if (allProjectKeys.length === 0) {
          return { issues: [] }
        }
        const projectFilter = allProjectKeys.map(k => `project = ${k}`).join(' OR ')
        jql = `(${projectFilter}) AND sprint in openSprints() ORDER BY priority ASC, updated DESC`
      }

      const fieldsStr = PERFORMANCE_FIELDS.join(',')
      const url = `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=${fieldsStr}&expand=changelog&maxResults=200`

      const response = await authFetch(`/api/jira/${url}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const status = response.status
        let message = `Jira API error: ${status}`
        try {
          const body = await response.json()
          if (body.errorMessages?.length) message = body.errorMessages.join(', ')
          else if (body.message) message = body.message
        } catch { /* ignore */ }
        const err = new Error(message)
        ;(err as unknown as { status: number }).status = status
        throw err
      }

      const data = await response.json()
      return data
    },
    enabled: !!projectKey || allProjectKeys.length > 0,
    staleTime: 5 * 60 * 1000, // 5 分钟
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        'status' in error &&
        ((error as { status: number }).status === 401 ||
          (error as { status: number }).status === 403)
      ) return false
      return failureCount < 3
    },
    select: (data) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const issues: any[] = data?.issues ?? []
        const performanceIssues: PerformanceIssue[] = issues.map(transformToPerformanceIssue)

        // 确定 Sprint 日期范围
        const sprintDates = {
          startDate: sprint?.startDate ?? new Date().toISOString(),
          endDate: sprint?.endDate ?? new Date().toISOString(),
        }

        if (performanceIssues.length === 0) {
          return { overall: null, departments: [] }
        }

        // 整体绩效
        const overall = calculateDepartmentPerformance(performanceIssues, sprintDates)

        // 按项目（部门）分组计算绩效
        const projectGroups = new Map<string, { name: string; issues: PerformanceIssue[] }>()
        for (const issue of performanceIssues) {
          const key = issue.projectKey
          if (!projectGroups.has(key)) {
            projectGroups.set(key, { name: issue.projectName, issues: [] })
          }
          projectGroups.get(key)!.issues.push(issue)
        }

        const departments = Array.from(projectGroups.entries()).map(([projectKey, group]) => ({
          projectKey,
          projectName: group.name,
          performance: calculateDepartmentPerformance(group.issues, sprintDates),
        }))

        // 按平均绩效分降序排列
        departments.sort((a, b) => b.performance.averageScore - a.performance.averageScore)

        return { overall, departments }
      } catch (e) {
        console.error('[PerformanceEngine] select error:', e)
        return { overall: null, departments: [] }
      }
    },
  })

  return {
    data: performanceData?.overall ?? null,
    departments: performanceData?.departments ?? [],
    isLoading: isSprintLoading || isIssuesLoading,
    error: issuesError as Error | null,
    sprint: sprint ?? null,
  }
}
