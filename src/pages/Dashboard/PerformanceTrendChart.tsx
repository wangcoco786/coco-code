import { useRef, useCallback, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ECharts } from 'echarts'
import { useQueries } from '@tanstack/react-query'
import { authFetch } from '@/lib/authFetch'
import {
  resolveProjectKeys,
  isProjectGroup,
  hasSprintGroups,
  getSprintGroups,
  matchSprintGroup,
} from '@/lib/projectGroups'
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

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2', '#fa541c']

/**
 * 绩效趋势折线图。
 * - 项目组（IDC）：按子项目各一条线
 * - Sprint 分组项目（DTS）：按 Sprint 前缀分组各一条线
 * - 普通项目：综合分 + 维度趋势
 */
export default function PerformanceTrendChart({ projectKey }: Props) {
  const echartRef = useRef<ReactECharts>(null)
  const isGroup = isProjectGroup(projectKey)
  const isSprintGrouped = !isGroup && hasSprintGroups(projectKey)

  // 确定需要查询的子项目列表
  const subProjects = useMemo(() => {
    if (isGroup) return resolveProjectKeys(projectKey)
    return [projectKey].filter(Boolean) as string[]
  }, [projectKey, isGroup])

  // Sprint 分组定义（仅 DTS 类项目使用）
  const sprintGroupDefs = useMemo(() => {
    if (isSprintGrouped) return getSprintGroups(projectKey)
    return []
  }, [projectKey, isSprintGrouped])

  // 获取 Sprint 历史列表（每个子项目独立获取）
  const sprintHistories = useQueries({
    queries: subProjects.map(pk => ({
      queryKey: ['sprint-history-list', pk, 10],
      queryFn: async () => {
        const jql = `project = ${pk} AND sprint is not EMPTY ORDER BY updated DESC`
        const url = `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=customfield_10005&maxResults=200`
        const response = await authFetch(`/api/jira/${url}`, {
          headers: { 'Content-Type': 'application/json' },
        })
        if (!response.ok) return []
        const data = await response.json()
        const sprintMap = new Map<number, { id: number; name: string; state: string; startDate: string }>()

        for (const issue of data?.issues ?? []) {
          const raw = issue?.fields?.customfield_10005
          const rawStrings: string[] = Array.isArray(raw)
            ? raw.filter((s: unknown) => typeof s === 'string')
            : typeof raw === 'string' ? [raw] : []

          for (const sprintStr of rawStrings) {
            const sprintParts = sprintStr.split(/(?=com\.atlassian\.greenhopper)/).filter(Boolean)
            for (const part of sprintParts) {
              const parseField = (key: string): string => {
                const prefix = `${key}=`
                const start = part.indexOf(prefix)
                if (start === -1) return ''
                const valueStart = start + prefix.length
                const commaIdx = part.indexOf(',', valueStart)
                const bracketIdx = part.indexOf(']', valueStart)
                const end = commaIdx === -1 ? bracketIdx : bracketIdx === -1 ? commaIdx : Math.min(commaIdx, bracketIdx)
                return end === -1 ? part.slice(valueStart) : part.slice(valueStart, end)
              }
              const state = parseField('state').toLowerCase()
              if (state !== 'active' && state !== 'closed') continue
              const id = parseInt(parseField('id'), 10)
              if (!id || sprintMap.has(id)) continue
              const name = parseField('name')
              const startDate = parseField('startDate').slice(0, 10)
              if (name) sprintMap.set(id, { id, name, state, startDate })
            }
          }
        }

        return Array.from(sprintMap.values())
          .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
          .slice(-10)
      },
      enabled: !!projectKey,
      staleTime: 10 * 60 * 1000,
    })),
  })

  // 收集所有需要查询绩效的 Sprint
  const allSprintQueries = useMemo(() => {
    const queries: Array<{ subProject: string; sprintName: string; startDate: string }>[] = []
    subProjects.forEach((pk, idx) => {
      const sprints = sprintHistories[idx]?.data ?? []
      const items = sprints.map(s => ({ subProject: pk, sprintName: s.name, startDate: s.startDate }))
      queries.push(items)
    })
    return queries.flat()
  }, [subProjects, sprintHistories])

  // 为每个 Sprint 拉取绩效数据
  const perfQueries = useQueries({
    queries: allSprintQueries.map(q => ({
      queryKey: ['sprint-perf-trend-v2', q.subProject, q.sprintName],
      queryFn: async () => {
        const jql = `project = ${q.subProject} AND sprint = "${q.sprintName}" ORDER BY priority ASC, updated DESC`
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
        const sprintDates = { startDate: q.startDate || new Date().toISOString(), endDate: new Date().toISOString() }
        return calculateDepartmentPerformance(performanceIssues, sprintDates)
      },
      enabled: !!projectKey && allSprintQueries.length > 0,
      staleTime: 15 * 60 * 1000,
    })),
  })

  const isLoading = sprintHistories.some(q => q.isLoading) || perfQueries.some(q => q.isLoading)

  const handleExport = useCallback(() => {
    const instance = echartRef.current?.getEchartsInstance() as ECharts | undefined
    if (!instance) return
    const url = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
    const link = document.createElement('a')
    link.download = 'performance-trend.png'
    link.href = url
    link.click()
  }, [])

  // 组装图表配置
  const chartConfig = useMemo(() => {
    if (isGroup) {
      // === 项目组模式（IDC）：每个子项目一条线 ===
      const seriesData: Array<{ name: string; points: Array<{ sprintName: string; score: number }> }> = []
      let queryIdx = 0

      subProjects.forEach((pk, pkIdx) => {
        const sprints = sprintHistories[pkIdx]?.data ?? []
        const points: Array<{ sprintName: string; score: number }> = []
        for (const s of sprints) {
          const result = perfQueries[queryIdx]?.data
          if (result) {
            points.push({ sprintName: s.name, score: result.averageScore })
          }
          queryIdx++
        }
        if (points.length > 0) {
          seriesData.push({ name: pk, points })
        }
      })

      const maxLen = Math.max(...seriesData.map(s => s.points.length), 0)
      const xLabels = Array.from({ length: maxLen }, (_, i) => `#${i + 1}`)

      return {
        xLabels,
        series: seriesData.map((s, i) => ({
          name: s.name,
          type: 'line' as const,
          data: s.points.map(p => p.score),
          lineStyle: { width: 2.5, color: COLORS[i % COLORS.length] },
          itemStyle: { color: COLORS[i % COLORS.length] },
          symbol: 'circle' as const,
          symbolSize: 7,
        })),
        legendData: seriesData.map(s => s.name),
        subtitle: '按组',
      }
    }

    if (isSprintGrouped) {
      // === Sprint 分组模式（DTS）：按 Sprint 名称前缀分组 ===
      const sprints = sprintHistories[0]?.data ?? []
      const grouped: Record<string, Array<{ sprintName: string; score: number }>> = {}

      for (const g of sprintGroupDefs) {
        grouped[g.key] = []
      }

      let queryIdx = 0
      for (const s of sprints) {
        const result = perfQueries[queryIdx]?.data
        const groupKey = matchSprintGroup(projectKey!, s.name)
        if (result && groupKey && grouped[groupKey]) {
          grouped[groupKey].push({ sprintName: s.name, score: result.averageScore })
        }
        queryIdx++
      }

      const seriesData = sprintGroupDefs
        .filter(g => grouped[g.key].length > 0)
        .map(g => ({ name: g.name, points: grouped[g.key] }))

      const maxLen = Math.max(...seriesData.map(s => s.points.length), 0)
      const xLabels = Array.from({ length: maxLen }, (_, i) => `#${i + 1}`)

      return {
        xLabels,
        series: seriesData.map((s, i) => ({
          name: s.name,
          type: 'line' as const,
          data: s.points.map(p => p.score),
          lineStyle: { width: 2.5, color: COLORS[i % COLORS.length] },
          itemStyle: { color: COLORS[i % COLORS.length] },
          symbol: 'circle' as const,
          symbolSize: 7,
        })),
        legendData: seriesData.map(s => s.name),
        subtitle: '按组',
      }
    }

    // === 普通单项目模式 ===
    const sprints = sprintHistories[0]?.data ?? []
    const points: Array<{ name: string; score: number; throughput: number; efficiency: number; quality: number }> = []
    let queryIdx = 0
    for (const s of sprints) {
      const result = perfQueries[queryIdx]?.data
      if (result) {
        points.push({
          name: s.name,
          score: result.averageScore,
          throughput: result.averageThroughput,
          efficiency: result.averageEfficiency,
          quality: result.averageQuality,
        })
      }
      queryIdx++
    }

    return {
      xLabels: points.map(p => shortenName(p.name)),
      series: [
        { name: '综合分', type: 'line' as const, data: points.map(p => p.score), lineStyle: { width: 3, color: '#1677ff' }, itemStyle: { color: '#1677ff' }, symbol: 'circle' as const, symbolSize: 8 },
        { name: '吞吐', type: 'line' as const, data: points.map(p => p.throughput), lineStyle: { width: 1.5, color: '#52c41a', type: 'dashed' as const }, itemStyle: { color: '#52c41a' }, symbol: 'diamond' as const, symbolSize: 6 },
        { name: '效率', type: 'line' as const, data: points.map(p => p.efficiency), lineStyle: { width: 1.5, color: '#faad14', type: 'dashed' as const }, itemStyle: { color: '#faad14' }, symbol: 'diamond' as const, symbolSize: 6 },
        { name: '质量', type: 'line' as const, data: points.map(p => p.quality), lineStyle: { width: 1.5, color: '#722ed1', type: 'dashed' as const }, itemStyle: { color: '#722ed1' }, symbol: 'diamond' as const, symbolSize: 6 },
      ],
      legendData: ['综合分', '吞吐', '效率', '质量'],
      subtitle: '',
    }
  }, [isGroup, isSprintGrouped, subProjects, sprintHistories, perfQueries, sprintGroupDefs, projectKey])

  if (!projectKey) return null

  if (isLoading) {
    return (
      <div className={styles.trendContainer}>
        <div className={styles.trendHeader}>
          <span className={styles.trendTitle}>📈 绩效趋势{chartConfig.subtitle ? `（${chartConfig.subtitle}）` : ''}</span>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>加载历史迭代数据中...</div>
      </div>
    )
  }

  const hasData = chartConfig.series.some(s => (s.data as number[]).length >= 2)
  if (!hasData) {
    return (
      <div className={styles.trendContainer}>
        <div className={styles.trendHeader}>
          <span className={styles.trendTitle}>📈 绩效趋势{chartConfig.subtitle ? `（${chartConfig.subtitle}）` : ''}</span>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>需要至少 2 个迭代的数据才能展示趋势</div>
      </div>
    )
  }

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        let html = `<strong>${params[0]?.axisValue ?? ''}</strong><br/>`
        for (const p of params) {
          html += `${p.marker} ${p.seriesName}: <strong>${Number(p.value).toFixed(1)}</strong><br/>`
        }
        return html
      },
    },
    legend: {
      data: chartConfig.legendData,
      bottom: 0,
      textStyle: { fontSize: 11, color: '#666' },
    },
    grid: { left: 45, right: 20, top: 20, bottom: 50 },
    xAxis: {
      type: 'category' as const,
      data: chartConfig.xLabels,
      axisLabel: { rotate: 0, fontSize: 11, color: '#999' },
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
    series: chartConfig.series,
    animationDuration: 600,
    animationEasing: 'cubicOut',
  }

  return (
    <div className={styles.trendContainer}>
      <div className={styles.trendHeader}>
        <span className={styles.trendTitle}>📈 绩效趋势{chartConfig.subtitle ? `（${chartConfig.subtitle}）` : ''}</span>
        <button className={styles.trendExportBtn} onClick={handleExport}>导出图片</button>
      </div>
      <ReactECharts
        ref={echartRef}
        option={option}
        style={{ height: 340 }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  )
}

function shortenName(name: string): string {
  return name.length > 20 ? name.slice(0, 18) + '…' : name
}
