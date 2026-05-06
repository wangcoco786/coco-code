import type { ActivityItem } from '@/types/platform'

// ─── Core Functions ─────────────────────────────────────────

/**
 * Sorts activities by timestamp descending and limits to N items.
 * Default limit is 50.
 */
export function sortAndLimitActivities(
  activities: ActivityItem[],
  limit: number = 50
): ActivityItem[] {
  const sorted = [...activities].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime()
    const timeB = new Date(b.timestamp).getTime()
    return timeB - timeA // descending (newest first)
  })

  return sorted.slice(0, Math.max(0, limit))
}
