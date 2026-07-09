import { useRef, useCallback, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ECharts } from 'echarts'
import { useQueries } from '@tanstack/react-query'
import { authFetch } from '@/lib/authFetch'
import { resolveProjectKeys, isProjectGroup } from '@/lib/projectGroups'
import styles from './PerformanceView.module.css'

interface Props {
  projectKey: string | null
}

// 趋势图只需要轻量字段
const TREND_FIELDS = [
  'summary', 'status', 'priority', 'assignee',
  'labels', 'created', 'updated', 'resolutiondate',
  'timeoriginalestimate', 'timespent',
  'customfield_10016', 'issuetype',
]

const MAX_SPRINTS = 8

/** 轻量级绩效计算 */
function calcLightScore(issues: any[]): number {
  if (issues.length === 0) return 0
  const total = issues.length
  const done = issues.filter((i: any) => {
    const status = (i.fields?.status?.name ?? '').toLowerCase()
    return status === 'done' || status === 'closed' || status === 'resolved' || status === 'released'
  }).length

  const completionRate = done / total

  const pointsIssues = issues.filter((i: any) => (i.fields?.customfield_10016 ?? 0) > 0)
  const avgPoints = pointsIssues.length > 0
    ? pointsIssues.reduce((sum: number, i: any) => sum + (i.fields?.customfield_10016 ?? 0), 0) / pointsIssues.length
    : 0
  const pointsScore = Math.min(1, avgPoints / 5)

  const highPri = issues.filter((i: any) => {
    const p = (i.fields?.priority?.name ?? '').toLowerCase()
    return p === 'highest' || p === 'high'
  })
  const highPriDone = highPri.filter((i: any) => {
    const status = (i.fields?.status?.name ?? '').toLowerCase()
    return status === 'done' || status === 'closed' || status === 'resolved'
  })
  const highPriRate = highPri.length > 0 ? highPriDone.length / highPri.length : completionRate

  return Math.round((completionRate * 60 + pointsScore * 20 + highPriRate * 20) * 10) / 10
}

/**
 * 绩效趋势折线图。
 * 显示整个部门/项目的综合绩效趋势（一条线），X 轴为 Sprint 开始时间。
 * 对于项目组，合并所有子项目同一迭代的数据算整体分。
 */
export default function PerformanceTrendChart({ projectKey }: Props) {
  if (!projectKey) return null

  return (
    <div className={styles.trendContainer}>
      <div className={styles.trendHeader}>
        <span className={styles.trendTitle}>📈 绩效趋势</span>
      </div>
      <TrendChartInner projectKey={projectKey} />
    </div>
  )
}

/** 按 startDate 分组迭代（同一天开始的 Sprint 合并为一个迭代） */
interface IterationGroup {
  startDate: string
  sprintNames: string[]
  subProjects: string[]
}

function TrendChartInner({ projectKey }: { projectKey: string }) {
  const echartRef = useRef<ReactECharts>(null)
  const isGroup = isProjectGroup(projectKey)

  const subProjects = useMemo(() => {
    if (isGroup) return resolveProjectKeys(projectKey)
    return [projectKey]
  }, [projectKey, isGroup])

  // 获取所有子项目的 Sprint 历史
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

  // 把所有子项目的 Sprint 按 startDate 分组为"迭代"
  const iterations: IterationGroup[] = useMemo(() => {
    const dateMap = new Map<string, { sprintNames: string[]; subProjects: string[] }>()

    subProjects.forEach((pk, idx) => {
      const sprints = sprintHistories[idx]?.data ?? []
      for (const s of sprints) {
        const date = s.startDate || 'unknown'
        if (!dateMap.has(date)) {
          dateMap.set(date, { sprintNames: [], subProjects: [] })
        }
        const entry = dateMap.get(date)!
        entry.sprintNames.push(s.name)
        entry.subProjects.push(pk)
      }
    })

    return Array.from(dateMap.entries())
      .map(([startDate, data]) => ({ startDate, ...data }))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(-MAX_SPRINTS)
  }, [subProjects, sprintHistories])

  // 为每个迭代拉取所有 Sprint 的数据并合并
  const iterationQueries = useQueries({
    queries: iterations.map(iter => ({
      queryKey: ['iteration-score', projectKey, iter.startDate, iter.sprintNames.join(',')],
      queryFn: async () => {
        // 合并同一迭代下所有 Sprint 的 issues
        const allIssues: any[] = []
        for (let i = 0; i < iter.sprintNames.length; i++) {
          const pk = iter.subProjects[i]
          const sprintName = iter.sprintNames[i]
          const jql = `project = ${pk} AND sprint = "${sprintName}" ORDER BY priority ASC`
          const fieldsStr = TREND_FIELDS.join(',')
          // 分页获取
          let tStartAt = 0
          let tTotal = Infinity
          while (tStartAt < tTotal) {
            const url = `rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=${fieldsStr}&maxResults=200&startAt=${tStartAt}`
            try {
              const response = await authFetch(`/api/jira/${url}`, {
                headers: { 'Content-Type': 'application/json' },
              })
              if (response.ok) {
                const data = await response.json()
                tTotal = data.total ?? 0
                allIssues.push(...(data?.issues ?? []))
                tStartAt += 200
                if (!data.issues?.length) break
              } else { break }
            } catch { break }
          }
        }
        if (allIssues.length === 0) return null
        return { score: calcLightScore(allIssues), total: allIssues.length }
      },
      enabled: iterations.length > 0,
      staleTime: 30 * 60 * 1000,
    })),
  })

  const isLoading = sprintHistories.some(q => q.isLoading) || iterationQueries.some(q => q.isLoading)

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
  const chartData = useMemo(() => {
    const points: Array<{ label: string; tooltip: string; score: number }> = []
    for (let i = 0; i < iterations.length; i++) {
      const result = iterationQueries[i]?.data
      if (result) {
        const iter = iterations[i]
        points.push({
          label: formatDateLabel(iter.startDate),
          tooltip: iter.sprintNames.join('\n'),
          score: result.score,
        })
      }
    }
    return points
  }, [iterations, iterationQueries])

  if (isLoading) {
    return <div style={{ padding: 30, textAlign: 'center', color: 'var(--text2)' }}>加载中...</div>
  }

  if (chartData.length < 2) {
    return <div style={{ padding: 30, textAlign: 'center', color: 'var(--text2)' }}>需要至少 2 个迭代的数据才能展示趋势</div>
  }

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        const idx = params[0]?.dataIndex ?? 0
        const point = chartData[idx]
        const sprints = point?.tooltip?.split('\n') ?? []
        let html = `<strong>开始: ${point?.label}</strong><br/>`
        html += `综合绩效: <strong>${Number(params[0]?.value).toFixed(1)}</strong><br/>`
        if (sprints.length > 0) {
          html += `<br/><span style="color:#999">包含 Sprint:</span><br/>`
          for (const s of sprints.slice(0, 6)) {
            html += `· ${s}<br/>`
          }
          if (sprints.length > 6) html += `… 等 ${sprints.length} 个`
        }
        return html
      },
    },
    grid: { left: 45, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: chartData.map(d => d.label),
      axisLabel: { rotate: 0, fontSize: 12, color: '#666' },
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
        name: '综合绩效',
        type: 'line',
        data: chartData.map(d => d.score),
        lineStyle: { width: 3, color: '#1677ff' },
        itemStyle: { color: '#1677ff' },
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22,119,255,0.15)' },
              { offset: 1, color: 'rgba(22,119,255,0)' },
            ],
          },
        },
        label: {
          show: true,
          position: 'top' as const,
          fontSize: 12,
          fontWeight: 600,
          color: '#1677ff',
          formatter: '{c}',
        },
      },
    ],
    animationDuration: 400,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className={styles.trendExportBtn} onClick={handleExport}>导出图片</button>
      </div>
      <ReactECharts
        ref={echartRef}
        option={option}
        style={{ height: 280 }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  )
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr || '?'
  // 显示 MM/DD 格式
  return dateStr.slice(5).replace('-', '/')
}
