import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useRoadmapStore } from './useRoadmapStore'
import type { MilestoneFormData, NodeFormData, RoadmapMilestone } from '@/types/roadmap'

// ── Helpers ─────────────────────────────────────────────────

const PROJECT_KEY = 'TEST'

const milestoneData: MilestoneFormData = {
  name: 'Sprint 1',
  startDate: '2025-01-01',
  endDate: '2025-01-14',
  description: 'First sprint',
  status: 'planned',
}

const nodeData: NodeFormData = {
  name: 'Release v1',
  date: '2025-02-01',
  type: 'release',
  description: 'Major release',
}

function lsKey(prefix: string) {
  return `${prefix}_${PROJECT_KEY}`
}

// ── Tests ───────────────────────────────────────────────────

describe('useRoadmapStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns no-op store when projectKey is null', () => {
    const { result } = renderHook(() => useRoadmapStore(null))
    expect(result.current.milestones).toEqual([])
    expect(result.current.nodes).toEqual([])
    expect(result.current.templateId).toBeNull()
    // no-op functions should not throw
    result.current.addMilestone(milestoneData)
    result.current.clearAll()
  })

  it('loads data from localStorage on mount', () => {
    const saved: RoadmapMilestone[] = [{
      id: 'ms-1', name: 'Saved', startDate: '2025-01-01', endDate: '2025-01-14',
      description: '', status: 'planned', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    }]
    localStorage.setItem(lsKey('roadmap_milestones'), JSON.stringify(saved))

    const { result } = renderHook(() => useRoadmapStore(PROJECT_KEY))
    expect(result.current.milestones).toHaveLength(1)
    expect(result.current.milestones[0].name).toBe('Saved')
  })

  it('addMilestone creates and persists a milestone', () => {
    const { result } = renderHook(() => useRoadmapStore(PROJECT_KEY))

    let _created: RoadmapMilestone | undefined
    act(() => {
      _created = result.current.addMilestone(milestoneData)
    })
    void _created

    expect(result.current.milestones).toHaveLength(1)
    expect(result.current.milestones[0].name).toBe('Sprint 1')
    expect(result.current.milestones[0].id).toBeTruthy()

    const stored = JSON.parse(localStorage.getItem(lsKey('roadmap_milestones'))!)
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Sprint 1')
  })

  it('updateMilestone merges partial data and updates updatedAt', async () => {
    const { result } = renderHook(() => useRoadmapStore(PROJECT_KEY))

    let id: string
    act(() => {
      const ms = result.current.addMilestone(milestoneData)
      id = ms.id
    })

    const oldUpdatedAt = result.current.milestones[0].updatedAt

    // Small delay to ensure updatedAt differs
    await new Promise((r) => setTimeout(r, 10))

    act(() => {
      result.current.updateMilestone(id!, { name: 'Sprint 1 Updated', status: 'in_progress' })
    })

    expect(result.current.milestones[0].name).toBe('Sprint 1 Updated')
    expect(result.current.milestones[0].status).toBe('in_progress')
    expect(result.current.milestones[0].startDate).toBe('2025-01-01') // unchanged
    expect(result.current.milestones[0].updatedAt).not.toBe(oldUpdatedAt)
  })

  it('deleteMilestone removes by id', () => {
    const { result } = renderHook(() => useRoadmapStore(PROJECT_KEY))

    let id: string
    act(() => {
      const ms = result.current.addMilestone(milestoneData)
      id = ms.id
    })
    expect(result.current.milestones).toHaveLength(1)

    act(() => {
      result.current.deleteMilestone(id!)
    })
    expect(result.current.milestones).toHaveLength(0)

    const stored = JSON.parse(localStorage.getItem(lsKey('roadmap_milestones'))!)
    expect(stored).toHaveLength(0)
  })

  it('addNode creates and persists a node', () => {
    const { result } = renderHook(() => useRoadmapStore(PROJECT_KEY))

    act(() => {
      result.current.addNode(nodeData)
    })

    expect(result.current.nodes).toHaveLength(1)
    expect(result.current.nodes[0].name).toBe('Release v1')
    expect(result.current.nodes[0].type).toBe('release')

    const stored = JSON.parse(localStorage.getItem(lsKey('roadmap_nodes'))!)
    expect(stored).toHaveLength(1)
  })

  it('updateNode merges partial data', () => {
    const { result } = renderHook(() => useRoadmapStore(PROJECT_KEY))

    let id: string
    act(() => {
      const n = result.current.addNode(nodeData)
      id = n.id
    })

    act(() => {
      result.current.updateNode(id!, { name: 'Release v2' })
    })

    expect(result.current.nodes[0].name).toBe('Release v2')
    expect(result.current.nodes[0].type).toBe('release') // unchanged
  })

  it('deleteNode removes by id', () => {
    const { result } = renderHook(() => useRoadmapStore(PROJECT_KEY))

    let id: string
    act(() => {
      const n = result.current.addNode(nodeData)
      id = n.id
    })

    act(() => {
      result.current.deleteNode(id!)
    })
    expect(result.current.nodes).toHaveLength(0)
  })

  it('applyTemplate replaces milestones and nodes', () => {
    const { result } = renderHook(() => useRoadmapStore(PROJECT_KEY))

    // Add existing data first
    act(() => {
      result.current.addMilestone(milestoneData)
    })
    expect(result.current.milestones).toHaveLength(1)

    act(() => {
      result.current.applyTemplate('agile-sprint', new Date('2025-03-01'))
    })

    // Agile sprint template has 6 milestones and 6 nodes
    expect(result.current.milestones).toHaveLength(6)
    expect(result.current.nodes).toHaveLength(6)
    expect(result.current.templateId).toBe('agile-sprint')

    const storedTemplate = JSON.parse(localStorage.getItem(lsKey('roadmap_template'))!)
    expect(storedTemplate).toBe('agile-sprint')
  })

  it('applyTemplate with custom-blank produces empty arrays', () => {
    const { result } = renderHook(() => useRoadmapStore(PROJECT_KEY))

    act(() => {
      result.current.applyTemplate('custom-blank')
    })

    expect(result.current.milestones).toHaveLength(0)
    expect(result.current.nodes).toHaveLength(0)
    expect(result.current.templateId).toBe('custom-blank')
  })

  it('clearAll resets everything', () => {
    const { result } = renderHook(() => useRoadmapStore(PROJECT_KEY))

    act(() => {
      result.current.addMilestone(milestoneData)
      result.current.addNode(nodeData)
    })

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.milestones).toHaveLength(0)
    expect(result.current.nodes).toHaveLength(0)
    expect(result.current.templateId).toBeNull()
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(lsKey('roadmap_milestones'), 'not-valid-json')

    const { result } = renderHook(() => useRoadmapStore(PROJECT_KEY))
    expect(result.current.milestones).toEqual([])
  })

  it('mergeSyncedMilestones integrates synced data', () => {
    renderHook(() => useRoadmapStore(PROJECT_KEY))

    // Add a milestone with jiraVersionId
    const existing: RoadmapMilestone = {
      id: 'ms-local',
      name: 'Old Name',
      startDate: '2025-01-01',
      endDate: '2025-01-14',
      description: '',
      status: 'planned',
      jiraVersionId: 'jira-v1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }
    localStorage.setItem(lsKey('roadmap_milestones'), JSON.stringify([existing]))

    // Re-render to pick up localStorage
    const { result: result2 } = renderHook(() => useRoadmapStore(PROJECT_KEY))

    const synced: RoadmapMilestone[] = [{
      id: 'ms-synced',
      name: 'Updated Name',
      startDate: '2025-01-01',
      endDate: '2025-01-21',
      description: '',
      status: 'completed',
      jiraVersionId: 'jira-v1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }]

    act(() => {
      result2.current.mergeSyncedMilestones(synced)
    })

    // Should update existing, not duplicate
    expect(result2.current.milestones).toHaveLength(1)
    expect(result2.current.milestones[0].id).toBe('ms-local') // keeps existing id
    expect(result2.current.milestones[0].name).toBe('Updated Name')
    expect(result2.current.milestones[0].status).toBe('completed')
  })
})
