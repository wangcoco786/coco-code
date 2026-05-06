import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { useI18n } from '@/context/I18nContext'
import { useShortcuts, ShortcutCheatSheet } from '@/components/ShortcutManager'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import ToastContainer from '@/components/Toast/Toast'
import AIAssistant from '@/components/AIAssistant/AIAssistant'
import styles from './Layout.module.css'

export default function Layout() {
  const { currentUser } = useApp()
  const { t } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false)

  useShortcuts({
    onShowCheatSheet: () => setCheatSheetOpen(prev => !prev),
    onOpenSearch: () => {
      // Focus the global search input if it exists
      const searchInput = document.querySelector<HTMLInputElement>('[aria-label]')
      if (searchInput && searchInput.tagName === 'INPUT') {
        searchInput.focus()
      }
    },
  })

  return (
    <div className={styles.root}>
      <Topbar onMenuToggle={() => setSidebarOpen(v => !v)} />
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}
      <Sidebar expanded={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={styles.content}>
        {currentUser?.role === 'DEV' && (
          <div className={styles.devBanner}>
            👤 {currentUser.name} · {t('layout.devBanner')}
          </div>
        )}
        <Outlet />
      </main>
      <ToastContainer />
      <AIAssistant />
      <ShortcutCheatSheet open={cheatSheetOpen} onClose={() => setCheatSheetOpen(false)} />
    </div>
  )
}
