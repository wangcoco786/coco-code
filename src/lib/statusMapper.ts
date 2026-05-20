import type { JiraIssue } from '@/types/jira'
import type { IssueStatus, IssuePriority, PlatformIssue } from '@/types/platform'

// ============================================================
// Jira status.name → 平台内部 IssueStatus
// ============================================================
export const STATUS_MAP: Record<string, IssueStatus> = {
  // 英文状态（Jira 默认）
  'To Do': 'todo',
  'Backlog': 'todo',
  'Open': 'todo',
  'Reopened': 'todo',
  'Selected for Development': 'todo',
  'In Progress': 'in_progress',
  'In Development': 'in_progress',
  'Development': 'in_progress',
  'In Review': 'in_review',
  'Code Review': 'in_review',
  'Peer Review': 'in_review',
  'Review': 'in_review',
  'In Testing': 'in_testing',
  'QA': 'in_testing',
  'Testing': 'in_testing',
  'UAT': 'in_testing',
  'Done': 'done',
  'Closed': 'done',
  'Resolved': 'done',
  'Released': 'done',
  'Completed': 'done',
  // 中文状态（部分 Jira 实例）
  '待办': 'todo',
  '待开始': 'todo',
  '进行中': 'in_progress',
  '开发中': 'in_progress',
  '评审中': 'in_review',
  '代码评审': 'in_review',
  '测试中': 'in_testing',
  '已完成': 'done',
  '已关闭': 'done',
  '已解决': 'done',
}

export function mapJiraStatus(jiraStatusName: string, statusCategory?: { key: string }): IssueStatus {
  // 1. 先尝试精确匹配
  const mapped = STATUS_MAP[jiraStatusName]
  if (mapped) return mapped

  // 2. 尝试不区分大小写匹配
  const lowerName = jiraStatusName.toLowerCase()
  for (const [key, value] of Object.entries(STATUS_MAP)) {
    if (key.toLowerCase() === lowerName) return value
  }

  // 3. 使用 Jira statusCategory 作为 fallback（更可靠）
  if (statusCategory?.key) {
    switch (statusCategory.key) {
      case 'new': return 'todo'
      case 'indeterminate': return 'in_progress'
      case 'done': return 'done'
    }
  }

  // 4. 模糊匹配关键词
  if (lowerName.includes('progress') || lowerName.includes('dev') || lowerName.includes('active') || lowerName.includes('doing')) return 'in_progress'
  if (lowerName.includes('review') || lowerName.includes('pr')) return 'in_review'
  if (lowerName.includes('test') || lowerName.includes('qa') || lowerName.includes('uat')) return 'in_testing'
  if (lowerName.includes('done') || lowerName.includes('close') || lowerName.includes('resolve') || lowerName.includes('complete') || lowerName.includes('release')) return 'done'

  return 'todo'
}

// ============================================================
// Jira priority.name → 平台内部 IssuePriority
// ============================================================
export const PRIORITY_MAP: Record<string, IssuePriority> = {
  Highest: 'P0',
  High: 'P1',
  Medium: 'P2',
  Low: 'P3',
  Lowest: 'P3',
  // 中文优先级
  '最高': 'P0',
  '高': 'P1',
  '中': 'P2',
  '低': 'P3',
  '最低': 'P3',
  // 数字优先级
  'P0': 'P0',
  'P1': 'P1',
  'P2': 'P2',
  'P3': 'P3',
}

export function mapJiraPriority(jiraPriorityName: string): IssuePriority {
  return PRIORITY_MAP[jiraPriorityName] ?? 'P2'
}

// ============================================================
// JiraIssue → PlatformIssue
// ============================================================
export function mapJiraIssueToPlatform(issue: JiraIssue): PlatformIssue {
  const { fields } = issue

  // Story Points：customfield_10016 是最常见的字段名
  const storyPoints = fields.customfield_10016 ?? 0

  // 工时转换：Jira 存储秒，转换为小时
  const estimatedHours =
    fields.timeoriginalestimate != null
      ? fields.timeoriginalestimate / 3600
      : null
  const spentHours =
    fields.timespent != null ? fields.timespent / 3600 : null

  // 基线标记：通过 label "baseline" 标识
  const isBaseline = fields.labels.some(
    (l) => l.toLowerCase() === 'baseline'
  )

  return {
    id: issue.key,
    jiraId: issue.id,
    title: fields.summary,
    status: mapJiraStatus(fields.status.name, fields.status.statusCategory),
    priority: mapJiraPriority(fields.priority.name),
    assignee: fields.assignee
      ? {
          id: fields.assignee.accountId || fields.assignee.key || fields.assignee.name || fields.assignee.emailAddress || fields.assignee.displayName,
          name: formatDisplayName(fields.assignee.displayName),
          avatarUrl: fields.assignee.avatarUrls['48x48'],
        }
      : null,
    storyPoints,
    labels: fields.labels,
    isBaseline,
    createdAt: fields.created,
    updatedAt: fields.updated,
    estimatedHours,
    spentHours,
  }
}

// ============================================================
// 工具函数：将邮件地址转为可读名字
// 如 "wenjian.li@item.com" → "Wenjian Li"
// ============================================================
export function formatDisplayName(name: string): string {
  if (!name) return name
  if (!name.includes('@')) return name
  return name
    .split('@')[0]
    .replace(/\./g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}
