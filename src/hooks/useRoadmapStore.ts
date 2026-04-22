import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  RoadmapMilestone,
  KeyNode,
  MilestoneFormData,
  NodeFormData,
} from '@/types/roadmap'
import { ROADMAP_TEMPLATES, applyTemplate } from '@/lib/roadmapTemplates'
import { mergeSyncedMilestones } from '@/lib/roadmapJiraSync'

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID() } catch { /* fallback */ }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// ============================================================
// useRoadmapStore — localStorage-backed roadmap data hook
// ============================================================

export interface UseRoadmapStoreReturn {
  milestones: RoadmapMilestone[]
  nodes: KeyNode[]
  templateId: string | null
  addMilestone: (data: MilestoneFormData) => RoadmapMilestone
  updateMilestone: (id: string, data: Partial<MilestoneFormData>) => void
  deleteMilestone: (id: string) => void
  addNode: (data: NodeFormData) => KeyNode
  updateNode: (id: string, data: Partial<NodeFormData>) => void
  deleteNode: (id: string) => void
  applyTemplate: (templateId: string, baseDate?: Date) => void
  mergeSyncedMilestones: (synced: RoadmapMilestone[]) => void
  clearAll: () => void
}

// ─── localStorage helpers ───────────────────────────────────

function storageKey(prefix: string, projectKey: string): string {
  return `${prefix}_${projectKey}`
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded or unavailable — silently fall back to memory
  }
}

// ─── No-op return for null projectKey ───────────────────────

const EMPTY_MILESTONES: RoadmapMilestone[] = []
const EMPTY_NODES: KeyNode[] = []

const NOOP_STORE: UseRoadmapStoreReturn = {
  milestones: EMPTY_MILESTONES,
  nodes: EMPTY_NODES,
  templateId: null,
  addMilestone: () => ({} as RoadmapMilestone),
  updateMilestone: () => {},
  deleteMilestone: () => {},
  addNode: () => ({} as KeyNode),
  updateNode: () => {},
  deleteNode: () => {},
  applyTemplate: () => {},
  mergeSyncedMilestones: () => {},
  clearAll: () => {},
}

// ─── Hook ───────────────────────────────────────────────────

export function useRoadmapStore(
  projectKey: string | null,
): UseRoadmapStoreReturn {
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([])
  const [nodes, setNodes] = useState<KeyNode[]>([])
  const [templateId, setTemplateId] = useState<string | null>(null)

  // Keep a ref so callbacks always see the latest projectKey
  const keyRef = useRef(projectKey)
  keyRef.current = projectKey

  // ── Load from localStorage on mount / projectKey change ──
  useEffect(() => {
    if (!projectKey) {
      setMilestones([])
      setNodes([])
      setTemplateId(null)
      return
    }
    setMilestones(
      readJSON<RoadmapMilestone[]>(storageKey('roadmap_milestones', projectKey), []),
    )
    setNodes(readJSON<KeyNode[]>(storageKey('roadmap_nodes', projectKey), []))
    setTemplateId(
      readJSON<string | null>(storageKey('roadmap_template', projectKey), null),
    )
  }, [projectKey])

  // ── Persist helpers (always write immediately) ────────────

  const persistMilestones = useCallback(
    (next: RoadmapMilestone[]) => {
      setMilestones(next)
      if (keyRef.current) {
        writeJSON(storageKey('roadmap_milestones', keyRef.current), next)
      }
    },
    [],
  )

  const persistNodes = useCallback((next: KeyNode[]) => {
    setNodes(next)
    if (keyRef.current) {
      writeJSON(storageKey('roadmap_nodes', keyRef.current), next)
    }
  }, [])

  const persistTemplate = useCallback((next: string | null) => {
    setTemplateId(next)
    if (keyRef.current) {
      writeJSON(storageKey('roadmap_template', keyRef.current), next)
    }
  }, [])

  // ── Milestone CRUD ────────────────────────────────────────

  const addMilestone = useCallback(
    (data: MilestoneFormData): RoadmapMilestone => {
      const now = new Date().toISOString()
      const milestone: RoadmapMilestone = {
        id: generateId(),
        ...data,
        createdAt: now,
        updatedAt: now,
      }
      setMilestones((prev) => {
        const next = [...prev, milestone]
        if (keyRef.current) {
          writeJSON(storageKey('roadmap_milestones', keyRef.current), next)
        }
        return next
      })
      return milestone
    },
    [],
  )

  const updateMilestone = useCallback(
    (id: string, data: Partial<MilestoneFormData>) => {
      setMilestones((prev) => {
        const next = prev.map((m) =>
          m.id === id
            ? { ...m, ...data, updatedAt: new Date().toISOString() }
            : m,
        )
        if (keyRef.current) {
          writeJSON(storageKey('roadmap_milestones', keyRef.current), next)
        }
        return next
      })
    },
    [],
  )

  const deleteMilestone = useCallback((id: string) => {
    setMilestones((prev) => {
      const next = prev.filter((m) => m.id !== id)
      if (keyRef.current) {
        writeJSON(storageKey('roadmap_milestones', keyRef.current), next)
      }
      return next
    })
  }, [])

  // ── Node CRUD ─────────────────────────────────────────────

  const addNode = useCallback((data: NodeFormData): KeyNode => {
    const now = new Date().toISOString()
    const node: KeyNode = {
      id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    }
    setNodes((prev) => {
      const next = [...prev, node]
      if (keyRef.current) {
        writeJSON(storageKey('roadmap_nodes', keyRef.current), next)
      }
      return next
    })
    return node
  }, [])

  const updateNode = useCallback(
    (id: string, data: Partial<NodeFormData>) => {
      setNodes((prev) => {
        const next = prev.map((n) =>
          n.id === id
            ? { ...n, ...data, updatedAt: new Date().toISOString() }
            : n,
        )
        if (keyRef.current) {
          writeJSON(storageKey('roadmap_nodes', keyRef.current), next)
        }
        return next
      })
    },
    [],
  )

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => {
      const next = prev.filter((n) => n.id !== id)
      if (keyRef.current) {
        writeJSON(storageKey('roadmap_nodes', keyRef.current), next)
      }
      return next
    })
  }, [])

  // ── Template application ──────────────────────────────────

  const applyTemplateAction = useCallback(
    (tid: string, baseDate?: Date) => {
      const template = ROADMAP_TEMPLATES.find((t) => t.id === tid)
      if (!template) return
      const result = applyTemplate(template, baseDate ?? new Date())
      persistMilestones(result.milestones)
      persistNodes(result.nodes)
      persistTemplate(tid)
    },
    [persistMilestones, persistNodes, persistTemplate],
  )

  // ── Jira sync merge ───────────────────────────────────────

  const mergeSyncedAction = useCallback(
    (synced: RoadmapMilestone[]) => {
      setMilestones((prev) => {
        const merged = mergeSyncedMilestones(prev, synced)
        if (keyRef.current) {
          writeJSON(storageKey('roadmap_milestones', keyRef.current), merged)
        }
        return merged
      })
    },
    [],
  )

  // ── Clear all ─────────────────────────────────────────────

  const clearAll = useCallback(() => {
    persistMilestones([])
    persistNodes([])
    persistTemplate(null)
  }, [persistMilestones, persistNodes, persistTemplate])

  // ── Return ────────────────────────────────────────────────

  if (!projectKey) return NOOP_STORE

  return {
    milestones,
    nodes,
    templateId,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addNode,
    updateNode,
    deleteNode,
    applyTemplate: applyTemplateAction,
    mergeSyncedMilestones: mergeSyncedAction,
    clearAll,
  }
}
