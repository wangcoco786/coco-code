import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { AppProvider } from '@/context/AppContext'
import { ToastProvider } from '@/context/ToastContext'
import { I18nProvider } from '@/context/I18nContext'
import App from './App'
import '@/styles/variables.css'

// ============================================================
// React Query 全局配置
// ============================================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分钟
      placeholderData: keepPreviousData,
      retry: (failureCount, error) => {
        // 401/403 不重试
        if (
          error instanceof Error &&
          'status' in error &&
          ((error as { status: number }).status === 401 ||
            (error as { status: number }).status === 403)
        ) {
          return false
        }
        return failureCount < 3
      },
    },
  },
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>
)
