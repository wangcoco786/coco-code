import { useEffect, useRef, useMemo } from 'react'
import type { RoadmapMilestone, KeyNode } from '@/types/roadmap'
import {
  computeTimelineRange,
  computeMilestoneBar,
  computePixelPosition,
  isOverdue,
} from '@/lib/timelineCalculator'
import { useI18n } from '@/context/I18nContext'
import styles from './Roadmap.module.css'

const MONTH_WIDTH = 200

interface TimelineViewProps {
  milestones: RoadmapMilestone[]
  nodes: KeyNode[]
  onEditMilestone: (id: string) => void
  onEditNode: (id: string) => void
}

const STATUS_CLASS: Record<string, string> = {
  planned: styles.milestoneBarPlanned,
  in_progress: styles.milestoneBarInProgress,
  completed: styles.milestoneBarCompleted,
  delayed: styles.milestoneBarDelayed,
}

const NODE_CLASS: Record<string, string> = {
  release: styles.nodeRelease,
  review: styles.nodeReview,
  deadline: styles.nodeDeadline,
  custom: styles.nodeCustom,
}

export default function TimelineView({
  milestones,
  nodes,
  onEditMilestone,
  onEditNode,
}: TimelineViewProps) {
  const { t } = useI18n()
  const scrollRef = useRef<HTMLDivElement>(null)

  const range = useMemo(
    () => computeTimelineRange(milestones, nodes),
    [milestones, nodes],
  )

  const totalWidth = range.months.length * MONTH_WIDTH
  const isEmpty = milestones.length === 0 && nodes.length === 0

  // Auto-scroll to today on mount
  useEffect(() => {
    if (!scrollRef.current || isEmpty) return
    const todayPx = computePixelPosition(new Date(), range, totalWidth)
    const container = scrollRef.current
    container.scrollLeft = Math.max(0, todayPx - container.clientWidth / 2)
  }, [range, totalWidth, isEmpty])

  if (isEmpty) {
    return (
      <div className={styles.timelineContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🗺️</div>
          <div className={styles.emptyStateText}>{t('roadmap.emptyState')}</div>
        </div>
      </div>
    )
  }

  const todayPx = computePixelPosition(new Date(), range, totalWidth)

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timelineScroll} ref={scrollRef}>
        {/* Month headers */}
        <div className={styles.monthHeaderRow} style={{ width: totalWidth }}>
          {range.months.map((m) => (
            <div
              key={m.label}
              className={styles.monthHeader}
              style={{ width: MONTH_WIDTH }}
            >
              {m.label}
            </div>
          ))}
        </div>

        {/* Timeline body */}
        <div style={{ position: 'relative', width: totalWidth }}>
          {/* Month grid lines */}
          <div className={styles.monthGridRow} style={{ width: totalWidth }}>
            {range.months.map((m) => (
              <div
                key={m.label}
                className={styles.monthCol}
                style={{ width: MONTH_WIDTH }}
              />
            ))}
          </div>

          {/* Milestone bars */}
          <div className={styles.milestonesArea}>
            {milestones.map((ms) => {
              const { left, width } = computeMilestoneBar(ms, range, totalWidth)
              const overdue = isOverdue(ms)
              const cls = overdue
                ? styles.milestoneBarOverdue
                : STATUS_CLASS[ms.status] || styles.milestoneBarPlanned
              return (
                <div key={ms.id} className={styles.milestoneRow}>
                  <div
                    className={`${styles.milestoneBar} ${cls}`}
                    style={{ left, width: Math.max(width, 24) }}
                    onClick={() => onEditMilestone(ms.id)}
                    title={ms.name}
                  >
                    <span className={styles.milestoneLabel}>{ms.name}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Key node markers */}
          <div className={styles.nodesArea}>
            {nodes.map((nd) => {
              const px = computePixelPosition(new Date(nd.date), range, totalWidth)
              const cls = NODE_CLASS[nd.type] || styles.nodeCustom
              return (
                <div
                  key={nd.id}
                  className={`${styles.nodeMarker} ${cls}`}
                  style={{ left: px, top: 12 }}
                  onClick={() => onEditNode(nd.id)}
                >
                  <span className={styles.nodeTooltip}>{nd.name}</span>
                </div>
              )
            })}
          </div>

          {/* Today line */}
          {todayPx >= 0 && todayPx <= totalWidth && (
            <div className={styles.todayLine} style={{ left: todayPx }}>
              <span className={styles.todayLabel}>{t('roadmap.today')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
