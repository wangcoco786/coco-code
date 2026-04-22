import { useQuery } from '@tanstack/react-query'
import { jiraClient } from '@/lib/jiraClient'
import type { JiraSprint } from '@/types/jira'

export function useJiraSprints(
  boardId: number | null,
  state?: 'active' | 'closed' | 'future'
) {
  return useQuery({
    queryKey: ['sprints', boardId, state],
    queryFn: () => jiraClient.getSprints(boardId!, state),
    enabled: boardId !== null,
    staleTime: 5 * 60 * 1000, // 5 分钟
    select: (data) => data.values as JiraSprint[],
  })
}

export function useActiveSprint(boardId: number | null) {
  const { data: sprints, ...rest } = useJiraSprints(boardId)
  const activeSprint = sprints?.find((s) => s.state === 'active') ?? null
  return { data: activeSprint, ...rest }
}
