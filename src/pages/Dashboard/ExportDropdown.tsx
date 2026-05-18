import { useState, useRef, useEffect, useCallback } from 'react'
import { exportReleaseNotes } from '@/lib/releaseNotesExporter'
import type { ReleaseNotesData, ExportFormat } from '@/types/platform'
import styles from './Dashboard.module.css'

interface ExportDropdownProps {
  data: ReleaseNotesData
}

/**
 * ExportDropdown — 导出按钮组件
 * 提供 Markdown / HTML 两种格式的下拉菜单，点击后触发文件下载。
 */
export default function ExportDropdown({ data }: ExportDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleExport = useCallback(
    (format: ExportFormat) => {
      exportReleaseNotes(data, {
        format,
        projectKey: data.projectKey,
        sprintName: data.sprintName,
      })
      setOpen(false)
    },
    [data],
  )

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className={styles.tab}
        onClick={() => setOpen((prev) => !prev)}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        📥 导出
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 100,
            minWidth: 160,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => handleExport('markdown')}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              fontSize: 13,
              cursor: 'pointer',
              color: 'var(--text)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            📄 导出 Markdown
          </button>
          <button
            onClick={() => handleExport('html')}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              fontSize: 13,
              cursor: 'pointer',
              color: 'var(--text)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            🌐 导出 HTML
          </button>
        </div>
      )}
    </div>
  )
}
