import { NavLink } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { useI18n } from '@/context/I18nContext'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const { currentUser } = useApp()
  const { t } = useI18n()

  const NAV_ITEMS = [
    { path: '/dashboard',    icon: '📊', labelKey: 'nav.dashboard',    roles: ['PM', 'DEV'] },
    { path: '/requirements', icon: '📋', labelKey: 'nav.requirements', roles: ['PM', 'DEV'] },
    { path: '/sprint',       icon: '🏃', labelKey: 'nav.sprint',       roles: ['PM', 'DEV'] },
    { path: '/risk',         icon: '⚠️', labelKey: 'nav.risk',         roles: ['PM'] },
    { path: '/reports',      icon: '📈', labelKey: 'nav.reports',      roles: ['PM', 'DEV'] },
    { path: '/roadmap',      icon: '🗺️', labelKey: 'nav.roadmap',      roles: ['PM', 'DEV'] },
    { path: '/settings',     icon: '⚙️', labelKey: 'nav.settings',     roles: ['PM', 'DEV'] },
  ] as const

  const visibleItems = NAV_ITEMS.filter(item => (item.roles as readonly string[]).includes(currentUser.role))

  return (
    <nav className={styles.sidebar} aria-label="主导航">
      {visibleItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <span className={styles.icon} aria-hidden="true">{item.icon}</span>
          <span className={styles.label}>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
