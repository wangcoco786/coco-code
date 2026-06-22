import { useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { getPerformanceGrade, getGradeColor, calculateComplexityFactor } from '@/lib/performanceEngine'
import type { MemberPerformance, PerformanceIssue } from '@/lib/performanceEngine'
import styles from './PerformanceView.module.css'

type SortKey = 'performanceScore' | 'throughputScore' | 'efficiencyScore' | 'qualityScore' | 'impactScore' | 'collaborationScore'

interface IndividualPerformanceProps {
  memberPerformances: MemberPerformance[]
}

/** 排序维度选项 */
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'performanceScore', label: '综合绩效' },
  { key: 'throughputScore', label: '吞吐量' },
  { key: 'efficiencyScore', label: '效率' },
  { key: 'qualityScore', label: '质量' },
  { key: 'impactScore', label: '影响力' },
  { key: 'collaborationScore', label: '协作' },
]

/** 五维度标签 */
const DIMENSION_LABELS: { key: keyof Pick<MemberPerformance, 'throughputScore' | 'efficiencyScore' | 'qualityScore' | 'impactScore' | 'collaborationScore'>; label: string }[] = [
  { key: 'throughputScore', label: '吞吐量' },
  { key: 'efficiencyScore', label: '效率' },
  { key: 'qualityScore', label: '质量' },
  { key: 'impactScore', label: '影响力' },
  { key: 'collaborationScore', label: '协作' },
]

/** 等级标签文字映射 */
function getGradeLabel(grade: string): string {
  switch (grade) {
    case 'excellent': return '优秀'
    case 'good': return '良好'
    case 'average': return '一般'
    case 'needs_improvement': return '需改进'
    default: return ''
  }
}

/** 获取等级对应的 CSS class 名 */
function getGradeClass(grade: string): string {
  switch (grade) {
    case 'excellent': return styles.excellent
    case 'good': return styles.good
    case 'average': return styles.average
    case 'needs_improvement': return styles.needsImprovement
    default: return ''
  }
}

/** 获取任务状态中文标签 */
function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'done': return '已完成'
    case 'in_progress':
    case 'inprogress': return '进行中'
    case 'todo':
    case 'to_do': return '待办'
    default: return status
  }
}

/** 获取优先级中文标签 */
function getPriorityLabel(priority: string | null | undefined): string {
  if (!priority) return '-'
  switch (priority.toLowerCase()) {
    case 'highest': return '最高'
    case 'high': return '高'
    case 'medium': return '中'
    case 'low': return '低'
    case 'lowest': return '最低'
    default: return priority
  }
}

export default function IndividualPerformance({ memberPerformances }: IndividualPerformanceProps) {
  const [sortKey, setSortKey] = useState<SortKey>('performanceScore')
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // 按角色分组
  const { developers, reporters, qas } = useMemo(() => {
    const devs: MemberPerformance[] = []
    const reps: MemberPerformance[] = []
    const qas: MemberPerformance[] = []

    for (const member of memberPerformances) {
      const roles = member.roles ?? []
      if (roles.includes('Developer')) devs.push(member)
      if (roles.includes('Reporter')) reps.push(member)
      if (roles.includes('QA')) qas.push(member)
      // 如果没有明确角色，归入 Developer
      if (roles.length === 0) {
        devs.push(member)
      }
    }

    // 各组按选定维度排序
    const sort = (arr: MemberPerformance[]) => [...arr].sort((a, b) => b[sortKey] - a[sortKey])
    return { developers: sort(devs), reporters: sort(reps), qas: sort(qas) }
  }, [memberPerformances, sortKey])

  // 如果选中了某人，显示该人的详情视图
  if (selectedMemberId) {
    const selectedMember = memberPerformances.find(m => m.memberId === selectedMemberId)
    if (selectedMember) {
      return (
        <div>
          <button
            className={styles.backButton}
            onClick={() => setSelectedMemberId(null)}
          >
            ← 返回列表
          </button>
          <MemberCard
            member={selectedMember}
            isExpanded={true}
            onClick={() => setSelectedMemberId(null)}
          />
        </div>
      )
    }
  }

  return (
    <div>
      {/* 排序控件 */}
      <div className={styles.sortControls}>
        <span className={styles.sortLabel}>排序方式：</span>
        <select
          className={styles.sortSelect}
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Developer 组 */}
      {developers.length > 0 && (
        <RoleSection
          title="👨‍💻 Developer"
          members={developers}
          onCardClick={setSelectedMemberId}
        />
      )}

      {/* Reporter 组 */}
      {reporters.length > 0 && (
        <RoleSection
          title="📝 Reporter"
          members={reporters}
          onCardClick={setSelectedMemberId}
        />
      )}

      {/* QA 组 */}
      {qas.length > 0 && (
        <RoleSection
          title="🧪 QA"
          members={qas}
          onCardClick={setSelectedMemberId}
        />
      )}
    </div>
  )
}

/** 角色分组区块 */
function RoleSection({ title, members, onCardClick }: {
  title: string
  members: MemberPerformance[]
  onCardClick: (id: string) => void
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid var(--border)' }}>
        {title}
        <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text2)', marginLeft: 8 }}>
          ({members.length} 人)
        </span>
      </h3>
      <div className={styles.memberGrid}>
        {members.map(member => (
          <MemberCard
            key={member.memberId}
            member={member}
            isExpanded={false}
            onClick={() => onCardClick(member.memberId)}
          />
        ))}
      </div>
    </div>
  )
}

/** 成员卡片组件 */
function MemberCard({
  member,
  isExpanded,
  onClick,
}: {
  member: MemberPerformance
  isExpanded: boolean
  onClick: () => void
}) {
  const grade = member.grade
  const gradeClass = getGradeClass(grade)

  // 个人雷达图配置
  const radarOption = {
    tooltip: {},
    radar: {
      indicator: [
        { name: '吞吐量', max: 100 },
        { name: '效率', max: 100 },
        { name: '质量', max: 100 },
        { name: '影响力', max: 100 },
        { name: '协作', max: 100 },
      ],
      shape: 'polygon' as const,
      splitNumber: 4,
      radius: '65%',
      axisName: {
        color: '#666',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: { color: '#e8e8e8' },
      },
      splitArea: {
        show: true,
        areaStyle: { color: ['#fff', '#f5f5f5', '#fff', '#f5f5f5'] },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              member.throughputScore,
              member.efficiencyScore,
              member.qualityScore,
              member.impactScore,
              member.collaborationScore,
            ],
            name: member.memberName,
            areaStyle: { color: `${getGradeColor(grade)}22` },
            lineStyle: { color: getGradeColor(grade), width: 2 },
            itemStyle: { color: getGradeColor(grade) },
          },
        ],
      },
    ],
  }

  return (
    <div
      className={`${styles.memberCard} ${isExpanded ? styles.expanded : ''}`}
      onClick={!isExpanded ? onClick : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      aria-expanded={isExpanded}
    >
      {/* 卡片头部：头像、姓名、分数、等级 */}
      <div className={styles.memberCardHeader}>
        <div className={styles.memberAvatar}>
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.memberName} />
          ) : (
            member.memberName.charAt(0).toUpperCase()
          )}
        </div>
        <div className={styles.memberInfo}>
          <div className={styles.memberCardName}>
            {member.memberName}
            {member.roles && member.roles.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text2)', marginLeft: 6 }}>
                ({member.roles.join(', ')})
              </span>
            )}
          </div>
          <div className={styles.memberCardScore} style={{ color: getGradeColor(grade) }}>
            {member.performanceScore.toFixed(1)}
            <span className={`${styles.gradeBadge} ${gradeClass}`} style={{ marginLeft: 8 }}>
              {getGradeLabel(grade)}
            </span>
          </div>
        </div>
      </div>

      {/* 以下内容仅在展开（详情视图）时显示 */}
      {isExpanded && (
        <>
          {/* 个人雷达图 */}
          <div className={styles.memberCardRadar}>
            <ReactECharts
              option={radarOption}
              style={{ width: '100%', height: '100%' }}
              notMerge={true}
              lazyUpdate={true}
            />
          </div>

          {/* 五维度进度条 */}
          <div className={styles.memberDimensions}>
            {DIMENSION_LABELS.map(dim => {
              const score = member[dim.key]
              const dimGrade = getPerformanceGrade(score)
              return (
                <div key={dim.key} className={styles.dimensionRow}>
                  <span className={styles.dimensionLabel}>{dim.label}</span>
                  <div className={styles.dimensionBar}>
                    <div
                      className={styles.dimensionBarFill}
                      style={{
                        width: `${Math.min(100, score)}%`,
                        background: getGradeColor(dimGrade),
                      }}
                    />
                  </div>
                  <span className={styles.dimensionValue} style={{ color: getGradeColor(dimGrade) }}>
                    {score.toFixed(0)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* 任务列表 */}
          <div className={styles.memberDetails} onClick={e => e.stopPropagation()}>
            <div className={styles.detailsTitle}>任务列表</div>
            <TaskListTable tasks={member.tasks} />
          </div>
        </>
      )}
    </div>
  )
}

/** 任务列表表格 */
function TaskListTable({ tasks }: { tasks: PerformanceIssue[] }) {
  if (!tasks || tasks.length === 0) {
    return <div className={styles.noData}>暂无任务数据</div>
  }

  return (
    <table className={styles.taskList}>
      <thead>
        <tr>
          <th>编号</th>
          <th>任务</th>
          <th>状态</th>
          <th>优先级</th>
          <th>复杂度</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => {
          const complexity = calculateComplexityFactor({
            subtaskCount: task.subtaskCount,
            linkedIssueCount: task.linkedIssueCount,
            commentCount: task.commentCount,
            sprintChanges: task.sprintChanges,
          })
          return (
            <tr key={task.id}>
              <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                <a
                  href={`${import.meta.env.VITE_JIRA_BASE_URL}/browse/${task.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--primary)', textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}
                >
                  {task.id}
                </a>
              </td>
              <td>{task.title}</td>
              <td>{getStatusLabel(task.status)}</td>
              <td>{getPriorityLabel(task.priority)}</td>
              <td>
                <span className={styles.complexityBadge}>
                  {complexity.toFixed(1)}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
