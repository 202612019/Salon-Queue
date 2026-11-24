import { useEffect, useState, type ReactNode } from 'react'
import { dictionaries, type Locale } from './dictionaries'
import { LocaleContext, type Translate } from './context'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    try { return localStorage.getItem('salonq.locale') === 'gu' ? 'gu' : 'en' } catch { return 'en' }
  })
  useEffect(() => {
    document.documentElement.lang = locale
    try { localStorage.setItem('salonq.locale', locale) } catch { /* Browsing without storage still works. */ }
  }, [locale])
  const t: Translate = (key, values) => {
    let text: string = dictionaries[locale][key]
    for (const [name, value] of Object.entries(values ?? {})) text = text.replaceAll(`{${name}}`, String(value))
    return text
  }
  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}
