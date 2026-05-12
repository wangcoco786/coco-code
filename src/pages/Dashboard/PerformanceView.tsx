import { useState, Component, type ReactNode } from 'react'
import { usePerformanceData } from '@/hooks/usePerformanceData'
import { useJiraProjects } from '@/hooks/useJiraBoard'
import DepartmentOverview from './DepartmentOverview'
import IndividualPerformance from './IndividualPerformance'
import styles from './PerformanceView.module.css'

/** Error Boundary */
class PerformanceErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#f5222d' }}>
          <p style={{ fontSize: 16, fontWeight: 600 }}>绩效模块加载出错</p>
          <p style={{ fontSize: 13, color: '#999', marginTop: 8 }}>{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 12, padding: '6px 16px', cursor: 'pointer' }}>重试</button>
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
  return <ProjectListView />
}

/** 单项目绩效视图 */
function SingleProjectPerformance({ projectKey }: { projectKey: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'department' | 'individual'>('department')
  const { data, isLoading, error } = usePerformanceData(projectKey)

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#f5222d' }}>
        <p style={{ fontSize: 16, fontWeight: 600 }}>数据加载失败</p>
        <p style={{ fontSize: 13, color: '#999', marginTop: 8 }}>{error.message}</p>
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

/** 项目列表视图 — 只显示有活跃 Sprint 的项目 */
function ProjectListView() {
  const { data: projects, isLoading } = useJiraProjects()
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  if (selectedProject) {
    return (
      <div>
        <button
          className={styles.subTab}
          onClick={() => setSelectedProject(null)}
          style={{ marginBottom: 20 }}
        >← 返回部门列表</button>
        <SingleProjectPerformance projectKey={selectedProject} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.skeletonGrid}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeleton} style={{ height: 16, width: '60%', marginBottom: 8 }} />
            <div className={styles.skeleton} style={{ height: 32, width: '40%' }} />
          </div>
        ))}
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📊</div>
        <div className={styles.emptyTitle}>暂无项目</div>
        <div className={styles.emptyDesc}>未找到可用的 Jira 项目</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          部门绩效排行
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          基于 SPACE + DORA 框架的五维度综合评估，点击部门查看详情
        </p>
      </div>
      <div className={styles.perfList}>
        {projects.map((project, index) => (
          <ProjectScoreRow
            key={project.key}
            project={project}
            rank={index + 1}
            onClick={() => setSelectedProject(project.key)}
          />
        ))}
      </div>
    </div>
  )
}

/** 项目绩效行 — 只显示有数据的 */
function ProjectScoreRow({ project, rank, onClick }: {
  project: { id: string; key: string; name: string }
  rank: number
  onClick: () => void
}) {
  const { data, isLoading } = usePerformanceData(project.key)

  // 无活跃 Sprint 的项目不显示
  if (!isLoading && !data) return null

  const score = data?.averageScore ?? 0
  const gradeColor = score >= 80 ? '#52c41a' : score >= 60 ? '#1677ff' : score >= 40 ? '#fa8c16' : '#f5222d'
  const gradeLabel = score >= 80 ? '优秀' : score >= 60 ? '良好' : score >= 40 ? '一般' : '需改进'
  const memberCount = data?.members.length ?? 0
  const completedTasks = data?.totalCompletedTasks ?? 0

  return (
    <div className={styles.perfRow} onClick={onClick}>
      <div className={styles.perfRank} style={{ color: rank <= 3 ? gradeColor : 'var(--text2)' }}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
      </div>
      <div className={styles.perfInfo}>
        <div className={styles.perfName}>{project.name}</div>
        <div className={styles.perfMeta}>
          {isLoading ? (
            <span style={{ color: 'var(--text2)' }}>加载中...</span>
          ) : (
            <>{memberCount} 人 · {completedTasks} 个任务完成</>
          )}
        </div>
      </div>
      <div className={styles.perfScore}>
        {isLoading ? (
          <div className={styles.skeleton} style={{ width: 48, height: 24, borderRadius: 4 }} />
        ) : (
          <>
            <span className={styles.perfScoreValue} style={{ color: gradeColor }}>
              {score.toFixed(1)}
            </span>
            <span className={styles.perfGrade} style={{ background: gradeColor + '12', color: gradeColor }}>
              {gradeLabel}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
