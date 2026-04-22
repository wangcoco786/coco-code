import { useState, useEffect } from 'react'
import type { KeyNode, NodeFormData, NodeType } from '@/types/roadmap'
import { useI18n } from '@/context/I18nContext'
import styles from './Roadmap.module.css'

interface NodeDialogProps {
  open: boolean
  node?: KeyNode | null
  onSave: (data: NodeFormData) => void
  onDelete?: () => void
  onClose: () => void
}

const TYPE_OPTIONS: { value: NodeType; label: string }[] = [
  { value: 'release', label: '🚀 发布' },
  { value: 'review', label: '📋 评审' },
  { value: 'deadline', label: '⏰ 截止日' },
  { value: 'custom', label: '✏️ 自定义' },
]

const EMPTY_FORM: NodeFormData = {
  name: '',
  date: '',
  type: 'custom',
  description: '',
}

export default function NodeDialog({
  open,
  node,
  onSave,
  onDelete,
  onClose,
}: NodeDialogProps) {
  const { t } = useI18n()
  const isEdit = !!node
  const [form, setForm] = useState<NodeFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (open) {
      if (node) {
        setForm({
          name: node.name,
          date: node.date,
          type: node.type,
          description: node.description,
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setErrors({})
      setShowDeleteConfirm(false)
    }
  }, [open, node])

  if (!open) return null

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = '名称不能为空'
    if (!form.date) errs.date = '请选择日期'
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
            <p>{t('roadmap.deleteNodeConfirm')}</p>
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
          <span>{isEdit ? '编辑关键节点' : t('roadmap.addNode')}</span>
          <button className={styles.dialogClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.dialogBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>名称 *</label>
            <input
              className={styles.formInput}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="节点名称"
            />
            {errors.name && <div className={styles.formError}>{errors.name}</div>}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>日期 *</label>
              <input
                type="date"
                className={styles.formInput}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              {errors.date && <div className={styles.formError}>{errors.date}</div>}
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>类型</label>
              <select
                className={styles.formSelect}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as NodeType })}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
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
