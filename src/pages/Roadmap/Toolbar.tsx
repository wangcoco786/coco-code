import { useI18n } from '@/context/I18nContext'
import styles from './Roadmap.module.css'

interface ToolbarProps {
  onAddMilestone: () => void
  onAddNode: () => void
  onSelectTemplate: () => void
  onSyncJira: () => void
  onClearAll: () => void
  isSyncing: boolean
  hasProject: boolean
  hasData: boolean
  templateName: string | null
}

export default function Toolbar({
  onAddMilestone,
  onAddNode,
  onSelectTemplate,
  onSyncJira,
  onClearAll,
  isSyncing,
  hasProject,
  hasData,
  templateName,
}: ToolbarProps) {
  const { t } = useI18n()

  return (
    <div className={styles.toolbar}>
      {templateName && (
        <span className={styles.templateBadge}>
          📌 {templateName}
        </span>
      )}
      <button className={styles.toolbarBtn} onClick={onSelectTemplate}>
        📋 {t('roadmap.selectTemplate')}
      </button>
      <button className={styles.toolbarBtnPrimary} onClick={onAddMilestone}>
        ＋ {t('roadmap.addMilestone')}
      </button>
      <button className={styles.toolbarBtn} onClick={onAddNode}>
        ◆ {t('roadmap.addNode')}
      </button>
      <button
        className={styles.toolbarBtn}
        onClick={onSyncJira}
        disabled={!hasProject || isSyncing}
        title={!hasProject ? t('roadmap.selectProjectTooltip') : undefined}
      >
        {isSyncing ? '⏳' : '🔄'} {t('roadmap.syncJira')}
      </button>
      {hasData && (
        <button className={styles.toolbarBtnDanger} onClick={onClearAll}>
          🗑️ {t('roadmap.clearAll')}
        </button>
      )}
    </div>
  )
}
