import { createContext, useContext } from 'react'
import type { Locale, TranslationKey } from './dictionaries'

export type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string
export type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: Translate }
export const LocaleContext = createContext<LocaleContextValue | null>(null)
export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('LocaleProvider is required')
  return value
}
