import { useToast } from '@/context/ToastContext'
import styles from './Toast.module.css'

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className={styles.container} role="region" aria-label="通知">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          role="alert"
          onClick={() => removeToast(toast.id)}
        >
          <div className={styles.title}>{toast.title}</div>
          {toast.description && (
            <div className={styles.description}>{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  )
}
