import { useEffect, useRef } from 'react'
import { SHORTCUT_REGISTRY } from './useShortcuts'
import styles from './ShortcutCheatSheet.module.css'

interface Props {
  open: boolean
  onClose: () => void
}

/** Format shortcut keys for display */
function formatKeys(keys: string): string {
  return keys
    .replace('ctrl', isMac() ? '⌘' : 'Ctrl')
    .replace('meta', '⌘')
    .replace('shift', '⇧')
    .replace('alt', '⌥')
    .replace('+', ' + ')
    .replace(' ', ' then ')
    .toUpperCase()
}

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
}

export default function ShortcutCheatSheet({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  if (!open) return null

  const navigationShortcuts = SHORTCUT_REGISTRY.filter(s => s.category === 'navigation')
  const actionShortcuts = SHORTCUT_REGISTRY.filter(s => s.category === 'action')
  const listShortcuts = SHORTCUT_REGISTRY.filter(s => s.category === 'list')

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="快捷键速查表">
      <div className={styles.dialog} ref={dialogRef}>
        <div className={styles.header}>
          <h2 className={styles.title}>⌨️ 快捷键速查表</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>操作</h3>
            {actionShortcuts.map(s => (
              <div key={s.action} className={styles.row}>
                <span className={styles.description}>{s.description}</span>
                <kbd className={styles.kbd}>{formatKeys(s.keys)}</kbd>
              </div>
            ))}
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>导航</h3>
            {navigationShortcuts.map(s => (
              <div key={s.action} className={styles.row}>
                <span className={styles.description}>{s.description}</span>
                <kbd className={styles.kbd}>{formatKeys(s.keys)}</kbd>
              </div>
            ))}
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>列表</h3>
            {listShortcuts.map(s => (
              <div key={s.action} className={styles.row}>
                <span className={styles.description}>{s.description}</span>
                <kbd className={styles.kbd}>{formatKeys(s.keys)}</kbd>
              </div>
            ))}
          </section>
        </div>

        <div className={styles.footer}>
          按 <kbd className={styles.kbdSmall}>ESC</kbd> 或 <kbd className={styles.kbdSmall}>?</kbd> 关闭
        </div>
      </div>
    </div>
  )
}
