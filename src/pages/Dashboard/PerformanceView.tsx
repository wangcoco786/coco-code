import { useState } from 'react'
import { usePerformanceData } from '@/hooks/usePerformanceData'
import DepartmentOverview from './DepartmentOverview'
import IndividualPerformance from './IndividualPerformance'
import styles from './PerformanceView.module.css'

type SubTab = 'department' | 'individual'

interface Props {
  projectKey: string | null
}

export default function PerformanceView({ projectKey }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('department')
  const { data, isLoading } = usePerformanceData(projectKey)

  // 加载状态（骨架屏）
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
        <div className={styles.skeletonCard} style={{ marginTop: 16 }}>
          <div className={styles.skeleton} style={{ height: 200 }} />
        </div>
      </div>
    )
  }

  // 空状态（无数据）
  if (!data) {
    return (
      <div>
        <div className={styles.subTabs}>
          <button className={`${styles.subTab} ${styles.active}`}>部门总览</button>
          <button className={styles.subTab}>个人详情</button>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyTitle}>暂无数据</div>
          <div className={styles.emptyDesc}>当前 Sprint 暂无可用的绩效数据</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 子视图切换 Tab */}
      <div className={styles.subTabs}>
        <button
          className={`${styles.subTab} ${activeSubTab === 'department' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('department')}
        >
          部门总览
        </button>
        <button
          className={`${styles.subTab} ${activeSubTab === 'individual' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('individual')}
        >
          个人详情
        </button>
      </div>

      {/* 内容区 */}
      {activeSubTab === 'department' && (
        <div data-testid="department-overview">
          <DepartmentOverview departmentPerformance={data} />
        </div>
      )}

      {activeSubTab === 'individual' && (
        <div data-testid="individual-performance">
          <IndividualPerformance memberPerformances={data.members} />
        </div>
      )}
    </div>
  )
}
