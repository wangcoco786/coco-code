import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/context/NotificationContext'
import { filterNotifications } from '@/lib/notificationEngine'
import type { NotificationType, PlatformNotification } from '@/types/platform'
import styles from './NotificationCenter.module.css'

type FilterCategory = NotificationType | 'all' | 'unread'

const TABS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'risk', label: '风险' },
  { key: 'task', label: '任务' },
  { key: 'system', label: '系统' },
]

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

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} 小时前`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} 天前`
  return new Date(dateStr).toLocaleDateString()
}

export default function NotificationCenter() {
  const navigate = useNavigate()
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
  } = useNotifications()

  const [activeTab, setActiveTab] = useState<FilterCategory>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredNotifications = useMemo(
    () => filterNotifications(notifications, activeTab),
    [notifications, activeTab]
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
        <h1 className={styles.title}>通知中心</h1>
        <div className={styles.actions}>
          {selectedIds.size > 0 && (
            <>
              <button className={styles.actionBtn} onClick={handleBatchMarkRead}>
                标记已读 ({selectedIds.size})
              </button>
              <button className={styles.dangerBtn} onClick={handleBatchDelete}>
                删除 ({selectedIds.size})
              </button>
            </>
          )}
          <button className={styles.actionBtn} onClick={handleSelectAll}>
            {selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0
              ? '取消全选'
              : '全选'}
          </button>
          <button className={styles.actionBtn} onClick={markAllAsRead}>
            全部标记已读
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
          <div className={styles.empty}>暂无通知</div>
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
                aria-label={`选择通知: ${notification.title}`}
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
                    title="标记已读"
                  >
                    ✓
                  </button>
                )}
                <button
                  className={styles.itemBtn}
                  onClick={(e) => { e.stopPropagation(); deleteNotifications([notification.id]) }}
                  title="删除"
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
