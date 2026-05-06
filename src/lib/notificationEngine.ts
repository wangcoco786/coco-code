import type { PlatformNotification, NotificationType } from '@/types/platform'

/**
 * Filter notifications by category.
 * - 'all': returns all notifications
 * - 'unread': returns only unread notifications
 * - NotificationType ('risk'|'task'|'mention'|'automation'|'system'): returns notifications of that type
 */
export function filterNotifications(
  notifications: PlatformNotification[],
  category: NotificationType | 'all' | 'unread'
): PlatformNotification[] {
  if (category === 'all') {
    return notifications
  }
  if (category === 'unread') {
    return notifications.filter((n) => !n.read)
  }
  return notifications.filter((n) => n.type === category)
}

/**
 * Compute the number of unread notifications.
 */
export function computeUnreadCount(notifications: PlatformNotification[]): number {
  return notifications.filter((n) => !n.read).length
}

/**
 * Batch mark notifications as read by IDs.
 * Returns a new array with the specified notifications marked as read.
 * Notifications not in the ids list remain unchanged.
 */
export function batchMarkAsRead(
  notifications: PlatformNotification[],
  ids: string[]
): PlatformNotification[] {
  const idSet = new Set(ids)
  return notifications.map((n) =>
    idSet.has(n.id) ? { ...n, read: true } : n
  )
}
