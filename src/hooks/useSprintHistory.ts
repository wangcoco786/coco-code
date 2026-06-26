import { useQuery } from '@tanstack/react-query'
import { authFetch } from '@/lib/authFetch'
import { resolveProjectKeys } from '@/lib/projectGroups'
import { calculateDepartmentPerformance } from '@/lib/performanceEngine'
import type { DepartmentPerformance } from '@/lib/performanceEngine'
import type { JiraSprint } from '@/types/jira'

// ============================================================
// 获取项目的已关闭 Sprint 列表（最近 N 个）
// ============================================================

interface SprintHistoryItem {
  sprint: JiraSprint
  performance: DepartmentPerformance | null
}

export interface UseSprintHistoryResult {
  /** 所有 Sprint（active + closed），按时间倒序 */
  sprints: JiraSprint[]
  /** 最近 N 个 Sprint 的绩效数据 */
  history: SprintHistoryItem[]
  isLoading: boolean
  error: Error | null
}

/**
 * 获取项目的 Sprint 历史列表（closed + active）。
 * 从 Jira 的 customfield_10005 中解析 Sprint 信息。
 */
export function useSprintHistory(projectKey: string | null, maxSprints = 10) {
  const { data: sprintList, isLoading: isSprintsLoading, error: sprintsError } = useQuery<JiraSprint[]>({
    queryKey: ['sprint-history-list', projectKey, maxSprints],
    queryFn: async () => {
      if (!projectKey) throw new Error('Project key is required')

      const resolvedKeys = resolveProjectKeys(projectKey)
      const projectClause = resolvedKeys.length === 1
        ? `project = ${resolvedKeys[0]}`
        : `project IN (${resolvedKeys.join(', ')})`

      // 搜索最近更新的 issues 来解析所有 Sprint（active + closed）
      const jql = `${projectClause} AND sprint is not EMPTY ORDER BY updated DESC`
      const url = `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=customfield_10005&maxResults=200`

      const response = await authFetch(`/api/jira/${url}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) throw new Error(`Failed to fetch sprints: ${response.status}`)

      const data = await response.json()
      const sprintMap = new Map<number, JiraSprint>()

      for (const issue of data?.issues ?? []) {
        const raw = issue?.fields?.customfield_10005
        const rawStrings: string[] = Array.isArray(raw)
          ? raw.filter((s: unknown) => typeof s === 'string')
          : typeof raw === 'string' ? [raw] : []

        for (const sprintStr of rawStrings) {
          const sprintParts = sprintStr.split(/(?=com\.atlassian\.greenhopper)/).filter(Boolean)

          for (const part of sprintParts) {
            const parseField = (key: string): string => {
              const prefix = `${key}=`
              const start = part.indexOf(prefix)
              if (start === -1) return ''
              const valueStart = start + prefix.length
              const commaIdx = part.indexOf(',', valueStart)
              const bracketIdx = part.indexOf(']', valueStart)
              const end = commaIdx === -1 ? bracketIdx : bracketIdx === -1 ? commaIdx : Math.min(commaIdx, bracketIdx)
              return end === -1 ? part.slice(valueStart) : part.slice(valueStart, end)
            }

            const state = parseField('state').toLowerCase()
            if (state !== 'active' && state !== 'closed') continue

            const id = parseInt(parseField('id'), 10)
            if (!id || sprintMap.has(id)) continue

            const name = parseField('name')
            const startDate = parseField('startDate').slice(0, 10)
            const endDate = parseField('endDate').slice(0, 10)
            const completeDate = parseField('completeDate').slice(0, 10)

            if (name) {
              sprintMap.set(id, {
                id,
                name,
                state: state as 'active' | 'closed',
                startDate,
                endDate,
                ...(completeDate ? { completeDate } : {}),
              } as JiraSprint)
            }
          }
        }
      }

      // 按 startDate 倒序排列，取最近 maxSprints 个
      const allSprints = Array.from(sprintMap.values())
        .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
        .slice(0, maxSprints)

      return allSprints
    },
    enabled: !!projectKey,
    staleTime: 10 * 60 * 1000,
  })

  return {
    sprints: sprintList ?? [],
    isLoading: isSprintsLoading,
    error: sprintsError as Error | null,
  }
}

// ============================================================
// 获取指定 Sprint 的绩效数据
// ============================================================

const PERFORMANCE_FIELDS = [
  'summary', 'status', 'priority', 'assignee',
  'labels', 'created', 'updated', 'resolutiondate',
  'timeoriginalestimate', 'timespent',
  'customfield_10016', 'customfield_10004',
  'customfield_11000', 'customfield_11103',
  'issuelinks', 'comment', 'issuetype',
]

export function useSprintPerformance(projectKey: string | null, sprintName: string | null) {
  return useQuery<DepartmentPerformance | null>({
    queryKey: ['sprint-performance', projectKey, sprintName],
    queryFn: async () => {
      if (!projectKey || !sprintName) return null

      const resolvedKeys = resolveProjectKeys(projectKey)
      const projectClause = resolvedKeys.length === 1
        ? `project = ${resolvedKeys[0]}`
        : `project IN (${resolvedKeys.join(', ')})`

      const jql = `${projectClause} AND sprint = "${sprintName}" ORDER BY priority ASC, updated DESC`
      const fieldsStr = PERFORMANCE_FIELDS.join(',')
      const url = `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=${fieldsStr}&expand=changelog&maxResults=200`

      const response = await authFetch(`/api/jira/${url}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) return null

      const data = await response.json()
      const issues = data?.issues ?? []
      if (issues.length === 0) return null

      // 动态 import transformToPerformanceIssue（避免循环依赖，复用已有逻辑）
      const { transformToPerformanceIssue } = await import('@/hooks/usePerformanceData')
      const performanceIssues = issues.map(transformToPerformanceIssue)

      const sprintDates = {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      }

      const result = calculateDepartmentPerformance(performanceIssues, sprintDates)
      return result
    },
    enabled: !!projectKey && !!sprintName,
    staleTime: 15 * 60 * 1000, // 历史数据缓存更久
  })
}
