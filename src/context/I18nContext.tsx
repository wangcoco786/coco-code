import { createContext, useCallback, useContext, useState } from 'react'
import { type Locale, type TranslationKey, translations } from '@/i18n'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const LS_KEY = 'ai_pm_locale'

function getSavedLocale(): Locale {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved === 'zh' || saved === 'en' || saved === 'ja' || saved === 'es') return saved
  } catch { /* ignore */ }
  // 根据浏览器语言自动选择
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('zh')) return 'zh'
  if (lang.startsWith('ja')) return 'ja'
  if (lang.startsWith('es')) return 'es'
  return 'en'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getSavedLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem(LS_KEY, l) } catch { /* ignore */ }
  }, [])

  const t = useCallback((key: TranslationKey): string => {
    return translations[locale][key] ?? translations['zh'][key] ?? key
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
