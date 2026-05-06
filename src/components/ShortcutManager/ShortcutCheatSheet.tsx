import { useEffect, useRef } from 'react'
import { SHORTCUT_REGISTRY } from './useShortcuts'
import { useI18n } from '@/context/I18nContext'
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
  const { t } = useI18n()
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
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t('shortcut.title')}>
      <div className={styles.dialog} ref={dialogRef}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('shortcut.title')}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('shortcut.actions')}</h3>
            {actionShortcuts.map(s => (
              <div key={s.action} className={styles.row}>
                <span className={styles.description}>{s.description}</span>
                <kbd className={styles.kbd}>{formatKeys(s.keys)}</kbd>
              </div>
            ))}
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('shortcut.navigation')}</h3>
            {navigationShortcuts.map(s => (
              <div key={s.action} className={styles.row}>
                <span className={styles.description}>{s.description}</span>
                <kbd className={styles.kbd}>{formatKeys(s.keys)}</kbd>
              </div>
            ))}
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('shortcut.list')}</h3>
            {listShortcuts.map(s => (
              <div key={s.action} className={styles.row}>
                <span className={styles.description}>{s.description}</span>
                <kbd className={styles.kbd}>{formatKeys(s.keys)}</kbd>
              </div>
            ))}
          </section>
        </div>

        <div className={styles.footer}>
          {t('shortcut.footer')}
        </div>
      </div>
    </div>
  )
}
