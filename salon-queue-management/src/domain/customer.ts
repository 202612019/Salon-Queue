import type { CatalogService, PublicBarber } from './database'
import type { TranslationKey } from '../i18n/dictionaries'

export function normalizeCustomerPhone(value: string) {
  const compact = value.trim().replace(/[\s-]/g, '').replace(/^\+91/, '')
  return /^[6-9][0-9]{9}$/.test(compact) ? compact : null
}
export function validCustomerName(value: string) {
  const length = [...value.trim()].length
  return length >= 2 && length <= 60 && ![...value].some(character => { const code = character.codePointAt(0)!; return code < 32 || (code >= 127 && code <= 159) })
}
export function catalogNeedsReview(selected: CatalogService[], catalog: CatalogService[]) {
  return selected.some(old => !catalog.some(current => current.id === old.id && current.enabled && current.version === old.version && current.price_paise === old.price_paise && current.duration_minutes === old.duration_minutes))
}
export function publicBarberState(barber: PublicBarber): TranslationKey {
  return !barber.on_duty ? 'offDuty' : barber.on_break ? 'onBreak' : barber.status === 'called' ? 'called' : barber.status === 'in_chair' ? 'inChair' : 'available'
}
const errorKeys: Record<string, TranslationKey> = {
  INVALID_NAME: 'invalidName', INVALID_PHONE: 'invalidPhone', INVALID_SERVICES: 'invalidServices', INVALID_INPUT: 'invalidInput',
  ACTIVE_ENTRY_EXISTS: 'duplicatePhone', CATALOG_CHANGED: 'catalogChanged', SERVICE_UNAVAILABLE: 'catalogChanged',
  BARBER_UNAVAILABLE: 'barberUnavailable', NO_BARBERS: 'noBarbersReason', ONLINE_CLOSED: 'onlineClosedReason', SALON_CLOSED: 'salonClosedReason',
  IDEMPOTENCY_CONFLICT: 'pendingRecovery', RATE_LIMITED: 'rateLimited', STATUS_UNAVAILABLE: 'statusUnavailable',
  INVALID_TRANSITION: 'stateChanged', NETWORK_UNCERTAIN: 'networkUncertain', BACKEND_NOT_CONFIGURED: 'backendUnavailable',
}
export const customerErrorKey = (code?: string): TranslationKey => errorKeys[code ?? ''] ?? 'backendUnavailable'
export function admissionReasonKey(reason: string): TranslationKey {
  return ({ BEFORE_OPENING: 'beforeOpeningReason', SALON_CLOSED: 'salonClosedReason', NO_BARBERS: 'noBarbersReason', NO_SERVICES: 'noServicesReason', ONLINE_PAUSED: 'onlinePausedReason', ONLINE_CUTOFF: 'cutoffReason', OPEN: 'admissionOpen' } as Record<string, TranslationKey>)[reason] ?? 'onlineClosedReason'
}
