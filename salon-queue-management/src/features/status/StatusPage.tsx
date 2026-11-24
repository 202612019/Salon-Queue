import { BellRing, Check, Copy, LockKeyhole, Scissors, Ticket, UserRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router'
import { useLocale } from '../../i18n/context'
import type { TranslationKey } from '../../i18n/dictionaries'
import { formatPrice } from '../../lib/format'
import type { CustomerEntry, QueueState } from '../../domain/database'
import { customerErrorKey } from '../../domain/customer'
import { Badge, Button, Card, LinkButton, PageIntro } from '../../components/ui'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ConnectionNotice, EstimateText } from '../../components/shared/CustomerFeedback'
import { useSnapshot } from '../../hooks/useSnapshot'
import { BackendError, cancelCustomerEntry, getCustomerStatus } from '../../services/backend'
import { captureStatusFragment, createPrivateStatusLink, forgetCustomerAccess } from '../../services/customer-access'
import { PreviewStatusPage } from './PreviewStatusPage'

const statusKeys: Record<QueueState, TranslationKey> = { waiting: 'waiting', called: 'called', in_chair: 'inChair', done: 'doneState', cancelled: 'cancelledState', no_show: 'noShowState' }
export function StatusPage() {
  const { id = '' } = useParams()
  return id === 'preview' ? <PreviewStatusPage /> : <PrivateStatusPage key={id} id={id} />
}
function PrivateStatusPage({ id }: { id: string }) {
  const { t, locale } = useLocale(), location = useLocation()
  const [access] = useState(() => captureStatusFragment(id))
  const [dialog, setDialog] = useState(false), [cancelling, setCancelling] = useState(false)
  const [message, setMessage] = useState<TranslationKey | null>(null), [cancelled, setCancelled] = useState<CustomerEntry | null>(null)
  const guard = useRef(false)
  const load = useCallback((signal: AbortSignal) => getCustomerStatus({ locator: id, capability: access?.capability ?? '' }, signal), [id, access?.capability])
  const state = useSnapshot(load, id, !!access)
  const entry = cancelled && cancelled.version > (state.data?.version ?? 0) ? cancelled : state.data
  useEffect(() => { if (state.error === 'STATUS_UNAVAILABLE') forgetCustomerAccess() }, [state.error])
  if (!access || state.error === 'STATUS_UNAVAILABLE') return <section className="empty-state"><LockKeyhole size={40} strokeWidth={1.4} aria-hidden="true" /><h1>{t('privateTitle')}</h1><p>{t('statusUnavailable')}</p><LinkButton to="/">{t('backHome')}</LinkButton><LinkButton to="/status/preview" variant="quiet">{t('openPreview')}</LinkButton></section>
  async function copyLink() {
    try { await navigator.clipboard.writeText(createPrivateStatusLink(access!)); setMessage('linkCopied') }
    catch { setMessage('copyFailed') }
  }
  async function cancel() {
    if (guard.current || state.connection !== 'live' || entry?.status !== 'waiting') return
    guard.current = true; setCancelling(true); setMessage(null)
    try { setCancelled(await cancelCustomerEntry(access!)); setDialog(false) }
    catch (error) { setMessage(error instanceof BackendError && error.uncertain ? 'cancelUncertain' : customerErrorKey(error instanceof BackendError ? error.code : undefined)); setDialog(false) }
    finally { guard.current = false; setCancelling(false); state.refresh() }
  }
  const steps = ['waiting', 'called', 'in_chair', 'done'] as const
  const stepIndex = entry ? steps.indexOf(entry.status as typeof steps[number]) : -1
  return <>
    <PageIntro eyebrow={t('statusEyebrow')} title={t('statusTitle')} description={t('statusLiveBody')} />
    <ConnectionNotice state={state} refresh={state.refresh} />
    {location.state?.joined && <p className="success-message" role="status">{t('joinedSuccess')}</p>}
    {message && <p className="feedback-message" role="status">{t(message)}</p>}
    {!entry ? <Card className="form-card" role="status"><p>{t(state.error ? 'backendUnavailable' : 'loadingStatus')}</p>{state.error && <Button onClick={state.refresh}>{t('retry')}</Button>}</Card> : <>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{t('tokenNumber', { token: entry.token })} · {t(statusKeys[entry.status])}{entry.assigned_barber ? ` · ${entry.assigned_barber.name}` : ''}{entry.status === 'waiting' && entry.estimate ? ` · ${t(entry.estimate.position_kind === 'global' ? 'globalPosition' : 'barberPosition')}: ${entry.estimate.position}` : ''}</p>
      {entry.status === 'called' && <div className="called-notification" role="alert"><BellRing size={30} aria-hidden="true" /><div><strong>{t('calledNotice')} · {entry.token}</strong><p>{t('calledWith', { barber: entry.assigned_barber?.name ?? t('assignedBarber') })}</p></div></div>}
      <div className="status-layout">
        <Card className="status-pass"><div className="status-pass-header"><span className="eyebrow">{t('yourQueuePass')}</span><Badge state={statusKeys[entry.status]} /></div><span className="status-token-label">{t('token')}</span><div className="status-token tabular-nums">{entry.token}</div><div className="status-pass-metrics"><div><div className="position-ring"><span>{entry.status === 'waiting' ? entry.estimate?.position ?? '—' : '—'}</span></div><p>{t(entry.estimate?.position_kind === 'barber' ? 'barberPosition' : 'globalPosition')}</p></div><div className="wait-visual"><svg viewBox="0 0 120 120" aria-hidden="true"><circle className="wait-ring-track" cx="60" cy="60" r="53" /><circle className="wait-ring-accent" cx="60" cy="60" r="53" /></svg><strong><EstimateText estimate={entry.status === 'waiting' ? entry.estimate : null} /></strong></div></div><p className="field-hint text-center">{t('estimateNote')}</p>
          {entry.status === 'waiting' && entry.estimate?.position === 2 && <div className="arrival-note" role="status"><BellRing size={23} aria-hidden="true" /><div><strong>{t('statusNear')}</strong><p>{t('arrivalReminder')}</p></div></div>}
          {entry.status === 'in_chair' && <p className="terminal-message">{t('inChairMessage')}</p>}
          {(entry.status === 'done' || entry.status === 'cancelled' || entry.status === 'no_show') && <p className="terminal-message">{t(entry.status === 'done' ? 'doneMessage' : entry.status === 'cancelled' ? 'cancelledMessage' : 'noShowMessage')}</p>}
          <Button className="full-width" variant="secondary" icon={Copy} onClick={() => void copyLink()}>{t('copyPrivateLink')}</Button><p className="field-hint">{t('privateLinkHint')}</p>
        </Card>
        <div className="status-details"><Card className="form-card"><h2>{t('yourServices')}</h2><div className="status-services">{entry.services.map(service => <div key={service.id}><span className="service-icon"><Scissors size={18} aria-hidden="true" /></span><div><strong>{service[locale === 'gu' ? 'name_gu' : 'name_en']}</strong><p>{t('minutesCount', { count: service.duration_minutes })}</p></div><span className="tabular-nums">{formatPrice(service.price_paise, locale)}</span></div>)}</div><dl className="summary-list"><div><dt>{t('bookedDuration')}</dt><dd>{t('minutesCount', { count: entry.total_minutes })}</dd></div><div><dt>{t('total')}</dt><dd>{formatPrice(entry.total_paise, locale)}</dd></div><div><dt><UserRound size={15} aria-hidden="true" />{t('selectedBarber')}</dt><dd>{entry.preferred_barber?.name ?? t('anyBarber')}</dd></div><div><dt>{t('assignedBarber')}</dt><dd>{entry.assigned_barber?.name ?? t('notAssigned')}</dd></div></dl></Card>
          <Card className="form-card"><h2>{t('myStatus')}</h2><ol className="status-timeline">{steps.map((step, index) => { const Icon = [Check, BellRing, Scissors, Ticket][index]; return <li key={step} aria-current={step === entry.status ? 'step' : undefined} className={index <= stepIndex ? 'timeline-active' : ''}><span><Icon size={16} aria-hidden="true" /></span>{t(statusKeys[step])}</li> })}{(entry.status === 'cancelled' || entry.status === 'no_show') && <li className="timeline-active" aria-current="step">{t(statusKeys[entry.status])}</li>}</ol></Card>
        </div>
      </div><div className="cancel-area">{entry.status === 'waiting' ? <Button variant="quiet" disabled={cancelling || state.connection !== 'live'} onClick={() => setDialog(true)}>{t('cancel')}</Button> : <p>{t('cancelOnlyWaiting')}</p>}<LinkButton to="/" variant="quiet">{t('backHome')}</LinkButton></div>
    </>}
    {dialog && <ConfirmDialog title={t('cancelTitle')} description={t('cancelBody')} confirm={t(cancelling ? 'cancelling' : 'confirmCancel')} dismiss={t('keepPlace')} busy={cancelling} onConfirm={() => void cancel()} onDismiss={() => setDialog(false)} />}
  </>
}
