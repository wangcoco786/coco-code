import React, { useState, Component, type ReactNode } from 'react'
import { usePerformanceData } from '@/hooks/usePerformanceData'
import { getPerformanceGrade, getGradeColor } from '@/lib/performanceEngine'
import type { DepartmentPerformance } from '@/lib/performanceEngine'
import { useSprintHistory, useSprintPerformance } from '@/hooks/useSprintHistory'
import DepartmentOverview from './DepartmentOverview'
import IndividualPerformance from './IndividualPerformance'
import PerformanceTrendChart from './PerformanceTrendChart'
import styles from './PerformanceView.module.css'

// ─── Hardcoded department project keys ───
const DEPARTMENT_KEYS = [
  'IDC', 'EAG',
  'AIAG', 'DTS', 'BI', 'CRM', 'CYC', 'CSR',
  'FMS', 'HRM', 'AIH', 'PLATFORM',
  'RMS', 'SAIL', 'TMS', 'VRM', 'WCS', 'WSP', 'WISE2018',
]

/** Error Boundary */
class PerformanceErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className={styles.errorContainer}>
          <p className={styles.errorTitle}>绩效模块加载出错</p>
          <p className={styles.errorMessage}>{this.state.error.message}</p>
          <button className={styles.retryBtn} onClick={() => this.setState({ error: null })}>重试</button>
        </div>
      )
    }
    return this.props.children
  }
}

interface Props {
  projectKey: string | null
}

export default function PerformanceView({ projectKey }: Props) {
  return (
    <PerformanceErrorBoundary>
      <PerformanceViewInner projectKey={projectKey} />
    </PerformanceErrorBoundary>
  )
}

function PerformanceViewInner({ projectKey }: Props) {
  if (projectKey) {
    return <SingleProjectPerformance projectKey={projectKey} />
  }
  return <DepartmentRankingView />
}

/** Single project performance view with sprint selection and comparison */
function SingleProjectPerformance({ projectKey }: { projectKey: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'department' | 'individual' | 'trend'>('department')
  const [selectedSprintName, setSelectedSprintName] = useState<string | null>(null)

  // 获取 Sprint 历史列表
  const { sprints: sprintHistory } = useSprintHistory(projectKey)

  // 当前数据（活跃 Sprint 或选中的历史 Sprint）
  const { data: activeData, isLoading: activeLoading, error: activeError } = usePerformanceData(
    selectedSprintName ? null : projectKey
  )
  const { data: selectedData, isLoading: selectedLoading } = useSprintPerformance(
    selectedSprintName ? projectKey : null,
    selectedSprintName
  )

  // 找到上一个迭代用于对比（只在同组 Sprint 中找）
  const selectedEntries = selectedSprintName ? selectedSprintName.split('|').filter(Boolean) : []
  const primaryEntry = selectedEntries[0] ?? null
  const primaryName = primaryEntry?.includes(':') ? primaryEntry.split(':').slice(1).join(':') : primaryEntry

  const previousSprintName = (() => {
    if (!primaryName) return null
    // 提取 Sprint 名称前缀（如 "RP.2026.06/26-07/09" → "RP"）
    const prefix = extractSprintPrefix(primaryName)
    // 在历史中找同前缀的 Sprint，按时间排列找当前的上一个
    const samePrefixSprints = sprintHistory
      .filter(s => extractSprintPrefix(s.name) === prefix)
      .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
    const currentIdx = samePrefixSprints.findIndex(s => s.name === primaryName)
    if (currentIdx >= 0 && currentIdx < samePrefixSprints.length - 1) {
      const prevSprint = samePrefixSprints[currentIdx + 1]
      return prevSprint ? `${prevSprint.id}:${prevSprint.name}` : null
    }
    return null
  })()

  const { data: previousData } = useSprintPerformance(
    previousSprintName ? projectKey : null,
    previousSprintName
  )

  const data = selectedSprintName ? selectedData : activeData
  const isLoading = selectedSprintName ? selectedLoading : activeLoading
  const error = selectedSprintName ? null : activeError

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorTitle}>数据加载失败</p>
        <p className={styles.errorMessage}>{error.message}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        {/* Sprint 选择器 */}
        <SprintSelector
          sprints={sprintHistory}
          selected={selectedSprintName}
          onSelect={setSelectedSprintName}
        />
        <div className={styles.subTabs}>
          <button className={`${styles.subTab} ${styles.active}`}>部门总览</button>
          <button className={styles.subTab}>个人详情</button>
          <button className={styles.subTab}>趋势</button>
        </div>
        <div className={styles.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeleton} style={{ height: 16, width: '60%', marginBottom: 8 }} />
              <div className={styles.skeleton} style={{ height: 32, width: '40%' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div>
        <SprintSelector
          sprints={sprintHistory}
          selected={selectedSprintName}
          onSelect={setSelectedSprintName}
        />
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyTitle}>暂无数据</div>
          <div className={styles.emptyDesc}>当前迭代暂无可用的绩效数据</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Sprint 选择器 */}
      <SprintSelector
        sprints={sprintHistory}
        selected={selectedSprintName}
        onSelect={setSelectedSprintName}
      />

      {/* 迭代对比摘要 */}
      {previousData && previousSprintName && (
        <SprintComparison current={data} previous={previousData} previousName={previousSprintName.includes(':') ? previousSprintName.split(':').slice(1).join(':') : previousSprintName} />
      )}

      <div className={styles.subTabs}>
        <button
          className={`${styles.subTab} ${activeSubTab === 'department' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('department')}
        >部门总览</button>
        <button
          className={`${styles.subTab} ${activeSubTab === 'individual' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('individual')}
        >个人详情</button>
        <button
          className={`${styles.subTab} ${activeSubTab === 'trend' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('trend')}
        >趋势</button>
      </div>
      {activeSubTab === 'department' && <DepartmentOverview departmentPerformance={data} />}
      {activeSubTab === 'individual' && <IndividualPerformance memberPerformances={data.members} />}
      {activeSubTab === 'trend' && <PerformanceTrendChart projectKey={projectKey} />}
    </div>
  )
}

/** Sprint 多选下拉框 — 显示具体 Sprint 名称，支持搜索和多选 */
function SprintSelector({
  sprints,
  selected,
  onSelect,
}: {
  sprints: Array<{ id: number; name: string; state: string; startDate?: string }>
  selected: string | null
  onSelect: (name: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  // 已选中的 sprint（格式 "id:name"）
  const selectedNames = selected ? selected.split('|').filter(Boolean) : []
  // 用于显示的名称列表
  const selectedDisplayNames = selectedNames.map(s => s.includes(':') ? s.split(':').slice(1).join(':') : s)

  // 过滤搜索
  const filtered = sprints.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.startDate ?? '').includes(search)
  )

  // 点击外部关闭
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function getSprintValue(s: { id: number; name: string }) {
    return `${s.id}:${s.name}`
  }

  function toggleSprint(s: { id: number; name: string }) {
    const val = getSprintValue(s)
    const newSet = new Set(selectedNames)
    if (newSet.has(val)) {
      newSet.delete(val)
    } else {
      newSet.add(val)
    }
    onSelect(newSet.size > 0 ? Array.from(newSet).join('|') : null)
  }

  function selectAll() {
    const allVals = filtered.map(s => getSprintValue(s))
    onSelect(allVals.join('|'))
  }

  function clearAll() {
    onSelect(null)
  }

  if (sprints.length === 0) return null

  const displayText = selectedDisplayNames.length === 0
    ? '当前活跃 Sprint'
    : selectedDisplayNames.length <= 2
      ? selectedDisplayNames.join(', ')
      : `已选 ${selectedDisplayNames.length} 个 Sprint`

  return (
    <div className={styles.sprintSelector} ref={containerRef} style={{ position: 'relative' }}>
      <label className={styles.sprintSelectorLabel}>迭代：</label>
      <div
        className={styles.sprintSelectorSelect}
        onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer', userSelect: 'none', minWidth: 280 }}
      >
        {displayText}
        <span style={{ float: 'right', opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className={styles.sprintDropdown}>
          {/* 搜索框 */}
          <input
            className={styles.sprintSearchInput}
            placeholder="搜索 Sprint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          {/* 操作按钮 */}
          <div className={styles.sprintDropdownActions}>
            <button onClick={selectAll} className={styles.sprintActionBtn}>全选</button>
            <button onClick={clearAll} className={styles.sprintActionBtn}>清空</button>
          </div>

          {/* Sprint 列表 */}
          <div className={styles.sprintDropdownList}>
            {filtered.map(s => (
              <label key={s.id} className={styles.sprintDropdownItem}>
                <input
                  type="checkbox"
                  checked={selectedNames.includes(getSprintValue(s))}
                  onChange={() => toggleSprint(s)}
                />
                <span className={styles.sprintItemName}>{s.name}</span>
                <span className={styles.sprintItemMeta}>
                  {s.state === 'active' ? '🟢' : '⚪'}
                  {s.startDate ? ` ${s.startDate}` : ''}
                </span>
              </label>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 12, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                无匹配结果
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** 迭代对比卡片 */
function SprintComparison({
  current,
  previous,
  previousName,
}: {
  current: DepartmentPerformance
  previous: DepartmentPerformance
  previousName: string
}) {
  const dims = [
    { label: '综合分', curr: current.averageScore, prev: previous.averageScore },
    { label: '吞吐', curr: current.averageThroughput, prev: previous.averageThroughput },
    { label: '效率', curr: current.averageEfficiency, prev: previous.averageEfficiency },
    { label: '质量', curr: current.averageQuality, prev: previous.averageQuality },
    { label: '影响', curr: current.averageImpact, prev: previous.averageImpact },
    { label: '协作', curr: current.averageCollaboration, prev: previous.averageCollaboration },
  ]

  return (
    <div className={styles.comparisonContainer}>
      <div className={styles.comparisonTitle}>
        📊 与上期对比 <span className={styles.comparisonPrevName}>({previousName})</span>
      </div>
      <div className={styles.comparisonGrid}>
        {dims.map(d => {
          const diff = d.curr - d.prev
          const isUp = diff > 0
          const isDown = diff < 0
          return (
            <div key={d.label} className={styles.comparisonItem}>
              <div className={styles.comparisonLabel}>{d.label}</div>
              <div className={styles.comparisonValue}>{d.curr.toFixed(1)}</div>
              <div className={`${styles.comparisonDiff} ${isUp ? styles.diffUp : isDown ? styles.diffDown : ''}`}>
                {isUp ? '↑' : isDown ? '↓' : '—'} {Math.abs(diff).toFixed(1)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Department Ranking View (main landing page) ───

function DepartmentRankingView() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  if (selectedProject) {
    return (
      <div>
        <button
          className={styles.backBtn}
          onClick={() => setSelectedProject(null)}
        >
          ← 返回部门排行
        </button>
        <SingleProjectPerformance projectKey={selectedProject} />
      </div>
    )
  }

  return (
    <div className={styles.rankingPage}>
      {/* Header */}
      <div className={styles.rankingPageHeader}>
        <div className={styles.rankingPageTitle}>
          <span className={styles.rankingPageIcon}>🏆</span>
          部门绩效排行榜
        </div>
        <div className={styles.rankingPageSubtitle}>
          基于活跃 Sprint 数据 · 实时更新
        </div>
      </div>

      {/* Department cards rendered via flex + order for sorting */}
      <div className={styles.deptGrid}>
        {DEPARTMENT_KEYS.map(key => (
          <DepartmentScoreCard
            key={key}
            projectKey={key}
            onClick={() => setSelectedProject(key)}
          />
        ))}
      </div>
    </div>
  )
}

/** Individual department score card — calls usePerformanceData independently */
function DepartmentScoreCard({ projectKey, onClick }: { projectKey: string; onClick: () => void }) {
  const { data, isLoading, error } = usePerformanceData(projectKey)

  // No data / error → hide
  if (!isLoading && (error || !data)) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.deptCard} style={{ order: 9999 }}>
        <div className={styles.deptCardInner}>
          <div className={styles.deptCardLoading}>
            <div className={styles.skeleton} style={{ height: 20, width: '60%', marginBottom: 12 }} />
            <div className={styles.skeleton} style={{ height: 40, width: '40%', marginBottom: 8 }} />
            <div className={styles.skeleton} style={{ height: 14, width: '80%' }} />
          </div>
        </div>
      </div>
    )
  }

  // Has data — render the card
  const score = data!.averageScore
  const grade = getPerformanceGrade(score)
  const gradeColor = getGradeColor(grade)
  const memberCount = data!.members.length
  const completedTasks = data!.totalCompletedTasks
  // Use negative score for CSS order (higher score = lower order = appears first)
  const orderValue = Math.round((100 - score) * 100)

  return (
    <div
      className={styles.deptCard}
      style={{ order: orderValue }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
    >
      <div className={styles.deptCardInner} style={{ borderTopColor: gradeColor }}>
        {/* Score badge */}
        <div className={styles.deptScoreBadge} style={{ background: gradeColor }}>
          {score.toFixed(0)}
        </div>

        {/* Department name */}
        <div className={styles.deptName}>{projectKey}</div>

        {/* Grade label */}
        <div className={styles.deptGrade} style={{ color: gradeColor }}>
          {getGradeLabel(grade)}
        </div>

        {/* Stats row */}
        <div className={styles.deptStats}>
          <div className={styles.deptStat}>
            <span className={styles.deptStatValue}>{memberCount}</span>
            <span className={styles.deptStatLabel}>成员</span>
          </div>
          <div className={styles.deptStatDivider} />
          <div className={styles.deptStat}>
            <span className={styles.deptStatValue}>{completedTasks}</span>
            <span className={styles.deptStatLabel}>已完成</span>
          </div>
        </div>

        {/* Score bar */}
        <div className={styles.deptProgressBar}>
          <div
            className={styles.deptProgressFill}
            style={{ width: `${Math.min(100, score)}%`, background: gradeColor }}
          />
        </div>

        {/* Dimension mini scores */}
        <DimensionMiniBar data={data!} />
      </div>
    </div>
  )
}

/** Mini dimension bars for the card */
function DimensionMiniBar({ data }: { data: DepartmentPerformance }) {
  const dims = [
    { label: '吞吐', value: data.averageThroughput },
    { label: '效率', value: data.averageEfficiency },
    { label: '质量', value: data.averageQuality },
    { label: '影响', value: data.averageImpact },
    { label: '协作', value: data.averageCollaboration },
  ]

  return (
    <div className={styles.deptDimensions}>
      {dims.map(d => (
        <div key={d.label} className={styles.deptDimRow}>
          <span className={styles.deptDimLabel}>{d.label}</span>
          <div className={styles.deptDimBar}>
            <div
              className={styles.deptDimFill}
              style={{
                width: `${Math.min(100, d.value)}%`,
                background: getGradeColor(getPerformanceGrade(d.value)),
              }}
            />
          </div>
          <span className={styles.deptDimValue}>{d.value.toFixed(0)}</span>
        </div>
      ))}
    </div>
  )
}

/** Grade label helper */
function getGradeLabel(grade: string): string {
  switch (grade) {
    case 'excellent': return '优秀'
    case 'good': return '良好'
    case 'average': return '一般'
    case 'needs_improvement': return '需改进'
    default: return ''
  }
}

/** 提取 Sprint 名称前缀（组名），用于上期对比时只找同组 Sprint */
function extractSprintPrefix(name: string): string {
  // 常见格式: "Linker CP.2026.06/26-07/09", "RP.2026.06/26-07/09", "Trfms.06/12-06/25"
  // 取到第一个日期模式（数字/数字 或 2026 等年份）之前的部分作为前缀
  // 去掉尾部的 . 和空格
  const match = name.match(/^(.+?)[\s.]*\d{4}[\s./]|^(.+?)[\s.]*\d{1,2}\//)
  if (match) {
    const prefix = (match[1] || match[2] || '').replace(/[\s.]+$/, '')
    return prefix.toLowerCase()
  }
  // fallback: 取第一个 . 之前的部分
  const dotIdx = name.indexOf('.')
  if (dotIdx > 0) return name.slice(0, dotIdx).toLowerCase()
  return name.toLowerCase()
}
