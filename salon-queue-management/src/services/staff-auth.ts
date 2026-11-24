import type { Session } from '@supabase/supabase-js'
import type { StaffProfile } from '../domain/database'
import { getSupabaseClient } from '../lib/supabase'
import { BackendError } from './backend'

function profileFrom(value: unknown): StaffProfile {
  if (!value || typeof value !== 'object') throw new BackendError('FORBIDDEN')
  const profile = value as Partial<StaffProfile>
  if (typeof profile.user_id !== 'string' || !['owner', 'receptionist', 'barber'].includes(profile.role ?? '') || (profile.role === 'barber' && typeof profile.barber_id !== 'string')) throw new BackendError('FORBIDDEN')
  return profile as StaffProfile
}
export async function loadStaffProfile(): Promise<StaffProfile> {
  const { data, error } = await getSupabaseClient().rpc('salonq_staff_profile')
  if (error) throw new BackendError('FORBIDDEN')
  const profile = profileFrom(data)
  if (profile.role !== 'barber') return { ...profile, barber_slug: null }
  const snapshot = await getSupabaseClient().rpc('salonq_staff_command', { action: 'snapshot' })
  const barber = snapshot.data && typeof snapshot.data === 'object' && !Array.isArray(snapshot.data) ? snapshot.data.barber : null
  if (snapshot.error || !barber || typeof barber !== 'object' || Array.isArray(barber) || barber.id !== profile.barber_id || typeof barber.slug !== 'string' || !/^[a-z][a-z0-9-]{1,39}$/.test(barber.slug)) throw new BackendError('FORBIDDEN')
  return { ...profile, barber_slug: barber.slug }
}
export async function signInStaff(email: string, password: string) {
  const client = getSupabaseClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new BackendError('AUTH_FAILED')
  try { return await loadStaffProfile() } catch { await client.auth.signOut(); throw new BackendError('FORBIDDEN') }
}
export async function signOutStaff() {
  const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' })
  if (error) throw new BackendError('AUTH_FAILED')
}

export type StaffState = { session: Session | null; profile: StaffProfile | null; error: string | null; checking?: boolean }
// Do not do awaited Supabase work inside onAuthStateChange's lock. Also discard stale loads.
export function observeStaff(onState: (state: StaffState) => void) {
  const client = getSupabaseClient()
  let generation = 0; let stopped = false
  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    if (stopped) return
    const current = ++generation
    onState({ session: null, profile: null, error: null, checking: !!session }) // Protected consumers clear caches first.
    if (!session || stopped) return
    window.setTimeout(() => {
      void (async () => {
        try {
          const { error } = await client.auth.getUser()
          if (error) throw new BackendError('AUTH_REQUIRED')
          const profile = await loadStaffProfile()
          if (!stopped && current === generation) onState({ session, profile, error: null, checking: false })
        } catch {
          if (!stopped && current === generation) onState({ session: null, profile: null, error: 'AUTH_REQUIRED', checking: false })
        }
      })()
    }, 0)
  })
  return () => { stopped = true; generation++; subscription.unsubscribe() }
}
export function staffHome(profile: StaffProfile) {
  return profile.role === 'owner' ? '/admin' : profile.role === 'receptionist' ? '/reception' : profile.barber_slug ? `/barber/${profile.barber_slug}` : '/login'
}
