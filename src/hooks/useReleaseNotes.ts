import { useState, useMemo, useCallback } from 'react'
import { useActiveSprintIssuesByProject, useActiveSprintsByProject } from '@/hooks/useProjectIssues'
import { buildReleaseNotesData, identifyUnplannedIssues } from '@/lib/releaseNotesEngine'
import type { ReleaseNotesData, ClassifiedIssue } from '@/types/platform'
import type { JiraSprint } from '@/types/jira'

// ============================================================
// useReleaseNotes — 数据 Hook
// 复用现有 hooks 获取 Sprint 数据，调用 releaseNotesEngine 计算
// 分类结果和统计摘要，管理筛选状态
// ============================================================

export interface UseReleaseNotesResult {
  /** 完整的 Release Notes 数据（分类、统计、stale 检测） */
  releaseNotesData: ReleaseNotesData | null
  /** 当前活跃 Sprint 信息 */
  sprint: JiraSprint | null
  /** 数据是否正在加载 */
  isLoading: boolean
  /** 加载错误 */
  error: Error | null
  /** 重新获取数据 */
  refetch: () => void
  /** 筛选状态：仅显示插队 Issue */
  showOnlyUnplanned: boolean
  /** 筛选状态：仅显示状态待更新 Issue */
  showOnlyStale: boolean
  /** 切换仅显示插队 Issue 筛选 */
  toggleShowOnlyUnplanned: () => void
  /** 切换仅显示状态待更新 Issue 筛选 */
  toggleShowOnlyStale: () => void
  /** 经过筛选后的分类 Issue 列表（扁平） */
  filteredIssues: ClassifiedIssue[]
}

export function useReleaseNotes(projectKey: string | null): UseReleaseNotesResult {
  // ─── 筛选状态 ─────────────────────────────────────────────
  const [showOnlyUnplanned, setShowOnlyUnplanned] = useState(false)
  const [showOnlyStale, setShowOnlyStale] = useState(false)

  const toggleShowOnlyUnplanned = useCallback(() => {
    setShowOnlyUnplanned((prev) => !prev)
  }, [])

  const toggleShowOnlyStale = useCallback(() => {
    setShowOnlyStale((prev) => !prev)
  }, [])

  // ─── 数据获取 ─────────────────────────────────────────────
  const { data: sprints = [], isLoading: isSprintsLoading } = useActiveSprintsByProject(projectKey)
  const sprint = sprints[0] ?? null

  // 使用 sprintId 精确过滤，只获取当前迭代的 Issue
  // 只有当 sprint 数据加载完成后才发起 issues 查询
  const {
    data: issues = [],
    isLoading: isIssuesLoading,
    error: issuesError,
    refetch: refetchIssues,
  } = useActiveSprintIssuesByProject(
    sprint?.id ? projectKey : null,
    sprint?.id ?? null,
  )

  // ─── 加载和错误状态 ───────────────────────────────────────
  const isLoading = (isSprintsLoading || (!!sprint?.id && isIssuesLoading)) && !!projectKey
  const error = issuesError as Error | null

  // ─── 计算 Release Notes 数据 ─────────────────────────────
  const releaseNotesData = useMemo<ReleaseNotesData | null>(() => {
    if (!sprint || issues.length === 0) return null

    return buildReleaseNotesData(
      issues,
      {
        name: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
      },
      projectKey ?? '',
    )
  }, [issues, sprint, projectKey])

  // ─── 筛选后的 Issue 列表 ─────────────────────────────────
  const filteredIssues = useMemo<ClassifiedIssue[]>(() => {
    if (!releaseNotesData) return []

    const { categorizedIssues, staleIssues } = releaseNotesData
    // 扁平化所有分类 Issue
    const allIssues: ClassifiedIssue[] = [
      ...categorizedIssues.feature,
      ...categorizedIssues.bug_fix,
      ...categorizedIssues.hot_fix,
      ...categorizedIssues.improvement,
      ...categorizedIssues.other,
    ]

    let result = allIssues

    if (showOnlyUnplanned) {
      result = identifyUnplannedIssues(result)
    }

    if (showOnlyStale) {
      const staleIds = new Set(staleIssues.map((i) => i.id))
      result = result.filter((issue) => staleIds.has(issue.id))
    }

    return result
  }, [releaseNotesData, showOnlyUnplanned, showOnlyStale])

  // ─── refetch ──────────────────────────────────────────────
  const refetch = useCallback(() => {
    refetchIssues()
  }, [refetchIssues])

  return {
    releaseNotesData,
    sprint,
    isLoading,
    error,
    refetch,
    showOnlyUnplanned,
    showOnlyStale,
    toggleShowOnlyUnplanned,
    toggleShowOnlyStale,
    filteredIssues,
  }
}
