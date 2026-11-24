import type { StaffEntry } from './database'
import type { TranslationKey } from '../i18n/dictionaries'
export function elapsedSeconds(start: string | null, now: number | null) { return start && now !== null ? Math.max(0, Math.floor((now - Date.parse(start)) / 1000)) : null }
export function formatElapsed(seconds: number | null) { return seconds === null ? '—' : `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}` }
export function serviceRemaining(entry: StaffEntry, now: number | null) { return entry.status === 'called' ? entry.total_minutes : Math.max(0, entry.total_minutes - (elapsedSeconds(entry.started_at, now) ?? 0) / 60) }
export const longWait = (entry: StaffEntry, now: number | null) => entry.status === 'waiting' && now !== null && now - Date.parse(entry.created_at) > 60 * 60 * 1000
export function staffErrorKey(code: string): TranslationKey {
  return ({ AUTH_REQUIRED: 'sessionExpired', AUTH_FAILED: 'authFailed', FORBIDDEN: 'staffForbidden', STALE_VERSION: 'staffConflict', BARBER_BUSY: 'barberBusyError', BARBER_HAS_WAITING: 'barberWaitingError', BARBER_UNAVAILABLE: 'barberUnavailable', NO_SHOW_TOO_EARLY: 'noShowTooEarly', INVALID_TRANSITION: 'stateChanged', IDEMPOTENCY_CONFLICT: 'staffConflict', NETWORK_UNCERTAIN: 'staffUncertain', RATE_LIMITED: 'rateLimited' } as Record<string, TranslationKey>)[code] ?? 'backendUnavailable'
}
