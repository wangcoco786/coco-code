// ============================================================
// 绩效计算引擎 — 基于 SPACE + DORA 框架的五维度绩效评估
// ============================================================

import type { PlatformIssue } from '@/types/platform'

// ────────────────────────────────────────────────────────────
// 数据模型：输入
// ────────────────────────────────────────────────────────────

/** 状态变更记录 */
export interface StatusTransition {
  from: string
  to: string
  timestamp: string // ISO 8601
}

/** Issue 评论 */
export interface IssueComment {
  authorId: string
  authorName: string
  createdAt: string // ISO 8601
}

/** 扩展的 Issue 数据，包含绩效计算所需的额外字段 */
export interface PerformanceIssue extends Omit<PlatformIssue, 'priority'> {
  priority: string | undefined // 允许原始 Jira 优先级名称（Highest/High 等）和映射后的值（P0/P1 等）
  subtaskCount: number // 子任务数量
  linkedIssueCount: number // 关联 issue 数量
  commentCount: number // 评论数量
  sprintChanges: number // 跨 Sprint 次数（从 changelog 解析）
  isReopened: boolean // 是否被 reopen 过
  linkedBugCount: number // 关联的 Bug 类型 issue 数量
  statusTransitions: StatusTransition[] // 状态变更历史
  comments: IssueComment[] // 评论列表（含作者信息）
}

/** 复杂度因子计算输入 */
export interface ComplexityFactorInput {
  subtaskCount: number
  linkedIssueCount: number
  commentCount: number
  sprintChanges: number
}

// ────────────────────────────────────────────────────────────
// 数据模型：输出
// ────────────────────────────────────────────────────────────

/** 绩效等级 */
export type PerformanceGrade = 'excellent' | 'good' | 'average' | 'needs_improvement'

/** 绩效明细 */
export interface PerformanceDetails {
  // 吞吐量明细
  completedTaskCount: number
  complexityWeightedOutput: number
  // 效率明细
  averageCycleTime: number // 天
  deliveryRate: number // 0-1
  // 质量明细
  reworkRate: number // 0-1
  bugIntroductionRate: number | null // 0-1 或 null（数据不可得）
  // 影响力明细
  highPriorityCompletionRatio: number // 0-1
  blockingResolutionSpeed: number // 天
  // 协作明细
  crossTeamCommentCount: number
  crossTeamTaskRatio: number // 0-1
}

/** 单个成员的绩效结果 */
export interface MemberPerformance {
  memberId: string
  memberName: string
  avatarUrl: string | null
  performanceScore: number // 综合绩效分 0-100
  throughputScore: number // 吞吐量 0-100
  efficiencyScore: number // 效率 0-100
  qualityScore: number // 质量 0-100
  impactScore: number // 影响力 0-100
  collaborationScore: number // 协作 0-100
  grade: PerformanceGrade // 绩效等级
  details: PerformanceDetails // 明细数据
  tasks: PerformanceIssue[] // 该成员的任务列表
}

/** 绩效分布 */
export interface PerformanceDistribution {
  excellent: number // 80-100 人数
  good: number // 60-79 人数
  average: number // 40-59 人数
  needsImprovement: number // 0-39 人数
}

/** 部门整体绩效 */
export interface DepartmentPerformance {
  averageScore: number
  averageThroughput: number
  averageEfficiency: number
  averageQuality: number
  averageImpact: number
  averageCollaboration: number
  totalCompletedTasks: number
  averageCycleTime: number
  members: MemberPerformance[]
  distribution: PerformanceDistribution
}

// ────────────────────────────────────────────────────────────
// 配置
// ────────────────────────────────────────────────────────────

/** 维度权重配置 */
export interface PerformanceWeights {
  throughput: number // 默认 0.20
  efficiency: number // 默认 0.25
  quality: number // 默认 0.25
  impact: number // 默认 0.15
  collaboration: number // 默认 0.15
}

export const DEFAULT_WEIGHTS: PerformanceWeights = {
  throughput: 0.20,
  efficiency: 0.25,
  quality: 0.25,
  impact: 0.15,
  collaboration: 0.15,
}

// ────────────────────────────────────────────────────────────
// 辅助函数
// ────────────────────────────────────────────────────────────

/**
 * 根据绩效分数返回对应的绩效等级。
 *
 * - 80-100: excellent
 * - 60-79: good
 * - 40-59: average
 * - 0-39: needs_improvement
 */
export function getPerformanceGrade(score: number): PerformanceGrade {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'average'
  return 'needs_improvement'
}

/**
 * 根据绩效等级返回对应的颜色值。
 *
 * - excellent: 绿色 #52c41a
 * - good: 蓝色 #1677ff
 * - average: 橙色 #fa8c16
 * - needs_improvement: 红色 #f5222d
 */
export function getGradeColor(grade: PerformanceGrade): string {
  switch (grade) {
    case 'excellent': return '#52c41a'
    case 'good': return '#1677ff'
    case 'average': return '#fa8c16'
    case 'needs_improvement': return '#f5222d'
  }
}

// ────────────────────────────────────────────────────────────
// 核心计算函数
// ────────────────────────────────────────────────────────────

/**
 * 计算任务复杂度因子。
 *
 * 基于 ticket 元数据规则自动计算任务难度系数：
 * - 基础分 1.0
 * - 子任务数 >3 加 0.5，>6 加 1.0（互斥，取高档）
 * - 关联 issue 数 >2 加 0.3，>5 加 0.6（互斥，取高档）
 * - 评论数 >5 加 0.3，>10 加 0.6（互斥，取高档）
 * - 跨 Sprint 次数 >0 加 0.3 × 次数
 * - 最终结果 clamp 到 [1.0, 5.0]
 */
export function calculateComplexityFactor(input: ComplexityFactorInput): number {
  let factor = 1.0

  // 子任务数
  if (input.subtaskCount > 6) factor += 1.0
  else if (input.subtaskCount > 3) factor += 0.5

  // 关联 issue 数
  if (input.linkedIssueCount > 5) factor += 0.6
  else if (input.linkedIssueCount > 2) factor += 0.3

  // 评论数
  if (input.commentCount > 10) factor += 0.6
  else if (input.commentCount > 5) factor += 0.3

  // 跨 Sprint 次数
  if (input.sprintChanges > 0) factor += 0.3 * input.sprintChanges

  // 限制范围 [1.0, 5.0]
  return Math.min(5.0, Math.max(1.0, factor))
}

/**
 * 计算吞吐量维度得分。
 *
 * 基于完成任务数量和复杂度加权完成量在团队中的相对排名计算得分：
 * 1. 统计已完成任务数（status === 'done'）
 * 2. 计算复杂度加权完成量：每个已完成任务贡献 1 × calculateComplexityFactor
 * 3. 计算百分位排名：在 allMemberStats 中分别对 completedCount 和 weightedOutput 计算百分位
 * 4. 最终得分 = 两个百分位排名的平均值 × 100
 * 5. 单人团队时直接返回满分 100
 */
export function calculateThroughputScore(
  memberIssues: PerformanceIssue[],
  allMemberStats: { completedCount: number; weightedOutput: number }[]
): { score: number; completedCount: number; weightedOutput: number } {
  // 统计已完成任务
  const completedIssues = memberIssues.filter(issue => issue.status === 'done')
  const completedCount = completedIssues.length

  // 计算复杂度加权完成量
  const weightedOutput = completedIssues.reduce((sum, issue) => {
    const complexity = calculateComplexityFactor({
      subtaskCount: issue.subtaskCount,
      linkedIssueCount: issue.linkedIssueCount,
      commentCount: issue.commentCount,
      sprintChanges: issue.sprintChanges,
    })
    return sum + complexity
  }, 0)

  // 单人团队直接满分
  if (allMemberStats.length <= 1) {
    return { score: 100, completedCount, weightedOutput }
  }

  // 计算百分位排名：在团队中有多少比例的成员排名低于当前成员
  const countPercentile = calculatePercentileRank(
    completedCount,
    allMemberStats.map(s => s.completedCount)
  )
  const weightedPercentile = calculatePercentileRank(
    weightedOutput,
    allMemberStats.map(s => s.weightedOutput)
  )

  // 最终得分 = 两个百分位排名的平均值，缩放到 0-100
  const score = Math.min(100, Math.max(0, ((countPercentile + weightedPercentile) / 2) * 100))

  return { score: Math.round(score * 100) / 100, completedCount, weightedOutput }
}

/**
 * 计算效率维度得分。
 *
 * 基于平均 Cycle_Time（In Progress → Done 天数）和 Delivery_Rate（Sprint 内按时完成比例）计算：
 * 1. 对每个已完成任务，从 statusTransitions 中计算 cycle time：
 *    - 找到第一次转入 'in_progress'/'In Progress' 的时间
 *    - 找到最后一次转入 'done'/'Done' 的时间
 *    - Cycle time = 两者之差（天数）
 *    - 若无有效 transition，使用 createdAt → updatedAt 作为 fallback
 * 2. 平均 cycle time = 所有已完成任务 cycle time 的均值
 * 3. Delivery rate = Sprint endDate 前完成的任务数 / 总分配任务数
 * 4. 得分计算：
 *    - Cycle time 分量 (50%): max(0, 100 - avgCycleTime * 5)
 *    - Delivery rate 分量 (50%): deliveryRate * 100
 *    - 最终得分 = (cycleTimeScore + deliveryRateScore) / 2, clamp 到 [0, 100]
 * 5. 若无已完成任务，avgCycleTime = 0, deliveryRate = 0, score = 0
 */
export function calculateEfficiencyScore(
  memberIssues: PerformanceIssue[],
  sprint: { startDate: string; endDate: string }
): { score: number; avgCycleTime: number; deliveryRate: number } {
  const completedIssues = memberIssues.filter(issue => issue.status === 'done')

  // 若无已完成任务
  if (completedIssues.length === 0) {
    return { score: 0, avgCycleTime: 0, deliveryRate: 0 }
  }

  // 计算每个已完成任务的 cycle time
  const cycleTimes = completedIssues.map(issue => calculateCycleTime(issue))
  const avgCycleTime = cycleTimes.reduce((sum, ct) => sum + ct, 0) / cycleTimes.length

  // 计算 delivery rate：Sprint endDate 前完成的任务数 / 总分配任务数
  const sprintEnd = new Date(sprint.endDate).getTime()
  const completedBeforeEnd = completedIssues.filter(issue => {
    const doneTime = getLastDoneTransitionTime(issue)
    return doneTime !== null && doneTime <= sprintEnd
  }).length

  const totalAssigned = memberIssues.length
  const deliveryRate = totalAssigned > 0 ? completedBeforeEnd / totalAssigned : 0

  // 得分计算
  const cycleTimeScore = Math.max(0, 100 - avgCycleTime * 5)
  const deliveryRateScore = deliveryRate * 100
  const rawScore = (cycleTimeScore + deliveryRateScore) / 2
  const score = Math.min(100, Math.max(0, Math.round(rawScore * 100) / 100))

  return { score, avgCycleTime: Math.round(avgCycleTime * 100) / 100, deliveryRate: Math.round(deliveryRate * 100) / 100 }
}

/**
 * 计算单个任务的 cycle time（天数）。
 *
 * 从 statusTransitions 中找到第一次转入 In Progress 和最后一次转入 Done 的时间差。
 * 若无有效 transition，使用 createdAt → updatedAt 作为 fallback。
 */
function calculateCycleTime(issue: PerformanceIssue): number {
  const inProgressTime = getFirstInProgressTime(issue)
  const doneTime = getLastDoneTime(issue)

  if (inProgressTime !== null && doneTime !== null && doneTime > inProgressTime) {
    return (doneTime - inProgressTime) / (1000 * 60 * 60 * 24)
  }

  // Fallback: createdAt → updatedAt
  const created = new Date(issue.createdAt).getTime()
  const updated = new Date(issue.updatedAt).getTime()
  if (updated > created) {
    return (updated - created) / (1000 * 60 * 60 * 24)
  }

  return 0
}

/**
 * 获取第一次转入 In Progress 状态的时间戳。
 */
function getFirstInProgressTime(issue: PerformanceIssue): number | null {
  for (const t of issue.statusTransitions) {
    const toNorm = t.to.toLowerCase().replace(/[\s_]/g, '')
    if (toNorm === 'inprogress') {
      return new Date(t.timestamp).getTime()
    }
  }
  return null
}

/**
 * 获取最后一次转入 Done 状态的时间戳。
 */
function getLastDoneTime(issue: PerformanceIssue): number | null {
  let lastTime: number | null = null
  for (const t of issue.statusTransitions) {
    const toNorm = t.to.toLowerCase().replace(/[\s_]/g, '')
    if (toNorm === 'done') {
      const time = new Date(t.timestamp).getTime()
      if (lastTime === null || time > lastTime) {
        lastTime = time
      }
    }
  }
  return lastTime
}

/**
 * 获取最后一次转入 Done 状态的时间戳（用于 delivery rate 判断）。
 * 返回 null 如果没有 Done transition（使用 updatedAt 作为 fallback）。
 */
function getLastDoneTransitionTime(issue: PerformanceIssue): number | null {
  const doneTime = getLastDoneTime(issue)
  if (doneTime !== null) return doneTime
  // Fallback: use updatedAt
  return new Date(issue.updatedAt).getTime()
}

/**
 * 计算质量维度得分。
 *
 * 基于 Rework_Rate（返工率）和 Bug_Introduction_Rate（Bug 引入率）计算：
 * 1. Rework rate = 被 reopen 的任务数 / 已完成任务总数
 * 2. Bug introduction rate = 关联 Bug 数 > 0 的已完成任务数 / 已完成任务总数
 *    - Bug 数据可用条件：至少一个已完成任务的 linkedBugCount >= 0
 *    - 若所有已完成任务的 linkedBugCount < 0（sentinel），则 Bug 数据不可得
 * 3. 得分计算：
 *    - Bug 数据可用时：score = ((1 - reworkRate) * 100 + (1 - bugIntroductionRate) * 100) / 2
 *    - Bug 数据不可用时：score = (1 - reworkRate) * 100（100% 权重归入 Rework_Rate）
 * 4. 得分 clamp 到 [0, 100]
 * 5. 无已完成任务时：score = 0, reworkRate = 0, bugIntroductionRate = null
 */
export function calculateQualityScore(
  memberIssues: PerformanceIssue[]
): { score: number; reworkRate: number; bugIntroductionRate: number | null } {
  const completedIssues = memberIssues.filter(issue => issue.status === 'done')

  // 无已完成任务
  if (completedIssues.length === 0) {
    return { score: 0, reworkRate: 0, bugIntroductionRate: null }
  }

  // 计算 Rework Rate
  const reopenedCount = completedIssues.filter(issue => issue.isReopened).length
  const reworkRate = reopenedCount / completedIssues.length

  // 判断 Bug 数据是否可用：至少一个已完成任务的 linkedBugCount >= 0
  const bugDataAvailable = completedIssues.some(issue => issue.linkedBugCount >= 0)

  if (bugDataAvailable) {
    // Bug 数据可用：计算 Bug Introduction Rate
    const issuesWithBugs = completedIssues.filter(issue => issue.linkedBugCount > 0).length
    const bugIntroductionRate = issuesWithBugs / completedIssues.length

    // 得分 = (rework 分量 + bug 分量) / 2
    const reworkComponent = (1 - reworkRate) * 100
    const bugComponent = (1 - bugIntroductionRate) * 100
    const rawScore = (reworkComponent + bugComponent) / 2
    const score = Math.min(100, Math.max(0, Math.round(rawScore * 100) / 100))

    return {
      score,
      reworkRate: Math.round(reworkRate * 10000) / 10000,
      bugIntroductionRate: Math.round(bugIntroductionRate * 10000) / 10000,
    }
  } else {
    // Bug 数据不可用：仅基于 Rework_Rate 计算
    const rawScore = (1 - reworkRate) * 100
    const score = Math.min(100, Math.max(0, Math.round(rawScore * 100) / 100))

    return {
      score,
      reworkRate: Math.round(reworkRate * 10000) / 10000,
      bugIntroductionRate: null,
    }
  }
}

/**
 * 计算影响力维度得分。
 *
 * 基于高优先级（Highest/High/P0/P1）任务完成占比和阻塞解决速度计算：
 * 1. 筛选已完成任务（status === 'done'）
 * 2. 计算高优先级完成比例：
 *    - 高优先级 = priority 为 'Highest', 'High', 'P0', 'P1'（不区分大小写）
 *    - highPriorityRatio = 高优先级已完成任务数 / 总已完成任务数
 * 3. 计算阻塞解决速度：
 *    - 阻塞任务 = linkedIssueCount > 0 的任务
 *    - 对阻塞任务计算 cycle time（In Progress → Done 天数）
 *    - blockingResolutionSpeed = 阻塞任务的平均 cycle time（天）
 *    - 若无阻塞任务，blockingResolutionSpeed = 0
 * 4. 得分计算：
 *    - highPriorityComponent (60%): highPriorityRatio * 100
 *    - blockingComponent (40%): max(0, 100 - blockingResolutionSpeed * 5)
 *    - 若无阻塞任务，blockingComponent = 50（中性值）
 *    - score = highPriorityComponent * 0.6 + blockingComponent * 0.4
 *    - 结果 clamp 到 [0, 100]
 * 5. 若无已完成任务：score = 0, highPriorityRatio = 0, blockingResolutionSpeed = 0
 */
export function calculateImpactScore(
  memberIssues: PerformanceIssue[]
): { score: number; highPriorityRatio: number; blockingResolutionSpeed: number } {
  const completedIssues = memberIssues.filter(issue => issue.status === 'done')

  // 若无已完成任务
  if (completedIssues.length === 0) {
    return { score: 0, highPriorityRatio: 0, blockingResolutionSpeed: 0 }
  }

  // 计算高优先级完成比例
  const highPriorityLabels = ['highest', 'high', 'p0', 'p1']
  const highPriorityCompleted = completedIssues.filter(issue =>
    issue.priority != null && highPriorityLabels.includes(issue.priority.toLowerCase())
  )
  const highPriorityRatio = highPriorityCompleted.length / completedIssues.length

  // 计算阻塞解决速度
  const blockingIssues = completedIssues.filter(issue => issue.linkedIssueCount > 0)

  let blockingResolutionSpeed = 0
  let blockingComponent = 50 // 中性值（无阻塞任务时）

  if (blockingIssues.length > 0) {
    const blockingCycleTimes = blockingIssues.map(issue => calculateCycleTime(issue))
    blockingResolutionSpeed = blockingCycleTimes.reduce((sum, ct) => sum + ct, 0) / blockingIssues.length
    blockingComponent = Math.max(0, 100 - blockingResolutionSpeed * 5)
  }

  // 得分计算
  const highPriorityComponent = highPriorityRatio * 100
  const rawScore = highPriorityComponent * 0.6 + blockingComponent * 0.4
  const score = Math.min(100, Math.max(0, Math.round(rawScore * 100) / 100))

  return {
    score,
    highPriorityRatio: Math.round(highPriorityRatio * 10000) / 10000,
    blockingResolutionSpeed: Math.round(blockingResolutionSpeed * 100) / 100,
  }
}

/**
 * 计算协作维度得分。
 *
 * 基于参与非自己任务的评论数和跨团队任务参与度计算：
 * 1. Cross-team comments：遍历 allIssues 中非本人负责的任务，统计本人发表的评论总数
 * 2. Cross-team task ratio：本人参与评论的他人任务数 / 他人任务总数
 *    - 若无他人任务，crossTeamTaskRatio = 0
 * 3. 得分计算：
 *    - commentComponent (50%): min(100, crossTeamComments * 10) — 10+ 条评论即满分
 *    - taskRatioComponent (50%): crossTeamTaskRatio * 100
 *    - score = (commentComponent + taskRatioComponent) / 2
 *    - 结果 clamp 到 [0, 100]
 * 4. 若 allIssues 为空或 memberId 无任务：score = 0
 */
export function calculateCollaborationScore(
  _memberIssues: PerformanceIssue[],
  allIssues: PerformanceIssue[],
  memberId: string
): { score: number; crossTeamComments: number; crossTeamTaskRatio: number } {
  // 若 allIssues 为空
  if (allIssues.length === 0) {
    return { score: 0, crossTeamComments: 0, crossTeamTaskRatio: 0 }
  }

  // 找出非本人负责的任务
  const otherMemberTasks = allIssues.filter(
    issue => issue.assignee?.id !== memberId
  )

  // 若无他人任务
  if (otherMemberTasks.length === 0) {
    return { score: 0, crossTeamComments: 0, crossTeamTaskRatio: 0 }
  }

  // 统计跨团队评论数：在他人任务中，本人发表的评论总数
  let crossTeamComments = 0
  let tasksWithMyComments = 0

  for (const issue of otherMemberTasks) {
    const myCommentsOnThisIssue = issue.comments.filter(
      comment => comment.authorId === memberId
    ).length

    if (myCommentsOnThisIssue > 0) {
      crossTeamComments += myCommentsOnThisIssue
      tasksWithMyComments++
    }
  }

  // 跨团队任务参与度
  const crossTeamTaskRatio = tasksWithMyComments / otherMemberTasks.length

  // 得分计算
  const commentComponent = Math.min(100, crossTeamComments * 10)
  const taskRatioComponent = crossTeamTaskRatio * 100
  const rawScore = (commentComponent + taskRatioComponent) / 2
  const score = Math.min(100, Math.max(0, Math.round(rawScore * 100) / 100))

  return {
    score,
    crossTeamComments,
    crossTeamTaskRatio: Math.round(crossTeamTaskRatio * 10000) / 10000,
  }
}

/**
 * 计算某个值在一组数据中的百分位排名。
 *
 * 使用公式：percentile = (低于该值的数量 + 等于该值的数量 × 0.5) / 总数量
 * 返回值范围 [0, 1]
 */
function calculatePercentileRank(value: number, allValues: number[]): number {
  const n = allValues.length
  if (n === 0) return 0

  let below = 0
  let equal = 0
  for (const v of allValues) {
    if (v < value) below++
    else if (v === value) equal++
  }

  return (below + equal * 0.5) / n
}

// ────────────────────────────────────────────────────────────
// 综合绩效计算
// ────────────────────────────────────────────────────────────

/**
 * 计算单个成员的综合绩效。
 *
 * 调用五个维度计算函数，按权重加权求和得到 performanceScore，
 * 并组装完整的 MemberPerformance 对象。
 *
 * 纯函数，无副作用，相同输入产生相同输出。
 */
export function calculateMemberPerformance(
  memberIssues: PerformanceIssue[],
  allIssues: PerformanceIssue[],
  sprint: { startDate: string; endDate: string },
  weights?: PerformanceWeights
): MemberPerformance {
  const w = weights ?? DEFAULT_WEIGHTS

  // 获取成员信息
  const firstIssue = memberIssues[0]
  const memberId = firstIssue?.assignee?.id ?? 'unknown'
  const memberName = firstIssue?.assignee?.name ?? 'unknown'
  const avatarUrl = firstIssue?.assignee?.avatarUrl ?? null

  // 预计算所有成员的吞吐量统计（用于相对排名）
  const memberGroups = groupIssuesByAssignee(allIssues)
  const allMemberStats = computeAllMemberStats(memberGroups)

  // 计算五个维度
  const throughput = calculateThroughputScore(memberIssues, allMemberStats)
  const efficiency = calculateEfficiencyScore(memberIssues, sprint)
  const quality = calculateQualityScore(memberIssues)
  const impact = calculateImpactScore(memberIssues)
  const collaboration = calculateCollaborationScore(memberIssues, allIssues, memberId)

  // 加权求和
  const rawScore =
    throughput.score * w.throughput +
    efficiency.score * w.efficiency +
    quality.score * w.quality +
    impact.score * w.impact +
    collaboration.score * w.collaboration

  const performanceScore = Math.min(100, Math.max(0, Math.round(rawScore * 100) / 100))

  // 确定等级
  const grade = getPerformanceGrade(performanceScore)

  // 组装明细
  const details: PerformanceDetails = {
    completedTaskCount: throughput.completedCount,
    complexityWeightedOutput: throughput.weightedOutput,
    averageCycleTime: efficiency.avgCycleTime,
    deliveryRate: efficiency.deliveryRate,
    reworkRate: quality.reworkRate,
    bugIntroductionRate: quality.bugIntroductionRate,
    highPriorityCompletionRatio: impact.highPriorityRatio,
    blockingResolutionSpeed: impact.blockingResolutionSpeed,
    crossTeamCommentCount: collaboration.crossTeamComments,
    crossTeamTaskRatio: collaboration.crossTeamTaskRatio,
  }

  return {
    memberId,
    memberName,
    avatarUrl,
    performanceScore,
    throughputScore: throughput.score,
    efficiencyScore: efficiency.score,
    qualityScore: quality.score,
    impactScore: impact.score,
    collaborationScore: collaboration.score,
    grade,
    details,
    tasks: memberIssues,
  }
}

/**
 * 计算部门整体绩效。
 *
 * 将所有 issues 按 assignee 分组，计算每个成员的绩效，
 * 然后聚合为部门级别的指标。
 *
 * 纯函数，无副作用，相同输入产生相同输出（幂等性）。
 */
export function calculateDepartmentPerformance(
  issues: PerformanceIssue[],
  sprint: { startDate: string; endDate: string },
  weights?: PerformanceWeights
): DepartmentPerformance {
  // 按 assignee 分组
  const memberGroups = groupIssuesByAssignee(issues)
  const memberIds = Object.keys(memberGroups)

  // 若无成员，返回空结果
  if (memberIds.length === 0) {
    return {
      averageScore: 0,
      averageThroughput: 0,
      averageEfficiency: 0,
      averageQuality: 0,
      averageImpact: 0,
      averageCollaboration: 0,
      totalCompletedTasks: 0,
      averageCycleTime: 0,
      members: [],
      distribution: { excellent: 0, good: 0, average: 0, needsImprovement: 0 },
    }
  }

  // 计算每个成员的绩效
  const members: MemberPerformance[] = memberIds.map(memberId => {
    const memberIssues = memberGroups[memberId]
    return calculateMemberPerformance(memberIssues, issues, sprint, weights)
  })

  // 聚合指标
  const n = members.length
  const averageScore = Math.round((members.reduce((sum, m) => sum + m.performanceScore, 0) / n) * 100) / 100
  const averageThroughput = Math.round((members.reduce((sum, m) => sum + m.throughputScore, 0) / n) * 100) / 100
  const averageEfficiency = Math.round((members.reduce((sum, m) => sum + m.efficiencyScore, 0) / n) * 100) / 100
  const averageQuality = Math.round((members.reduce((sum, m) => sum + m.qualityScore, 0) / n) * 100) / 100
  const averageImpact = Math.round((members.reduce((sum, m) => sum + m.impactScore, 0) / n) * 100) / 100
  const averageCollaboration = Math.round((members.reduce((sum, m) => sum + m.collaborationScore, 0) / n) * 100) / 100

  // 总完成任务数
  const totalCompletedTasks = members.reduce((sum, m) => sum + m.details.completedTaskCount, 0)

  // 平均 Cycle Time
  const membersWithCycleTime = members.filter(m => m.details.averageCycleTime > 0)
  const averageCycleTime = membersWithCycleTime.length > 0
    ? Math.round((membersWithCycleTime.reduce((sum, m) => sum + m.details.averageCycleTime, 0) / membersWithCycleTime.length) * 100) / 100
    : 0

  // 绩效分布
  const distribution: PerformanceDistribution = {
    excellent: 0,
    good: 0,
    average: 0,
    needsImprovement: 0,
  }

  for (const member of members) {
    switch (member.grade) {
      case 'excellent':
        distribution.excellent++
        break
      case 'good':
        distribution.good++
        break
      case 'average':
        distribution.average++
        break
      case 'needs_improvement':
        distribution.needsImprovement++
        break
    }
  }

  return {
    averageScore,
    averageThroughput,
    averageEfficiency,
    averageQuality,
    averageImpact,
    averageCollaboration,
    totalCompletedTasks,
    averageCycleTime,
    members,
    distribution,
  }
}

/**
 * 按 assignee 分组 issues。
 * 无 assignee 的 issue 归入 'unassigned' 组。
 */
function groupIssuesByAssignee(issues: PerformanceIssue[]): Record<string, PerformanceIssue[]> {
  const groups: Record<string, PerformanceIssue[]> = {}

  for (const issue of issues) {
    const memberId = issue.assignee?.id ?? 'unassigned'
    if (!groups[memberId]) {
      groups[memberId] = []
    }
    groups[memberId].push(issue)
  }

  return groups
}

/**
 * 预计算所有成员的吞吐量统计数据（用于相对排名）。
 */
function computeAllMemberStats(
  memberGroups: Record<string, PerformanceIssue[]>
): { completedCount: number; weightedOutput: number }[] {
  return Object.values(memberGroups).map(memberIssues => {
    const completedIssues = memberIssues.filter(issue => issue.status === 'done')
    const completedCount = completedIssues.length
    const weightedOutput = completedIssues.reduce((sum, issue) => {
      const complexity = calculateComplexityFactor({
        subtaskCount: issue.subtaskCount,
        linkedIssueCount: issue.linkedIssueCount,
        commentCount: issue.commentCount,
        sprintChanges: issue.sprintChanges,
      })
      return sum + complexity
    }, 0)
    return { completedCount, weightedOutput }
  })
}
