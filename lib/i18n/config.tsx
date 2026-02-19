'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import ja from './ja.json'
import en from './en.json'

export type Locale = 'ja' | 'en'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const translations = {
  ja,
  en,
}

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ja')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load locale from localStorage on mount
    const saved = localStorage.getItem('tweaklog-locale')
    if (saved === 'ja' || saved === 'en') {
      setLocaleState(saved)
    }
    setMounted(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('tweaklog-locale', newLocale)
  }

  const t = (key: string): string => {
    return getNestedValue(translations[locale], key)
  }

  // Prevent hydration mismatch by rendering nothing until mounted
  if (!mounted) {
    return null
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useTranslation must be used within LocaleProvider')
  }
  return context
}
