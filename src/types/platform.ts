// ============================================================
// AI-PM 平台内部业务类型
// ============================================================

// Issue 状态（映射自 Jira status.name）
export type IssueStatus =
  | 'todo' // 待办
  | 'in_progress' // 进行中
  | 'in_review' // 评审中
  | 'in_testing' // 测试中
  | 'done' // 已完成

// Issue 优先级（映射自 Jira priority.name）
export type IssuePriority = 'P0' | 'P1' | 'P2' | 'P3'

// 平台内部 Issue（经过映射和计算的业务对象）
export interface PlatformIssue {
  id: string // Jira key, e.g. "DTS-1234"
  jiraId: string // Jira internal id
  title: string
  status: IssueStatus
  priority: IssuePriority
  assignee: {
    id: string
    name: string
    avatarUrl: string
  } | null
  storyPoints: number
  labels: string[]
  isBaseline: boolean // 是否为基线需求（通过 label 标记）
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
  estimatedHours: number | null // 预估工时（小时）
  spentHours: number | null // 实际工时（小时）
}

// Sprint 摘要
export interface SprintSummary {
  id: number
  name: string
  state: 'active' | 'closed' | 'future'
  startDate: string
  endDate: string
  totalIssues: number
  completedIssues: number
  completionRate: number // 0-100
  issues: PlatformIssue[]
}

// 风险等级
export type RiskLevel = 'high' | 'medium' | 'low'

// 风险类型
export type RiskType =
  | 'unassigned' // 未分配超时
  | 'overtime' // 超预估工时
  | 'scope_creep' // 范围蔓延
  | 'dependency_block' // 依赖阻塞

// 风险状态
export type RiskStatus = 'open' | 'notified' | 'resolved'

// 风险条目
export interface Risk {
  id: string
  level: RiskLevel
  type: RiskType
  description: string
  relatedIssueId?: string
  assignee?: string
  status: RiskStatus
  detectedAt: string // ISO 8601
}

// 变更请求
export interface ChangeRequest {
  id: string
  title: string
  description: string
  impactScope: string
  requestedBy: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

// 团队成员负载
export interface TeamMemberLoad {
  memberId: string
  memberName: string
  avatarUrl: string
  capacity: number // 容量（Story Points）
  allocated: number // 已分配 Story Points
  loadPercentage: number // 0-100+
  inProgressIssues: PlatformIssue[]
}

// 报告类型
export type ReportType = 'daily' | 'weekly' | 'sprint_review'

// 报告状态
export type ReportStatus = 'draft' | 'pushed'

// 报告条目
export interface Report {
  id: string
  type: ReportType
  title: string
  date: string // YYYY-MM-DD
  status: ReportStatus
  content: string // Markdown 格式
  pushedAt?: string // ISO 8601
}

// 用户角色
export type UserRole = 'PM' | 'DEV'

// 当前用户
export interface CurrentUser {
  id: string
  name: string
  role: UserRole
}

// 全局应用状态（AppContext）
export interface AppState {
  currentUser: CurrentUser | null
  currentBoardId: number | null  // 保留兼容性
  currentProjectKey: string | null
  notificationCount: number
}

// 通知条目
export interface NotificationItem {
  id: string
  type: 'danger' | 'warning' | 'info'
  message: string
  createdAt: string
  read: boolean
}

// 里程碑（来自 Jira Fix Version）
export interface Milestone {
  id: string
  name: string
  releaseDate?: string
  released: boolean
  description?: string
}

// 燃尽图数据点
export interface BurndownDataPoint {
  day: number // Sprint 第几天（1-based）
  date: string // YYYY-MM-DD
  ideal: number // 理想剩余任务数
  actual: number | null // 实际剩余任务数（null 表示未来）
}

// ─── Resource Tab Types ─────────────────────────────────────

/** Aggregated developer profile derived from PlatformIssue assignee data */
export interface DeveloperProfile {
  id: string                    // assignee.id
  name: string                  // assignee.name (formatted)
  avatarUrl: string | null      // assignee.avatarUrl or null
  skillTags: string[]           // deduplicated labels from assigned issues
  tasks: PlatformIssue[]        // all issues assigned to this developer in Sprint
}

/** Computed workload information for a developer */
export interface WorkloadInfo {
  totalStoryPoints: number      // sum of SP for non-done issues
  capacity: number              // default 10 SP
  loadPercentage: number        // (totalStoryPoints / capacity) * 100
  status: 'overloaded' | 'balanced' | 'underloaded'
  doneCount: number
  inProgressCount: number
  todoCount: number
}

/** Team-level summary statistics */
export interface TeamSummary {
  totalTasks: number
  assignedTasks: number
  unassignedTasks: number
  averageLoadPercentage: number
  overloadedCount: number
  balancedCount: number
  underloadedCount: number
}

// ─── Change Tab Types ───────────────────────────────────────

/** Types of requirement-level changes detected during a Sprint */
export type ChangeType =
  | 'priority_change'     // priority differs from what's expected at Sprint start
  | 'new_addition'        // issue created after Sprint start date
  | 'scope_change'        // labels or story points modified after Sprint start
  | 'status_regression'   // issue moved backward in workflow

/** A single detected change with metadata */
export interface DetectedChange {
  issue: PlatformIssue
  changeType: ChangeType
  description: string           // human-readable description of the change
  severity: 'high' | 'medium' | 'low'
  detectedAt: string            // ISO 8601 timestamp of when the change was detected
}

/** Scope creep metrics computed from Sprint data */
export interface ScopeCreepMetrics {
  baselineIssueCount: number    // issues present at Sprint start
  currentIssueCount: number     // current total issues
  addedIssueCount: number       // issues added after Sprint start
  addedStoryPoints: number      // total SP of added issues
  scopeIncreasePercentage: number // (added / baseline) * 100
  isCreeping: boolean           // true if scopeIncreasePercentage > 20%
}

/** Impact analysis of detected changes */
export interface ImpactAnalysis {
  totalChanges: number
  changesByType: Record<ChangeType, number>
  affectedStoryPoints: number
  baselineStoryPoints: number   // total SP at Sprint start
  impactPercentage: number      // (affected / baseline) * 100
  impactLevel: 'high' | 'medium' | 'low'  // >30% high, 10-30% medium, <10% low
}

/** Sort options for developer profile cards */
export type DeveloperSortKey = 'load' | 'taskCount' | 'name'
