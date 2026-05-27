import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authFetch } from '@/lib/authFetch'
import { mapJiraStatus, mapJiraPriority, formatDisplayName } from '@/lib/statusMapper'
import { calculateDepartmentPerformance } from '@/lib/performanceEngine'
import { getExcludedUsers } from '@/lib/excludedUsers'
import type { PerformanceIssue, StatusTransition, IssueComment, DepartmentPerformance } from '@/lib/performanceEngine'
import type { JiraSprint } from '@/types/jira'
import { useActiveSprintByProject } from '@/hooks/useProjectIssues'

// ============================================================
// Jira 扩展字段列表（绩效计算所需）
// ============================================================
const PERFORMANCE_FIELDS = [
  'summary', 'status', 'priority', 'assignee', 'reporter',
  'labels', 'created', 'updated', 'project',
  'subtasks',       // 子任务列表
  'issuelinks',    // 关联 issue
  'comment',       // 评论
  'customfield_11102', // QA 字段
  'customfield_11000', // Developer(single) 字段
  'customfield_11103', // Developer (multi) 字段
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

  const assignee = (fields.assignee && fields.assignee.active !== false)
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
    reporter: fields.reporter
      ? {
          id: fields.reporter.accountId || fields.reporter.key || fields.reporter.name || fields.reporter.displayName || 'unknown',
          name: formatDisplayName(fields.reporter.displayName ?? ''),
        }
      : null,
    qaUser: (() => {
      // QA 字段: customfield_11102 — 返回的是用户数组
      const qa = fields.customfield_11102 ?? null
      if (!qa) return null
      // 可能是数组或单个对象
      const qaObj = Array.isArray(qa) ? qa[0] : qa
      if (!qaObj || typeof qaObj !== 'object') return null
      const q = qaObj as { accountId?: string; key?: string; name?: string; displayName?: string; active?: boolean }
      if (q.active === false) return null
      return {
        id: q.accountId || q.key || q.name || q.displayName || 'unknown',
        name: formatDisplayName(q.displayName ?? ''),
      }
    })(),
    developerUser: (() => {
      // Developer(single) 字段: customfield_11000
      const dev = fields.customfield_11000 ?? null
      if (dev && typeof dev === 'object') {
        const devObj = Array.isArray(dev) ? dev[0] : dev
        if (devObj && typeof devObj === 'object') {
          const d = devObj as { accountId?: string; key?: string; name?: string; displayName?: string; active?: boolean }
          if (d.active !== false) {
            return {
              id: d.accountId || d.key || d.name || d.displayName || 'unknown',
              name: formatDisplayName(d.displayName ?? ''),
            }
          }
        }
      }
      // Developer (multi) 字段: customfield_11103
      const devMulti = fields.customfield_11103 ?? null
      if (Array.isArray(devMulti) && devMulti.length > 0) {
        const d = devMulti[0] as { accountId?: string; key?: string; name?: string; displayName?: string; active?: boolean }
        if (d && typeof d === 'object' && d.active !== false) {
          return {
            id: d.accountId || d.key || d.name || d.displayName || 'unknown',
            name: formatDisplayName(d.displayName ?? ''),
          }
        }
      }
      return null
    })(),
  }
}

// ============================================================
// usePerformanceData Hook
// ============================================================

export interface UsePerformanceDataResult {
  data: DepartmentPerformance | null
  isLoading: boolean
  error: Error | null
  sprint: JiraSprint | null
}

/**
 * 获取单个项目的绩效数据。
 * @param projectKey - 项目 Key（如 "DTS"），必须非 null
 */
export function usePerformanceData(projectKey: string | null): UsePerformanceDataResult {
  // 获取活跃 Sprint（用于显示 Sprint 信息）
  const { data: sprint, isLoading: isSprintLoading } = useActiveSprintByProject(projectKey)

  // 大范围搜索：获取所有项目中 developer 字段非空的 ticket，收集 developer ID 集合
  const {
    data: knownDeveloperIdList,
    isLoading: isDevLoading,
  } = useQuery<string[]>({
    queryKey: ['known-developers', projectKey],
    queryFn: async () => {
      if (!projectKey) throw new Error('Project key is required')

      // 只搜索当前项目中 Developer 字段非空的 ticket（分页获取全部）
      const jql = `project = ${projectKey} AND ("Developer(single)" is not EMPTY OR "Developer" is not EMPTY)`
      const devIds = new Set<string>()
      let startAt = 0
      const pageSize = 200
      let total = Infinity

      while (startAt < total) {
        const url = `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=customfield_11000,customfield_11103&maxResults=${pageSize}&startAt=${startAt}`
        const response = await authFetch(`/api/jira/${url}`, {
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          console.warn('[PerformanceData] Developer search failed at startAt:', startAt, 'status:', response.status)
          break
        }

        const data = await response.json()
        total = data.total ?? 0

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const issue of (data?.issues ?? []) as any[]) {
          // customfield_11000: Developer(single) — 单用户
          const dev11000 = issue?.fields?.customfield_11000
          if (dev11000 && typeof dev11000 === 'object') {
            const d = (Array.isArray(dev11000) ? dev11000[0] : dev11000) as { accountId?: string; key?: string; name?: string; emailAddress?: string }
            if (d) {
              // 只收集精确 ID（不收集 displayName，避免误匹配）
              if (d.accountId) devIds.add(d.accountId)
              if (d.key) devIds.add(d.key)
              if (d.name) devIds.add(d.name)
              if (d.emailAddress) devIds.add(d.emailAddress)
            }
          }

          // customfield_11103: Developer (multi) — 多用户数组
          const dev11103 = issue?.fields?.customfield_11103
          if (Array.isArray(dev11103)) {
            for (const devUser of dev11103) {
              if (!devUser || typeof devUser !== 'object') continue
              const d = devUser as { accountId?: string; key?: string; name?: string; emailAddress?: string }
              // 只收集精确 ID（不收集 displayName，避免误匹配）
              if (d.accountId) devIds.add(d.accountId)
              if (d.key) devIds.add(d.key)
              if (d.name) devIds.add(d.name)
              if (d.emailAddress) devIds.add(d.emailAddress)
            }
          }
        }

        startAt += pageSize
        if (!data.issues?.length) break
      }

      const result = [...devIds]
      console.log('[PerformanceData] Known developer IDs (total tickets):', total, 'unique IDs:', result.length, 'sample:', result.slice(0, 10))
      return result
    },
    enabled: !!projectKey,
    staleTime: 10 * 60 * 1000, // 10 分钟缓存
  })

  // 获取所有活跃 Sprint 的 Issues（不限制单个 Sprint）
  const {
    data: rawIssuesData,
    isLoading: isIssuesLoading,
    error: issuesError,
  } = useQuery({
    queryKey: ['performance-issues', projectKey],
    queryFn: async () => {
      if (!projectKey) throw new Error('Project key is required')

      // 使用 openSprints() 获取所有活跃 Sprint 的 issues
      const jql = `project = ${projectKey} AND sprint in openSprints() ORDER BY priority ASC, updated DESC`

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
    enabled: !!projectKey,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        'status' in error &&
        ((error as { status: number }).status === 401 ||
          (error as { status: number }).status === 403)
      ) return false
      return failureCount < 3
    },
  })

  // 使用 useMemo 在所有数据就绪后计算绩效（确保 knownDeveloperIds 被正确使用）
  const performanceData = useMemo(() => {
    if (!rawIssuesData) return null
    // 等待 developer 数据加载完成
    if (!knownDeveloperIdList) return null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const issues: any[] = rawIssuesData?.issues ?? []
      const performanceIssues: PerformanceIssue[] = issues.map(transformToPerformanceIssue)

      const sprintDates = {
        startDate: sprint?.startDate ?? new Date().toISOString(),
        endDate: sprint?.endDate ?? new Date().toISOString(),
      }

      if (performanceIssues.length === 0) return null

      // 构建 developer ID Set（包含所有可能的 ID 格式）
      const knownDevIds = new Set(knownDeveloperIdList)

      // DEBUG: 对比 developer IDs 和 assignee IDs
      const assigneeIds = [...new Set(performanceIssues.map(i => i.assignee?.id).filter(Boolean))]
      const assigneeNames = [...new Set(performanceIssues.map(i => i.assignee?.name).filter(Boolean))]
      const intersection = assigneeIds.filter(id => knownDevIds.has(id!))
      const nameIntersection = assigneeNames.filter(name => knownDevIds.has(name!))
      console.log('[PerformanceData] DEBUG ALL assignee IDs:', assigneeIds)
      console.log('[PerformanceData] DEBUG ALL assignee names:', assigneeNames)
      console.log('[PerformanceData] DEBUG knownDevIds sample:', [...knownDevIds].slice(0, 20))
      console.log('[PerformanceData] DEBUG ID intersection:', intersection.length, intersection)
      console.log('[PerformanceData] DEBUG name intersection:', nameIntersection.length, nameIntersection)

      // 过滤掉已离职/排除的人员
      const excludedNames = getExcludedUsers()
      const filteredIssues = performanceIssues.filter(issue => {
        const assigneeName = issue.assignee?.name?.toLowerCase() ?? ''
        const devName = issue.developerUser?.name?.toLowerCase() ?? ''
        return !excludedNames.has(assigneeName) && !excludedNames.has(devName)
      })

      return calculateDepartmentPerformance(filteredIssues, sprintDates, undefined, knownDevIds)
    } catch (e) {
      console.error('[PerformanceEngine] calculation error:', e)
      return null
    }
  }, [rawIssuesData, sprint, knownDeveloperIdList])

  return {
    data: performanceData,
    isLoading: isSprintLoading || isDevLoading || isIssuesLoading,
    error: issuesError as Error | null,
    sprint: sprint ?? null,
  }
}
