import { useRef, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ECharts } from 'echarts'
import type { CFDDataPoint } from '@/types/platform'
import { useI18n } from '@/context/I18nContext'
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

/**
 * CFD Chart — ECharts stacked area chart showing cumulative flow
 * of issues across statuses over time.
 */
export default function CFDChart({ data, title }: CFDChartProps) {
  const { t } = useI18n()
  const echartRef = useRef<ReactECharts>(null)

  const resolvedTitle = title ?? t('chart.cumulativeFlowDiagram')

  const STATUS_LABELS: Record<string, string> = {
    done: t('chart.legend.done'),
    inTesting: t('chart.legend.testing'),
    inReview: t('chart.legend.review'),
    inProgress: t('chart.legend.inProgress'),
    todo: t('chart.legend.todo'),
  }

  const handleExport = useCallback(() => {
    const instance = echartRef.current?.getEchartsInstance() as ECharts | undefined
    if (!instance) return
    const url = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
    const link = document.createElement('a')
    link.download = 'cfd-chart.png'
    link.href = url
    link.click()
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

  // Stack order: done (bottom) → inTesting → inReview → inProgress → todo (top)
  const statusOrder = ['done', 'inTesting', 'inReview', 'inProgress', 'todo'] as const

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'cross' as const, label: { backgroundColor: '#6a7985' } },
    },
    legend: {
      data: statusOrder.map((s) => STATUS_LABELS[s]),
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    grid: {
      left: 40,
      right: 20,
      top: 20,
      bottom: 50,
      containLabel: false,
    },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: data.map((d) => d.date.slice(5)), // show MM-DD
      axisLabel: { fontSize: 11, color: '#999' },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 11, color: '#999' },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLine: { show: false },
    },
    series: statusOrder.map((status) => ({
      name: STATUS_LABELS[status],
      type: 'line',
      stack: 'total',
      areaStyle: { opacity: 0.85 },
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1 },
      itemStyle: { color: STATUS_COLORS[status] },
      emphasis: { focus: 'series' as const },
      data: data.map((d) => d[status]),
    })),
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
