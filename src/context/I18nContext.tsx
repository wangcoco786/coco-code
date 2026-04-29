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
    // Only respect saved locale if user explicitly chose it (not auto-detected zh)
    if (saved === 'en' || saved === 'ja' || saved === 'es') return saved
    // Force English as default — clear any stale 'zh' from auto-detection
    if (saved === 'zh') localStorage.removeItem(LS_KEY)
  } catch { /* ignore */ }
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
