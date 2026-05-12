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
  // 如果已选择项目，直接显示该项目的绩效
  if (projectKey) {
    return <SingleProjectPerformance projectKey={projectKey} />
  }

  // 未选择项目：显示项目列表，让用户选择查看哪个部门
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

/** 项目列表视图（未选择项目时显示） */
function ProjectListView() {
  const { data: projects, isLoading } = useJiraProjects()
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  // 如果选择了某个项目，显示该项目的绩效
  if (selectedProject) {
    return (
      <div>
        <button
          className={styles.subTab}
          onClick={() => setSelectedProject(null)}
          style={{ marginBottom: 16 }}
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
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>
        部门绩效排行（点击查看详情）
      </h2>
      <div className={styles.rankingSection}>
        <table className={styles.rankingTable}>
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>部门</th>
              <th style={{ width: 80 }}>项目 Key</th>
              <th style={{ width: 120, textAlign: 'right' }}>综合绩效</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, index) => (
              <ProjectRow
                key={project.key}
                project={project}
                rank={index + 1}
                onClick={() => setSelectedProject(project.key)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** 单个项目行（异步加载绩效分数） */
function ProjectRow({ project, rank, onClick }: {
  project: { id: string; key: string; name: string }
  rank: number
  onClick: () => void
}) {
  const { data, isLoading } = usePerformanceData(project.key)

  const score = data?.averageScore ?? null
  const gradeLabel = score !== null
    ? score >= 80 ? '优秀' : score >= 60 ? '良好' : score >= 40 ? '一般' : '需改进'
    : null
  const gradeColor = score !== null
    ? score >= 80 ? '#52c41a' : score >= 60 ? '#1677ff' : score >= 40 ? '#fa8c16' : '#f5222d'
    : '#999'

  return (
    <tr onClick={onClick} style={{ cursor: 'pointer' }}>
      <td className={styles.rankNumber}>{rank}</td>
      <td className={styles.memberName}>{project.name}</td>
      <td style={{ color: 'var(--text2)', fontSize: 12 }}>{project.key}</td>
      <td style={{ textAlign: 'right' }}>
        {isLoading ? (
          <span style={{ color: '#999', fontSize: 12 }}>加载中...</span>
        ) : score !== null ? (
          <span style={{ fontWeight: 700, fontSize: 16, color: gradeColor }}>
            {score.toFixed(1)}
            <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 6, padding: '1px 6px', borderRadius: 8, background: gradeColor + '15', color: gradeColor }}>
              {gradeLabel}
            </span>
          </span>
        ) : (
          <span style={{ color: '#999', fontSize: 12 }}>无活跃 Sprint</span>
        )}
      </td>
    </tr>
  )
}
