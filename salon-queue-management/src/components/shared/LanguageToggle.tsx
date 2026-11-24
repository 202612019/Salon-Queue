import { Globe2 } from 'lucide-react'
import { useLocale } from '../../i18n/context'

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale()
  return <button type="button" className="language-toggle" aria-label={t('language')} onClick={() => setLocale(locale === 'en' ? 'gu' : 'en')}><Globe2 size={17} aria-hidden="true" /><span lang={locale === 'en' ? 'gu' : 'en'}>{locale === 'en' ? 'ગુજરાતી' : 'English'}</span></button>
}
