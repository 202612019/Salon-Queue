import { Scissors } from 'lucide-react'
import { Link } from 'react-router'
import { useLocale } from '../../i18n/context'

export function Brand() {
  const { t } = useLocale()
  return <Link to="/" className="brand" aria-label={`${t('appName')} · ${t('home')}`}><span className="brand-mark"><Scissors size={24} strokeWidth={1.7} aria-hidden="true" /></span><span className="brand-word">Salon<span>Q</span></span></Link>
}
