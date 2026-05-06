import { useRef, useCallback, useMemo } from 'react'
import type { HeatmapCell } from '@/types/platform'
import { useI18n } from '@/context/I18nContext'
import { exportChartToPng } from './exportChart'
import styles from './Charts.module.css'

interface HeatmapChartProps {
  data: HeatmapCell[]
  title?: string
}

/**
 * Heatmap Chart — SVG grid showing team member workload intensity.
 * Members on Y-axis, time periods on X-axis, color intensity represents load.
 */
export default function HeatmapChart({ data, title }: HeatmapChartProps) {
  const { t } = useI18n()
  const svgRef = useRef<SVGSVGElement>(null)

  const resolvedTitle = title ?? t('chart.teamHeatmap')

  const handleExport = useCallback(() => {
    if (svgRef.current) {
      exportChartToPng(svgRef.current, 'heatmap-chart')
    }
  }, [])

  // Derive unique members and periods from data
  const { members, periods } = useMemo(() => {
    const memberMap = new Map<string, string>()
    const periodSet = new Set<string>()

    for (const cell of data) {
      memberMap.set(cell.memberId, cell.memberName)
      periodSet.add(cell.period)
    }

    return {
      members: Array.from(memberMap.entries()).map(([id, name]) => ({ id, name })),
      periods: Array.from(periodSet),
    }
  }, [data])

  if (data.length === 0 || members.length === 0 || periods.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>{resolvedTitle}</span>
        </div>
        <div className={styles.emptyState}>{t('chart.noHeatmapData')}</div>
      </div>
    )
  }

  // Build a lookup map for quick cell access
  const cellMap = useMemo(() => {
    const map = new Map<string, HeatmapCell>()
    for (const cell of data) {
      map.set(`${cell.memberId}::${cell.period}`, cell)
    }
    return map
  }, [data])

  // Chart dimensions
  const cellSize = 28
  const labelWidth = 80
  const headerHeight = 30
  const padding = { top: 10, right: 10, bottom: 10, left: 10 }

  const gridWidth = periods.length * cellSize
  const gridHeight = members.length * cellSize
  const width = padding.left + labelWidth + gridWidth + padding.right
  const height = padding.top + headerHeight + gridHeight + padding.bottom

  /**
   * Compute cell fill color based on intensity (0-1).
   * Uses primary color with varying opacity.
   */
  function getCellColor(intensity: number): string {
    if (intensity === 0) return 'var(--bg)'
    // Map intensity to opacity range [0.15, 1.0]
    const opacity = 0.15 + intensity * 0.85
    return `rgba(22, 119, 255, ${opacity.toFixed(2)})`
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>{resolvedTitle}</span>
        <button className={styles.exportBtn} onClick={handleExport} aria-label="Export chart as PNG">
          {t('chart.exportPng')}
        </button>
      </div>
      <svg
        ref={svgRef}
        className={styles.chartSvg}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Team heatmap with ${members.length} members and ${periods.length} periods`}
      >
        {/* Period headers (X-axis) */}
        {periods.map((period, i) => (
          <text
            key={period}
            x={padding.left + labelWidth + i * cellSize + cellSize / 2}
            y={padding.top + headerHeight - 6}
            textAnchor="middle"
            className={styles.axisLabel}
            fontSize="9"
          >
            {period.length > 5 ? period.slice(0, 5) : period}
          </text>
        ))}

        {/* Member labels (Y-axis) and cells */}
        {members.map((member, rowIdx) => {
          const y = padding.top + headerHeight + rowIdx * cellSize
          return (
            <g key={member.id}>
              {/* Member name */}
              <text
                x={padding.left + labelWidth - 6}
                y={y + cellSize / 2 + 4}
                textAnchor="end"
                className={styles.heatmapLabel}
              >
                {member.name.length > 8 ? member.name.slice(0, 8) + '…' : member.name}
              </text>

              {/* Cells for each period */}
              {periods.map((period, colIdx) => {
                const cell = cellMap.get(`${member.id}::${period}`)
                const intensity = cell?.intensity ?? 0
                const taskCount = cell?.taskCount ?? 0
                const x = padding.left + labelWidth + colIdx * cellSize

                return (
                  <rect
                    key={`${member.id}-${period}`}
                    x={x + 2}
                    y={y + 2}
                    width={cellSize - 4}
                    height={cellSize - 4}
                    fill={getCellColor(intensity)}
                    className={styles.heatmapCell}
                    aria-label={`${member.name}, ${period}: ${taskCount} tasks (${Math.round(intensity * 100)}%)`}
                  >
                    <title>{`${member.name} - ${period}: ${taskCount} tasks`}</title>
                  </rect>
                )
              })}
            </g>
          )
        })}
      </svg>

      {/* Scale legend */}
      <div className={styles.heatmapScale}>
        <span>{t('chart.scaleLow')}</span>
        <span className={styles.scaleGradient} />
        <span>{t('chart.scaleHigh')}</span>
      </div>
    </div>
  )
}
