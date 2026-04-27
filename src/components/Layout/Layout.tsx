import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { useI18n } from '@/context/I18nContext'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import ToastContainer from '@/components/Toast/Toast'
import AIAssistant from '@/components/AIAssistant/AIAssistant'
import styles from './Layout.module.css'

export default function Layout() {
  const { currentUser } = useApp()
  const { t } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={styles.root}>
      <Topbar onMenuToggle={() => setSidebarOpen(v => !v)} />
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}
      <Sidebar expanded={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={styles.content}>
        {currentUser.role === 'DEV' && (
          <div className={styles.devBanner}>
            👤 {currentUser.name} · {t('layout.devBanner')}
          </div>
        )}
        <Outlet />
      </main>
      <ToastContainer />
      <AIAssistant />
    </div>
  )
}
