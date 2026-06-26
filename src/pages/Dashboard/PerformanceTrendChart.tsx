import { useRef, useCallback, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ECharts } from 'echarts'
import { useSprintHistory } from '@/hooks/useSprintHistory'
import { useQueries } from '@tanstack/react-query'
import { authFetch } from '@/lib/authFetch'
import { resolveProjectKeys } from '@/lib/projectGroups'
import { calculateDepartmentPerformance } from '@/lib/performanceEngine'
import { transformToPerformanceIssue } from '@/hooks/usePerformanceData'
import styles from './PerformanceView.module.css'

interface Props {
  projectKey: string | null
}

const PERFORMANCE_FIELDS = [
  'summary', 'status', 'priority', 'assignee',
  'labels', 'created', 'updated', 'resolutiondate',
  'timeoriginalestimate', 'timespent',
  'customfield_10016', 'customfield_10004',
  'customfield_11000', 'customfield_11103',
  'issuelinks', 'comment', 'issuetype',
]

/**
 * 绩效趋势折线图 — 展示最近若干迭代的绩效评分变化趋势。
 * 包含：综合分、吞吐、效率、质量等维度折线。
 */
export default function PerformanceTrendChart({ projectKey }: Props) {
  const echartRef = useRef<ReactECharts>(null)
  const { sprints, isLoading: isSprintsLoading } = useSprintHistory(projectKey, 8)

  // 为每个 sprint 并行拉取绩效数据
  const sprintQueries = useQueries({
    queries: sprints.map(sprint => ({
      queryKey: ['sprint-perf-trend', projectKey, sprint.name],
      queryFn: async () => {
        if (!projectKey) return null
        const resolvedKeys = resolveProjectKeys(projectKey)
        const projectClause = resolvedKeys.length === 1
          ? `project = ${resolvedKeys[0]}`
          : `project IN (${resolvedKeys.join(', ')})`

        const jql = `${projectClause} AND sprint = "${sprint.name}" ORDER BY priority ASC, updated DESC`
        const fieldsStr = PERFORMANCE_FIELDS.join(',')
        const url = `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=${fieldsStr}&expand=changelog&maxResults=200`

        const response = await authFetch(`/api/jira/${url}`, {
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) return null
        const data = await response.json()
        const issues = data?.issues ?? []
        if (issues.length === 0) return null

        const performanceIssues = issues.map(transformToPerformanceIssue)
        const sprintDates = {
          startDate: sprint.startDate ?? new Date().toISOString(),
          endDate: sprint.endDate ?? new Date().toISOString(),
        }
        return calculateDepartmentPerformance(performanceIssues, sprintDates)
      },
      enabled: !!projectKey && sprints.length > 0,
      staleTime: 15 * 60 * 1000,
    })),
  })

  const isLoading = isSprintsLoading || sprintQueries.some(q => q.isLoading)

  // 组装图表数据（按时间正序）
  const chartData = useMemo(() => {
    const items: Array<{
      name: string
      score: number
      throughput: number
      efficiency: number
      quality: number
      impact: number
      collaboration: number
    }> = []

    // sprints 已经按 startDate 倒序排列，需要 reverse 才能正序显示
    const orderedSprints = [...sprints].reverse()

    for (let i = 0; i < orderedSprints.length; i++) {
      const queryIndex = sprints.length - 1 - i // 因为 reverse 了
      const result = sprintQueries[queryIndex]?.data
      if (result) {
        items.push({
          name: orderedSprints[i].name,
          score: result.averageScore,
          throughput: result.averageThroughput,
          efficiency: result.averageEfficiency,
          quality: result.averageQuality,
          impact: result.averageImpact,
          collaboration: result.averageCollaboration,
        })
      }
    }

    return items
  }, [sprints, sprintQueries])

  const handleExport = useCallback(() => {
    const instance = echartRef.current?.getEchartsInstance() as ECharts | undefined
    if (!instance) return
    const url = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
    const link = document.createElement('a')
    link.download = 'performance-trend.png'
    link.href = url
    link.click()
  }, [])

  if (!projectKey) return null

  if (isLoading) {
    return (
      <div className={styles.trendContainer}>
        <div className={styles.trendHeader}>
          <span className={styles.trendTitle}>📈 绩效趋势</span>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
          加载历史迭代数据中...
        </div>
      </div>
    )
  }

  if (chartData.length < 2) {
    return (
      <div className={styles.trendContainer}>
        <div className={styles.trendHeader}>
          <span className={styles.trendTitle}>📈 绩效趋势</span>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
          需要至少 2 个迭代的数据才能展示趋势
        </div>
      </div>
    )
  }

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        let html = `<strong>${params[0].axisValue}</strong><br/>`
        for (const p of params) {
          html += `${p.marker} ${p.seriesName}: <strong>${p.value.toFixed(1)}</strong><br/>`
        }
        return html
      },
    },
    legend: {
      data: ['综合分', '吞吐', '效率', '质量', '影响', '协作'],
      bottom: 0,
      textStyle: { fontSize: 11, color: '#666' },
    },
    grid: {
      left: 45,
      right: 20,
      top: 20,
      bottom: 50,
    },
    xAxis: {
      type: 'category' as const,
      data: chartData.map(d => d.name),
      axisLabel: { rotate: 20, fontSize: 11, color: '#999' },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 100,
      axisLabel: { fontSize: 11, color: '#999' },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      {
        name: '综合分',
        type: 'line',
        data: chartData.map(d => d.score),
        lineStyle: { width: 3, color: '#1677ff' },
        itemStyle: { color: '#1677ff' },
        symbol: 'circle',
        symbolSize: 8,
      },
      {
        name: '吞吐',
        type: 'line',
        data: chartData.map(d => d.throughput),
        lineStyle: { width: 1.5, color: '#52c41a', type: 'dashed' as const },
        itemStyle: { color: '#52c41a' },
        symbol: 'diamond',
        symbolSize: 6,
      },
      {
        name: '效率',
        type: 'line',
        data: chartData.map(d => d.efficiency),
        lineStyle: { width: 1.5, color: '#faad14', type: 'dashed' as const },
        itemStyle: { color: '#faad14' },
        symbol: 'diamond',
        symbolSize: 6,
      },
      {
        name: '质量',
        type: 'line',
        data: chartData.map(d => d.quality),
        lineStyle: { width: 1.5, color: '#722ed1', type: 'dashed' as const },
        itemStyle: { color: '#722ed1' },
        symbol: 'diamond',
        symbolSize: 6,
      },
      {
        name: '影响',
        type: 'line',
        data: chartData.map(d => d.impact),
        lineStyle: { width: 1.5, color: '#eb2f96', type: 'dashed' as const },
        itemStyle: { color: '#eb2f96' },
        symbol: 'diamond',
        symbolSize: 6,
        show: false,
      },
      {
        name: '协作',
        type: 'line',
        data: chartData.map(d => d.collaboration),
        lineStyle: { width: 1.5, color: '#13c2c2', type: 'dashed' as const },
        itemStyle: { color: '#13c2c2' },
        symbol: 'diamond',
        symbolSize: 6,
        show: false,
      },
    ],
    animationDuration: 600,
    animationEasing: 'cubicOut',
  }

  return (
    <div className={styles.trendContainer}>
      <div className={styles.trendHeader}>
        <span className={styles.trendTitle}>📈 绩效趋势</span>
        <button className={styles.trendExportBtn} onClick={handleExport}>导出图片</button>
      </div>
      <ReactECharts
        ref={echartRef}
        option={option}
        style={{ height: 320 }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  )
}
