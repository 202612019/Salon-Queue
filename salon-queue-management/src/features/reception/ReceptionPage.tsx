import { Clock3, Coffee, Plus, UsersRound } from 'lucide-react'
import { useLocale } from '../../i18n/context'
import { barbers, waitingEntries } from '../../services/preview-data'
import { BarberCard } from '../../components/shared/BarberCard'
import { StaffNotice } from '../../components/shared/PreviewBanner'
import { Badge, Button, Card, Metric, PageIntro, SectionHeading } from '../../components/ui'

export function ReceptionPage() {
  const { t } = useLocale()
  return <>
    <PageIntro eyebrow={t('receptionEyebrow')} title={t('receptionTitle')} description={t('receptionBody')} action={<Button icon={Plus} disabled>{t('addWalkIn')}</Button>} />
    <StaffNotice />
    <Card className="metrics-row"><Metric label={t('peopleWaiting')} value="06" icon={UsersRound} /><Metric label={t('activeChairs')} value="02" icon={Clock3} /><Metric label={t('onBreak')} value="01" icon={Coffee} /></Card>
    <section className="staff-section"><SectionHeading title={t('teamOverview')} description={t('teamOverviewHint')} /><div className="barber-grid operational-grid">{barbers.map(barber => <BarberCard key={barber.name} barber={barber} operational />)}</div></section>
    <Card className="waiting-card"><SectionHeading title={t('waitingList')} description={t('waitingListHint')} action={<span className="count-chip">06</span>} /><table className="queue-table"><thead><tr><th>{t('token')}</th><th>{t('customer')}</th><th>{t('services')}</th><th>{t('barberPreference')}</th><th>{t('waitDuration')}</th><th>{t('action')}</th></tr></thead><tbody>{waitingEntries.map(entry => <tr key={entry.token} className={entry.waited > 60 ? 'long-wait-row' : ''}><td data-label={t('token')}><strong className="table-token tabular-nums">{entry.token}</strong></td><td data-label={t('customer')}>{entry.name}</td><td data-label={t('services')}>{entry.services.map(key => t(key)).join(' · ')}</td><td data-label={t('barberPreference')}>{entry.preference ?? t('anyBarber')}</td><td data-label={t('waitDuration')}><span className="wait-value">{t('minutesCount', { count: entry.waited })}</span>{entry.waited > 60 && <small className="long-wait-label">{t('longWait')}</small>}</td><td data-label={t('action')}><Button variant="quiet" disabled>{t('cancel')}</Button></td></tr>)}</tbody></table></Card>
    <Card className="called-review"><div><Badge state="called" /><strong className="tabular-nums">S-013 · Amit</strong><p>{t('noShowHint')}</p></div><Button variant="secondary" disabled>{t('noShow')}</Button></Card>
  </>
}
