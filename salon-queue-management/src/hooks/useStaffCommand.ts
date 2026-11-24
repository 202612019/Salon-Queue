import { useRef, useState } from 'react'
import type { Json } from '../domain/database'
import { BackendError, staffOperation } from '../services/backend'
import { useStaff } from '../features/auth/context'
import { staffErrorKey } from '../domain/staff'
import type { TranslationKey } from '../i18n/dictionaries'
const storageKey = 'salonq.staff.pending.command'
type PendingCommand = { actor: string; action: string; payload: { [key: string]: Json | undefined } }
function readPending(actor: string): PendingCommand | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')
    return value?.actor === actor && ['call_next', 'start', 'done', 'cancel', 'no_show', 'set_duty'].includes(value.action) && /^[0-9a-f]{64}$/.test(value.payload?.request_key) ? value : null
  } catch { return null }
}
export function useStaffCommand(refresh: () => void, fresh: boolean) {
  const { profile, invalidate } = useStaff()
  const [pending, setPending] = useState<PendingCommand | null>(() => readPending(profile?.user_id ?? ''))
  const [busy, setBusy] = useState(false), [message, setMessage] = useState<TranslationKey | null>(null)
  const guard = useRef(false)
  async function send(command: PendingCommand): Promise<Record<string, Json> | null> {
    if (guard.current || !fresh || command.actor !== profile?.user_id) return null
    guard.current = true; setBusy(true); setMessage(null)
    try {
      const result = await staffOperation<Record<string, Json>>(command.action, command.payload)
      sessionStorage.removeItem(storageKey); setPending(null)
      setMessage(result.reason === 'NO_ELIGIBLE_CUSTOMER' ? 'noEligible' : command.action === 'call_next' ? 'callSuccess' : command.action === 'start' ? 'startSuccess' : command.action === 'done' ? 'doneSuccess' : 'staffActionSuccess')
      return result
    } catch (error) {
      const failure = error instanceof BackendError ? error : new BackendError('NETWORK_UNCERTAIN', true)
      if (!failure.uncertain) { sessionStorage.removeItem(storageKey); setPending(null) }
      setMessage(staffErrorKey(failure.code))
      if (failure.code === 'AUTH_REQUIRED') invalidate()
      return null
    } finally { guard.current = false; setBusy(false); refresh() }
  }
  async function run(action: string, payload: { [key: string]: Json | undefined }) {
    if (guard.current || pending || !fresh || !profile) return null
    const requestKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2, '0')).join('')
    const command = { actor: profile.user_id, action, payload: { ...payload, request_key: requestKey } }
    try { sessionStorage.setItem(storageKey, JSON.stringify(command)) }
    catch { setMessage('staffStorageError'); return null }
    setPending(command)
    return send(command)
  }
  return { run, busy, pending: !!pending, message, retry: () => pending ? send(pending) : Promise.resolve(null) }
}
