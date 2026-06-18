import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/context/NotificationContext'
import { useApp } from '@/context/AppContext'
import { useI18n } from '@/context/I18nContext'
import { filterNotifications } from '@/lib/notificationEngine'
import type { NotificationType, PlatformNotification } from '@/types/platform'
import styles from './NotificationCenter.module.css'

type FilterCategory = NotificationType | 'all' | 'unread'

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'risk': return '⚠️'
    case 'task': return '📋'
    case 'mention': return '💬'
    case 'automation': return '⚙️'
    case 'system': return 'ℹ️'
    default: return '🔔'
  }
}

export default function NotificationCenter() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { currentProjectKey } = useApp()
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
  } = useNotifications()

  // 只显示当前项目的通知（没有projectKey的通知是全局通知，始终显示）
  const projectNotifications = useMemo(
    () => notifications.filter(n => {
      const pk = n.metadata?.projectKey as string | undefined
      if (!pk) return true // 全局通知始终显示
      return pk === currentProjectKey
    }),
    [notifications, currentProjectKey]
  )

  const TABS: { key: FilterCategory; label: string }[] = [
    { key: 'all', label: t('notification.all') },
    { key: 'unread', label: t('notification.unread') },
    { key: 'risk', label: t('notification.risk') },
    { key: 'task', label: t('notification.task') },
    { key: 'system', label: t('notification.system') },
  ]

  function timeAgo(dateStr: string): string {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diffMs = now - then
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return t('notification.justNow')
    if (diffMin < 60) return `${diffMin} ${t('notification.minutesAgo')}`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours} ${t('notification.hoursAgo')}`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays} ${t('notification.daysAgo')}`
    return new Date(dateStr).toLocaleDateString()
  }

  const [activeTab, setActiveTab] = useState<FilterCategory>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredNotifications = useMemo(
    () => filterNotifications(projectNotifications, activeTab),
    [projectNotifications, activeTab]
  )

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)))
    }
  }, [filteredNotifications, selectedIds.size])

  const handleBatchMarkRead = useCallback(() => {
    if (selectedIds.size > 0) {
      markAsRead(Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }, [selectedIds, markAsRead])

  const handleBatchDelete = useCallback(() => {
    if (selectedIds.size > 0) {
      deleteNotifications(Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }, [selectedIds, deleteNotifications])

  const handleNotificationClick = useCallback(
    (notification: PlatformNotification) => {
      if (!notification.read) {
        markAsRead([notification.id])
      }
      if (notification.actionUrl) {
        navigate(notification.actionUrl)
      }
    },
    [markAsRead, navigate]
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('notification.title')}</h1>
        <div className={styles.actions}>
          {selectedIds.size > 0 && (
            <>
              <button className={styles.actionBtn} onClick={handleBatchMarkRead}>
                {t('notification.markRead')} ({selectedIds.size})
              </button>
              <button className={styles.dangerBtn} onClick={handleBatchDelete}>
                {t('notification.delete')} ({selectedIds.size})
              </button>
            </>
          )}
          <button className={styles.actionBtn} onClick={handleSelectAll}>
            {selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0
              ? t('notification.deselectAll')
              : t('notification.selectAll')}
          </button>
          <button className={styles.actionBtn} onClick={markAllAsRead}>
            {t('notification.markAllRead')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? styles.tabActive : styles.tab}
            onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className={styles.list}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.empty}>{t('notification.empty')}</div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={notification.read ? styles.item : styles.itemUnread}
              onClick={() => handleNotificationClick(notification)}
            >
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedIds.has(notification.id)}
                onChange={(e) => { e.stopPropagation(); toggleSelect(notification.id) }}
                onClick={(e) => e.stopPropagation()}
                aria-label={`${t('notification.selectAll')}: ${notification.title}`}
              />
              <div className={styles.icon}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className={styles.content}>
                <div className={styles.itemTitle}>{notification.title}</div>
                <div className={styles.message}>{notification.message}</div>
                <div className={styles.time}>{timeAgo(notification.createdAt)}</div>
              </div>
              <div className={styles.itemActions}>
                {!notification.read && (
                  <button
                    className={styles.itemBtn}
                    onClick={(e) => { e.stopPropagation(); markAsRead([notification.id]) }}
                    title={t('notification.markRead')}
                  >
                    ✓
                  </button>
                )}
                <button
                  className={styles.itemBtn}
                  onClick={(e) => { e.stopPropagation(); deleteNotifications([notification.id]) }}
                  title={t('notification.delete')}
                >
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
