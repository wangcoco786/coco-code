import ReactECharts from 'echarts-for-react'
import { getPerformanceGrade, getGradeColor } from '@/lib/performanceEngine'
import type { DepartmentPerformance, MemberPerformance } from '@/lib/performanceEngine'
import styles from './PerformanceView.module.css'

interface DepartmentOverviewProps {
  departmentPerformance: DepartmentPerformance
}

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

export default function DepartmentOverview({ departmentPerformance }: DepartmentOverviewProps) {
  const {
    averageScore,
    averageThroughput,
    averageEfficiency,
    averageQuality,
    averageImpact,
    averageCollaboration,
    totalCompletedTasks,
    averageCycleTime,
    members,
    distribution,
  } = departmentPerformance

  // 按 Performance_Score 降序排列
  const sortedMembers = [...members].sort((a, b) => b.performanceScore - a.performanceScore)

  // 指标卡片数据
  const metrics = [
    { label: '综合绩效', value: averageScore, key: 'performance' },
    { label: '吞吐量', value: averageThroughput, key: 'throughput' },
    { label: '效率', value: averageEfficiency, key: 'efficiency' },
    { label: '质量', value: averageQuality, key: 'quality' },
    { label: '影响力', value: averageImpact, key: 'impact' },
    { label: '协作', value: averageCollaboration, key: 'collaboration' },
  ]

  // 雷达图配置
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
      axisName: {
        color: '#666',
        fontSize: 12,
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
              averageThroughput,
              averageEfficiency,
              averageQuality,
              averageImpact,
              averageCollaboration,
            ],
            name: '团队平均',
            areaStyle: { color: 'rgba(22, 119, 255, 0.15)' },
            lineStyle: { color: '#1677ff', width: 2 },
            itemStyle: { color: '#1677ff' },
          },
        ],
      },
    ],
  }

  // 绩效分布柱状图配置
  const distributionOption = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
    },
    grid: {
      left: 40,
      right: 20,
      top: 20,
      bottom: 40,
      containLabel: false,
    },
    xAxis: {
      type: 'category' as const,
      data: ['优秀 (80-100)', '良好 (60-79)', '一般 (40-59)', '需改进 (0-39)'],
      axisLabel: { fontSize: 11, color: '#666' },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      minInterval: 1,
      axisLabel: { fontSize: 11, color: '#999' },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLine: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: [
          { value: distribution.excellent, itemStyle: { color: '#52c41a' } },
          { value: distribution.good, itemStyle: { color: '#1677ff' } },
          { value: distribution.average, itemStyle: { color: '#fa8c16' } },
          { value: distribution.needsImprovement, itemStyle: { color: '#f5222d' } },
        ],
        barMaxWidth: 48,
        label: {
          show: true,
          position: 'top' as const,
          fontSize: 12,
          fontWeight: 600,
          color: '#333',
        },
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
    animationDuration: 600,
    animationEasing: 'cubicOut',
  }

  return (
    <div>
      {/* 6 个聚合指标卡片 */}
      <div className={styles.metricsGrid}>
        {metrics.map(metric => {
          const grade = getPerformanceGrade(metric.value)
          const gradeClass = getGradeClass(grade)
          return (
            <div key={metric.key} className={`${styles.metricCard} ${gradeClass}`}>
              <div className={styles.metricLabel}>{metric.label}</div>
              <div className={styles.metricValue} style={{ color: getGradeColor(grade) }}>
                {metric.value.toFixed(1)}
              </div>
              <div className={styles.metricSub}>
                <span className={`${styles.gradeBadge} ${gradeClass}`}>
                  {getGradeLabel(grade)}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${gradeClass}`}
                  style={{ width: `${Math.min(100, metric.value)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* 团队总完成任务数和平均 Cycle_Time */}
      <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 20 }}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>团队总完成任务数</div>
          <div className={styles.metricValue}>{totalCompletedTasks}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>平均 Cycle Time</div>
          <div className={styles.metricValue}>{averageCycleTime.toFixed(1)} <span style={{ fontSize: 14, fontWeight: 400 }}>天</span></div>
        </div>
      </div>

      {/* 两列布局：雷达图 + 分布图 */}
      <div className={styles.twoCol}>
        {/* 雷达图 */}
        <div className={styles.radarContainer}>
          <ReactECharts
            option={radarOption}
            style={{ width: '100%', height: 320 }}
            notMerge={true}
            lazyUpdate={true}
          />
        </div>

        {/* 绩效分布图 */}
        <div className={styles.distributionContainer}>
          <div className={styles.distributionTitle}>绩效分布</div>
          <ReactECharts
            option={distributionOption}
            className={styles.distributionChart}
            notMerge={true}
            lazyUpdate={true}
          />
        </div>
      </div>

      {/* 绩效排行列表 */}
      <div className={styles.rankingSection}>
        <div className={styles.rankingTitle}>绩效排行</div>
        <table className={styles.rankingTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>成员</th>
              <th>综合分</th>
              <th>吞吐量</th>
              <th>效率</th>
              <th>质量</th>
              <th>影响力</th>
              <th>协作</th>
              <th>等级</th>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.map((member, index) => (
              <RankingRow key={member.memberId} member={member} rank={index + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** 排行列表行组件 */
function RankingRow({ member, rank }: { member: MemberPerformance; rank: number }) {
  const grade = member.grade
  const gradeClass = getGradeClass(grade)

  return (
    <tr>
      <td className={styles.rankNumber}>{rank}</td>
      <td className={styles.memberName}>{member.memberName}</td>
      <td>
        <span className={styles.dimensionScore} style={{ color: getGradeColor(grade) }}>
          {member.performanceScore.toFixed(1)}
        </span>
      </td>
      <td>
        <DimensionCell score={member.throughputScore} />
      </td>
      <td>
        <DimensionCell score={member.efficiencyScore} />
      </td>
      <td>
        <DimensionCell score={member.qualityScore} />
      </td>
      <td>
        <DimensionCell score={member.impactScore} />
      </td>
      <td>
        <DimensionCell score={member.collaborationScore} />
      </td>
      <td>
        <span className={`${styles.gradeBadge} ${gradeClass}`}>
          {getGradeLabel(grade)}
        </span>
      </td>
    </tr>
  )
}

/** 维度分数单元格（带进度条） */
function DimensionCell({ score }: { score: number }) {
  const grade = getPerformanceGrade(score)
  const gradeClass = getGradeClass(grade)

  return (
    <div>
      <span className={styles.dimensionScore} style={{ color: getGradeColor(grade) }}>
        {score.toFixed(1)}
      </span>
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${gradeClass}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  )
}
