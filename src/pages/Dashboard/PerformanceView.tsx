import { useState, Component, type ReactNode } from 'react'
import { usePerformanceData } from '@/hooks/usePerformanceData'
import { getPerformanceGrade, getGradeColor } from '@/lib/performanceEngine'
import type { DepartmentPerformance } from '@/lib/performanceEngine'
import { useSprintHistory, useSprintPerformance } from '@/hooks/useSprintHistory'
import { isProjectGroup, resolveProjectKeys, hasSprintGroups, getSprintGroups, matchSprintGroup } from '@/lib/projectGroups'
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
    // 项目组（IDC、EAG）或 Sprint 分组项目（DTS）：显示子组 Tab 切换
    if (isProjectGroup(projectKey) || hasSprintGroups(projectKey)) {
      return <GroupedProjectPerformance projectKey={projectKey} />
    }
    return <SingleProjectPerformance projectKey={projectKey} />
  }
  return <DepartmentRankingView />
}

/** 项目组 / Sprint 分组视图 —— 顶部 Tab 切换子组 */
function GroupedProjectPerformance({ projectKey }: { projectKey: string }) {
  const isGroup = isProjectGroup(projectKey)
  const isSprintGroup = hasSprintGroups(projectKey)

  // 确定子组列表
  const subTabs = (() => {
    if (isGroup) {
      return resolveProjectKeys(projectKey).map(k => ({ key: k, name: k }))
    }
    if (isSprintGroup) {
      return getSprintGroups(projectKey).map(g => ({ key: g.key, name: g.name }))
    }
    return []
  })()

  const [activeGroup, setActiveGroup] = useState<string>(subTabs[0]?.key ?? '')
  const [showTrend, setShowTrend] = useState(false)

  if (subTabs.length === 0) {
    return <SingleProjectPerformance projectKey={projectKey} />
  }

  // 对于项目组（IDC），子项目就是独立的 Jira project key
  // 对于 Sprint 分组（DTS），仍然是同一个 project key，但需要按 Sprint 前缀过滤
  const effectiveProjectKey = isGroup ? activeGroup : projectKey

  return (
    <div>
      {/* 子组 Tab */}
      <div className={styles.subTabs} style={{ marginBottom: 12 }}>
        {subTabs.map(tab => (
          <button
            key={tab.key}
            className={`${styles.subTab} ${activeGroup === tab.key ? styles.active : ''}`}
            onClick={() => { setActiveGroup(tab.key); setShowTrend(false) }}
          >
            {tab.name}
          </button>
        ))}
        <button
          className={`${styles.subTab} ${showTrend ? styles.active : ''}`}
          onClick={() => setShowTrend(!showTrend)}
          style={{ marginLeft: 'auto' }}
        >
          📈 趋势对比
        </button>
      </div>

      {/* 趋势图（跨组对比） */}
      {showTrend && <PerformanceTrendChart projectKey={projectKey} />}

      {/* 当前子组的绩效详情 */}
      {!showTrend && (
        isSprintGroup
          ? <SprintGroupPerformance projectKey={projectKey} groupKey={activeGroup} />
          : <SingleProjectPerformance projectKey={effectiveProjectKey} />
      )}
    </div>
  )
}

/** Sprint 分组绩效（DTS 内按 OB/OMS/DI/CP 分别展示） */
function SprintGroupPerformance({ projectKey, groupKey }: { projectKey: string; groupKey: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'department' | 'individual'>('department')
  const { sprints } = useSprintHistory(projectKey, 10)

  // 找到属于该组的当前活跃 Sprint
  const groupSprints = sprints.filter(s => matchSprintGroup(projectKey, s.name) === groupKey)
  const activeSprint = groupSprints.find(s => s.state === 'active') ?? groupSprints[0] ?? null

  const { data, isLoading } = useSprintPerformance(
    activeSprint ? projectKey : null,
    activeSprint?.name ?? null,
  )

  // 上一个迭代
  const currentIdx = groupSprints.findIndex(s => s.name === activeSprint?.name)
  const prevSprintName = currentIdx >= 0 && currentIdx < groupSprints.length - 1
    ? groupSprints[currentIdx + 1]?.name
    : null
  const { data: previousData } = useSprintPerformance(
    prevSprintName ? projectKey : null,
    prevSprintName,
  )

  if (isLoading) {
    return (
      <div className={styles.skeletonGrid}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeleton} style={{ height: 16, width: '60%', marginBottom: 8 }} />
            <div className={styles.skeleton} style={{ height: 32, width: '40%' }} />
          </div>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📭</div>
        <div className={styles.emptyTitle}>暂无数据</div>
        <div className={styles.emptyDesc}>{groupKey} 组暂无可用的绩效数据</div>
      </div>
    )
  }

  return (
    <div>
      {activeSprint && (
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
          当前迭代: <strong>{activeSprint.name}</strong>
          {activeSprint.startDate && ` · ${activeSprint.startDate}`}
        </div>
      )}

      {/* 迭代对比 */}
      {previousData && prevSprintName && (
        <SprintComparison current={data} previous={previousData} previousName={prevSprintName} />
      )}

      <div className={styles.subTabs}>
        <button
          className={`${styles.subTab} ${activeSubTab === 'department' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('department')}
        >总览</button>
        <button
          className={`${styles.subTab} ${activeSubTab === 'individual' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('individual')}
        >个人详情</button>
      </div>
      {activeSubTab === 'department' && <DepartmentOverview departmentPerformance={data} />}
      {activeSubTab === 'individual' && <IndividualPerformance memberPerformances={data.members} />}
    </div>
  )
}

/** Single project performance view with sprint selection and comparison */
function SingleProjectPerformance({ projectKey }: { projectKey: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'department' | 'individual' | 'trend'>('department')
  const [selectedSprintName, setSelectedSprintName] = useState<string | null>(null)

  // 获取 Sprint 历史列表
  const { sprints: sprintHistory } = useSprintHistory(projectKey, 10)

  // 当前数据（活跃 Sprint 或选中的历史 Sprint）
  const { data: activeData, isLoading: activeLoading, error: activeError } = usePerformanceData(
    selectedSprintName ? null : projectKey
  )
  const { data: selectedData, isLoading: selectedLoading } = useSprintPerformance(
    selectedSprintName ? projectKey : null,
    selectedSprintName
  )

  // 找到上一个迭代用于对比
  const currentSprintIndex = selectedSprintName
    ? sprintHistory.findIndex(s => s.name === selectedSprintName)
    : 0
  const previousSprintName = currentSprintIndex >= 0 && currentSprintIndex < sprintHistory.length - 1
    ? sprintHistory[currentSprintIndex + 1]?.name
    : null
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
      {previousData && (
        <SprintComparison current={data} previous={previousData} previousName={previousSprintName!} />
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

/** Sprint 选择下拉框 — 按迭代日期分组，选中一个日期 = 选中该日期所有 Sprint */
function SprintSelector({
  sprints,
  selected,
  onSelect,
}: {
  sprints: Array<{ id: number; name: string; state: string; startDate?: string }>
  selected: string | null
  onSelect: (name: string | null) => void
}) {
  if (sprints.length === 0) return null

  // 按 startDate 分组
  const dateGroups = new Map<string, Array<{ id: number; name: string; state: string; startDate?: string }>>()
  for (const s of sprints) {
    const date = s.startDate || 'unknown'
    if (!dateGroups.has(date)) dateGroups.set(date, [])
    dateGroups.get(date)!.push(s)
  }
  const sortedDates = Array.from(dateGroups.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // 最新的在前

  return (
    <div className={styles.sprintSelector}>
      <label className={styles.sprintSelectorLabel}>迭代：</label>
      <select
        className={styles.sprintSelectorSelect}
        value={selected ?? ''}
        onChange={(e) => onSelect(e.target.value || null)}
      >
        <option value="">当前活跃 Sprint</option>
        {sortedDates.map(([date, group]) => {
          // value 用第一个 sprint 的 name（后面加载时会按 date 匹配所有）
          const label = `${date} · ${group.length} 个组`
          const stateLabel = group.some(g => g.state === 'active') ? '活跃' : '已关闭'
          const names = group.map(g => g.name).join('|')
          return (
            <option key={date} value={names}>
              {label} ({stateLabel})
            </option>
          )
        })}
      </select>
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
