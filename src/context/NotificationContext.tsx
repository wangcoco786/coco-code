import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { PlatformNotification, NotificationPreferences, NotificationType } from '@/types/platform'
import { computeUnreadCount, batchMarkAsRead } from '@/lib/notificationEngine'
import { useApp } from '@/context/AppContext'

// ============================================================
// Context Types
// ============================================================

interface NotificationContextValue {
  notifications: PlatformNotification[]
  unreadCount: number
  preferences: NotificationPreferences
  addNotification: (notification: Omit<PlatformNotification, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (ids: string[]) => void
  markAllAsRead: () => void
  deleteNotifications: (ids: string[]) => void
  updatePreferences: (prefs: NotificationPreferences) => void
}

const PREFERENCES_KEY = 'ai-pm-notification-preferences'

const DEFAULT_PREFERENCES: NotificationPreferences = {
  wecomPush: ['risk', 'mention'] as NotificationType[],
  platformOnly: ['task', 'automation', 'system'] as NotificationType[],
}

// ============================================================
// Context
// ============================================================

const NotificationContext = createContext<NotificationContextValue | null>(null)

function loadPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY)
    if (stored) {
      return JSON.parse(stored) as NotificationPreferences
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_PREFERENCES
}

function savePreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
  } catch {
    // ignore storage errors
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(loadPreferences)
  const { setNotificationCount } = useApp()

  const unreadCount = useMemo(() => computeUnreadCount(notifications), [notifications])

  // Sync unread count to AppContext so Topbar badge stays in sync
  useEffect(() => {
    setNotificationCount(unreadCount)
  }, [unreadCount, setNotificationCount])

  const addNotification = useCallback(
    (notification: Omit<PlatformNotification, 'id' | 'createdAt' | 'read'>) => {
      const newNotification: PlatformNotification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        read: false,
      }
      setNotifications((prev) => [newNotification, ...prev])
    },
    []
  )

  const markAsRead = useCallback((ids: string[]) => {
    setNotifications((prev) => batchMarkAsRead(prev, ids))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const deleteNotifications = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setNotifications((prev) => prev.filter((n) => !idSet.has(n.id)))
  }, [])

  const updatePreferences = useCallback((prefs: NotificationPreferences) => {
    setPreferences(prefs)
    savePreferences(prefs)
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotifications,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return ctx
}
