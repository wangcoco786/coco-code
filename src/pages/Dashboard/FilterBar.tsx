import styles from './Dashboard.module.css'

interface FilterBarProps {
  showOnlyUnplanned: boolean
  showOnlyStale: boolean
  onToggleUnplanned: () => void
  onToggleStale: () => void
}

/**
 * FilterBar 筛选栏组件
 * 提供 "仅显示插队 Issue" 和 "仅显示状态待更新 Issue" 两个筛选切换按钮
 */
export default function FilterBar({
  showOnlyUnplanned,
  showOnlyStale,
  onToggleUnplanned,
  onToggleStale,
}: FilterBarProps) {
  return (
    <div className={styles.tabs} style={{ marginBottom: 16 }}>
      <button
        className={`${styles.tab} ${showOnlyUnplanned ? styles.active : ''}`}
        onClick={onToggleUnplanned}
        aria-pressed={showOnlyUnplanned}
      >
        🚀 仅显示插队 Issue
      </button>
      <button
        className={`${styles.tab} ${showOnlyStale ? styles.active : ''}`}
        onClick={onToggleStale}
        aria-pressed={showOnlyStale}
      >
        ⚠️ 仅显示状态待更新 Issue
      </button>
    </div>
  )
}
