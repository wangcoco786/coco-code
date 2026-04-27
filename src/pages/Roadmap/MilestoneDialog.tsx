import { useState, useEffect } from 'react'
import type { RoadmapMilestone, MilestoneFormData, MilestoneStatus } from '@/types/roadmap'
import { useI18n } from '@/context/I18nContext'
import type { TranslationKey } from '@/i18n'
import styles from './Roadmap.module.css'

interface MilestoneDialogProps {
  open: boolean
  milestone?: RoadmapMilestone | null
  onSave: (data: MilestoneFormData) => void
  onDelete?: () => void
  onClose: () => void
}

const STATUS_OPTION_KEYS: { value: MilestoneStatus; labelKey: TranslationKey }[] = [
  { value: 'planned', labelKey: 'milestone.planned' },
  { value: 'in_progress', labelKey: 'milestone.inProgress' },
  { value: 'completed', labelKey: 'milestone.completed' },
  { value: 'delayed', labelKey: 'milestone.delayed' },
]

const EMPTY_FORM: MilestoneFormData = {
  name: '',
  startDate: '',
  endDate: '',
  description: '',
  status: 'planned',
}

export default function MilestoneDialog({
  open,
  milestone,
  onSave,
  onDelete,
  onClose,
}: MilestoneDialogProps) {
  const { t } = useI18n()
  const isEdit = !!milestone
  const [form, setForm] = useState<MilestoneFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (open) {
      if (milestone) {
        setForm({
          name: milestone.name,
          startDate: milestone.startDate,
          endDate: milestone.endDate,
          description: milestone.description,
          status: milestone.status,
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setErrors({})
      setShowDeleteConfirm(false)
    }
  }, [open, milestone])

  if (!open) return null

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = t('milestone.nameRequired')
    if (!form.startDate) errs.startDate = t('milestone.startRequired')
    if (!form.endDate) errs.endDate = t('milestone.endRequired')
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      errs.endDate = t('milestone.dateError')
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (validate()) onSave(form)
  }

  if (showDeleteConfirm) {
    return (
      <div className={styles.dialogOverlay} onClick={onClose}>
        <div className={styles.dialogCard} onClick={(e) => e.stopPropagation()}>
          <div className={styles.confirmDialog}>
            <p>{t('roadmap.deleteMilestoneConfirm')}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className={styles.btnSecondary} onClick={() => setShowDeleteConfirm(false)}>
                {t('common.cancel')}
              </button>
              <button className={styles.btnDanger} onClick={onDelete}>
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
          <span>{isEdit ? t('milestone.editTitle') : t('roadmap.addMilestone')}</span>
          <button className={styles.dialogClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.dialogBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('milestone.name')} *</label>
            <input
              className={styles.formInput}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('milestone.namePlaceholder')}
            />
            {errors.name && <div className={styles.formError}>{errors.name}</div>}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>{t('milestone.startDate')} *</label>
              <input
                type="date"
                className={styles.formInput}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              {errors.startDate && <div className={styles.formError}>{errors.startDate}</div>}
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>{t('milestone.endDate')} *</label>
              <input
                type="date"
                className={styles.formInput}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
              {errors.endDate && <div className={styles.formError}>{errors.endDate}</div>}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('milestone.status')}</label>
            <select
              className={styles.formSelect}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as MilestoneStatus })}
            >
              {STATUS_OPTION_KEYS.map((o) => (
                <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('milestone.description')}</label>
            <textarea
              className={styles.formTextarea}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('milestone.descPlaceholder')}
            />
          </div>
        </div>
        <div className={styles.dialogFooter}>
          {isEdit && onDelete && (
            <button
              className={styles.btnDanger}
              onClick={() => setShowDeleteConfirm(true)}
              style={{ marginRight: 'auto' }}
            >
              {t('milestone.delete')}
            </button>
          )}
          <button className={styles.btnSecondary} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className={styles.btnPrimary} onClick={handleSubmit}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
