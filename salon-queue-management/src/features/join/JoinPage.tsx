import { Check, Info, LockKeyhole, Scissors, UsersRound } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useLocale } from '../../i18n/context'
import { formatPrice } from '../../lib/format'
import { Avatar, Button, Card, Field, PageIntro, SectionHeading } from '../../components/ui'
import { ServiceCard } from '../../components/shared/ServiceCard'
import { ConnectionNotice, EstimateText } from '../../components/shared/CustomerFeedback'
import { useSalon } from '../customer/context'
import { admissionReasonKey, catalogNeedsReview, customerErrorKey, normalizeCustomerPhone, publicBarberState, validCustomerName } from '../../domain/customer'
import type { AdmissionReceipt, AdmissionRequest, CatalogService } from '../../domain/database'
import type { TranslationKey } from '../../i18n/dictionaries'
import { admitCustomer, BackendError, recoverAdmission } from '../../services/backend'
import { clearRejectedAdmissionIdentity, createAdmissionIdentity, readPendingIdentity, saveCustomerAccess } from '../../services/customer-access'

export function JoinPage() {
  const { t, locale } = useLocale(), salon = useSalon(), navigate = useNavigate()
  const [name, setName] = useState(''), [phone, setPhone] = useState('')
  const [selected, setSelected] = useState<CatalogService[]>([]), [preferred, setPreferred] = useState<string | null>(null)
  const [attempted, setAttempted] = useState(false), [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(() => !!readPendingIdentity())
  const [canRetryOriginal, setCanRetryOriginal] = useState(false)
  const [message, setMessage] = useState<TranslationKey | null>(null), [forceReview, setForceReview] = useState(false)
  const guard = useRef(false), original = useRef<AdmissionRequest | null>(null), uncertain = useRef(pending)
  const data = salon.data
  const changed = catalogNeedsReview(selected, data?.services ?? [])
  const barber = data?.barbers.find(barber => barber.id === preferred)
  const fresh = salon.connection === 'live' && navigator.onLine
  const closed = !data?.admission.online
  const frozen = busy || pending
  const canSubmit = fresh && !closed && !frozen && !changed && !forceReview && (!preferred || !!barber?.on_duty)
  const finishAdmission = (receipt: AdmissionReceipt, capability: string) => {
    try {
      saveCustomerAccess(receipt, capability)
      navigate(`/status/${receipt.locator}`, { replace: true, state: { joined: true } })
    } catch {
      // The entry really exists. A fragment still gives this tab private access if storage filled.
      navigate(`/status/${receipt.locator}#access=${capability}`, { replace: true, state: { joined: true } })
    }
  }
  async function send(request: AdmissionRequest) {
    if (guard.current || !fresh) return
    guard.current = true; setBusy(true); setMessage(null)
    try { finishAdmission(await admitCustomer(request), request.capability) }
    catch (error) {
      const failure = error instanceof BackendError ? error : new BackendError('NETWORK_UNCERTAIN', true)
      if (failure.uncertain || uncertain.current || failure.code === 'IDEMPOTENCY_CONFLICT') {
        uncertain.current = true; setMessage('networkUncertain')
      } else {
        clearRejectedAdmissionIdentity(); setPending(false); setCanRetryOriginal(false); original.current = null
        setMessage(customerErrorKey(failure.code))
        if (failure.code === 'CATALOG_CHANGED' || failure.code === 'SERVICE_UNAVAILABLE') setForceReview(true)
      }
      salon.refresh()
    } finally { guard.current = false; setBusy(false) }
  }
  function submit(event: FormEvent) {
    event.preventDefault(); if (guard.current) return; setAttempted(true); setMessage(null)
    if (!validCustomerName(name) || !normalizeCustomerPhone(phone) || selected.length < 1 || selected.length > 3 || !canSubmit) return
    let identity: ReturnType<typeof createAdmissionIdentity>
    try { identity = createAdmissionIdentity() } catch { setMessage('storageUnavailable'); return }
    const request: AdmissionRequest = { ...identity, name: name.trim(), phone: normalizeCustomerPhone(phone)!, services: selected.map(({ id, version, price_paise, duration_minutes }) => ({ id, version, price_paise, duration_minutes })), preferred_barber_id: preferred, source: 'remote' }
    original.current = request; setCanRetryOriginal(true); setPending(true)
    void send(request)
  }
  async function recover() {
    if (guard.current || !navigator.onLine) return
    const identity = readPendingIdentity()
    if (!identity) return
    guard.current = true; setBusy(true); setMessage(null)
    try { finishAdmission(await recoverAdmission(identity.request_key, identity.capability), identity.capability) }
    catch (error) { setMessage(error instanceof BackendError && error.code === 'STATUS_UNAVAILABLE' ? 'receiptNotReady' : customerErrorKey(error instanceof BackendError ? error.code : undefined)) }
    finally { guard.current = false; setBusy(false) }
  }
  const total = selected.reduce((sum, service) => sum + service.price_paise, 0)
  const minutes = selected.reduce((sum, service) => sum + service.duration_minutes, 0)
  return <>
    <PageIntro eyebrow={t('joinEyebrow')} title={t('joinTitle')} description={t('joinBody')} />
    <ConnectionNotice state={salon} refresh={salon.refresh} />
    <ol className="join-progress" aria-label={t('join')}><li>{t('detailsStep')}</li><li>{t('servicesStep')}</li><li>{t('confirmStep')}</li></ol>
    {pending && <Card className="recovery-notice"><h2>{t('pendingRecovery')}</h2><p>{t('pendingHint')}</p><Button onClick={() => void recover()} disabled={busy || !navigator.onLine}>{t(busy ? 'checkingPrevious' : 'checkPrevious')}</Button>{canRetryOriginal && <Button variant="secondary" onClick={() => void send(original.current!)} disabled={busy || !fresh}>{t('retryOriginal')}</Button>}</Card>}
    {message && <p className="feedback-message" role="alert">{t(message)}</p>}
    {!data && <p role="status">{t(salon.error ? 'backendUnavailable' : 'loadingSalon')}</p>}
    {data && closed && <p className="inline-note" role="status">{t(admissionReasonKey(data.admission.reason))}</p>}
    <form className="join-layout" onSubmit={submit} noValidate aria-busy={busy}>
      <div className="form-sections">
        <Card className="form-card"><SectionHeading title={t('yourDetails')} description={t('detailsHint')} /><div className="field-grid"><Field label={t('name')} name="customerName" value={name} onChange={event => setName(event.target.value)} placeholder={t('namePlaceholder')} autoComplete="off" disabled={frozen} error={attempted && !validCustomerName(name) ? t('invalidName') : undefined} /><Field label={t('phone')} name="customerPhone" type="tel" inputMode="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder={t('phonePlaceholder')} hint={t('phoneHint')} autoComplete="off" disabled={frozen} error={attempted && !normalizeCustomerPhone(phone) ? t('invalidPhone') : undefined} /></div></Card>
        <Card className="form-card"><SectionHeading title={t('chooseServices')} description={t('liveServicesHint')} action={<span className="sample-label" aria-live="polite">{t('selectedCounter', { count: selected.length })}</span>} /><fieldset className="service-grid" aria-label={t('chooseServices')}>{data?.services.map(service => <ServiceCard key={service.id} service={service} selected={selected.some(item => item.id === service.id)} disabled={frozen || !fresh || (selected.length === 3 && !selected.some(item => item.id === service.id))} onChange={() => setSelected(items => items.some(item => item.id === service.id) ? items.filter(item => item.id !== service.id) : items.length < 3 ? [...items, service] : items)} />)}</fieldset>{data && !data.services.length && <p>{t('emptyCatalog')}</p>}{attempted && !selected.length && <p className="field-error" role="alert">{t('invalidServices')}</p>}{(changed || forceReview) && <div className="review-notice" role="status"><p>{t('catalogChanged')}</p><Button variant="secondary" disabled={frozen || !fresh} onClick={() => { setSelected(items => data?.services.filter(service => items.some(item => item.id === service.id)) ?? []); setForceReview(false); setMessage('reviewedSelection') }}>{t('reviewSelection')}</Button></div>}</Card>
        <Card className="form-card"><SectionHeading title={t('chooseBarber')} /><fieldset className="barber-picker" aria-label={t('chooseBarber')}><label className={`barber-option${preferred === null ? ' barber-option-selected' : ''}`}><input type="radio" name="barber" checked={preferred === null} onChange={() => setPreferred(null)} disabled={frozen || !fresh} /><span className="barber-option-icon"><UsersRound size={21} aria-hidden="true" /></span><span><strong>{t('anyBarber')}</strong><small>{t('anyBarberHint')}</small></span>{preferred === null && <Check size={17} aria-hidden="true" />}</label>{data?.barbers.map(barber => <label className={`barber-option${preferred === barber.id ? ' barber-option-selected' : ''}`} key={barber.id}><input type="radio" name="barber" checked={preferred === barber.id} onChange={() => setPreferred(barber.id)} disabled={frozen || !fresh || !barber.on_duty} /><Avatar initials={barber.display_name.slice(0, 2).toUpperCase()} /><span><strong>{barber.display_name}</strong><small>{t(publicBarberState(barber))}</small></span></label>)}</fieldset>{preferred && !barber?.on_duty && <p className="field-error">{t('barberUnavailable')}</p>}{barber?.on_break && <p className="inline-note"><Info size={16} aria-hidden="true" />{t('relevantBreak')}</p>}{!preferred && data?.barbers.some(b => b.on_duty) && data.barbers.filter(b => b.on_duty).every(b => b.on_break) && <p className="inline-note">{t('allOnBreak')}</p>}</Card>
      </div>
      <aside className="selection-column"><Card className="selection-card"><div className="selection-heading"><Scissors size={21} aria-hidden="true" /><h2>{t('yourSelection')}</h2></div><p className="field-hint" aria-live="polite">{t('selectedCounter', { count: selected.length })}</p><div className="selection-services">{selected.length ? selected.map(service => <div key={service.id}><span>{service[locale === 'gu' ? 'name_gu' : 'name_en']}</span><span className="tabular-nums">{formatPrice(service.price_paise, locale)}</span></div>) : <p>{t('selectionEmpty')}</p>}</div><dl className="summary-list"><div><dt>{t('duration')}</dt><dd>{t('minutesCount', { count: minutes })}</dd></div><div><dt>{t('selectedBarber')}</dt><dd>{barber?.display_name ?? t('anyBarber')}</dd></div><div><dt>{t('estimatedWait')}</dt><dd><EstimateText estimate={preferred ? barber?.estimate : data?.estimate} /></dd></div></dl><p className="field-hint">{t('estimateNote')}</p><div className="selection-total"><span>{t('total')}</span><strong className="tabular-nums">{formatPrice(total, locale)}</strong></div><Button type="submit" disabled={!canSubmit} className="full-width">{t(busy ? 'submitting' : 'confirmJoin')}</Button></Card><p className="privacy-note"><LockKeyhole size={17} aria-hidden="true" />{t('privateTrackingHint')}</p></aside>
    </form>
  </>
}
