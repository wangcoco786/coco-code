import { useQuery, useQueryClient } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { jiraClient } from '@/lib/jiraClient'
import { mapJiraIssueToPlatform } from '@/lib/statusMapper'
import { resolveProjectKeys, isProjectGroup } from '@/lib/projectGroups'
import type { IssuePriority, IssueStatus, PlatformIssue } from '@/types/platform'
import type { JiraSprint } from '@/types/jira'

// ============================================================
// 获取项目活跃 Sprint 的 Issue（支持指定 Sprint ID，支持项目组）
// ============================================================
export function useActiveSprintIssuesByProject(
  projectKey: string | null,
  sprintId?: number | null,
  sprintName?: string | null
) {
  return useQuery({
    queryKey: ['issues', 'active-sprint', projectKey, sprintId ?? sprintName ?? 'all'],
    queryFn: () => {
      const keys = resolveProjectKeys(projectKey)
      const projectClause = keys.length === 1
        ? `project = ${keys[0]}`
        : `project IN (${keys.join(', ')})`

      let jql: string
      if (sprintName && !isProjectGroup(projectKey)) {
        jql = `${projectClause} AND sprint = "${sprintName}" ORDER BY priority ASC, updated DESC`
      } else if (sprintId && !isProjectGroup(projectKey)) {
        jql = `${projectClause} AND sprint = ${sprintId} ORDER BY priority ASC, updated DESC`
      } else {
        jql = `${projectClause} AND sprint in openSprints() ORDER BY priority ASC, updated DESC`
      }
      return jiraClient.getActiveSprintIssues(keys[0], jql)
    },
    enabled: !!projectKey,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.issues.map(mapJiraIssueToPlatform) as PlatformIssue[],
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
}

// ============================================================
// 获取项目所有活跃 Sprint（支持多个并行 Sprint，支持项目组）
// ============================================================
export function useActiveSprintsByProject(projectKey: string | null) {
  return useQuery({
    queryKey: ['sprints', 'active', projectKey],
    queryFn: async () => {
      const keys = resolveProjectKeys(projectKey)
      // 对项目组，获取所有子项目的 sprint 合并
      const allSprints: JiraSprint[] = []
      for (const key of keys) {
        try {
          const sprints = await jiraClient.getActiveSprints(key)
          allSprints.push(...(sprints as JiraSprint[]))
        } catch { /* 忽略单个项目失败 */ }
      }
      return allSprints
    },
    enabled: !!projectKey,
    staleTime: 5 * 60 * 1000,
    select: (data) => data as JiraSprint[],
  })
}

// 兼容旧接口：返回第一个活跃 Sprint
export function useActiveSprintByProject(projectKey: string | null) {
  const { data: sprints, ...rest } = useActiveSprintsByProject(projectKey)
  return { data: sprints?.[0] ?? null, ...rest }
}

// ============================================================
// 获取项目所有 Issue（带筛选，用于需求管理页面）
// ============================================================
export function useProjectIssues(
  projectKey: string | null,
  filters?: {
    status?: IssueStatus
    priority?: IssuePriority
    label?: string
    keyword?: string
    daysBack?: number
  }
) {
  const daysBack = filters?.daysBack ?? 60

  return useQuery({
    queryKey: ['issues', 'project', projectKey, filters],
    queryFn: async () => {
      if (!projectKey) throw new Error('Project key is required')

      const resolvedKeys = resolveProjectKeys(projectKey)
      const projectClause = resolvedKeys.length === 1
        ? `project = ${resolvedKeys[0]}`
        : `project IN (${resolvedKeys.join(', ')})`

      const conditions: string[] = [
        projectClause,
        `updated >= -${daysBack}d`,
      ]

      if (filters?.status) {
        const statusMap: Record<string, string> = {
          todo: '"To Do","Open","Backlog","New"',
          in_progress: '"In Progress","In Development","In Dev"',
          in_review: '"In Review","Code Review","Review"',
          in_testing: '"In Testing","QA","Testing","UAT"',
          done: '"Done","Closed","Resolved","Released"',
        }
        conditions.push(`status in (${statusMap[filters.status] ?? `"${filters.status}"`})`)
      }

      if (filters?.priority) {
        const priorityMap: Record<string, string> = {
          P0: 'Highest', P1: 'High', P2: 'Medium', P3: 'Low',
        }
        conditions.push(`priority = "${priorityMap[filters.priority] ?? filters.priority}"`)
      }

      if (filters?.label) conditions.push(`labels = "${filters.label}"`)
      if (filters?.keyword) conditions.push(`summary ~ "${filters.keyword}"`)

      const jql = conditions.join(' AND ') + ' ORDER BY updated DESC'
      return jiraClient.searchIssues(
        jql,
        ['summary', 'status', 'priority', 'assignee', 'labels', 'fixVersions',
          'created', 'updated', 'timeoriginalestimate', 'timespent',
          'customfield_10016', 'customfield_10004'],
        0, 200
      )
    },
    enabled: !!projectKey,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    select: (data) => data.issues.map(mapJiraIssueToPlatform) as PlatformIssue[],
  })
}

// 刷新
export function useRefreshProjectIssues() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['issues'] })
    queryClient.invalidateQueries({ queryKey: ['sprint'] })
  }
}
