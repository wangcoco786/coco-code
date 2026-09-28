import styles from './ResourceDashboard.module.css'

export default function ResourceDashboard() {
  return (
    <div className={styles.wrapper}>
      <iframe
        src="/docs/resource-dashboard-2026-09-28.html"
        className={styles.frame}
        title="PMO Resource Dashboard"
      />
    </div>
  )
}
