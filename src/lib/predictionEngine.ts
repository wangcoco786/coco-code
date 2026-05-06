// ============================================================
// 预测引擎 — Sprint 完成概率与交付日期预测
// ============================================================

import type { VelocityRecord, SprintPrediction } from '@/types/platform'

/**
 * 计算历史速度的平均值、标准差和趋势方向。
 *
 * 速度 = completedPoints / durationDays（每日完成点数）
 * 趋势通过比较后半段平均与前半段平均来判断。
 */
export function computeVelocity(history: VelocityRecord[]): {
  average: number
  stdDev: number
  trend: 'improving' | 'stable' | 'declining'
} {
  if (history.length === 0) {
    return { average: 0, stdDev: 0, trend: 'stable' }
  }

  // 计算每个 Sprint 的日均速度
  const velocities = history.map((record) => {
    if (record.durationDays <= 0) return 0
    return record.completedPoints / record.durationDays
  })

  // 平均值
  const sum = velocities.reduce((acc, v) => acc + v, 0)
  const average = sum / velocities.length

  // 标准差
  const squaredDiffs = velocities.map((v) => (v - average) ** 2)
  const variance = squaredDiffs.reduce((acc, d) => acc + d, 0) / velocities.length
  const stdDev = Math.sqrt(variance)

  // 趋势：比较前半段和后半段的平均速度
  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (velocities.length >= 2) {
    const mid = Math.floor(velocities.length / 2)
    const firstHalf = velocities.slice(0, mid)
    const secondHalf = velocities.slice(mid)

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    const threshold = average * 0.1 // 10% 变化阈值
    if (secondAvg - firstAvg > threshold) {
      trend = 'improving'
    } else if (firstAvg - secondAvg > threshold) {
      trend = 'declining'
    }
  }

  return { average, stdDev, trend }
}

/**
 * 预测 Sprint 完成概率和交付日期。
 *
 * 逻辑：
 * 1. 输入验证：totalTasks ≤ 0 或 totalDays ≤ 0 返回安全默认值
 * 2. 已全部完成：概率 100%
 * 3. 有历史速度数据：基于日均速度预测
 * 4. 无历史数据：基于当前进度线性外推
 * 5. 置信区间：optimistic ≤ mostLikely ≤ pessimistic（日期顺序）
 */
export function predictSprintCompletion(
  remainingTasks: number,
  completedTasks: number,
  totalTasks: number,
  daysElapsed: number,
  totalDays: number,
  velocityHistory: VelocityRecord[]
): SprintPrediction {
  // 输入验证：返回安全默认值
  if (totalTasks <= 0 || totalDays <= 0) {
    return {
      completionProbability: 0,
      predictedEndDate: new Date().toISOString(),
      confidence: {
        optimistic: new Date().toISOString(),
        mostLikely: new Date().toISOString(),
        pessimistic: new Date().toISOString(),
      },
      isReliable: false,
      warningMessage: '输入数据无效：总任务数或总天数必须大于 0',
    }
  }

  // 已全部完成
  if (completedTasks >= totalTasks) {
    const now = new Date().toISOString()
    return {
      completionProbability: 100,
      predictedEndDate: now,
      confidence: {
        optimistic: now,
        mostLikely: now,
        pessimistic: now,
      },
      isReliable: velocityHistory.length >= 3,
      warningMessage:
        velocityHistory.length < 3
          ? '历史数据不足，预测仅供参考'
          : undefined,
    }
  }

  const isReliable = velocityHistory.length >= 3
  const velocity = computeVelocity(velocityHistory)

  let probability: number
  let daysToComplete: number
  let optimisticDays: number
  let pessimisticDays: number

  const effectiveRemaining = Math.max(0, remainingTasks)

  if (velocityHistory.length > 0 && velocity.average > 0) {
    // 基于历史速度预测
    const avgDailyVelocity = velocity.average
    const daysRemaining = totalDays - daysElapsed

    // 预计完成所需天数
    daysToComplete = effectiveRemaining / avgDailyVelocity

    // 概率：剩余天数能否覆盖所需天数
    if (daysRemaining <= 0) {
      probability = effectiveRemaining <= 0 ? 100 : 0
    } else {
      // 概率 = 剩余天数可完成的工作量 / 剩余工作量 * 100
      const canComplete = daysRemaining * avgDailyVelocity
      probability = Math.min(100, (canComplete / effectiveRemaining) * 100)
    }

    // 置信区间
    const optimisticVelocity = avgDailyVelocity + velocity.stdDev
    const pessimisticVelocity = Math.max(
      avgDailyVelocity * 0.1,
      avgDailyVelocity - velocity.stdDev
    )

    optimisticDays =
      optimisticVelocity > 0
        ? effectiveRemaining / optimisticVelocity
        : daysToComplete
    pessimisticDays =
      pessimisticVelocity > 0
        ? effectiveRemaining / pessimisticVelocity
        : daysToComplete * 2
  } else {
    // 无历史数据：线性外推
    if (daysElapsed <= 0) {
      // 还没开始，无法外推
      probability = 50 // 默认中等概率
      daysToComplete = totalDays
      optimisticDays = totalDays * 0.8
      pessimisticDays = totalDays * 1.5
    } else {
      const currentRate = completedTasks / daysElapsed // 每天完成任务数
      if (currentRate <= 0) {
        probability = 0
        daysToComplete = totalDays * 2
        optimisticDays = totalDays * 2
        pessimisticDays = totalDays * 3
      } else {
        daysToComplete = effectiveRemaining / currentRate
        const daysRemaining = totalDays - daysElapsed
        if (daysRemaining <= 0) {
          probability = 0
        } else {
          probability = Math.min(
            100,
            (daysRemaining / daysToComplete) * 100
          )
        }
        optimisticDays = daysToComplete * 0.8
        pessimisticDays = daysToComplete * 1.5
      }
    }
  }

  // Clamp probability to [0, 100]
  probability = Math.max(0, Math.min(100, probability))

  // 计算预测日期
  const now = new Date()
  const predictedEnd = new Date(
    now.getTime() + daysToComplete * 24 * 60 * 60 * 1000
  )
  const optimisticEnd = new Date(
    now.getTime() + optimisticDays * 24 * 60 * 60 * 1000
  )
  const pessimisticEnd = new Date(
    now.getTime() + pessimisticDays * 24 * 60 * 60 * 1000
  )

  // 确保 optimistic ≤ mostLikely ≤ pessimistic（日期顺序）
  const dates = [optimisticEnd, predictedEnd, pessimisticEnd].sort(
    (a, b) => a.getTime() - b.getTime()
  )

  return {
    completionProbability: Math.round(probability * 100) / 100,
    predictedEndDate: dates[1].toISOString(),
    confidence: {
      optimistic: dates[0].toISOString(),
      mostLikely: dates[1].toISOString(),
      pessimistic: dates[2].toISOString(),
    },
    isReliable,
    warningMessage: !isReliable
      ? '历史数据不足，预测仅供参考'
      : undefined,
  }
}

/**
 * 判断是否应触发风险预警。
 * 当完成概率 < 60% 时返回 true。
 */
export function shouldTriggerAlert(prediction: SprintPrediction): boolean {
  return prediction.completionProbability < 60
}
