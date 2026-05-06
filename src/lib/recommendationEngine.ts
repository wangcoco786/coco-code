import type {
  MemberProfile,
  RecommendationCandidate,
  RecommendationResult,
  IssuePriority,
} from '@/types/platform'

// ─── Weight Configuration ───────────────────────────────────

const WEIGHT_SKILL_MATCH = 0.4
const WEIGHT_WORKLOAD = 0.3
const WEIGHT_COMPLETION_RATE = 0.3

// ─── Core Functions ─────────────────────────────────────────

/**
 * Computes a 0-100 score for a single member relative to a task.
 * Score = skillMatch * 40% + workloadAvailability * 30% + completionRate * 30%
 */
export function computeMemberScore(
  member: MemberProfile,
  task: { labels: string[]; priority: IssuePriority; storyPoints: number }
): number {
  // Skill match: proportion of task labels matched by member skills
  const skillMatch = computeSkillMatch(member.skills, task.labels)

  // Workload availability: inverse of current load percentage (clamped 0-1)
  const loadRatio = member.capacity > 0 ? member.currentLoad / member.capacity : 1
  const workloadAvailability = Math.max(0, Math.min(1, 1 - loadRatio))

  // Historical completion rate (already 0-1)
  const completionRate = Math.max(0, Math.min(1, member.completionRate))

  const rawScore =
    skillMatch * WEIGHT_SKILL_MATCH +
    workloadAvailability * WEIGHT_WORKLOAD +
    completionRate * WEIGHT_COMPLETION_RATE

  return Math.round(rawScore * 100)
}

/**
 * Recommends top N assignees for a task based on team profiles.
 * Returns 'insufficient_data' if fewer than 2 members are available.
 */
export function recommendAssignees(
  task: { labels: string[]; priority: IssuePriority; storyPoints: number },
  teamProfiles: MemberProfile[],
  topN: number = 3
): RecommendationResult {
  if (teamProfiles.length < 2) {
    return {
      status: 'insufficient_data',
      candidates: [],
      message: '团队成员不足 2 人，无法生成推荐',
    }
  }

  const candidates: RecommendationCandidate[] = teamProfiles.map((member) => {
    const score = computeMemberScore(member, task)
    const skillMatch = computeSkillMatch(member.skills, task.labels)
    const loadRatio = member.capacity > 0 ? member.currentLoad / member.capacity : 1
    const workloadPercentage = Math.round(loadRatio * 100)

    const reasons: string[] = []
    if (skillMatch >= 0.5) {
      reasons.push(`技能匹配度 ${Math.round(skillMatch * 100)}%`)
    }
    if (workloadPercentage < 80) {
      reasons.push(`当前负载 ${workloadPercentage}%，有余力`)
    }
    if (member.completionRate >= 0.8) {
      reasons.push(`历史完成率 ${Math.round(member.completionRate * 100)}%`)
    }
    if (reasons.length === 0) {
      reasons.push('综合评分较高')
    }

    return {
      memberId: member.id,
      memberName: member.name,
      score,
      reasons,
      workloadPercentage,
      skillMatch,
      historicalRate: member.completionRate,
    }
  })

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score)

  return {
    status: 'success',
    candidates: candidates.slice(0, topN),
  }
}

// ─── Helpers ────────────────────────────────────────────────

function computeSkillMatch(memberSkills: string[], taskLabels: string[]): number {
  if (taskLabels.length === 0) return 0.5 // neutral when no labels
  const normalizedSkills = memberSkills.map((s) => s.toLowerCase())
  const normalizedLabels = taskLabels.map((l) => l.toLowerCase())
  const matchCount = normalizedLabels.filter((label) =>
    normalizedSkills.includes(label)
  ).length
  return matchCount / normalizedLabels.length
}
