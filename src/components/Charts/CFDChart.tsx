import { useRef, useCallback } from 'react'
import type { CFDDataPoint } from '@/types/platform'
import { useI18n } from '@/context/I18nContext'
import { exportChartToPng } from './exportChart'
import styles from './Charts.module.css'

interface CFDChartProps {
  data: CFDDataPoint[]
  title?: string
}

const STATUS_COLORS = {
  done: '#52c41a',
  inTesting: '#13c2c2',
  inReview: '#722ed1',
  inProgress: '#1677ff',
  todo: '#8c8c8c',
} as const

type StatusKey = keyof typeof STATUS_COLORS

/**
 * CFD Chart — Stacked area chart showing cumulative flow of issues
 * across statuses over time.
 */
export default function CFDChart({ data, title }: CFDChartProps) {
  const { t } = useI18n()
  const svgRef = useRef<SVGSVGElement>(null)

  const resolvedTitle = title ?? t('chart.cumulativeFlowDiagram')

  const STATUS_LABELS: Record<StatusKey, string> = {
    done: t('chart.legend.done'),
    inTesting: t('chart.legend.testing'),
    inReview: t('chart.legend.review'),
    inProgress: t('chart.legend.inProgress'),
    todo: t('chart.legend.todo'),
  }

  const handleExport = useCallback(() => {
    if (svgRef.current) {
      exportChartToPng(svgRef.current, 'cfd-chart')
    }
  }, [])

  if (data.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>{resolvedTitle}</span>
        </div>
        <div className={styles.emptyState}>{t('chart.noFlowData')}</div>
      </div>
    )
  }

  // Chart dimensions
  const width = 400
  const height = 220
  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Compute max total for Y scale
  const maxTotal = Math.max(
    ...data.map((d) => d.todo + d.inProgress + d.inReview + d.inTesting + d.done),
    1,
  )

  // X scale: evenly distribute data points
  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth

  // Y scale
  const yScale = (value: number) => chartHeight - (value / maxTotal) * chartHeight

  // Build stacked areas (bottom to top: done, inTesting, inReview, inProgress, todo)
  const statusOrder: StatusKey[] = ['done', 'inTesting', 'inReview', 'inProgress', 'todo']

  // Compute cumulative values for each data point
  const stacked = data.map((d) => {
    const values: Record<StatusKey, number> = {
      done: d.done,
      inTesting: d.inTesting,
      inReview: d.inReview,
      inProgress: d.inProgress,
      todo: d.todo,
    }
    const cumulative: Record<StatusKey, { bottom: number; top: number }> = {} as never
    let acc = 0
    for (const status of statusOrder) {
      const bottom = acc
      acc += values[status]
      cumulative[status] = { bottom, top: acc }
    }
    return cumulative
  })

  // Generate SVG path for each status area
  function buildAreaPath(status: StatusKey): string {
    const points = stacked.map((s, i) => ({
      x: padding.left + i * xStep,
      topY: padding.top + yScale(s[status].top),
      bottomY: padding.top + yScale(s[status].bottom),
    }))

    // Top line (left to right)
    const topLine = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.topY}`).join(' ')
    // Bottom line (right to left)
    const bottomLine = points
      .slice()
      .reverse()
      .map((p, i) => `${i === 0 ? 'L' : 'L'} ${p.x} ${p.bottomY}`)
      .join(' ')

    return `${topLine} ${bottomLine} Z`
  }

  // X-axis labels (show a subset to avoid crowding)
  const labelInterval = Math.max(1, Math.floor(data.length / 6))

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
        aria-label="Cumulative flow diagram"
      >
        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          className={styles.axisLine}
        />
        {/* X-axis */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          className={styles.axisLine}
        />

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = Math.round(maxTotal * ratio)
          const y = padding.top + yScale(value)
          return (
            <text key={ratio} x={padding.left - 6} y={y + 4} textAnchor="end" className={styles.axisLabel}>
              {value}
            </text>
          )
        })}

        {/* Stacked areas */}
        {statusOrder.map((status) => (
          <path
            key={status}
            d={buildAreaPath(status)}
            fill={STATUS_COLORS[status]}
            className={styles.cfdArea}
          />
        ))}

        {/* X-axis date labels */}
        {data.map((d, i) => {
          if (i % labelInterval !== 0 && i !== data.length - 1) return null
          const x = padding.left + i * xStep
          return (
            <text
              key={d.date}
              x={x}
              y={padding.top + chartHeight + 14}
              textAnchor="middle"
              className={styles.axisLabel}
            >
              {d.date.slice(5)}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div className={styles.cfdLegend}>
        {statusOrder.slice().reverse().map((status) => (
          <span key={status} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: STATUS_COLORS[status] }} />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>
    </div>
  )
}
