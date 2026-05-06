import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ShortcutDefinition } from './shortcutUtils'

/** Check if the event target is an input-like element */
function isInputFocused(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null
  if (!target) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (target.isContentEditable) return true
  return false
}

/** Sequence timeout in ms */
const SEQUENCE_TIMEOUT = 800

export interface UseShortcutsOptions {
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean
  /** Callback when cheat sheet should open */
  onShowCheatSheet?: () => void
  /** Callback when global search should open */
  onOpenSearch?: () => void
  /** Callback when "new task" action is triggered */
  onNewTask?: () => void
}

/**
 * Hook that registers global keyboard shortcuts.
 * 
 * Supports:
 * - Cmd/Ctrl+K: Open global search
 * - Cmd/Ctrl+N: Create new task
 * - G+D: Navigate to Dashboard
 * - G+S: Navigate to Sprint
 * - G+R: Navigate to Requirements
 * - ?: Show shortcut cheat sheet
 * - J/K: List navigation (handled separately via useListNavigation)
 */
export function useShortcuts(options: UseShortcutsOptions = {}) {
  const { enabled = true, onShowCheatSheet, onOpenSearch, onNewTask } = options
  const navigate = useNavigate()
  const sequenceRef = useRef<string | null>(null)
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSequence = useCallback(() => {
    sequenceRef.current = null
    if (sequenceTimerRef.current) {
      clearTimeout(sequenceTimerRef.current)
      sequenceTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      // --- Modifier shortcuts (work even in inputs for Cmd/Ctrl combos) ---
      const key = event.key.toLowerCase()
      const hasModifier = event.ctrlKey || event.metaKey

      // Cmd/Ctrl+K — open search
      if (hasModifier && key === 'k') {
        event.preventDefault()
        onOpenSearch?.()
        return
      }

      // Cmd/Ctrl+N — new task
      if (hasModifier && key === 'n') {
        event.preventDefault()
        onNewTask?.()
        return
      }

      // --- Non-modifier shortcuts: skip if in input ---
      if (isInputFocused(event)) return

      // ? — show cheat sheet (shift+/ on US keyboard, or literal ?)
      if (event.key === '?' || (event.shiftKey && key === '/')) {
        event.preventDefault()
        onShowCheatSheet?.()
        return
      }

      // --- Sequence handling: G+D, G+S, G+R ---
      if (key === 'g' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        sequenceRef.current = 'g'
        if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current)
        sequenceTimerRef.current = setTimeout(clearSequence, SEQUENCE_TIMEOUT)
        return
      }

      if (sequenceRef.current === 'g') {
        clearSequence()
        switch (key) {
          case 'd':
            event.preventDefault()
            navigate('/dashboard')
            return
          case 's':
            event.preventDefault()
            navigate('/sprint')
            return
          case 'r':
            event.preventDefault()
            navigate('/requirements')
            return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearSequence()
    }
  }, [enabled, navigate, onShowCheatSheet, onOpenSearch, onNewTask, clearSequence])
}

/**
 * Hook for J/K list navigation and Enter to open.
 * Returns the currently selected index.
 */
export function useListNavigation(options: {
  listLength: number
  enabled?: boolean
  onSelect?: (index: number) => void
}) {
  const { listLength, enabled = true, onSelect } = options
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Reset index when list length changes
  useEffect(() => {
    setSelectedIndex(prev => {
      if (listLength <= 0) return 0
      return Math.min(prev, listLength - 1)
    })
  }, [listLength])

  useEffect(() => {
    if (!enabled || listLength <= 0) return

    function handleKeyDown(event: KeyboardEvent) {
      // Skip if in input
      const target = event.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) return

      const key = event.key.toLowerCase()

      if (key === 'j') {
        event.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, listLength - 1))
        return
      }

      if (key === 'k') {
        event.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        return
      }

      if (key === 'enter') {
        event.preventDefault()
        onSelect?.(selectedIndex)
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, listLength, selectedIndex, onSelect])

  return { selectedIndex, setSelectedIndex }
}

/** All registered shortcuts for the cheat sheet */
export const SHORTCUT_REGISTRY: Omit<ShortcutDefinition, 'handler'>[] = [
  { keys: 'ctrl+k', action: 'search', description: '打开全局搜索', category: 'action' },
  { keys: 'ctrl+n', action: 'new-task', description: '创建新任务', category: 'action' },
  { keys: 'g d', action: 'go-dashboard', description: '跳转到 Dashboard', category: 'navigation' },
  { keys: 'g s', action: 'go-sprint', description: '跳转到 Sprint', category: 'navigation' },
  { keys: 'g r', action: 'go-requirements', description: '跳转到需求', category: 'navigation' },
  { keys: '?', action: 'cheat-sheet', description: '显示快捷键速查表', category: 'action' },
  { keys: 'j', action: 'list-down', description: '列表向下导航', category: 'list' },
  { keys: 'k', action: 'list-up', description: '列表向上导航', category: 'list' },
  { keys: 'enter', action: 'list-open', description: '打开选中项', category: 'list' },
]
