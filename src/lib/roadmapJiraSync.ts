import type { JiraVersion } from '@/types/jira'
import type { RoadmapMilestone } from '@/types/roadmap'
import { jiraClient } from '@/lib/jiraClient'
import { addDays, formatDateStr } from './timelineCalculator'

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID() } catch { /* fallback */ }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// ============================================================
// Jira Version ↔ Roadmap Milestone sync utilities
// ============================================================

/**
 * Map a JiraVersion to a RoadmapMilestone.
 * Returns null if the version has no releaseDate (skip it).
 */
export function mapJiraVersionToMilestone(
  version: JiraVersion,
): RoadmapMilestone | null {
  if (!version.releaseDate) return null

  const endDate = version.releaseDate
  const startDate = formatDateStr(addDays(new Date(endDate), -14))
  const now = new Date().toISOString()

  return {
    id: generateId(),
    name: version.name,
    startDate,
    endDate,
    description: version.description ?? '',
    status: version.released ? 'completed' : 'planned',
    jiraVersionId: version.id,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Merge synced milestones into existing ones.
 * - If an existing milestone shares the same jiraVersionId, update it (keep existing id).
 * - Otherwise add the synced milestone as new.
 * - Existing milestones without jiraVersionId are kept unchanged.
 */
export function mergeSyncedMilestones(
  existing: RoadmapMilestone[],
  synced: RoadmapMilestone[],
): RoadmapMilestone[] {
  const now = new Date().toISOString()

  // Index synced milestones by jiraVersionId for quick lookup
  const syncedByVersionId = new Map<string, RoadmapMilestone>()
  for (const s of synced) {
    if (s.jiraVersionId) {
      syncedByVersionId.set(s.jiraVersionId, s)
    }
  }

  const usedVersionIds = new Set<string>()
  const result: RoadmapMilestone[] = []

  for (const e of existing) {
    if (e.jiraVersionId && syncedByVersionId.has(e.jiraVersionId)) {
      // Update existing milestone with synced data, keep existing id
      const s = syncedByVersionId.get(e.jiraVersionId)!
      result.push({
        ...e,
        name: s.name,
        endDate: s.endDate,
        startDate: s.startDate,
        status: s.status,
        updatedAt: now,
      })
      usedVersionIds.add(e.jiraVersionId)
    } else {
      // Keep unchanged
      result.push(e)
    }
  }

  // Add new synced milestones that didn't match any existing
  for (const s of synced) {
    if (s.jiraVersionId && !usedVersionIds.has(s.jiraVersionId)) {
      result.push(s)
    }
  }

  return result
}

/**
 * Fetch Jira versions for a project, map them to milestones, and merge
 * with existing milestones. Returns the merged list and the count of
 * skipped versions (those without a releaseDate).
 */
export async function syncJiraVersions(
  projectKey: string,
  existingMilestones: RoadmapMilestone[],
): Promise<{ milestones: RoadmapMilestone[]; skipped: number }> {
  const versions = await jiraClient.getVersions(projectKey)

  let skipped = 0
  const synced: RoadmapMilestone[] = []

  for (const v of versions) {
    const mapped = mapJiraVersionToMilestone(v)
    if (mapped) {
      synced.push(mapped)
    } else {
      skipped++
    }
  }

  const milestones = mergeSyncedMilestones(existingMilestones, synced)
  return { milestones, skipped }
}
