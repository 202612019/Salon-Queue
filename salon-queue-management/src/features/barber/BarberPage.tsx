import { CheckCheck, Clock3, Coffee, Scissors } from 'lucide-react'
import { useParams } from 'react-router'
import { useLocale } from '../../i18n/context'
import { barbers } from '../../services/preview-data'
import { StaffNotice } from '../../components/shared/PreviewBanner'
import { Avatar, Badge, Button, Card, LinkButton, PageIntro, ReadOnlySwitch } from '../../components/ui'

export function BarberPage() {
  const { name } = useParams()
  const { t } = useLocale()
  const selected = barbers.find(barber => barber.name.toLowerCase() === name?.toLowerCase())
  if (!selected) return <section className="empty-state"><Scissors size={40} aria-hidden="true" /><h1>{t('noAssignment')}</h1><p>{t('staffPreviewHint')}</p><LinkButton to="/barber/ravi">{t('barber')}</LinkButton></section>
  return <>
    <PageIntro eyebrow={t('barberEyebrow')} title={t('barberTitle')} description={t('barberBody')} />
    <StaffNotice />
    <div className="barber-workspace"><Card className="assignment-card"><div className="assignment-header"><div className="barber-identity"><Avatar initials={selected.initials} /><div><h2>{selected.name}</h2><p>{t(selected.specialty)}</p></div></div><Badge state={selected.state} /></div>{selected.token ? <><div className="assignment-customer"><span className="eyebrow">{t('currentCustomer')}</span><div><h2>{selected.customer}</h2><strong className="tabular-nums">{selected.token}</strong></div><p>{t('haircut')}{selected.state === 'called' && ` · ${t('beard')}`} · {t('minutesCount', { count: selected.state === 'called' ? 45 : 30 })}</p></div><div className="service-timer"><Clock3 size={22} strokeWidth={1.5} aria-hidden="true" /><span>{t(selected.state === 'called' ? 'sinceCalled' : 'elapsed')}</span><strong className="tabular-nums">{selected.state === 'called' ? '03:00' : '18:00'}</strong><small>{t('staticTimer')}</small></div><Button className="full-width" icon={selected.state === 'called' ? Scissors : CheckCheck} disabled>{t(selected.state === 'called' ? 'start' : 'done')}</Button><p className="disabled-explanation">{t('settingsUnavailable')}</p></> : <div className="empty-assignment"><Coffee size={34} aria-hidden="true" /><h2>{t('takingBreak')}</h2><p>{t('noAssignment')}</p></div>}</Card><div className="barber-workspace-aside"><Card className="form-card"><p className="eyebrow">{t('nextForYou')}</p><div className="next-customer"><strong className="tabular-nums">S-014</strong><h2>Arjun</h2><p>{t('haircut')} · {t('beard')}</p></div><p className="field-hint">{t('nextMayChange')}</p></Card><Card className="form-card"><h2>{t('duty')}</h2><div className="setting-row"><span>{t('available')}</span><ReadOnlySwitch label={t('availableLabel')} checked={selected.state !== 'onBreak'} /></div><div className="setting-row"><span>{t('breakLabel')}</span><ReadOnlySwitch label={t('breakLabel')} checked={selected.state === 'onBreak'} /></div><p className="field-hint">{t('dutyHint')}</p></Card></div></div>
  </>
}
