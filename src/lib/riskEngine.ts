import type { PlatformIssue, Risk, RiskLevel, TeamMemberLoad } from '@/types/platform'

// ============================================================
// 风险识别规则引擎
// ============================================================

const RISK_RULES = {
  UNASSIGNED_THRESHOLD_HOURS: 24, // 未分配超过 24 小时 → 高危
  OVERTIME_THRESHOLD_RATIO: 1.5, // 实际工时超出预估 50% → 中危
  SCOPE_CREEP_THRESHOLD: 0.1, // 蔓延率超过 10% → 中危
}

// 生成唯一风险 ID
function generateRiskId(type: string, issueId?: string): string {
  const base = issueId ? `${type}-${issueId}` : type
  return `risk-${base}-${Date.now()}`
}

// 计算两个时间点之间的小时差
function hoursSince(isoDateString: string): number {
  const created = new Date(isoDateString).getTime()
  const now = Date.now()
  return (now - created) / (1000 * 60 * 60)
}

// ============================================================
// 规则 1：未分配超时（高危）
// ============================================================
export function detectUnassignedRisk(issue: PlatformIssue): Risk | null {
  if (issue.assignee !== null) return null
  if (issue.status === 'done') return null

  const hours = hoursSince(issue.createdAt)
  if (hours < RISK_RULES.UNASSIGNED_THRESHOLD_HOURS) return null

  return {
    id: generateRiskId('unassigned', issue.id),
    level: 'high',
    type: 'unassigned',
    description: `${issue.id} ${issue.title} 未分配超 ${Math.floor(hours)}h`,
    relatedIssueId: issue.id,
    assignee: undefined,
    status: 'open',
    detectedAt: new Date().toISOString(),
  }
}

// ============================================================
// 规则 2：超预估工时（中危）
// ============================================================
export function detectOvertimeRisk(issue: PlatformIssue): Risk | null {
  if (
    issue.estimatedHours == null ||
    issue.spentHours == null ||
    issue.estimatedHours <= 0
  ) {
    return null
  }

  const ratio = issue.spentHours / issue.estimatedHours
  if (ratio < RISK_RULES.OVERTIME_THRESHOLD_RATIO) return null

  const overPercent = Math.round((ratio - 1) * 100)

  return {
    id: generateRiskId('overtime', issue.id),
    level: 'medium',
    type: 'overtime',
    description: `${issue.id} ${issue.title} 超预期工时 ${overPercent}%`,
    relatedIssueId: issue.id,
    assignee: issue.assignee?.name,
    status: 'open',
    detectedAt: new Date().toISOString(),
  }
}

// ============================================================
// 规则 3：Sprint 范围蔓延（中危）
// ============================================================
export function detectScopeCreepRisk(
  currentIssueCount: number,
  baselineIssueCount: number
): Risk | null {
  if (baselineIssueCount <= 0) return null

  const creepRate =
    (currentIssueCount - baselineIssueCount) / baselineIssueCount
  if (creepRate < RISK_RULES.SCOPE_CREEP_THRESHOLD) return null

  const creepPercent = Math.round(creepRate * 100)

  return {
    id: generateRiskId('scope_creep'),
    level: 'medium',
    type: 'scope_creep',
    description: `Sprint 范围蔓延率达 ${creepPercent}%（基线 ${baselineIssueCount} 个任务，当前 ${currentIssueCount} 个）`,
    status: 'open',
    detectedAt: new Date().toISOString(),
  }
}

// ============================================================
// 风险排序：high → medium → low
// ============================================================
const RISK_LEVEL_ORDER: Record<RiskLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function sortRisks(risks: Risk[]): Risk[] {
  return [...risks].sort(
    (a, b) => RISK_LEVEL_ORDER[a.level] - RISK_LEVEL_ORDER[b.level]
  )
}

// ============================================================
// 综合分析：对所有 Issue 运行所有规则
// ============================================================
export function analyzeRisks(
  issues: PlatformIssue[],
  baselineIssueCount?: number
): Risk[] {
  const risks: Risk[] = []

  for (const issue of issues) {
    const unassigned = detectUnassignedRisk(issue)
    if (unassigned) risks.push(unassigned)

    const overtime = detectOvertimeRisk(issue)
    if (overtime) risks.push(overtime)
  }

  // 蔓延率检测
  if (baselineIssueCount !== undefined) {
    const scopeCreep = detectScopeCreepRisk(issues.length, baselineIssueCount)
    if (scopeCreep) risks.push(scopeCreep)
  }

  return sortRisks(risks)
}

// ============================================================
// 团队成员负载计算
// ============================================================
export function calculateTeamLoad(
  issues: PlatformIssue[],
  memberCapacities: Record<string, { name: string; avatarUrl: string; capacity: number }>
): TeamMemberLoad[] {
  const memberMap = new Map<string, TeamMemberLoad>()

  // 初始化所有成员
  for (const [memberId, info] of Object.entries(memberCapacities)) {
    memberMap.set(memberId, {
      memberId,
      memberName: info.name,
      avatarUrl: info.avatarUrl,
      capacity: info.capacity,
      allocated: 0,
      loadPercentage: 0,
      inProgressIssues: [],
    })
  }

  // 统计进行中的任务
  for (const issue of issues) {
    if (issue.status !== 'in_progress') continue
    if (!issue.assignee) continue

    const member = memberMap.get(issue.assignee.id)
    if (!member) continue

    member.allocated += issue.storyPoints
    member.inProgressIssues.push(issue)
  }

  // 计算负载百分比
  for (const member of memberMap.values()) {
    member.loadPercentage =
      member.capacity > 0
        ? (member.allocated / member.capacity) * 100
        : 0
  }

  return Array.from(memberMap.values())
}
