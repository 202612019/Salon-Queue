import { Clock3, Plus, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useLocale } from '../../i18n/context'
import type { ReceptionSnapshot, StaffEntry } from '../../domain/database'
import { elapsedSeconds, formatElapsed, longWait, serviceRemaining } from '../../domain/staff'
import { admissionReasonKey } from '../../domain/customer'
import { Avatar, Badge, Button, Card, Field, Metric, PageIntro, SectionHeading } from '../../components/ui'
import { ConnectionNotice } from '../../components/shared/CustomerFeedback'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useStaffSnapshot } from '../../hooks/useStaffSnapshot'
import { useStaffCommand } from '../../hooks/useStaffCommand'
import { useSalonClock } from '../../hooks/useSalonClock'
import { useSnapshot } from '../../hooks/useSnapshot'
import { getPublicSalon } from '../../services/backend'
import { WalkInForm } from './WalkInForm'

export function ReceptionPage() {
  const { t, locale } = useLocale(), state = useStaffSnapshot<ReceptionSnapshot>()
  const salon = useSnapshot(getPublicSalon, 'staff-public-salon')
  const fresh = state.connection === 'live' && navigator.onLine
  const command = useStaffCommand(state.refresh, fresh), now = useSalonClock(state.data?.server_time, state.lastUpdated)
  const [walkIn, setWalkIn] = useState(false), [search, setSearch] = useState(''), [preference, setPreference] = useState('')
  const [confirm, setConfirm] = useState<{ entry: StaffEntry; action: 'cancel' | 'no_show' } | null>(null)
  const data = state.data, entries = data?.entries ?? [], waiting = entries.filter(entry => entry.status === 'waiting'), called = entries.filter(entry => entry.status === 'called')
  const filtered = waiting.filter(entry => (!preference || entry.preferred_barber?.id === preference) && `${entry.token} ${entry.customer_name}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  const blocked = !fresh || command.busy || command.pending
  const available = data?.barbers.filter(barber => barber.on_duty && !barber.on_break && !entries.some(entry => entry.assigned_barber?.id === barber.id && ['called', 'in_chair'].includes(entry.status))).length ?? 0
  return <>
    <PageIntro eyebrow={t('receptionEyebrow')} title={t('receptionTitle')} description={t('receptionBody')} action={<Button icon={Plus} disabled={blocked || salon.connection !== 'live' || !salon.data?.admission.walk_in} onClick={() => setWalkIn(true)}>{t('addWalkIn')}</Button>} />
    <ConnectionNotice state={state} refresh={state.refresh} />
    {salon.data && <p className="operating-note">{salon.data.salon_name} · {salon.data.opening_time.slice(0, 5)}–{salon.data.closing_time.slice(0, 5)} IST · {t(admissionReasonKey(salon.data.admission.reason))}</p>}
    {command.message && <p className="feedback-message" role="status">{t(command.message)}</p>}
    {command.pending && !command.busy && <div className="recovery-notice"><p>{t('staffUncertain')}</p><Button disabled={!fresh} onClick={() => void command.retry()}>{t('retryStaffAction')}</Button></div>}
    {!data ? <Card className="form-card" role="status"><p>{t(state.error ? 'noStaffSnapshot' : 'connectingData')}</p><Button onClick={state.refresh}>{t('retry')}</Button></Card> : <>
      <Card className="metrics-row"><Metric label={t('peopleWaiting')} value={waiting.length} icon={UsersRound} /><Metric label={t('activeAssignments')} value={entries.filter(entry => entry.status === 'called' || entry.status === 'in_chair').length} icon={Clock3} /><Metric label={t('availableBarbers')} value={available} icon={UsersRound} /></Card>
      <section className="staff-section"><SectionHeading title={t('teamOverview')} description={t('operationalAvailability')} /><div className="barber-grid operational-grid">{data.barbers.map(barber => {
        const entry = entries.find(entry => entry.assigned_barber?.id === barber.id && ['called', 'in_chair'].includes(entry.status))
        const barberState = !barber.on_duty ? 'offDuty' : barber.on_break ? 'onBreak' : entry?.status === 'called' ? 'called' : entry?.status === 'in_chair' ? 'inChair' : 'available'
        const remaining = entry ? serviceRemaining(entry, now) : null
        return <article className="barber-card barber-card-operational" key={barber.id}><div className="barber-identity"><Avatar initials={barber.display_name.slice(0, 2).toUpperCase()} /><h3>{barber.display_name}</h3></div><Badge state={barberState} /><div className="barber-current"><span className="field-hint">{t('currentCustomer')}</span>{entry ? <><strong className="tabular-nums">{entry.token}<span>{entry.customer_name}</span></strong><p>{entry.services.map(service => service[locale === 'gu' ? 'name_gu' : 'name_en']).join(' · ')}</p><p>{t(entry.status === 'called' ? 'sinceCalled' : 'elapsed')} · <span className="tabular-nums">{formatElapsed(elapsedSeconds(entry.status === 'called' ? entry.called_at : entry.started_at, now))}</span></p><p>{entry.status === 'in_chair' && remaining === 0 ? t('serviceOverrun') : `${t('remaining')} · ${t('minutesCount', { count: Math.ceil(remaining ?? 0) })}`}</p></> : <p>{t('noActiveAssignment')}</p>}</div><Button variant="secondary" aria-label={`${t('callNext')} · ${barber.display_name}`} disabled={blocked || !barber.on_duty || barber.on_break || !!entry} onClick={() => void command.run('call_next', { barber_id: barber.id })}>{t('callNext')}</Button></article>
      })}</div></section>
      <Card className="waiting-card"><SectionHeading title={t('waitingList')} description={t('waitingListHint')} action={<span className="count-chip">{waiting.length}</span>} /><div className="queue-filters"><Field label={t('searchQueue')} value={search} onChange={event => setSearch(event.target.value)} autoComplete="off" /><label className="staff-select-label">{t('preferenceFilter')}<select value={preference} onChange={event => setPreference(event.target.value)}><option value="">{t('allPreferences')}</option>{data.barbers.map(barber => <option value={barber.id} key={barber.id}>{barber.display_name}</option>)}</select></label></div>{!filtered.length ? <p className="empty-queue">{t('noWaiting')}</p> : <table className="queue-table"><thead><tr><th>{t('token')}</th><th>{t('customer')}</th><th>{t('services')}</th><th>{t('barberPreference')}</th><th>{t('waitDuration')}</th><th>{t('action')}</th></tr></thead><tbody>{filtered.map(entry => <tr key={entry.entry_id} className={longWait(entry, now) ? 'long-wait-row' : ''}><td data-label={t('token')}><strong className="table-token tabular-nums">{entry.token}</strong></td><td data-label={t('customer')}>{entry.customer_name}</td><td data-label={t('services')}>{entry.services.map(service => service[locale === 'gu' ? 'name_gu' : 'name_en']).join(' · ')}</td><td data-label={t('barberPreference')}>{entry.preferred_barber?.name ?? t('anyBarber')}</td><td data-label={t('waitDuration')}><span className="wait-value tabular-nums">{formatElapsed(elapsedSeconds(entry.created_at, now))}</span>{longWait(entry, now) && <small className="long-wait-label">{t('longWait')}</small>}</td><td data-label={t('action')}><Button variant="quiet" aria-label={`${t('cancel')} · ${entry.token}`} disabled={blocked} onClick={() => setConfirm({ entry, action: 'cancel' })}>{t('cancel')}</Button></td></tr>)}</tbody></table>}</Card>
      {called.length > 0 && <section className="staff-section"><SectionHeading title={t('calledCustomers')} />{called.map(entry => {
        const elapsed = elapsedSeconds(entry.called_at, now)
        return <Card className="called-review" key={entry.entry_id}><div><Badge state="called" /><strong className="tabular-nums">{entry.token} · {entry.assigned_barber?.name}</strong><p>{entry.customer_name}</p><p>{elapsed !== null && elapsed < 600 ? t('waitUntilNoShow', { time: formatElapsed(600 - elapsed) }) : t('noShowHint')}</p></div><Button variant="secondary" aria-label={`${t('noShow')} · ${entry.token}`} disabled={blocked || elapsed === null || elapsed < 600} onClick={() => setConfirm({ entry, action: 'no_show' })}>{t('noShow')}</Button></Card>
      })}</section>}
    </>}
    {walkIn && salon.data && <WalkInForm salon={salon.data} fresh={fresh && salon.connection === 'live' && !command.pending && !command.busy} refresh={() => { state.refresh(); salon.refresh() }} onClose={() => setWalkIn(false)} />}
    {confirm && <ConfirmDialog title={t(confirm.action === 'cancel' ? 'cancelStaffTitle' : 'noShowTitle')} description={t(confirm.action === 'cancel' ? 'cancelStaffBody' : 'noShowBody')} confirm={t(command.busy ? 'actionInProgress' : 'confirmAction')} dismiss={t('dismissDialog')} busy={command.busy} confirmDisabled={blocked} onConfirm={() => { void command.run(confirm.action, { entry_id: confirm.entry.entry_id, version: confirm.entry.version }).finally(() => setConfirm(null)) }} onDismiss={() => setConfirm(null)} />}
  </>
}
