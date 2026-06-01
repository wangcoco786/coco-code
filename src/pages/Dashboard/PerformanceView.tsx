import { useState, Component, type ReactNode } from 'react'
import { usePerformanceData } from '@/hooks/usePerformanceData'
import { getPerformanceGrade, getGradeColor } from '@/lib/performanceEngine'
import type { DepartmentPerformance } from '@/lib/performanceEngine'
import DepartmentOverview from './DepartmentOverview'
import IndividualPerformance from './IndividualPerformance'
import styles from './PerformanceView.module.css'

// ─── Hardcoded department project keys ───
const DEPARTMENT_KEYS = [
  'AIAG', 'DTS', 'BP', 'RMS',
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

/** Single project performance view (existing behavior) */
function SingleProjectPerformance({ projectKey }: { projectKey: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'department' | 'individual'>('department')
  const { data, isLoading, error } = usePerformanceData(projectKey)

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
        <div className={styles.subTabs}>
          <button className={`${styles.subTab} ${styles.active}`}>部门总览</button>
          <button className={styles.subTab}>个人详情</button>
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
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📭</div>
        <div className={styles.emptyTitle}>暂无数据</div>
        <div className={styles.emptyDesc}>当前 Sprint 暂无可用的绩效数据</div>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.subTabs}>
        <button
          className={`${styles.subTab} ${activeSubTab === 'department' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('department')}
        >部门总览</button>
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
          基于活跃 Sprint 数据 · 实时更新 · {DEPARTMENT_KEYS.length} 个部门
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

  // No data / error → hide completely
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
