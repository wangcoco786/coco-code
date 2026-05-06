// ============================================================
// ShortcutManager — Pure utility functions
// ============================================================

/** Parsed shortcut representation */
export interface ParsedShortcut {
  modifiers: string[] // 'ctrl' | 'meta' | 'shift' | 'alt'
  key: string         // final key (lowercase)
  sequence?: string   // for multi-key sequences like 'g d'
}

/** Shortcut definition used by the manager */
export interface ShortcutDefinition {
  keys: string          // e.g. 'ctrl+k', 'g d', '?'
  action: string        // action identifier
  description: string   // human-readable description
  category: 'navigation' | 'action' | 'list'
  handler: () => void
}

/** List navigation state */
export interface ListNavigationState {
  selectedIndex: number
  listLength: number
}

/**
 * Parse a shortcut string into structured representation.
 * Supports:
 *   - Modifier combos: 'ctrl+k', 'meta+shift+n'
 *   - Sequences: 'g d', 'g s'
 *   - Single keys: '?', 'j', 'k'
 */
export function parseShortcut(keys: string): ParsedShortcut {
  const trimmed = keys.trim().toLowerCase()

  // Check for sequence (space-separated, no modifiers)
  if (trimmed.includes(' ') && !trimmed.includes('+')) {
    const parts = trimmed.split(/\s+/)
    return {
      modifiers: [],
      key: parts[parts.length - 1],
      sequence: trimmed,
    }
  }

  // Modifier combo or single key
  const parts = trimmed.split('+')
  const key = parts.pop() ?? ''
  const modifiers = parts.filter(p =>
    ['ctrl', 'meta', 'shift', 'alt', 'cmd'].includes(p)
  ).map(m => m === 'cmd' ? 'meta' : m)

  return { modifiers, key }
}

/**
 * Check if a keyboard event matches a shortcut definition.
 * For sequence shortcuts, this only checks the final key —
 * sequence state must be managed externally.
 */
export function matchShortcut(
  event: KeyboardEvent,
  definition: ShortcutDefinition
): boolean {
  const parsed = parseShortcut(definition.keys)

  // For sequences, we don't match here (handled by sequence state)
  if (parsed.sequence) {
    return false
  }

  const eventKey = event.key.toLowerCase()

  // Check modifiers
  const needCtrl = parsed.modifiers.includes('ctrl')
  const needMeta = parsed.modifiers.includes('meta')
  const needShift = parsed.modifiers.includes('shift')
  const needAlt = parsed.modifiers.includes('alt')

  // ctrl or meta (for cross-platform Cmd/Ctrl)
  const ctrlOrMeta = needCtrl || needMeta
  const hasCtrlOrMeta = event.ctrlKey || event.metaKey

  if (ctrlOrMeta && !hasCtrlOrMeta) return false
  if (!ctrlOrMeta && hasCtrlOrMeta) return false
  if (needShift && !event.shiftKey) return false
  if (!needShift && event.shiftKey && eventKey.length > 1) return false
  if (needAlt && !event.altKey) return false
  if (!needAlt && event.altKey) return false

  return eventKey === parsed.key
}

/**
 * Navigate a list up or down, clamping to valid bounds.
 * Returns a new state with updated selectedIndex.
 */
export function navigateList(
  state: ListNavigationState,
  direction: 'up' | 'down'
): ListNavigationState {
  if (state.listLength <= 0) {
    return { selectedIndex: 0, listLength: state.listLength }
  }

  let newIndex = state.selectedIndex
  if (direction === 'down') {
    newIndex = Math.min(state.selectedIndex + 1, state.listLength - 1)
  } else {
    newIndex = Math.max(state.selectedIndex - 1, 0)
  }

  return { selectedIndex: newIndex, listLength: state.listLength }
}
