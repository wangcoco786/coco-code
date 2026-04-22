import type {
  JiraBoard,
  JiraIssue,
  JiraPaginatedResponse,
  JiraSearchResponse,
  JiraSprint,
  JiraVersion,
} from '@/types/jira'
import type { IssuePriority, IssueStatus } from '@/types/platform'

// ============================================================
// Jira API 错误类
// ============================================================
export class JiraApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'JiraApiError'
  }
}

// ============================================================
// 基础请求函数（通过 Vercel Serverless 代理）
// Jira 6.x + Agile 插件：
//   - 标准 API：/rest/api/2/...
//   - Agile API：/rest/agile/1.0/...（Sprint、Board）
// ============================================================
async function jiraFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // 所有请求通过 /api/jira/... 代理转发
  // path 已包含 rest/api/2 或 rest/agile/1.0 前缀
  const url = `/api/jira/${path.replace(/^\//, '')}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let errorMessage = `Jira API error: ${response.status}`
    try {
      const errorBody = await response.json()
      if (Array.isArray(errorBody.errorMessages) && errorBody.errorMessages.length) {
        errorMessage = errorBody.errorMessages.join(', ')
      } else if (errorBody.error) {
        errorMessage = errorBody.error
      } else if (errorBody.message) {
        errorMessage = errorBody.message
      }
    } catch {
      // 忽略 JSON 解析错误
    }
    throw new JiraApiError(response.status, errorMessage)
  }

  return response.json() as Promise<T>
}

// ============================================================
// Jira API 客户端
// 注意：Jira 6.x Agile 插件 Board/Sprint 接口路径为 /rest/agile/1.0/
// ============================================================
export const jiraClient = {
  // 获取所有 Board（Agile 插件接口，支持分页）
  async getBoards(): Promise<JiraPaginatedResponse<JiraBoard>> {
    // 先获取第一页，再判断是否需要继续
    const first = await jiraFetch<JiraPaginatedResponse<JiraBoard>>(
      'rest/agile/1.0/board?maxResults=50&startAt=0'
    )
    // 如果总数超过 50，继续拉取
    if (!first.isLast && first.values.length < first.total) {
      const second = await jiraFetch<JiraPaginatedResponse<JiraBoard>>(
        `rest/agile/1.0/board?maxResults=50&startAt=50`
      )
      return {
        ...first,
        values: [...first.values, ...second.values],
        isLast: second.isLast,
      }
    }
    return first
  },

  // 获取指定 Board 的 Sprint 列表（Agile 插件接口）
  getSprints(
    boardId: number,
    state?: 'active' | 'closed' | 'future'
  ): Promise<JiraPaginatedResponse<JiraSprint>> {
    const stateParam = state ? `&state=${state}` : ''
    return jiraFetch<JiraPaginatedResponse<JiraSprint>>(
      `rest/agile/1.0/board/${boardId}/sprint?maxResults=50${stateParam}`
    )
  },

  // 获取项目的活跃 Sprint Issue（支持自定义 JQL）
  async getActiveSprintIssues(projectKey: string, customJql?: string): Promise<JiraSearchResponse> {
    const jql = customJql ?? `project = ${projectKey} AND sprint in openSprints() ORDER BY priority ASC, updated DESC`
    const fields = [
      'summary', 'status', 'priority', 'assignee',
      'labels', 'fixVersions', 'created', 'updated',
      'timeoriginalestimate', 'timespent',
      'customfield_10016', 'customfield_10004',
    ].join(',')
    return jiraFetch<JiraSearchResponse>(
      `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=200`
    )
  },

  // 获取项目的活跃 Sprint 信息（通过 JQL 查 sprint 字段）
  // 获取项目所有活跃 Sprint（Jira 6.x 从 customfield_10005 解析，支持多个并行 Sprint）
  async getActiveSprints(projectKey: string): Promise<JiraSprint[]> {
    try {
      const sprintMap = new Map<number, JiraSprint>()
      let startAt = 0
      const pageSize = 200
      let total = Infinity

      // 分页查询所有活跃 Sprint 的 Issue
      while (startAt < total) {
        const result = await jiraFetch<JiraSearchResponse>(
          `rest/api/2/search?jql=${encodeURIComponent(`project = ${projectKey} AND sprint in openSprints()`)}&maxResults=${pageSize}&startAt=${startAt}&fields=customfield_10005`
        )
        if (!result.issues?.length) break
        total = result.total

        for (const issue of result.issues) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = (issue.fields as any).customfield_10005

          // customfield_10005 可能是：字符串、字符串数组、或包含多个Sprint的长字符串
          const rawStrings: string[] = Array.isArray(raw)
            ? raw.filter((s: unknown) => typeof s === 'string')
            : typeof raw === 'string' ? [raw] : []

          for (const sprintStr of rawStrings) {
            // 一个字符串里可能包含多个 Sprint（用空格分隔）
            // 格式: "Sprint@xxx[...] Sprint@yyy[...]"
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
              if (state !== 'active') continue

              const id = parseInt(parseField('id'), 10)
              if (!id || sprintMap.has(id)) continue

              const name = parseField('name')
              const startDate = parseField('startDate').slice(0, 10)
              const endDate = parseField('endDate').slice(0, 10)
              const rapidViewId = parseInt(parseField('rapidViewId'), 10)

              if (name) {
                sprintMap.set(id, { id, name, state: 'active', startDate, endDate, originBoardId: rapidViewId })
              }
            }
          }
        }

        startAt += pageSize
      }

      return Array.from(sprintMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    } catch {
      return []
    }
  },

  // 兼容旧接口：返回第一个活跃 Sprint
  async getActiveSprint(projectKey: string): Promise<JiraSprint | null> {
    const sprints = await jiraClient.getActiveSprints(projectKey)
    return sprints[0] ?? null
  },

  // 获取 Backlog Issue（标准 JQL 搜索接口）
  getBacklogIssues(
    boardId: number,
    filters?: {
      status?: IssueStatus
      priority?: IssuePriority
      label?: string
      keyword?: string
    },
    startAt = 0,
    maxResults = 100
  ): Promise<JiraSearchResponse> {
    // Jira 6.x：用 JQL 查询 Backlog（sprint is EMPTY 或 sprint not in openSprints()）
    const conditions: string[] = [
      `project in projectsFromBoard(${boardId})`,
      'sprint is EMPTY',
    ]

    if (filters?.status) {
      const statusMap: Record<string, string> = {
        todo: '"To Do"',
        in_progress: '"In Progress"',
        in_review: '"In Review"',
        in_testing: '"In Testing"',
        done: '"Done"',
      }
      conditions.push(`status = ${statusMap[filters.status] ?? `"${filters.status}"`}`)
    }

    if (filters?.priority) {
      const priorityMap: Record<string, string> = {
        P0: 'Highest',
        P1: 'High',
        P2: 'Medium',
        P3: 'Low',
      }
      conditions.push(`priority = "${priorityMap[filters.priority] ?? filters.priority}"`)
    }

    if (filters?.label) {
      conditions.push(`labels = "${filters.label}"`)
    }

    if (filters?.keyword) {
      conditions.push(`summary ~ "${filters.keyword}"`)
    }

    const jql = encodeURIComponent(
      conditions.join(' AND ') + ' ORDER BY priority ASC, created DESC'
    )
    const fields = [
      'summary', 'status', 'priority', 'assignee',
      'labels', 'fixVersions', 'created', 'updated',
      'timeoriginalestimate', 'timespent',
      'customfield_10016', 'customfield_10004',
    ].join(',')

    return jiraFetch<JiraSearchResponse>(
      `rest/api/2/search?jql=${jql}&fields=${fields}&startAt=${startAt}&maxResults=${maxResults}`
    )
  },

  // 获取项目版本（里程碑）
  getVersions(projectKey: string): Promise<JiraVersion[]> {
    return jiraFetch<JiraVersion[]>(
      `rest/api/2/project/${projectKey}/versions`
    )
  },

  // 获取单个 Issue
  getIssue(issueKey: string): Promise<JiraIssue> {
    return jiraFetch<JiraIssue>(`rest/api/2/issue/${issueKey}`)
  },

  // 获取当前登录用户信息（用于测试连接）
  async testConnection(): Promise<boolean> {
    try {
      // Jira 6.x 用 /rest/auth/1/session 或 /rest/api/2/myself
      await jiraFetch<{ name: string }>('rest/api/2/myself')
      return true
    } catch {
      return false
    }
  },

  // 获取项目列表（用于 Board 选择器备用方案）
  getProjects(): Promise<Array<{ id: string; key: string; name: string }>> {
    return jiraFetch<Array<{ id: string; key: string; name: string }>>(
      'rest/api/2/project?maxResults=50'
    )
  },

  // 通过 JQL 直接搜索 Issue（通用方法）
  searchIssues(
    jql: string,
    fields: string[],
    startAt = 0,
    maxResults = 100
  ): Promise<JiraSearchResponse> {
    const encodedJql = encodeURIComponent(jql)
    const fieldsStr = fields.join(',')
    return jiraFetch<JiraSearchResponse>(
      `rest/api/2/search?jql=${encodedJql}&fields=${fieldsStr}&startAt=${startAt}&maxResults=${maxResults}`
    )
  },
}
