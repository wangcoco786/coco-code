import { useRef, useCallback, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ECharts } from 'echarts'
import type { HeatmapCell } from '@/types/platform'
import { useI18n } from '@/context/I18nContext'
import styles from './Charts.module.css'

interface HeatmapChartProps {
  data: HeatmapCell[]
  title?: string
}

/**
 * Heatmap Chart — ECharts heatmap grid showing team member workload intensity.
 * Members on Y-axis, time periods on X-axis, color intensity represents load.
 */
export default function HeatmapChart({ data, title }: HeatmapChartProps) {
  const { t } = useI18n()
  const echartRef = useRef<ReactECharts>(null)

  const resolvedTitle = title ?? t('chart.teamHeatmap')

  const handleExport = useCallback(() => {
    const instance = echartRef.current?.getEchartsInstance() as ECharts | undefined
    if (!instance) return
    const url = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
    const link = document.createElement('a')
    link.download = 'heatmap-chart.png'
    link.href = url
    link.click()
  }, [])

  // Derive unique members and periods from data
  const { members, periods, maxTaskCount } = useMemo(() => {
    const memberMap = new Map<string, string>()
    const periodSet = new Set<string>()
    let maxCount = 0

    for (const cell of data) {
      memberMap.set(cell.memberId, cell.memberName)
      periodSet.add(cell.period)
      if (cell.taskCount > maxCount) maxCount = cell.taskCount
    }

    return {
      members: Array.from(memberMap.entries()).map(([id, name]) => ({ id, name })),
      periods: Array.from(periodSet),
      maxTaskCount: maxCount,
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

  // Build heatmap data: [periodIndex, memberIndex, value]
  const heatmapData = useMemo(() => {
    const result: [number, number, number][] = []
    const memberIndexMap = new Map(members.map((m, i) => [m.id, i]))
    const periodIndexMap = new Map(periods.map((p, i) => [p, i]))

    for (const cell of data) {
      const mIdx = memberIndexMap.get(cell.memberId)
      const pIdx = periodIndexMap.get(cell.period)
      if (mIdx !== undefined && pIdx !== undefined) {
        result.push([pIdx, mIdx, cell.taskCount])
      }
    }
    return result
  }, [data, members, periods])

  const option = {
    tooltip: {
      position: 'top' as const,
      formatter: (params: any) => {
        const [pIdx, mIdx, value] = params.data
        const memberName = members[mIdx]?.name ?? ''
        const period = periods[pIdx] ?? ''
        return `<strong>${memberName}</strong><br/>${period}<br/>Tasks: ${value}`
      },
    },
    grid: {
      left: 90,
      right: 40,
      top: 10,
      bottom: 50,
      containLabel: false,
    },
    xAxis: {
      type: 'category' as const,
      data: periods.map((p) => (p.length > 5 ? p.slice(0, 5) : p)),
      axisLabel: { fontSize: 10, color: '#999' },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisTick: { show: false },
      splitArea: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: members.map((m) => (m.name.length > 10 ? m.name.slice(0, 10) + '…' : m.name)),
      axisLabel: { fontSize: 11, color: '#666' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitArea: { show: false },
    },
    visualMap: {
      min: 0,
      max: maxTaskCount || 1,
      calculable: false,
      orient: 'horizontal' as const,
      left: 'center' as const,
      bottom: 0,
      itemWidth: 12,
      itemHeight: 80,
      textStyle: { fontSize: 10, color: '#999' },
      text: [t('chart.scaleHigh'), t('chart.scaleLow')],
      inRange: {
        color: ['#e6f4ff', '#91caff', '#4096ff', '#1677ff', '#0958d9'],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: heatmapData,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          borderRadius: 3,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 6,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
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
