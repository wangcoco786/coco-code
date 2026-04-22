// ============================================================
// Project Roadmap 类型定义
// ============================================================

// 里程碑状态
export type MilestoneStatus = 'planned' | 'in_progress' | 'completed' | 'delayed'

// 关键节点类型
export type NodeType = 'release' | 'review' | 'deadline' | 'custom'

// 路线图里程碑
export interface RoadmapMilestone {
  id: string                    // crypto.randomUUID()
  name: string
  startDate: string             // YYYY-MM-DD
  endDate: string               // YYYY-MM-DD
  description: string
  status: MilestoneStatus
  jiraVersionId?: string        // 关联 Jira Fix Version
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
}

// 关键节点（路线图专用，区别于 platform.ts 中的变更检测 KeyNode）
export interface KeyNode {
  id: string                    // crypto.randomUUID()
  name: string
  date: string                  // YYYY-MM-DD
  type: NodeType
  description: string
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
}

// 里程碑表单数据
export interface MilestoneFormData {
  name: string
  startDate: string             // YYYY-MM-DD
  endDate: string               // YYYY-MM-DD
  description: string
  status: MilestoneStatus
}

// 关键节点表单数据
export interface NodeFormData {
  name: string
  date: string                  // YYYY-MM-DD
  type: NodeType
  description: string
}

// 路线图模板
export interface RoadmapTemplate {
  id: string
  nameKey: string               // i18n key
  descriptionKey: string        // i18n key
  icon: string
  milestones: TemplateMilestone[]
  nodes: TemplateNode[]
}

// 模板里程碑（使用日期偏移量）
export interface TemplateMilestone {
  name: string
  startDayOffset: number        // 相对 baseDate 的天数偏移
  endDayOffset: number
  status: MilestoneStatus
}

// 模板关键节点（使用日期偏移量）
export interface TemplateNode {
  name: string
  dayOffset: number
  type: NodeType
}

// 时间线范围
export interface TimelineRange {
  startDate: Date               // 时间线起始日期（最早日期 - 1 月）
  endDate: Date                 // 时间线结束日期（最晚日期 + 1 月）
  totalDays: number             // 总天数
  months: MonthColumn[]         // 月份列数组
}

// 月份列
export interface MonthColumn {
  year: number
  month: number                 // 0-11
  label: string                 // "2025-01" 格式
  startDay: number              // 该月第一天在总天数中的偏移
  days: number                  // 该月天数
}
