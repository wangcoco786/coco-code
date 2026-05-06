import { useRef, useCallback } from 'react'
import type { VelocityChartData } from '@/types/platform'
import { useI18n } from '@/context/I18nContext'
import { exportChartToPng } from './exportChart'
import styles from './Charts.module.css'

interface VelocityChartProps {
  data: VelocityChartData
  title?: string
}

/**
 * Velocity Chart — SVG bar chart showing completed story points
 * for the last N sprints with an average line overlay.
 */
export default function VelocityChart({ data, title }: VelocityChartProps) {
  const { t } = useI18n()
  const svgRef = useRef<SVGSVGElement>(null)

  const resolvedTitle = title ?? t('chart.velocityTrend')

  const handleExport = useCallback(() => {
    if (svgRef.current) {
      exportChartToPng(svgRef.current, 'velocity-chart')
    }
  }, [])

  if (data.sprints.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>{resolvedTitle}</span>
        </div>
        <div className={styles.emptyState}>{t('chart.noSprintData')}</div>
      </div>
    )
  }

  // Chart dimensions
  const width = 400
  const height = 200
  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxVelocity = Math.max(...data.sprints.map((s) => Math.max(s.velocity, s.planned)), 1)
  const barWidth = Math.min(chartWidth / data.sprints.length * 0.6, 40)
  const barGap = chartWidth / data.sprints.length

  // Y-axis scale
  const yScale = (value: number) => chartHeight - (value / maxVelocity) * chartHeight

  // Average line Y position
  const avgY = yScale(data.averageVelocity)

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
        aria-label={`Velocity chart showing ${data.sprints.length} sprints`}
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
          const value = Math.round(maxVelocity * ratio)
          const y = padding.top + yScale(value)
          return (
            <text
              key={ratio}
              x={padding.left - 6}
              y={y + 4}
              textAnchor="end"
              className={styles.axisLabel}
            >
              {value}
            </text>
          )
        })}

        {/* Bars */}
        {data.sprints.map((sprint, i) => {
          const x = padding.left + i * barGap + (barGap - barWidth) / 2
          const barHeight = (sprint.velocity / maxVelocity) * chartHeight
          const y = padding.top + chartHeight - barHeight

          return (
            <g key={sprint.name}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                className={styles.velocityBar}
                aria-label={`${sprint.name}: ${sprint.velocity} points`}
              />
              {/* Value label on top of bar */}
              <text
                x={x + barWidth / 2}
                y={y - 4}
                className={styles.barLabel}
              >
                {sprint.velocity}
              </text>
              {/* Sprint name on x-axis */}
              <text
                x={x + barWidth / 2}
                y={padding.top + chartHeight + 14}
                className={styles.axisLabel}
                textAnchor="middle"
              >
                {sprint.name.length > 8 ? sprint.name.slice(0, 8) + '…' : sprint.name}
              </text>
            </g>
          )
        })}

        {/* Average line */}
        <line
          x1={padding.left}
          y1={padding.top + avgY}
          x2={padding.left + chartWidth}
          y2={padding.top + avgY}
          className={styles.averageLine}
        />
        <text
          x={padding.left + chartWidth + 2}
          y={padding.top + avgY + 4}
          className={styles.axisLabel}
          fontSize="10"
        >
          avg: {Math.round(data.averageVelocity)}
        </text>
      </svg>
    </div>
  )
}
