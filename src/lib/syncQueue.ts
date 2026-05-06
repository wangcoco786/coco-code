import type { SyncOperation, SyncConflict } from '@/types/platform'

// ─── Core Functions ─────────────────────────────────────────

/**
 * Adds an operation to the queue with generated id, createdAt, retryCount=0, status='pending'.
 * Returns a new queue array (immutable).
 */
export function enqueueOperation(
  queue: SyncOperation[],
  operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retryCount' | 'status'>
): SyncOperation[] {
  const newOperation: SyncOperation = {
    ...operation,
    id: generateId(),
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
  }
  return [...queue, newOperation]
}

/**
 * Removes operations with matching ids from the queue.
 * Returns a new queue array (immutable).
 */
export function dequeueSuccessful(
  queue: SyncOperation[],
  successIds: string[]
): SyncOperation[] {
  const idSet = new Set(successIds)
  return queue.filter((op) => !idSet.has(op.id))
}

/**
 * Detects a sync conflict between local and remote changes.
 * Returns a SyncConflict if both changes occurred after lastSyncTimestamp,
 * modify the same field, and have different values. Returns null otherwise.
 */
export function detectConflict(
  localChange: { field: string; value: unknown; timestamp: string },
  remoteChange: { field: string; value: unknown; timestamp: string },
  lastSyncTimestamp: string
): SyncConflict | null {
  // Must be the same field
  if (localChange.field !== remoteChange.field) return null

  const lastSync = new Date(lastSyncTimestamp).getTime()
  const localTime = new Date(localChange.timestamp).getTime()
  const remoteTime = new Date(remoteChange.timestamp).getTime()

  // Both changes must be after last sync
  if (localTime <= lastSync || remoteTime <= lastSync) return null

  // Values must differ
  if (JSON.stringify(localChange.value) === JSON.stringify(remoteChange.value)) return null

  return {
    issueId: '', // caller should provide context
    field: localChange.field,
    localValue: localChange.value,
    remoteValue: remoteChange.value,
    localTimestamp: localChange.timestamp,
    remoteTimestamp: remoteChange.timestamp,
  }
}

// ─── Helpers ────────────────────────────────────────────────

let counter = 0

function generateId(): string {
  counter++
  return `sync-${Date.now()}-${counter}-${Math.random().toString(36).substring(2, 8)}`
}
