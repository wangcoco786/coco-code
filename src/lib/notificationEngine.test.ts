import { describe, it, expect } from 'vitest'
import {
  filterNotifications,
  computeUnreadCount,
  batchMarkAsRead,
} from './notificationEngine'
import type { PlatformNotification } from '@/types/platform'

// ─── helpers ────────────────────────────────────────────────

function makeNotification(
  overrides: Partial<PlatformNotification> = {}
): PlatformNotification {
  return {
    id: 'notif-1',
    type: 'task',
    title: 'Test Notification',
    message: 'This is a test notification',
    createdAt: '2025-01-15T10:00:00Z',
    read: false,
    priority: 'normal',
    ...overrides,
  }
}

const SAMPLE_NOTIFICATIONS: PlatformNotification[] = [
  makeNotification({ id: 'n1', type: 'risk', read: false }),
  makeNotification({ id: 'n2', type: 'task', read: true }),
  makeNotification({ id: 'n3', type: 'system', read: false }),
  makeNotification({ id: 'n4', type: 'mention', read: true }),
  makeNotification({ id: 'n5', type: 'automation', read: false }),
  makeNotification({ id: 'n6', type: 'risk', read: true }),
  makeNotification({ id: 'n7', type: 'task', read: false }),
]

// ─── filterNotifications ────────────────────────────────────

describe('filterNotifications', () => {
  it('returns all notifications when category is "all"', () => {
    const result = filterNotifications(SAMPLE_NOTIFICATIONS, 'all')
    expect(result).toHaveLength(7)
    expect(result).toEqual(SAMPLE_NOTIFICATIONS)
  })

  it('returns only unread notifications when category is "unread"', () => {
    const result = filterNotifications(SAMPLE_NOTIFICATIONS, 'unread')
    expect(result).toHaveLength(4)
    expect(result.every((n) => !n.read)).toBe(true)
  })

  it('returns only risk notifications when category is "risk"', () => {
    const result = filterNotifications(SAMPLE_NOTIFICATIONS, 'risk')
    expect(result).toHaveLength(2)
    expect(result.every((n) => n.type === 'risk')).toBe(true)
  })

  it('returns only task notifications when category is "task"', () => {
    const result = filterNotifications(SAMPLE_NOTIFICATIONS, 'task')
    expect(result).toHaveLength(2)
    expect(result.every((n) => n.type === 'task')).toBe(true)
  })

  it('returns only system notifications when category is "system"', () => {
    const result = filterNotifications(SAMPLE_NOTIFICATIONS, 'system')
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('system')
  })

  it('returns empty array for empty input', () => {
    const result = filterNotifications([], 'all')
    expect(result).toHaveLength(0)
  })

  it('returns empty array when no notifications match category', () => {
    const notifications = [makeNotification({ type: 'risk' })]
    const result = filterNotifications(notifications, 'system')
    expect(result).toHaveLength(0)
  })
})

// ─── computeUnreadCount ─────────────────────────────────────

describe('computeUnreadCount', () => {
  it('returns 0 for empty array', () => {
    expect(computeUnreadCount([])).toBe(0)
  })

  it('counts unread notifications correctly', () => {
    expect(computeUnreadCount(SAMPLE_NOTIFICATIONS)).toBe(4)
  })

  it('returns 0 when all notifications are read', () => {
    const allRead = SAMPLE_NOTIFICATIONS.map((n) => ({ ...n, read: true }))
    expect(computeUnreadCount(allRead)).toBe(0)
  })

  it('returns total count when all notifications are unread', () => {
    const allUnread = SAMPLE_NOTIFICATIONS.map((n) => ({ ...n, read: false }))
    expect(computeUnreadCount(allUnread)).toBe(7)
  })
})

// ─── batchMarkAsRead ────────────────────────────────────────

describe('batchMarkAsRead', () => {
  it('marks specified notifications as read', () => {
    const result = batchMarkAsRead(SAMPLE_NOTIFICATIONS, ['n1', 'n3'])
    expect(result.find((n) => n.id === 'n1')?.read).toBe(true)
    expect(result.find((n) => n.id === 'n3')?.read).toBe(true)
  })

  it('does not change notifications not in the ids list', () => {
    const result = batchMarkAsRead(SAMPLE_NOTIFICATIONS, ['n1'])
    // n7 was unread and should remain unread
    expect(result.find((n) => n.id === 'n7')?.read).toBe(false)
    // n2 was already read and should remain read
    expect(result.find((n) => n.id === 'n2')?.read).toBe(true)
  })

  it('returns same array structure with empty ids', () => {
    const result = batchMarkAsRead(SAMPLE_NOTIFICATIONS, [])
    expect(result).toHaveLength(7)
    expect(computeUnreadCount(result)).toBe(4)
  })

  it('handles non-existent ids gracefully', () => {
    const result = batchMarkAsRead(SAMPLE_NOTIFICATIONS, ['non-existent'])
    expect(result).toHaveLength(7)
    expect(computeUnreadCount(result)).toBe(4)
  })

  it('does not mutate the original array', () => {
    const original = [makeNotification({ id: 'x1', read: false })]
    const result = batchMarkAsRead(original, ['x1'])
    expect(original[0].read).toBe(false)
    expect(result[0].read).toBe(true)
  })
})
