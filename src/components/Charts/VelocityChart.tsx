import { useRef, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ECharts } from 'echarts'
import type { VelocityChartData } from '@/types/platform'
import { useI18n } from '@/context/I18nContext'
import styles from './Charts.module.css'

interface VelocityChartProps {
  data: VelocityChartData
  title?: string
}

/**
 * Velocity Chart — ECharts bar chart showing completed story points
 * for the last N sprints with an average markLine overlay.
 */
export default function VelocityChart({ data, title }: VelocityChartProps) {
  const { t } = useI18n()
  const echartRef = useRef<ReactECharts>(null)

  const resolvedTitle = title ?? t('chart.velocityTrend')

  const handleExport = useCallback(() => {
    const instance = echartRef.current?.getEchartsInstance() as ECharts | undefined
    if (!instance) return
    const url = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
    const link = document.createElement('a')
    link.download = 'velocity-chart.png'
    link.href = url
    link.click()
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

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      formatter: (params: any) => {
        const item = params[0]
        return `<strong>${item.name}</strong><br/>Velocity: ${item.value}`
      },
    },
    grid: {
      left: 40,
      right: 20,
      top: 20,
      bottom: 60,
      containLabel: false,
    },
    xAxis: {
      type: 'category' as const,
      data: data.sprints.map((s) => s.name),
      axisLabel: {
        rotate: 30,
        fontSize: 11,
        color: '#999',
      },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 11, color: '#999' },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLine: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: data.sprints.map((s) => s.velocity),
        itemStyle: {
          color: '#1677ff',
          borderRadius: [4, 4, 0, 0],
        },
        barMaxWidth: 40,
        label: {
          show: true,
          position: 'top' as const,
          fontSize: 11,
          fontWeight: 600,
          color: '#333',
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: '#ff4d4f',
            type: 'dashed' as const,
            width: 1.5,
          },
          data: [
            {
              yAxis: data.averageVelocity,
              label: {
                formatter: `avg: ${Math.round(data.averageVelocity)}`,
                position: 'end' as const,
                fontSize: 10,
                color: '#ff4d4f',
              },
            },
          ],
        },
      },
    ],
    animationDuration: 600,
    animationEasing: 'cubicOut',
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>{resolvedTitle}</span>
        <button className={styles.exportBtn} onClick={handleExport} aria-label="Export chart as PNG">
          {t('chart.exportPng')}
        </button>
      </div>
      <ReactECharts
        ref={echartRef}
        option={option}
        style={{ height: 300 }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  )
}
