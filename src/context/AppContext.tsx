import { createContext, useCallback, useContext, useState } from 'react'
import type { AppState, CurrentUser } from '@/types/platform'

interface AppContextValue extends AppState {
  setCurrentUser: (user: CurrentUser) => void
  setCurrentProjectKey: (key: string | null) => void
  setNotificationCount: (count: number) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>({
    id: 'user-1',
    name: 'User',
    role: 'PM',
  })
  const [currentProjectKey, setCurrentProjectKeyState] = useState<string | null>(null)
  const [notificationCount, setNotificationCountState] = useState(0)

  const setCurrentUser = useCallback((user: CurrentUser) => setCurrentUserState(user), [])
  const setCurrentProjectKey = useCallback((key: string | null) => setCurrentProjectKeyState(key), [])
  const setNotificationCount = useCallback((count: number) => setNotificationCountState(count), [])

  return (
    <AppContext.Provider value={{
      currentUser,
      currentBoardId: null,       // 保留字段兼容性，不再使用
      currentProjectKey,
      notificationCount,
      setCurrentUser,
      setCurrentProjectKey,
      setNotificationCount,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
