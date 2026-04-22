// ============================================================
// Jira Server REST API v2 响应类型
// ============================================================

export interface JiraSprint {
  id: number
  name: string
  state: 'active' | 'closed' | 'future'
  startDate: string // ISO 8601
  endDate: string // ISO 8601
  goal?: string
  originBoardId: number
}

export interface JiraUser {
  accountId: string
  name?: string          // Jira Server user key
  key?: string           // Jira Server user key (alternative)
  displayName: string
  emailAddress?: string
  avatarUrls: {
    '48x48': string
    '32x32': string
    '16x16': string
  }
  active: boolean
}

export interface JiraStatus {
  id: string
  name: string
  statusCategory: {
    id: number
    key: string
    name: string
  }
}

export interface JiraPriority {
  id: string
  name: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest'
  iconUrl: string
}

export interface JiraVersion {
  id: string
  name: string
  description?: string
  releaseDate?: string // YYYY-MM-DD
  released: boolean
  archived: boolean
}

export interface JiraIssueFields {
  summary: string
  status: JiraStatus
  priority: JiraPriority
  assignee: JiraUser | null
  reporter: JiraUser | null
  labels: string[]
  fixVersions: JiraVersion[]
  created: string // ISO 8601
  updated: string // ISO 8601
  // Story Points — 字段名因 Jira 实例而异，常见为 customfield_10016
  customfield_10016?: number | null
  // 工时（秒）
  timeoriginalestimate: number | null
  timespent: number | null
  // 描述
  description?: string | null
}

export interface JiraIssue {
  id: string
  key: string // e.g. "DTS-1234"
  self: string // API URL
  fields: JiraIssueFields
}

export interface JiraBoard {
  id: number
  name: string
  type: 'scrum' | 'kanban'
  self: string
  location: {
    projectId: number
    projectKey: string
    projectName: string
    displayName: string
    avatarURI: string
  }
}

// 分页响应（用于 Sprint、Board 等列表接口）
export interface JiraPaginatedResponse<T> {
  maxResults: number
  startAt: number
  total: number
  isLast: boolean
  values: T[]
}

// Issue 搜索响应（JQL 查询）
export interface JiraSearchResponse {
  total: number
  startAt: number
  maxResults: number
  issues: JiraIssue[]
}

// Jira API 错误响应
export interface JiraErrorResponse {
  errorMessages: string[]
  errors: Record<string, string>
}
