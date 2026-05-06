import { describe, it, expect } from 'vitest'
import {
  predictSprintCompletion,
  computeVelocity,
  shouldTriggerAlert,
} from './predictionEngine'
import type { VelocityRecord, SprintPrediction } from '@/types/platform'

// ─── helpers ────────────────────────────────────────────────

function makeVelocityRecord(
  overrides: Partial<VelocityRecord> = {}
): VelocityRecord {
  return {
    sprintId: 1,
    sprintName: 'Sprint 1',
    plannedPoints: 20,
    completedPoints: 18,
    durationDays: 14,
    ...overrides,
  }
}

const SAMPLE_HISTORY: VelocityRecord[] = [
  makeVelocityRecord({ sprintId: 1, sprintName: 'Sprint 1', completedPoints: 16, durationDays: 14 }),
  makeVelocityRecord({ sprintId: 2, sprintName: 'Sprint 2', completedPoints: 18, durationDays: 14 }),
  makeVelocityRecord({ sprintId: 3, sprintName: 'Sprint 3', completedPoints: 20, durationDays: 14 }),
  makeVelocityRecord({ sprintId: 4, sprintName: 'Sprint 4', completedPoints: 22, durationDays: 14 }),
]

// ─── computeVelocity ────────────────────────────────────────

describe('computeVelocity', () => {
  it('returns zeros for empty history', () => {
    const result = computeVelocity([])
    expect(result.average).toBe(0)
    expect(result.stdDev).toBe(0)
    expect(result.trend).toBe('stable')
  })

  it('computes correct average for single record', () => {
    const history = [makeVelocityRecord({ completedPoints: 14, durationDays: 7 })]
    const result = computeVelocity(history)
    expect(result.average).toBe(2) // 14/7
    expect(result.stdDev).toBe(0)
    expect(result.trend).toBe('stable')
  })

  it('computes correct average and stdDev for multiple records', () => {
    // velocities: 16/14, 18/14, 20/14, 22/14 ≈ 1.143, 1.286, 1.429, 1.571
    const result = computeVelocity(SAMPLE_HISTORY)
    const expectedAvg = (16 / 14 + 18 / 14 + 20 / 14 + 22 / 14) / 4
    expect(result.average).toBeCloseTo(expectedAvg, 5)
    expect(result.stdDev).toBeGreaterThan(0)
  })

  it('detects improving trend', () => {
    const improving = [
      makeVelocityRecord({ completedPoints: 10, durationDays: 14 }),
      makeVelocityRecord({ completedPoints: 12, durationDays: 14 }),
      makeVelocityRecord({ completedPoints: 20, durationDays: 14 }),
      makeVelocityRecord({ completedPoints: 22, durationDays: 14 }),
    ]
    const result = computeVelocity(improving)
    expect(result.trend).toBe('improving')
  })

  it('detects declining trend', () => {
    const declining = [
      makeVelocityRecord({ completedPoints: 22, durationDays: 14 }),
      makeVelocityRecord({ completedPoints: 20, durationDays: 14 }),
      makeVelocityRecord({ completedPoints: 12, durationDays: 14 }),
      makeVelocityRecord({ completedPoints: 10, durationDays: 14 }),
    ]
    const result = computeVelocity(declining)
    expect(result.trend).toBe('declining')
  })

  it('detects stable trend when velocities are similar', () => {
    const stable = [
      makeVelocityRecord({ completedPoints: 14, durationDays: 14 }),
      makeVelocityRecord({ completedPoints: 14, durationDays: 14 }),
      makeVelocityRecord({ completedPoints: 14, durationDays: 14 }),
      makeVelocityRecord({ completedPoints: 14, durationDays: 14 }),
    ]
    const result = computeVelocity(stable)
    expect(result.trend).toBe('stable')
  })

  it('handles records with durationDays <= 0 as zero velocity', () => {
    const history = [makeVelocityRecord({ completedPoints: 10, durationDays: 0 })]
    const result = computeVelocity(history)
    expect(result.average).toBe(0)
  })
})

// ─── predictSprintCompletion ────────────────────────────────

describe('predictSprintCompletion', () => {
  describe('input validation', () => {
    it('returns safe defaults when totalTasks <= 0', () => {
      const result = predictSprintCompletion(5, 0, 0, 3, 14, SAMPLE_HISTORY)
      expect(result.completionProbability).toBe(0)
      expect(result.isReliable).toBe(false)
      expect(result.warningMessage).toBeDefined()
    })

    it('returns safe defaults when totalTasks is negative', () => {
      const result = predictSprintCompletion(5, 0, -1, 3, 14, SAMPLE_HISTORY)
      expect(result.completionProbability).toBe(0)
      expect(result.isReliable).toBe(false)
    })

    it('returns safe defaults when totalDays <= 0', () => {
      const result = predictSprintCompletion(5, 5, 10, 3, 0, SAMPLE_HISTORY)
      expect(result.completionProbability).toBe(0)
      expect(result.isReliable).toBe(false)
      expect(result.warningMessage).toBeDefined()
    })

    it('returns safe defaults when totalDays is negative', () => {
      const result = predictSprintCompletion(5, 5, 10, 3, -1, SAMPLE_HISTORY)
      expect(result.completionProbability).toBe(0)
      expect(result.isReliable).toBe(false)
    })
  })

  describe('all tasks completed', () => {
    it('returns 100% probability when all tasks are done', () => {
      const result = predictSprintCompletion(0, 10, 10, 7, 14, SAMPLE_HISTORY)
      expect(result.completionProbability).toBe(100)
    })

    it('returns 100% when completedTasks exceeds totalTasks', () => {
      const result = predictSprintCompletion(0, 12, 10, 7, 14, SAMPLE_HISTORY)
      expect(result.completionProbability).toBe(100)
    })
  })

  describe('with velocity history', () => {
    it('returns probability in [0, 100]', () => {
      const result = predictSprintCompletion(5, 5, 10, 7, 14, SAMPLE_HISTORY)
      expect(result.completionProbability).toBeGreaterThanOrEqual(0)
      expect(result.completionProbability).toBeLessThanOrEqual(100)
    })

    it('marks prediction as reliable with >= 3 history records', () => {
      const result = predictSprintCompletion(5, 5, 10, 7, 14, SAMPLE_HISTORY)
      expect(result.isReliable).toBe(true)
      expect(result.warningMessage).toBeUndefined()
    })

    it('marks prediction as unreliable with < 3 history records', () => {
      const shortHistory = SAMPLE_HISTORY.slice(0, 2)
      const result = predictSprintCompletion(5, 5, 10, 7, 14, shortHistory)
      expect(result.isReliable).toBe(false)
      expect(result.warningMessage).toBeDefined()
    })

    it('higher completion ratio yields higher probability', () => {
      // Same sprint parameters, different completion levels
      const lowCompletion = predictSprintCompletion(8, 2, 10, 7, 14, SAMPLE_HISTORY)
      const highCompletion = predictSprintCompletion(2, 8, 10, 7, 14, SAMPLE_HISTORY)
      expect(highCompletion.completionProbability).toBeGreaterThanOrEqual(
        lowCompletion.completionProbability
      )
    })
  })

  describe('without velocity history', () => {
    it('uses linear extrapolation when no history available', () => {
      const result = predictSprintCompletion(5, 5, 10, 7, 14, [])
      expect(result.completionProbability).toBeGreaterThanOrEqual(0)
      expect(result.completionProbability).toBeLessThanOrEqual(100)
      expect(result.isReliable).toBe(false)
    })

    it('returns 0 probability when no progress and time elapsed', () => {
      const result = predictSprintCompletion(10, 0, 10, 7, 14, [])
      expect(result.completionProbability).toBe(0)
    })

    it('handles daysElapsed = 0 gracefully', () => {
      const result = predictSprintCompletion(10, 0, 10, 0, 14, [])
      expect(result.completionProbability).toBeGreaterThanOrEqual(0)
      expect(result.completionProbability).toBeLessThanOrEqual(100)
    })
  })

  describe('confidence interval ordering', () => {
    it('ensures optimistic <= mostLikely <= pessimistic', () => {
      const result = predictSprintCompletion(5, 5, 10, 7, 14, SAMPLE_HISTORY)
      const optimistic = new Date(result.confidence.optimistic).getTime()
      const mostLikely = new Date(result.confidence.mostLikely).getTime()
      const pessimistic = new Date(result.confidence.pessimistic).getTime()
      expect(optimistic).toBeLessThanOrEqual(mostLikely)
      expect(mostLikely).toBeLessThanOrEqual(pessimistic)
    })

    it('confidence interval is ordered even with no history', () => {
      const result = predictSprintCompletion(5, 5, 10, 7, 14, [])
      const optimistic = new Date(result.confidence.optimistic).getTime()
      const mostLikely = new Date(result.confidence.mostLikely).getTime()
      const pessimistic = new Date(result.confidence.pessimistic).getTime()
      expect(optimistic).toBeLessThanOrEqual(mostLikely)
      expect(mostLikely).toBeLessThanOrEqual(pessimistic)
    })

    it('all dates are equal when all tasks completed', () => {
      const result = predictSprintCompletion(0, 10, 10, 7, 14, SAMPLE_HISTORY)
      expect(result.confidence.optimistic).toBe(result.confidence.mostLikely)
      expect(result.confidence.mostLikely).toBe(result.confidence.pessimistic)
    })
  })

  describe('predicted end date', () => {
    it('returns valid ISO 8601 date string', () => {
      const result = predictSprintCompletion(5, 5, 10, 7, 14, SAMPLE_HISTORY)
      expect(() => new Date(result.predictedEndDate)).not.toThrow()
      expect(new Date(result.predictedEndDate).toISOString()).toBe(
        result.predictedEndDate
      )
    })
  })
})

// ─── shouldTriggerAlert ─────────────────────────────────────

describe('shouldTriggerAlert', () => {
  it('returns true when probability < 60', () => {
    const prediction: SprintPrediction = {
      completionProbability: 59,
      predictedEndDate: new Date().toISOString(),
      confidence: {
        optimistic: new Date().toISOString(),
        mostLikely: new Date().toISOString(),
        pessimistic: new Date().toISOString(),
      },
      isReliable: true,
    }
    expect(shouldTriggerAlert(prediction)).toBe(true)
  })

  it('returns true when probability is 0', () => {
    const prediction: SprintPrediction = {
      completionProbability: 0,
      predictedEndDate: new Date().toISOString(),
      confidence: {
        optimistic: new Date().toISOString(),
        mostLikely: new Date().toISOString(),
        pessimistic: new Date().toISOString(),
      },
      isReliable: true,
    }
    expect(shouldTriggerAlert(prediction)).toBe(true)
  })

  it('returns false when probability is exactly 60', () => {
    const prediction: SprintPrediction = {
      completionProbability: 60,
      predictedEndDate: new Date().toISOString(),
      confidence: {
        optimistic: new Date().toISOString(),
        mostLikely: new Date().toISOString(),
        pessimistic: new Date().toISOString(),
      },
      isReliable: true,
    }
    expect(shouldTriggerAlert(prediction)).toBe(false)
  })

  it('returns false when probability > 60', () => {
    const prediction: SprintPrediction = {
      completionProbability: 85,
      predictedEndDate: new Date().toISOString(),
      confidence: {
        optimistic: new Date().toISOString(),
        mostLikely: new Date().toISOString(),
        pessimistic: new Date().toISOString(),
      },
      isReliable: true,
    }
    expect(shouldTriggerAlert(prediction)).toBe(false)
  })

  it('returns false when probability is 100', () => {
    const prediction: SprintPrediction = {
      completionProbability: 100,
      predictedEndDate: new Date().toISOString(),
      confidence: {
        optimistic: new Date().toISOString(),
        mostLikely: new Date().toISOString(),
        pessimistic: new Date().toISOString(),
      },
      isReliable: true,
    }
    expect(shouldTriggerAlert(prediction)).toBe(false)
  })
})
