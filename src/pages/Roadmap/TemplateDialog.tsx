import { useState } from 'react'
import { ROADMAP_TEMPLATES } from '@/lib/roadmapTemplates'
import { useI18n } from '@/context/I18nContext'
import styles from './Roadmap.module.css'

interface TemplateDialogProps {
  open: boolean
  onApply: (templateId: string) => void
  onClose: () => void
  hasExistingData: boolean
}

export default function TemplateDialog({
  open,
  onApply,
  onClose,
  hasExistingData,
}: TemplateDialogProps) {
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  if (!open) return null

  const selected = ROADMAP_TEMPLATES.find((tp) => tp.id === selectedId)

  const handleApply = () => {
    if (!selectedId) return
    if (hasExistingData) {
      setShowConfirm(true)
    } else {
      onApply(selectedId)
    }
  }

  if (showConfirm) {
    return (
      <div className={styles.dialogOverlay} onClick={onClose}>
        <div className={styles.dialogCard} onClick={(e) => e.stopPropagation()}>
          <div className={styles.confirmDialog}>
            <p>{t('roadmap.replaceConfirm')}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className={styles.btnSecondary} onClick={() => setShowConfirm(false)}>
                {t('common.cancel')}
              </button>
              <button
                className={styles.btnPrimary}
                onClick={() => { onApply(selectedId!); setShowConfirm(false) }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialogCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <span>{t('roadmap.selectTemplate')}</span>
          <button className={styles.dialogClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.dialogBody}>
          <div className={styles.templateGrid}>
            {ROADMAP_TEMPLATES.map((tp) => (
              <div
                key={tp.id}
                className={selectedId === tp.id ? styles.templateCardActive : styles.templateCard}
                onClick={() => setSelectedId(tp.id)}
              >
                <div className={styles.templateIcon}>{tp.icon}</div>
                <div className={styles.templateName}>{t(tp.nameKey as any)}</div>
                <div className={styles.templateDesc}>{t(tp.descriptionKey as any)}</div>
              </div>
            ))}
          </div>

          {selected && (
            <div className={styles.templatePreview}>
              📊 {selected.milestones.length} 个里程碑，{selected.nodes.length} 个关键节点
            </div>
          )}
        </div>
        <div className={styles.dialogFooter}>
          <button className={styles.btnSecondary} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleApply}
            disabled={!selectedId}
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
