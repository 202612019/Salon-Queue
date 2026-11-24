import { Check, Scissors, Sparkles, WandSparkles } from 'lucide-react'
import type { Service } from '../../domain/types'
import { useLocale } from '../../i18n/context'
import { formatPrice } from '../../lib/format'

export function ServiceCard({ service, selected = false }: { service: Service; selected?: boolean }) {
  const { locale, t } = useLocale()
  const Icon = service.id === 'haircut' ? Scissors : service.id === 'beard' ? WandSparkles : Sparkles
  return <label className={`service-card${selected ? ' service-selected' : ''}`}><input type="checkbox" disabled checked={selected} readOnly aria-label={`${t(service.name)} · ${t('preview')}`} /><div className="service-card-top"><span className="service-icon"><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></span><span className="selection-check" aria-hidden="true">{selected && <Check size={14} />}</span></div><h3>{t(service.name)}</h3><p>{t(service.description)}</p><div className="service-card-bottom"><span>{t('minutesCount', { count: service.minutes })}</span><strong>{formatPrice(service.paise, locale)}</strong></div></label>
}
