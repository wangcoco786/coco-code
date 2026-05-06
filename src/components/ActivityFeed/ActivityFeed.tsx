import { useI18n } from '@/context/I18nContext'
import type { ActivityItem } from '@/types/platform'
import styles from './ActivityFeed.module.css'

const ACTIVITY_ICONS: Record<string, string> = {
  task_created: '📝',
  status_change: '🔄',
  comment: '💬',
  assignment_change: '👤',
  priority_change: '⚡',
}

function formatRelativeTime(timestamp: string, t: (key: any) => string): string {
  const now = Date.now()
  const time = new Date(timestamp).getTime()
  const diffMs = now - time
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return t('notification.justNow')
  if (diffMin < 60) return `${diffMin} ${t('notification.minutesAgo')}`
  if (diffHr < 24) return `${diffHr} ${t('notification.hoursAgo')}`
  return `${diffDay} ${t('notification.daysAgo')}`
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  maxItems?: number
}

export default function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const { t } = useI18n()
  const displayItems = activities.slice(0, maxItems)

  if (displayItems.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>📋</span>
          <span className={styles.headerTitle}>{t('activity.title' as any)}</span>
        </div>
        <div className={styles.empty}>{t('activity.empty' as any)}</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>📋</span>
        <span className={styles.headerTitle}>{t('activity.title' as any)}</span>
      </div>
      <div className={styles.list}>
        {displayItems.map((item) => (
          <div key={item.id} className={styles.item}>
            <span className={styles.icon}>{ACTIVITY_ICONS[item.type] ?? '📌'}</span>
            <div className={styles.content}>
              <span className={styles.actor}>{item.actor.name}</span>
              <span className={styles.desc}>{item.description}</span>
              <span className={styles.target}>{item.target.title}</span>
            </div>
            <span className={styles.time}>{formatRelativeTime(item.timestamp, t)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
