import { Scissors } from 'lucide-react'
import { useLocale } from '../../i18n/context'
import { LinkButton } from '../../components/ui'

export function NotFoundPage() {
  const { t } = useLocale()
  return <section className="empty-state"><span className="not-found-number" aria-hidden="true">404</span><Scissors size={32} strokeWidth={1.4} aria-hidden="true" /><h1>{t('notFoundTitle')}</h1><p>{t('notFoundBody')}</p><LinkButton to="/">{t('backHome')}</LinkButton></section>
}
