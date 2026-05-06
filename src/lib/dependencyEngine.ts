import type { RoadmapMilestone } from '@/types/roadmap'
import type { MilestoneDependency, DelayPropagation } from '@/types/platform'

/**
 * Compute the number of days between two YYYY-MM-DD date strings.
 * Returns (dateB - dateA) in days.
 */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00Z')
  const b = new Date(dateB + 'T00:00:00Z')
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Add days to a YYYY-MM-DD date string and return a new YYYY-MM-DD string.
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Propagate a delay through a dependency graph (DAG) starting from a changed milestone.
 *
 * Logic:
 * 1. Find the changed milestone and compute delayDays = newEndDate - originalEndDate
 * 2. Build adjacency list from dependencies (fromId → toId[])
 * 3. BFS from changedMilestoneId through the dependency graph
 * 4. For finish-to-start: shift both startDate and endDate by the delay amount
 * 5. For start-to-start: shift startDate by the delay amount, endDate shifts accordingly
 * 6. Return DelayPropagation[] for all affected milestones
 * 7. Upstream milestones are NOT affected
 * 8. The changed milestone itself is included with isDirectlyAffected=true
 *
 * Edge cases:
 * - Empty milestones/dependencies: returns empty array
 * - Non-existent changedMilestoneId: returns empty array
 * - Circular dependencies: breaks cycles via visited set
 */
export function propagateDelay(
  milestones: RoadmapMilestone[],
  dependencies: MilestoneDependency[],
  changedMilestoneId: string,
  newEndDate: string
): DelayPropagation[] {
  if (milestones.length === 0) return []

  // Find the changed milestone
  const changedMilestone = milestones.find((m) => m.id === changedMilestoneId)
  if (!changedMilestone) return []

  // Compute delay in days
  const delayDays = daysBetween(changedMilestone.endDate, newEndDate)
  if (delayDays === 0) return []

  // Build milestone lookup
  const milestoneMap = new Map<string, RoadmapMilestone>()
  for (const m of milestones) {
    milestoneMap.set(m.id, m)
  }

  // Build adjacency list: fromId → { toId, type }[]
  const adjacency = new Map<string, { toId: string; type: MilestoneDependency['type'] }[]>()
  for (const dep of dependencies) {
    if (!adjacency.has(dep.fromId)) {
      adjacency.set(dep.fromId, [])
    }
    adjacency.get(dep.fromId)!.push({ toId: dep.toId, type: dep.type })
  }

  const result: DelayPropagation[] = []

  // Add the changed milestone itself
  result.push({
    milestoneId: changedMilestoneId,
    originalEndDate: changedMilestone.endDate,
    newEndDate,
    delayDays,
    isDirectlyAffected: true,
  })

  // BFS to propagate delay to downstream milestones
  const visited = new Set<string>([changedMilestoneId])
  const queue: { id: string; propagatedDelay: number }[] = [
    { id: changedMilestoneId, propagatedDelay: delayDays },
  ]

  while (queue.length > 0) {
    const current = queue.shift()!
    const neighbors = adjacency.get(current.id) || []

    for (const { toId, type } of neighbors) {
      if (visited.has(toId)) continue // Break cycles
      visited.add(toId)

      const downstream = milestoneMap.get(toId)
      if (!downstream) continue

      let newDownstreamEndDate: string

      if (type === 'finish-to-start') {
        // Shift both start and end dates by the propagated delay
        newDownstreamEndDate = addDays(downstream.endDate, current.propagatedDelay)
      } else {
        // start-to-start: shift start date by delay, end date shifts by same amount
        // (preserving duration)
        newDownstreamEndDate = addDays(downstream.endDate, current.propagatedDelay)
      }

      const downstreamDelay = daysBetween(downstream.endDate, newDownstreamEndDate)

      result.push({
        milestoneId: toId,
        originalEndDate: downstream.endDate,
        newEndDate: newDownstreamEndDate,
        delayDays: downstreamDelay,
        isDirectlyAffected: false,
      })

      // Continue propagation from this downstream milestone
      queue.push({ id: toId, propagatedDelay: downstreamDelay })
    }
  }

  return result
}

/**
 * Filter milestones by owner.
 * - If ownerFilter is null, return all milestones.
 * - Otherwise return only milestones where owner matches the filter (case-sensitive).
 */
export function filterMilestonesByOwner(
  milestones: RoadmapMilestone[],
  ownerFilter: string | null
): RoadmapMilestone[] {
  if (ownerFilter === null) {
    return milestones
  }
  return milestones.filter((m) => m.owner === ownerFilter)
}
