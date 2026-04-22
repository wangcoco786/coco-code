import { useQuery } from '@tanstack/react-query'
import { jiraClient } from '@/lib/jiraClient'
import type { JiraBoard, JiraVersion } from '@/types/jira'

// 获取所有 Jira 项目（用于顶部项目选择器）
export function useJiraProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => jiraClient.getProjects(),
    staleTime: 10 * 60 * 1000,
    select: (data) => [...data].sort((a, b) => a.name.localeCompare(b.name)),
  })
}

// 获取所有 Board（用于 Sprint 查询）
export function useJiraBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: () => jiraClient.getBoards(),
    staleTime: 10 * 60 * 1000,
    select: (data) =>
      [...(data.values as JiraBoard[])].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'scrum' ? -1 : 1
        return a.name.localeCompare(b.name)
      }),
  })
}

// 获取项目版本（里程碑）
export function useJiraVersions(projectKey: string | null) {
  return useQuery({
    queryKey: ['versions', projectKey],
    queryFn: () => jiraClient.getVersions(projectKey!),
    enabled: !!projectKey,
    staleTime: 10 * 60 * 1000,
    select: (data) => data as JiraVersion[],
  })
}
