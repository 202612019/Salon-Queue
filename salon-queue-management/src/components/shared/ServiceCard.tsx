import { Check, Scissors, Sparkles, WandSparkles } from 'lucide-react'
import type { Service } from '../../domain/types'
import { useLocale } from '../../i18n/context'
import { formatPrice } from '../../lib/format'
import type { CatalogService } from '../../domain/database'

export function ServiceCard({ service, selected = false, onChange, disabled = true }: { service: Service | CatalogService; selected?: boolean; onChange?: () => void; disabled?: boolean }) {
  const { locale, t } = useLocale()
  const Icon = service.id === 'haircut' ? Scissors : service.id === 'beard' ? WandSparkles : Sparkles
  const live = 'name_en' in service
  const name = live ? service[locale === 'gu' ? 'name_gu' : 'name_en'] : t(service.name)
  return <label className={`service-card${selected ? ' service-selected' : ''}${disabled ? ' service-disabled' : ''}`}><input type="checkbox" disabled={disabled} checked={selected} onChange={onChange} readOnly={!onChange} aria-label={live ? name : `${name} · ${t('preview')}`} /><div className="service-card-top"><span className="service-icon"><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></span><span className="selection-check" aria-hidden="true">{selected && <Check size={14} />}</span></div><h3>{name}</h3><p>{live ? t('catalogServiceHint') : t(service.description)}</p><div className="service-card-bottom"><span>{t('minutesCount', { count: live ? service.duration_minutes : service.minutes })}</span><strong>{formatPrice(live ? service.price_paise : service.paise, locale)}</strong></div></label>
}
