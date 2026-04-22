import { useState, useEffect } from 'react'
import type { RoadmapMilestone, MilestoneFormData, MilestoneStatus } from '@/types/roadmap'
import { useI18n } from '@/context/I18nContext'
import styles from './Roadmap.module.css'

interface MilestoneDialogProps {
  open: boolean
  milestone?: RoadmapMilestone | null
  onSave: (data: MilestoneFormData) => void
  onDelete?: () => void
  onClose: () => void
}

const STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
  { value: 'planned', label: '计划中' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'delayed', label: '已延期' },
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
    if (!form.name.trim()) errs.name = '名称不能为空'
    if (!form.startDate) errs.startDate = '请选择开始日期'
    if (!form.endDate) errs.endDate = '请选择结束日期'
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      errs.endDate = '开始日期不能晚于结束日期'
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
          <span>{isEdit ? '编辑里程碑' : t('roadmap.addMilestone')}</span>
          <button className={styles.dialogClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.dialogBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>名称 *</label>
            <input
              className={styles.formInput}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="里程碑名称"
            />
            {errors.name && <div className={styles.formError}>{errors.name}</div>}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>开始日期 *</label>
              <input
                type="date"
                className={styles.formInput}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              {errors.startDate && <div className={styles.formError}>{errors.startDate}</div>}
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>结束日期 *</label>
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
            <label className={styles.formLabel}>状态</label>
            <select
              className={styles.formSelect}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as MilestoneStatus })}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>描述</label>
            <textarea
              className={styles.formTextarea}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="可选描述"
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
              删除
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
