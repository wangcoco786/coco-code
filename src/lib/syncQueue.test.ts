import { describe, it, expect } from 'vitest'
import { enqueueOperation, dequeueSuccessful, detectConflict } from './syncQueue'
import type { SyncOperation } from '@/types/platform'

// ─── enqueueOperation ───────────────────────────────────────

describe('enqueueOperation', () => {
  it('adds operation to queue with generated fields', () => {
    const queue: SyncOperation[] = []
    const result = enqueueOperation(queue, {
      type: 'status_change',
      issueId: 'DTS-1',
      payload: { status: 'done' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBeTruthy()
    expect(result[0].createdAt).toBeTruthy()
    expect(result[0].retryCount).toBe(0)
    expect(result[0].status).toBe('pending')
    expect(result[0].type).toBe('status_change')
    expect(result[0].issueId).toBe('DTS-1')
  })

  it('does not mutate the original queue', () => {
    const queue: SyncOperation[] = []
    const result = enqueueOperation(queue, {
      type: 'assignee_change',
      issueId: 'DTS-2',
      payload: { assignee: 'user-1' },
    })
    expect(queue).toHaveLength(0)
    expect(result).toHaveLength(1)
  })

  it('appends to existing queue', () => {
    const existing: SyncOperation = {
      id: 'existing-1',
      type: 'status_change',
      issueId: 'DTS-1',
      payload: {},
      createdAt: '2025-01-01T00:00:00Z',
      retryCount: 0,
      status: 'pending',
    }
    const result = enqueueOperation([existing], {
      type: 'priority_change',
      issueId: 'DTS-2',
      payload: { priority: 'P0' },
    })
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('existing-1')
    expect(result[1].type).toBe('priority_change')
  })

  it('generates unique ids for each operation', () => {
    let queue: SyncOperation[] = []
    queue = enqueueOperation(queue, { type: 'status_change', issueId: 'DTS-1', payload: {} })
    queue = enqueueOperation(queue, { type: 'status_change', issueId: 'DTS-2', payload: {} })
    expect(queue[0].id).not.toBe(queue[1].id)
  })
})

// ─── dequeueSuccessful ──────────────────────────────────────

describe('dequeueSuccessful', () => {
  const queue: SyncOperation[] = [
    { id: 'op-1', type: 'status_change', issueId: 'DTS-1', payload: {}, createdAt: '2025-01-01T00:00:00Z', retryCount: 0, status: 'pending' },
    { id: 'op-2', type: 'assignee_change', issueId: 'DTS-2', payload: {}, createdAt: '2025-01-01T01:00:00Z', retryCount: 0, status: 'pending' },
    { id: 'op-3', type: 'priority_change', issueId: 'DTS-3', payload: {}, createdAt: '2025-01-01T02:00:00Z', retryCount: 0, status: 'pending' },
  ]

  it('removes operations with matching ids', () => {
    const result = dequeueSuccessful(queue, ['op-1', 'op-3'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('op-2')
  })

  it('does not mutate the original queue', () => {
    const original = [...queue]
    dequeueSuccessful(queue, ['op-1'])
    expect(queue).toHaveLength(original.length)
  })

  it('returns full queue when no ids match', () => {
    const result = dequeueSuccessful(queue, ['nonexistent'])
    expect(result).toHaveLength(3)
  })

  it('returns empty array when all ids match', () => {
    const result = dequeueSuccessful(queue, ['op-1', 'op-2', 'op-3'])
    expect(result).toHaveLength(0)
  })

  it('handles empty success ids', () => {
    const result = dequeueSuccessful(queue, [])
    expect(result).toHaveLength(3)
  })

  it('handles empty queue', () => {
    const result = dequeueSuccessful([], ['op-1'])
    expect(result).toHaveLength(0)
  })
})

// ─── detectConflict ─────────────────────────────────────────

describe('detectConflict', () => {
  const lastSync = '2025-01-10T00:00:00Z'

  it('detects conflict when both changed same field after sync to different values', () => {
    const local = { field: 'status', value: 'done', timestamp: '2025-01-11T10:00:00Z' }
    const remote = { field: 'status', value: 'in_progress', timestamp: '2025-01-11T12:00:00Z' }
    const result = detectConflict(local, remote, lastSync)
    expect(result).not.toBeNull()
    expect(result!.field).toBe('status')
    expect(result!.localValue).toBe('done')
    expect(result!.remoteValue).toBe('in_progress')
  })

  it('returns null when fields are different', () => {
    const local = { field: 'status', value: 'done', timestamp: '2025-01-11T10:00:00Z' }
    const remote = { field: 'priority', value: 'P0', timestamp: '2025-01-11T12:00:00Z' }
    const result = detectConflict(local, remote, lastSync)
    expect(result).toBeNull()
  })

  it('returns null when local change is before last sync', () => {
    const local = { field: 'status', value: 'done', timestamp: '2025-01-09T10:00:00Z' }
    const remote = { field: 'status', value: 'in_progress', timestamp: '2025-01-11T12:00:00Z' }
    const result = detectConflict(local, remote, lastSync)
    expect(result).toBeNull()
  })

  it('returns null when remote change is before last sync', () => {
    const local = { field: 'status', value: 'done', timestamp: '2025-01-11T10:00:00Z' }
    const remote = { field: 'status', value: 'in_progress', timestamp: '2025-01-09T12:00:00Z' }
    const result = detectConflict(local, remote, lastSync)
    expect(result).toBeNull()
  })

  it('returns null when both changed to same value', () => {
    const local = { field: 'status', value: 'done', timestamp: '2025-01-11T10:00:00Z' }
    const remote = { field: 'status', value: 'done', timestamp: '2025-01-11T12:00:00Z' }
    const result = detectConflict(local, remote, lastSync)
    expect(result).toBeNull()
  })

  it('returns null when changes are exactly at last sync time', () => {
    const local = { field: 'status', value: 'done', timestamp: '2025-01-10T00:00:00Z' }
    const remote = { field: 'status', value: 'in_progress', timestamp: '2025-01-11T12:00:00Z' }
    const result = detectConflict(local, remote, lastSync)
    expect(result).toBeNull()
  })

  it('includes timestamps in conflict result', () => {
    const local = { field: 'assignee', value: 'Alice', timestamp: '2025-01-11T10:00:00Z' }
    const remote = { field: 'assignee', value: 'Bob', timestamp: '2025-01-11T12:00:00Z' }
    const result = detectConflict(local, remote, lastSync)
    expect(result).not.toBeNull()
    expect(result!.localTimestamp).toBe('2025-01-11T10:00:00Z')
    expect(result!.remoteTimestamp).toBe('2025-01-11T12:00:00Z')
  })
})
