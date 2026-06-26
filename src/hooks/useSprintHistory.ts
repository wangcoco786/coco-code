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
export function useSprintHistory(projectKey: string | null, maxSprints = 50) {
  const { data: sprintList, isLoading: isSprintsLoading, error: sprintsError } = useQuery<JiraSprint[]>({
    queryKey: ['sprint-history-list', projectKey, maxSprints],
    queryFn: async () => {
      if (!projectKey) throw new Error('Project key is required')

      const resolvedKeys = resolveProjectKeys(projectKey)
      const sprintMap = new Map<number, JiraSprint>()
      const MIN_DATE = '2026-03-14'

      // 方法1: 通过 Agile API 获取 Board 的 closed + active sprints（最可靠）
      for (const pk of resolvedKeys) {
        try {
          // 获取 active sprints
          const activeUrl = `rest/agile/1.0/board?projectKeyOrId=${pk}&maxResults=10`
          const boardRes = await authFetch(`/api/jira/${activeUrl}`, {
            headers: { 'Content-Type': 'application/json' },
          })
          if (boardRes.ok) {
            const boardData = await boardRes.json()
            const boards = boardData?.values ?? []
            for (const board of boards) {
              if (!board.id) continue
              // 获取 closed sprints
              try {
                const closedUrl = `rest/agile/1.0/board/${board.id}/sprint?state=closed&maxResults=50`
                const closedRes = await authFetch(`/api/jira/${closedUrl}`, {
                  headers: { 'Content-Type': 'application/json' },
                })
                if (closedRes.ok) {
                  const closedData = await closedRes.json()
                  for (const s of closedData?.values ?? []) {
                    if (!s.id || sprintMap.has(s.id)) continue
                    let startDate = (s.startDate ?? '').slice(0, 10)
                    // fallback from name
                    if (!startDate || startDate.length < 10) {
                      startDate = extractDateFromSprintName(s.name ?? '')
                    }
                    if (startDate >= MIN_DATE) {
                      sprintMap.set(s.id, { id: s.id, name: s.name, state: 'closed', startDate, endDate: (s.endDate ?? '').slice(0, 10) } as JiraSprint)
                    }
                  }
                }
              } catch { /* ignore */ }

              // 获取 active sprints
              try {
                const activeSpUrl = `rest/agile/1.0/board/${board.id}/sprint?state=active&maxResults=10`
                const activeRes = await authFetch(`/api/jira/${activeSpUrl}`, {
                  headers: { 'Content-Type': 'application/json' },
                })
                if (activeRes.ok) {
                  const activeData = await activeRes.json()
                  for (const s of activeData?.values ?? []) {
                    if (!s.id || sprintMap.has(s.id)) continue
                    let startDate = (s.startDate ?? '').slice(0, 10)
                    if (!startDate || startDate.length < 10) {
                      startDate = extractDateFromSprintName(s.name ?? '')
                    }
                    if (startDate >= MIN_DATE) {
                      sprintMap.set(s.id, { id: s.id, name: s.name, state: 'active', startDate, endDate: (s.endDate ?? '').slice(0, 10) } as JiraSprint)
                    }
                  }
                }
              } catch { /* ignore */ }
            }
          }
        } catch { /* ignore board fetch failure */ }
      }

      // 方法2: fallback — 从 issue 的 customfield_10005 补充（以防 Agile API 不可用）
      if (sprintMap.size < 5) {
        const projectClause = resolvedKeys.length === 1
          ? `project = ${resolvedKeys[0]}`
          : `project IN (${resolvedKeys.join(', ')})`
        const jql = `${projectClause} AND sprint is not EMPTY AND (updated >= "2026/03/01" OR created >= "2026/03/01") ORDER BY updated DESC`
        const url = `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=customfield_10005&maxResults=500`

        try {
          const response = await authFetch(`/api/jira/${url}`, {
            headers: { 'Content-Type': 'application/json' },
          })
          if (response.ok) {
            const data = await response.json()
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
                  let startDate = parseField('startDate').slice(0, 10)
                  if (!startDate || startDate.length < 10) {
                    startDate = extractDateFromSprintName(name)
                  }
                  if (name && startDate && startDate.length >= 10 && startDate >= MIN_DATE) {
                    sprintMap.set(id, { id, name, state: state as 'active' | 'closed', startDate } as JiraSprint)
                  }
                }
              }
            }
          }
        } catch { /* ignore */ }
      }

      // 按 startDate 倒序排列
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
  // 支持 | 分隔的多个 Sprint 名称（同一迭代的多个并行 Sprint）
  const sprintNames = sprintName?.split('|').filter(Boolean) ?? []

  return useQuery<DepartmentPerformance | null>({
    queryKey: ['sprint-performance', projectKey, sprintName],
    queryFn: async () => {
      if (!projectKey || sprintNames.length === 0) return null

      const resolvedKeys = resolveProjectKeys(projectKey)
      const projectClause = resolvedKeys.length === 1
        ? `project = ${resolvedKeys[0]}`
        : `project IN (${resolvedKeys.join(', ')})`

      // 多个 Sprint 用 IN 查询
      const sprintClause = sprintNames.length === 1
        ? `sprint = "${sprintNames[0]}"`
        : `sprint IN (${sprintNames.map(n => `"${n}"`).join(', ')})`

      const jql = `${projectClause} AND ${sprintClause} ORDER BY priority ASC, updated DESC`
      const fieldsStr = PERFORMANCE_FIELDS.join(',')
      const url = `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=${fieldsStr}&expand=changelog&maxResults=200`

      const response = await authFetch(`/api/jira/${url}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) return null

      const data = await response.json()
      const issues = data?.issues ?? []
      if (issues.length === 0) return null

      const { transformToPerformanceIssue } = await import('@/hooks/usePerformanceData')
      const performanceIssues = issues.map(transformToPerformanceIssue)

      const sprintDates = {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      }

      const result = calculateDepartmentPerformance(performanceIssues, sprintDates)
      return result
    },
    enabled: !!projectKey && sprintNames.length > 0,
    staleTime: 15 * 60 * 1000,
  })
}

// ============================================================
// Helper: 从 Sprint 名称中提取日期
// ============================================================

/** 从 Sprint 名称中提取开始日期，格式如 "RP.2026.03/30-04/10" → "2026-03-30" */
function extractDateFromSprintName(name: string): string {
  if (!name) return ''
  // 格式1: "RP.2026.03/30-04/10" — 含年份
  const yearMatch = name.match(/(\d{4})[./](\d{1,2})\/(\d{1,2})/)
  if (yearMatch) {
    const [, y, m, d] = yearMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // 格式2: "APS.03/30-04/10" or "TrfMS.03/30-04/10" — 无年份，假设 2026
  const noYearMatch = name.match(/[./](\d{1,2})\/(\d{1,2})-/)
  if (noYearMatch) {
    const [, m, d] = noYearMatch
    return `2026-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return ''
}
