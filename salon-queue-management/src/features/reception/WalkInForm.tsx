import { useRef, useState, type FormEvent } from 'react'
import type { AdmissionReceipt, AdmissionRequest, CatalogService, PublicSalon } from '../../domain/database'
import { useStaff } from '../auth/context'
import { useLocale } from '../../i18n/context'
import { Button, Field } from '../../components/ui'
import { Modal } from '../../components/ui/Modal'
import { ServiceCard } from '../../components/shared/ServiceCard'
import { catalogNeedsReview, customerErrorKey, normalizeCustomerPhone, publicBarberState, validCustomerName } from '../../domain/customer'
import { formatPrice } from '../../lib/format'
import { admitCustomer, BackendError, recoverAdmission } from '../../services/backend'
import { clearWalkInIdentity, createWalkInIdentity, readWalkInIdentity } from '../../services/walk-in-access'
import { createPrivateStatusLink } from '../../services/customer-access'
import type { TranslationKey } from '../../i18n/dictionaries'
export function WalkInForm({ salon, fresh, refresh, onClose }: { salon: PublicSalon; fresh: boolean; refresh: () => void; onClose: () => void }) {
  const { profile } = useStaff(), { t, locale } = useLocale()
  const [name, setName] = useState(''), [phone, setPhone] = useState(''), [preferred, setPreferred] = useState('')
  const [selected, setSelected] = useState<CatalogService[]>([]), [attempted, setAttempted] = useState(false), [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(() => !!readWalkInIdentity(profile!.user_id))
  const [result, setResult] = useState<(AdmissionReceipt & { capability: string }) | null>(null)
  const [message, setMessage] = useState<TranslationKey | null>(null), [review, setReview] = useState(false), [retryable, setRetryable] = useState(false)
  const guard = useRef(false), uncertain = useRef(pending), original = useRef<AdmissionRequest | null>(null)
  const changed = catalogNeedsReview(selected, salon.services), locked = busy || pending
  async function send(request: AdmissionRequest) {
    if (guard.current || !fresh) return
    guard.current = true; setBusy(true); setMessage(null)
    try { const receipt = await admitCustomer(request); clearWalkInIdentity(); setPending(false); setResult({ ...receipt, capability: request.capability }); refresh() }
    catch (error) {
      const failure = error instanceof BackendError ? error : new BackendError('NETWORK_UNCERTAIN', true)
      if (failure.uncertain || uncertain.current || failure.code === 'IDEMPOTENCY_CONFLICT') { uncertain.current = true; setMessage('networkUncertain') }
      else { clearWalkInIdentity(); setPending(false); setRetryable(false); original.current = null; setMessage(customerErrorKey(failure.code)); if (['CATALOG_CHANGED', 'SERVICE_UNAVAILABLE'].includes(failure.code)) setReview(true) }
      refresh()
    } finally { guard.current = false; setBusy(false) }
  }
  function submit(event: FormEvent) {
    event.preventDefault(); setAttempted(true)
    if (guard.current || !fresh || !salon.admission.walk_in || locked || changed || review || !validCustomerName(name) || !normalizeCustomerPhone(phone) || !selected.length || selected.length > 3 || (preferred && !salon.barbers.some(b => b.id === preferred && b.on_duty))) return
    try {
      const identity = createWalkInIdentity(profile!.user_id)
      const request: AdmissionRequest = { request_key: identity.request_key, capability: identity.capability, name: name.trim(), phone: normalizeCustomerPhone(phone)!, source: 'walk_in', preferred_barber_id: preferred || null, services: selected.map(({ id, version, price_paise, duration_minutes }) => ({ id, version, price_paise, duration_minutes })) }
      original.current = request; setRetryable(true); setPending(true); void send(request)
    } catch { setMessage('staffStorageError') }
  }
  async function recover() {
    if (guard.current || !fresh) return
    const identity = readWalkInIdentity(profile!.user_id)
    if (!identity) return
    guard.current = true; setBusy(true)
    try { const receipt = await recoverAdmission(identity.request_key, identity.capability); clearWalkInIdentity(); setPending(false); setResult({ ...receipt, capability: identity.capability }); refresh() }
    catch (error) { setMessage(error instanceof BackendError && error.code === 'STATUS_UNAVAILABLE' ? 'receiptNotReady' : 'networkUncertain') }
    finally { guard.current = false; setBusy(false) }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(createPrivateStatusLink({ locator: result!.locator, capability: result!.capability })); setMessage('linkCopied') } catch { setMessage('copyFailed') }
  }
  return <Modal title={t('walkInTitle')} busy={busy} onClose={onClose}>{message && <p role="status" className="feedback-message">{t(message)}</p>}{result ? <div className="walk-in-receipt"><h3>{t('walkInCreated')}</h3><strong className="pass-token tabular-nums">{result.token}</strong><p>{t('walkInPrivateHint')}</p><Button onClick={() => void copy()}>{t('copyPrivateLink')}</Button></div> : <><p>{t('walkInBody')}</p>{pending && <div className="recovery-notice"><p>{t('walkInRecovery')}</p><Button disabled={busy || !fresh} onClick={() => void recover()}>{t('checkPrevious')}</Button>{retryable && <Button disabled={busy || !fresh} variant="secondary" onClick={() => void send(original.current!)}>{t('retryOriginal')}</Button>}</div>}<form onSubmit={submit} noValidate><div className="field-grid"><Field label={t('name')} value={name} onChange={event => setName(event.target.value)} disabled={locked} autoComplete="off" error={attempted && !validCustomerName(name) ? t('invalidName') : undefined} /><Field label={t('phone')} type="tel" value={phone} onChange={event => setPhone(event.target.value)} disabled={locked} autoComplete="off" hint={t('phoneHint')} error={attempted && !normalizeCustomerPhone(phone) ? t('invalidPhone') : undefined} /></div><p className="field-hint" aria-live="polite">{t('selectedCounter', { count: selected.length })}</p><fieldset className="service-grid" aria-label={t('chooseServices')}>{salon.services.map(service => <ServiceCard key={service.id} service={service} selected={selected.some(item => item.id === service.id)} disabled={locked || !fresh || (selected.length === 3 && !selected.some(item => item.id === service.id))} onChange={() => setSelected(items => items.some(item => item.id === service.id) ? items.filter(item => item.id !== service.id) : items.length < 3 ? [...items, service] : items)} />)}</fieldset>{attempted && !selected.length && <p className="field-error">{t('invalidServices')}</p>}<label className="staff-select-label">{t('chooseBarber')}<select value={preferred} onChange={event => setPreferred(event.target.value)} disabled={locked || !fresh}><option value="">{t('anyBarber')}</option>{salon.barbers.map(barber => <option key={barber.id} value={barber.id} disabled={!barber.on_duty}>{barber.display_name} · {t(publicBarberState(barber))}</option>)}</select></label>{salon.barbers.find(barber => barber.id === preferred)?.on_break && <p className="inline-note">{t('relevantBreak')}</p>}<p className="walk-in-total">{t('total')}: <strong>{formatPrice(selected.reduce((sum, service) => sum + service.price_paise, 0), locale)}</strong> · {t('minutesCount', { count: selected.reduce((sum, service) => sum + service.duration_minutes, 0) })}</p>{(changed || review) && <div className="review-notice"><p>{t('catalogChanged')}</p><Button disabled={locked || !fresh} onClick={() => { setSelected(items => salon.services.filter(service => items.some(item => item.id === service.id))); setReview(false); setMessage('reviewedSelection') }}>{t('reviewSelection')}</Button></div>}<Button type="submit" disabled={locked || !fresh || !salon.admission.walk_in || changed || review}>{t(busy ? 'submitting' : 'walkInConfirm')}</Button></form></>}<Button variant="quiet" disabled={busy} onClick={onClose}>{t('closeWalkIn')}</Button></Modal>
}
