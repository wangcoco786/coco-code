import type { SprintSummary, Risk, PlatformIssue } from '@/types/platform'

// ─── Report Interfaces ──────────────────────────────────────

export interface RetrospectiveReport {
  sprintName: string
  completionRate: number
  velocityComparison: { current: number; previous: number; delta: number } | null
  riskReview: { total: number; highCount: number; resolvedCount: number }
  teamContribution: { name: string; completed: number; total: number }[]
  improvements: string[] // at least 3
}

export interface SprintMetricsComparison {
  current: { name: string; completionRate: number; velocity: number; riskCount: number }
  previous: { name: string; completionRate: number; velocity: number; riskCount: number }
  deltas: { completionRate: number; velocity: number; riskCount: number }
}

export interface MonthlyReport {
  month: string // YYYY-MM
  sprintsCovered: string[]
  aggregatedCompletionRate: number // weighted average by task count
  totalTasksCompleted: number
  totalTasks: number
  velocityTrend: 'improving' | 'stable' | 'declining'
}

export interface CollaborationReport {
  crossTeamPairs: { teamA: string; teamB: string; sharedTasks: number }[]
  totalCrossTeamTasks: number
}

// ─── Helper Functions ───────────────────────────────────────

function computeVelocity(sprint: SprintSummary): number {
  return sprint.completedIssues
}

function generateImprovements(
  sprint: SprintSummary,
  risks: Risk[],
  teamContribution: { name: string; completed: number; total: number }[]
): string[] {
  const improvements: string[] = []

  // Check for mid-sprint additions (issues created after sprint start)
  const sprintStart = new Date(sprint.startDate)
  const addedMidSprint = sprint.issues.filter(
    (issue) => new Date(issue.createdAt) > sprintStart
  )
  if (addedMidSprint.length > 0) {
    improvements.push(
      `Reduce mid-sprint additions: ${addedMidSprint.length} issues were added after sprint start`
    )
  }

  // Check for workload imbalance
  if (teamContribution.length >= 2) {
    const loads = teamContribution.map((m) => m.total)
    const maxLoad = Math.max(...loads)
    const minLoad = Math.min(...loads)
    if (maxLoad > 0 && minLoad >= 0 && maxLoad > minLoad * 2) {
      improvements.push(
        'Balance workload across team members to avoid bottlenecks'
      )
    }
  }

  // Check for high risks
  const highRisks = risks.filter((r) => r.level === 'high')
  if (highRisks.length > 0) {
    improvements.push(
      `Address high risks earlier: ${highRisks.length} high-level risks were detected`
    )
  }

  // Check completion rate
  if (sprint.completionRate < 80) {
    improvements.push(
      'Consider reducing sprint scope to improve completion rate'
    )
  }

  // Check for unresolved risks
  const unresolvedRisks = risks.filter((r) => r.status !== 'resolved')
  if (unresolvedRisks.length > 0) {
    improvements.push(
      `Resolve outstanding risks: ${unresolvedRisks.length} risks remain unresolved`
    )
  }

  // Ensure at least 3 improvements
  const fallbackImprovements = [
    'Conduct regular stand-ups to identify blockers early',
    'Review estimation accuracy to improve future sprint planning',
    'Increase test coverage to reduce regression risks',
  ]

  let fallbackIndex = 0
  while (improvements.length < 3 && fallbackIndex < fallbackImprovements.length) {
    if (!improvements.includes(fallbackImprovements[fallbackIndex])) {
      improvements.push(fallbackImprovements[fallbackIndex])
    }
    fallbackIndex++
  }

  return improvements
}

// ─── Core Functions ─────────────────────────────────────────

/**
 * Generate a Sprint retrospective report including completion rate,
 * velocity comparison, risk review, team contribution, and improvements.
 */
export function generateRetrospective(
  sprint: SprintSummary,
  risks: Risk[],
  previousSprint?: SprintSummary | null
): RetrospectiveReport {
  // Compute team contribution from sprint.issues grouped by assignee
  const assigneeMap = new Map<string, { completed: number; total: number }>()

  for (const issue of sprint.issues) {
    const name = issue.assignee?.name ?? 'Unassigned'
    const entry = assigneeMap.get(name) ?? { completed: 0, total: 0 }
    entry.total++
    if (issue.status === 'done') {
      entry.completed++
    }
    assigneeMap.set(name, entry)
  }

  const teamContribution = Array.from(assigneeMap.entries()).map(
    ([name, stats]) => ({
      name,
      completed: stats.completed,
      total: stats.total,
    })
  )

  // Compute velocity comparison
  let velocityComparison: RetrospectiveReport['velocityComparison'] = null
  if (previousSprint) {
    const currentVelocity = computeVelocity(sprint)
    const previousVelocity = computeVelocity(previousSprint)
    velocityComparison = {
      current: currentVelocity,
      previous: previousVelocity,
      delta: currentVelocity - previousVelocity,
    }
  }

  // Compute risk review
  const highCount = risks.filter((r) => r.level === 'high').length
  const resolvedCount = risks.filter((r) => r.status === 'resolved').length

  const riskReview = {
    total: risks.length,
    highCount,
    resolvedCount,
  }

  // Generate improvements
  const improvements = generateImprovements(sprint, risks, teamContribution)

  return {
    sprintName: sprint.name,
    completionRate: sprint.completionRate,
    velocityComparison,
    riskReview,
    teamContribution,
    improvements,
  }
}

/**
 * Compare key metrics between two sprints.
 */
export function compareSprintMetrics(
  current: SprintSummary,
  previous: SprintSummary,
  currentRisks: Risk[],
  previousRisks: Risk[]
): SprintMetricsComparison {
  const currentVelocity = computeVelocity(current)
  const previousVelocity = computeVelocity(previous)

  return {
    current: {
      name: current.name,
      completionRate: current.completionRate,
      velocity: currentVelocity,
      riskCount: currentRisks.length,
    },
    previous: {
      name: previous.name,
      completionRate: previous.completionRate,
      velocity: previousVelocity,
      riskCount: previousRisks.length,
    },
    deltas: {
      completionRate: current.completionRate - previous.completionRate,
      velocity: currentVelocity - previousVelocity,
      riskCount: currentRisks.length - previousRisks.length,
    },
  }
}

/**
 * Aggregate a monthly report from sprints that overlap with the given month.
 * Completion rate is a weighted average by task count.
 */
export function aggregateMonthlyReport(
  sprints: SprintSummary[],
  month: string // YYYY-MM
): MonthlyReport {
  // Parse month boundaries
  const [yearStr, monthStr] = month.split('-')
  const year = parseInt(yearStr, 10)
  const monthNum = parseInt(monthStr, 10)
  const monthStart = new Date(year, monthNum - 1, 1)
  const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999) // last day of month

  // Filter sprints that overlap with the month
  const overlappingSprints = sprints.filter((sprint) => {
    const sprintStart = new Date(sprint.startDate)
    const sprintEnd = new Date(sprint.endDate)
    // Overlap: sprint starts before month ends AND sprint ends after month starts
    return sprintStart <= monthEnd && sprintEnd >= monthStart
  })

  const sprintsCovered = overlappingSprints.map((s) => s.name)

  // Compute weighted average completion rate
  let totalTasks = 0
  let totalTasksCompleted = 0

  for (const sprint of overlappingSprints) {
    totalTasks += sprint.totalIssues
    totalTasksCompleted += sprint.completedIssues
  }

  const aggregatedCompletionRate =
    totalTasks > 0 ? (totalTasksCompleted / totalTasks) * 100 : 0

  // Compute velocity trend from overlapping sprints
  let velocityTrend: MonthlyReport['velocityTrend'] = 'stable'
  if (overlappingSprints.length >= 2) {
    const velocities = overlappingSprints.map((s) => computeVelocity(s))
    // Compare first half average to second half average
    const midpoint = Math.floor(velocities.length / 2)
    const firstHalf = velocities.slice(0, midpoint)
    const secondHalf = velocities.slice(midpoint)

    const firstAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        : 0
    const secondAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        : 0

    const diff = secondAvg - firstAvg
    if (diff > 1) {
      velocityTrend = 'improving'
    } else if (diff < -1) {
      velocityTrend = 'declining'
    }
  }

  return {
    month,
    sprintsCovered,
    aggregatedCompletionRate,
    totalTasksCompleted,
    totalTasks,
    velocityTrend,
  }
}

/**
 * Generate a cross-team collaboration report by identifying issues
 * with labels containing different team names.
 */
export function generateCollaborationReport(
  issues: PlatformIssue[]
): CollaborationReport {
  // Extract team names from labels that follow the pattern "team-<name>" or "team:<name>"
  const teamPattern = /^team[-:_](.+)$/i

  const pairCountMap = new Map<string, number>()
  let totalCrossTeamTasks = 0

  for (const issue of issues) {
    // Extract team labels from this issue
    const teams: string[] = []
    for (const label of issue.labels) {
      const match = label.match(teamPattern)
      if (match) {
        teams.push(match[1].toLowerCase())
      }
    }

    // If issue has labels from multiple teams, it's a cross-team task
    const uniqueTeams = [...new Set(teams)]
    if (uniqueTeams.length >= 2) {
      totalCrossTeamTasks++

      // Generate all pairs
      for (let i = 0; i < uniqueTeams.length; i++) {
        for (let j = i + 1; j < uniqueTeams.length; j++) {
          // Sort to ensure consistent key
          const [teamA, teamB] = [uniqueTeams[i], uniqueTeams[j]].sort()
          const key = `${teamA}|${teamB}`
          pairCountMap.set(key, (pairCountMap.get(key) ?? 0) + 1)
        }
      }
    }
  }

  const crossTeamPairs = Array.from(pairCountMap.entries()).map(
    ([key, sharedTasks]) => {
      const [teamA, teamB] = key.split('|')
      return { teamA, teamB, sharedTasks }
    }
  )

  // Sort by shared tasks descending
  crossTeamPairs.sort((a, b) => b.sharedTasks - a.sharedTasks)

  return {
    crossTeamPairs,
    totalCrossTeamTasks,
  }
}
