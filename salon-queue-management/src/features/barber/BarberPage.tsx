import { CheckCheck, Clock3, Coffee, Scissors } from 'lucide-react'
import { useState } from 'react'
import { useLocale } from '../../i18n/context'
import { Avatar, Badge, Button, Card, PageIntro } from '../../components/ui'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ConnectionNotice } from '../../components/shared/CustomerFeedback'
import { useStaff } from '../auth/context'
import { useStaffSnapshot } from '../../hooks/useStaffSnapshot'
import { useStaffCommand } from '../../hooks/useStaffCommand'
import { useSalonClock } from '../../hooks/useSalonClock'
import { elapsedSeconds, formatElapsed, serviceRemaining } from '../../domain/staff'
import type { BarberSnapshot } from '../../domain/database'
export function BarberPage() {
  const { t, locale } = useLocale(), staff = useStaff(), state = useStaffSnapshot<BarberSnapshot>()
  const command = useStaffCommand(state.refresh, state.connection === 'live' && navigator.onLine)
  const now = useSalonClock(state.data?.server_time, state.lastUpdated)
  const [finish, setFinish] = useState(false)
  const data = state.data, entry = data?.current, barber = data?.barber
  const blocked = state.connection !== 'live' || command.busy || command.pending
  // Discard even a stale profile/snapshot mismatch rather than showing the wrong workspace.
  if (barber && (barber.id !== staff.profile?.barber_id || barber.slug !== staff.profile?.barber_slug)) return <section className="empty-state"><h1>{t('accessDenied')}</h1><p>{t('accessDeniedBody')}</p></section>
  return <>
    <PageIntro eyebrow={t('barberEyebrow')} title={t('barberTitle')} description={t('barberBody')} />
    <ConnectionNotice state={state} refresh={state.refresh} />
    {command.message && <p className="feedback-message" role="status">{t(command.message)}</p>}{command.pending && !command.busy && <div className="recovery-notice"><p>{t('staffUncertain')}</p><Button disabled={state.connection !== 'live'} onClick={() => void command.retry()}>{t('retryStaffAction')}</Button></div>}
    {!data || !barber ? <Card className="form-card" role="status"><p>{t(state.error ? 'noStaffSnapshot' : 'connectingData')}</p><Button onClick={state.refresh}>{t('retry')}</Button></Card> : <div className="barber-workspace"><Card className="assignment-card"><div className="assignment-header"><div className="barber-identity"><Avatar initials={barber.display_name.slice(0, 2).toUpperCase()} /><div><h2>{barber.display_name}</h2><p>{t('myWorkspace')}</p></div></div><Badge state={!barber.on_duty ? 'offDuty' : barber.on_break ? 'onBreak' : entry?.status === 'called' ? 'called' : entry?.status === 'in_chair' ? 'inChair' : 'available'} /></div>{entry ? <><div className="assignment-customer"><span className="eyebrow">{t('currentCustomer')}</span><div><h2>{entry.customer_name}</h2><strong className="tabular-nums">{entry.token}</strong></div><p>{entry.services.map(service => service[locale === 'gu' ? 'name_gu' : 'name_en']).join(' · ')} · {t('minutesCount', { count: entry.total_minutes })}</p></div><div className="service-timer"><Clock3 size={22} strokeWidth={1.5} aria-hidden="true" /><span>{t(entry.status === 'called' ? 'sinceCalled' : 'elapsed')}</span><strong className="tabular-nums">{formatElapsed(elapsedSeconds(entry.status === 'called' ? entry.called_at : entry.started_at, now))}</strong><small>{t('elapsedFromServer')}</small></div>{entry.status === 'in_chair' && <p className="field-hint">{serviceRemaining(entry, now) === 0 ? t('serviceOverrun') : `${t('remaining')} · ${t('minutesCount', { count: Math.ceil(serviceRemaining(entry, now)) })}`}</p>}<Button className="full-width" icon={entry.status === 'called' ? Scissors : CheckCheck} disabled={blocked} onClick={() => { if (entry.status === 'called') void command.run('start', { entry_id: entry.entry_id, version: entry.version }); else setFinish(true) }}>{t(entry.status === 'called' ? 'start' : 'done')}</Button></> : <div className="empty-assignment"><Coffee size={34} aria-hidden="true" /><h2>{t(barber.on_break ? 'takingBreak' : 'noActiveAssignment')}</h2></div>}</Card><div className="barber-workspace-aside"><Card className="form-card"><p className="eyebrow">{t('nextEligible')}</p>{data.next ? <div className="next-customer"><strong className="tabular-nums">{data.next.token}</strong><h2>{data.next.customer_name}</h2><p>{data.next.services.map(service => service[locale === 'gu' ? 'name_gu' : 'name_en']).join(' · ')}</p></div> : <p>{t('noEligible')}</p>}<p className="field-hint">{t('nextEligibleHint')}</p></Card><Card className="form-card"><h2>{t('duty')}</h2><div className="setting-row"><Badge state={barber.on_break ? 'onBreak' : barber.on_duty ? 'available' : 'offDuty'} /><Button variant="secondary" disabled={blocked || !!entry || !barber.on_duty} onClick={() => void command.run('set_duty', { barber_id: barber.id, version: barber.version, on_duty: true, on_break: !barber.on_break })}>{t(barber.on_break ? 'returnFromBreak' : 'takeBreak')}</Button></div><p className="field-hint">{t('breakUnavailable')}</p></Card></div></div>}
    {finish && entry && <ConfirmDialog title={t('finishTitle')} description={t('finishBody')} confirm={t(command.busy ? 'actionInProgress' : 'done')} dismiss={t('dismissDialog')} busy={command.busy} onConfirm={() => { void command.run('done', { entry_id: entry.entry_id, version: entry.version }).finally(() => setFinish(false)) }} onDismiss={() => setFinish(false)} />}
  </>
}
