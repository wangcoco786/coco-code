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
import styles from './PerformanceView.module.css'

interface Props {
  projectKey: string | null
}

// 趋势图只需要轻量字段，不要 changelog/comment/issuelinks
const TREND_FIELDS = [
  'summary', 'status', 'priority', 'assignee',
  'labels', 'created', 'updated', 'resolutiondate',
  'timeoriginalestimate', 'timespent',
  'customfield_10016', 'issuetype',
]

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2', '#fa541c']
const MAX_SPRINTS = 5

/** 轻量级绩效计算（不需要 changelog，只做完成率 + 工时效率） */
function calcLightScore(issues: any[]): number {
  if (issues.length === 0) return 0
  const total = issues.length
  const done = issues.filter((i: any) => {
    const status = (i.fields?.status?.name ?? '').toLowerCase()
    return status === 'done' || status === 'closed' || status === 'resolved' || status === 'released'
  }).length

  // 完成率权重 60%
  const completionRate = done / total

  // 有 story points 的平均分（质量代理）权重 20%
  const pointsIssues = issues.filter((i: any) => (i.fields?.customfield_10016 ?? 0) > 0)
  const avgPoints = pointsIssues.length > 0
    ? pointsIssues.reduce((sum: number, i: any) => sum + (i.fields?.customfield_10016 ?? 0), 0) / pointsIssues.length
    : 0
  const pointsScore = Math.min(1, avgPoints / 5) // 5 SP 为满分

  // 高优完成率 权重 20%
  const highPri = issues.filter((i: any) => {
    const p = (i.fields?.priority?.name ?? '').toLowerCase()
    return p === 'highest' || p === 'high'
  })
  const highPriDone = highPri.filter((i: any) => {
    const status = (i.fields?.status?.name ?? '').toLowerCase()
    return status === 'done' || status === 'closed' || status === 'resolved'
  })
  const highPriRate = highPri.length > 0 ? highPriDone.length / highPri.length : completionRate

  const score = (completionRate * 60 + pointsScore * 20 + highPriRate * 20)
  return Math.round(score * 10) / 10
}

/**
 * 绩效趋势折线图（优化版）。
 * - 不请求 changelog，使用轻量计算
 * - 每组最多显示最近 5 个 Sprint
 */
export default function PerformanceTrendChart({ projectKey }: Props) {
  if (!projectKey) return null

  return (
    <div className={styles.trendContainer}>
      <div className={styles.trendHeader}>
        <span className={styles.trendTitle}>
          📈 绩效趋势
          {(isProjectGroup(projectKey) || hasSprintGroups(projectKey)) ? '（按组）' : ''}
        </span>
      </div>
      <TrendChartInner projectKey={projectKey} />
    </div>
  )
}

function TrendChartInner({ projectKey }: { projectKey: string }) {
  const echartRef = useRef<ReactECharts>(null)
  const isGroup = isProjectGroup(projectKey)
  const isSprintGrouped = !isGroup && hasSprintGroups(projectKey)

  const subProjects = useMemo(() => {
    if (isGroup) return resolveProjectKeys(projectKey)
    return [projectKey]
  }, [projectKey, isGroup])

  const sprintGroupDefs = useMemo(() => {
    if (isSprintGrouped) return getSprintGroups(projectKey)
    return []
  }, [projectKey, isSprintGrouped])

  // 获取 Sprint 历史列表
  const sprintHistories = useQueries({
    queries: subProjects.map(pk => ({
      queryKey: ['sprint-history-light', pk, MAX_SPRINTS],
      queryFn: async () => {
        const jql = `project = ${pk} AND sprint is not EMPTY ORDER BY updated DESC`
        const url = `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=customfield_10005&maxResults=100`
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
          .slice(-MAX_SPRINTS)
      },
      enabled: true,
      staleTime: 10 * 60 * 1000,
    })),
  })

  // 收集所有需要查询的 Sprint（轻量）
  const allSprintQueries = useMemo(() => {
    const queries: Array<{ subProject: string; sprintName: string; startDate: string }> = []
    subProjects.forEach((pk, idx) => {
      const sprints = sprintHistories[idx]?.data ?? []
      for (const s of sprints) {
        queries.push({ subProject: pk, sprintName: s.name, startDate: s.startDate })
      }
    })
    return queries
  }, [subProjects, sprintHistories])

  // 轻量化请求（无 changelog，少字段）
  const perfQueries = useQueries({
    queries: allSprintQueries.map(q => ({
      queryKey: ['sprint-trend-light', q.subProject, q.sprintName],
      queryFn: async () => {
        const jql = `project = ${q.subProject} AND sprint = "${q.sprintName}" ORDER BY priority ASC`
        const fieldsStr = TREND_FIELDS.join(',')
        // 注意：没有 expand=changelog，速度快很多
        const url = `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=${fieldsStr}&maxResults=200`
        const response = await authFetch(`/api/jira/${url}`, {
          headers: { 'Content-Type': 'application/json' },
        })
        if (!response.ok) return null
        const data = await response.json()
        const issues = data?.issues ?? []
        if (issues.length === 0) return null
        return { score: calcLightScore(issues), total: issues.length }
      },
      enabled: allSprintQueries.length > 0,
      staleTime: 30 * 60 * 1000, // 30 分钟缓存
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

  // 组装图表数据
  const chartConfig = useMemo(() => {
    if (isGroup) {
      // 项目组模式（IDC）：每个子项目一条线
      const seriesData: Array<{ name: string; points: Array<{ label: string; tooltip: string; score: number }> }> = []
      let queryIdx = 0

      subProjects.forEach((pk, pkIdx) => {
        const sprints = sprintHistories[pkIdx]?.data ?? []
        const points: Array<{ label: string; tooltip: string; score: number }> = []
        for (const s of sprints) {
          const result = perfQueries[queryIdx]?.data
          if (result) {
            points.push({
              label: formatDateLabel(s.startDate),
              tooltip: s.name,
              score: result.score,
            })
          }
          queryIdx++
        }
        if (points.length > 0) {
          seriesData.push({ name: pk, points })
        }
      })

      // X 轴用日期标签，取最长的那组作为参考
      const maxLen = Math.max(...seriesData.map(s => s.points.length), 0)
      const longestSeries = seriesData.find(s => s.points.length === maxLen)
      const xLabels = longestSeries?.points.map(p => p.label) ?? []

      return { xLabels, seriesData, legendData: seriesData.map(s => s.name) }
    }

    if (isSprintGrouped) {
      // Sprint 分组模式（DTS）
      const sprints = sprintHistories[0]?.data ?? []
      const grouped: Record<string, Array<{ label: string; tooltip: string; score: number }>> = {}
      for (const g of sprintGroupDefs) grouped[g.key] = []

      let queryIdx = 0
      for (const s of sprints) {
        const result = perfQueries[queryIdx]?.data
        const groupKey = matchSprintGroup(projectKey, s.name)
        if (result && groupKey && grouped[groupKey]) {
          grouped[groupKey].push({
            label: formatDateLabel(s.startDate),
            tooltip: s.name,
            score: result.score,
          })
        }
        queryIdx++
      }

      const seriesData = sprintGroupDefs
        .filter(g => grouped[g.key].length > 0)
        .map(g => ({ name: g.name, points: grouped[g.key] }))

      const maxLen = Math.max(...seriesData.map(s => s.points.length), 0)
      const longestSeries = seriesData.find(s => s.points.length === maxLen)
      const xLabels = longestSeries?.points.map(p => p.label) ?? []

      return { xLabels, seriesData, legendData: seriesData.map(s => s.name) }
    }

    // 普通单项目
    const sprints = sprintHistories[0]?.data ?? []
    const points: Array<{ label: string; tooltip: string; score: number }> = []
    let queryIdx = 0
    for (const s of sprints) {
      const result = perfQueries[queryIdx]?.data
      if (result) {
        points.push({
          label: formatDateLabel(s.startDate),
          tooltip: s.name,
          score: result.score,
        })
      }
      queryIdx++
    }

    return {
      xLabels: points.map(p => p.label),
      seriesData: [{ name: '综合分', points }],
      legendData: ['综合分'],
    }
  }, [isGroup, isSprintGrouped, subProjects, sprintHistories, perfQueries, sprintGroupDefs, projectKey])

  if (isLoading) {
    return <div style={{ padding: 30, textAlign: 'center', color: 'var(--text2)' }}>加载中...</div>
  }

  const hasData = chartConfig.seriesData.some(s => s.points.length >= 2)
  if (!hasData) {
    return <div style={{ padding: 30, textAlign: 'center', color: 'var(--text2)' }}>需要至少 2 个迭代的数据才能展示趋势</div>
  }

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        const idx = params[0]?.dataIndex ?? 0
        // 显示完整 Sprint 名
        const firstSeries = chartConfig.seriesData[0]
        const sprintName = firstSeries?.points[idx]?.tooltip ?? ''
        let html = `<strong>${sprintName || params[0]?.axisValue}</strong><br/>`
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
      axisLabel: { rotate: 0, fontSize: 11, color: '#666' },
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
    series: chartConfig.seriesData.map((s, i) => ({
      name: s.name,
      type: 'line',
      data: s.points.map(p => p.score),
      lineStyle: { width: 2.5, color: COLORS[i % COLORS.length] },
      itemStyle: { color: COLORS[i % COLORS.length] },
      symbol: 'circle',
      symbolSize: 7,
      label: { show: false },
    })),
    animationDuration: 400,
    animationEasing: 'cubicOut',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className={styles.trendExportBtn} onClick={handleExport}>导出图片</button>
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

/** 把 2026-06-12 格式化为 06/12 */
function formatDateLabel(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr || '?'
  return dateStr.slice(5).replace('-', '/')
}
