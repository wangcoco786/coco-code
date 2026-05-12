import { useState } from 'react'
import { usePerformanceData } from '@/hooks/usePerformanceData'
import { getPerformanceGrade, getGradeColor } from '@/lib/performanceEngine'
import type { DepartmentPerformance } from '@/lib/performanceEngine'
import DepartmentOverview from './DepartmentOverview'
import IndividualPerformance from './IndividualPerformance'
import styles from './PerformanceView.module.css'

interface Props {
  projectKey: string | null
}

export default function PerformanceView({ projectKey }: Props) {
  const [expandedDept, setExpandedDept] = useState<string | null>(null)
  const { data, departments, isLoading } = usePerformanceData(projectKey)

  // 加载状态（骨架屏）
  if (isLoading) {
    return (
      <div>
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

  // 空状态（无数据）
  if (!data && departments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📭</div>
        <div className={styles.emptyTitle}>暂无数据</div>
        <div className={styles.emptyDesc}>当前 Sprint 暂无可用的绩效数据</div>
      </div>
    )
  }

  // 如果有展开的部门，显示该部门的详细视图
  if (expandedDept) {
    const dept = departments.find(d => d.projectKey === expandedDept)
    if (dept) {
      return (
        <div>
          <button
            className={styles.subTab}
            onClick={() => setExpandedDept(null)}
            style={{ marginBottom: 16 }}
          >
            ← 返回部门列表
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            {dept.projectName} ({dept.projectKey}) 部门绩效
          </h2>
          <DepartmentOverview departmentPerformance={dept.performance} />
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '24px 0 12px' }}>成员绩效详情</h3>
          <IndividualPerformance memberPerformances={dept.performance.members} />
        </div>
      )
    }
  }

  // 默认视图：各部门整体绩效列表
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>
        各部门绩效总览（点击部门查看详情）
      </h2>
      <div className={styles.memberGrid}>
        {departments.map(dept => (
          <DepartmentCard
            key={dept.projectKey}
            projectKey={dept.projectKey}
            projectName={dept.projectName}
            performance={dept.performance}
            onClick={() => setExpandedDept(dept.projectKey)}
          />
        ))}
      </div>
    </div>
  )
}

/** 部门卡片组件 */
function DepartmentCard({
  projectKey,
  projectName,
  performance,
  onClick,
}: {
  projectKey: string
  projectName: string
  performance: DepartmentPerformance
  onClick: () => void
}) {
  const grade = getPerformanceGrade(performance.averageScore)
  const gradeColor = getGradeColor(grade)

  const gradeLabel = grade === 'excellent' ? '优秀' : grade === 'good' ? '良好' : grade === 'average' ? '一般' : '需改进'

  return (
    <div className={styles.memberCard} onClick={onClick} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onClick() }}>
      <div className={styles.memberCardHeader}>
        <div className={styles.memberAvatar} style={{ background: gradeColor + '22', color: gradeColor }}>
          {projectKey.charAt(0)}
        </div>
        <div className={styles.memberInfo}>
          <div className={styles.memberCardName}>{projectName}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{projectKey} · {performance.members.length} 人</div>
        </div>
      </div>

      <div className={styles.memberCardScore} style={{ color: gradeColor, margin: '12px 0 4px' }}>
        {performance.averageScore.toFixed(1)}
        <span className={styles.gradeBadge} style={{ marginLeft: 8, background: gradeColor + '15', color: gradeColor }}>
          {gradeLabel}
        </span>
      </div>

      {/* 五维度进度条 */}
      <div className={styles.memberDimensions}>
        {[
          { label: '吞吐量', value: performance.averageThroughput },
          { label: '效率', value: performance.averageEfficiency },
          { label: '质量', value: performance.averageQuality },
          { label: '影响力', value: performance.averageImpact },
          { label: '协作', value: performance.averageCollaboration },
        ].map(dim => {
          const dimGrade = getPerformanceGrade(dim.value)
          return (
            <div key={dim.label} className={styles.dimensionRow}>
              <span className={styles.dimensionLabel}>{dim.label}</span>
              <div className={styles.dimensionBar}>
                <div
                  className={styles.dimensionBarFill}
                  style={{ width: `${Math.min(100, dim.value)}%`, background: getGradeColor(dimGrade) }}
                />
              </div>
              <span className={styles.dimensionValue} style={{ color: getGradeColor(dimGrade) }}>
                {dim.value.toFixed(0)}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text2)', textAlign: 'center' }}>
        完成 {performance.totalCompletedTasks} 个任务 · 平均 {performance.averageCycleTime.toFixed(1)} 天
      </div>
    </div>
  )
}
