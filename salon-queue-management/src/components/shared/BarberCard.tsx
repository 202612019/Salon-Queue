import type { PreviewBarber } from '../../domain/types'
import { useLocale } from '../../i18n/context'
import { Avatar, Badge, Button } from '../ui'
import { PhoneCall } from 'lucide-react'

export function BarberCard({ barber, operational = false }: { barber: PreviewBarber; operational?: boolean }) {
  const { t } = useLocale()
  return <article className={`barber-card${operational ? ' barber-card-operational' : ''}`}><div className="barber-identity"><Avatar initials={barber.initials} /><div><h3>{barber.name}</h3><p>{t(barber.specialty)}</p></div></div><Badge state={barber.state} />{operational && <><div className="barber-current"><span className="field-hint">{t('currentCustomer')}</span>{barber.token ? <><strong className="tabular-nums">{barber.token}<span>{barber.customer}</span></strong><p>{barber.remaining ? `${t('remaining')} · ${t('minutesCount', { count: barber.remaining })}` : `${t('sinceCalled')} · ${t('minutesCount', { count: 3 })}`}</p></> : <p>{t('takingBreak')}</p>}</div><Button variant="secondary" icon={PhoneCall} disabled>{t('callNext')}</Button></>}</article>
}
