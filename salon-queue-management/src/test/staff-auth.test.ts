import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadStaffProfile, observeStaff, signInStaff } from '../services/staff-auth'
import type { Session } from '@supabase/supabase-js'
const auth = vi.hoisted(() => ({ rpc: vi.fn(), getUser: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), callback: (_event: string, _session: unknown) => { void _event; void _session }, unsubscribe: vi.fn() }))
vi.mock('../lib/supabase', () => ({ getSupabaseClient: () => ({ rpc: auth.rpc, auth: { getUser: auth.getUser, signInWithPassword: auth.signIn, signOut: auth.signOut, onAuthStateChange: (callback: typeof auth.callback) => { auth.callback = callback; return { data: { subscription: { unsubscribe: auth.unsubscribe } } } } } }) }))
beforeEach(() => { vi.clearAllMocks(); auth.getUser.mockResolvedValue({ error: null }); auth.signIn.mockResolvedValue({ error: null }); auth.signOut.mockResolvedValue({ error: null }) })
describe('real staff auth adapter with controlled SDK boundary', () => {
  it('revalidates a refreshed session without replaying any staff mutation', async () => {
    vi.useFakeTimers()
    auth.rpc.mockResolvedValue({ data: { user_id: 'fictional', role: 'owner', barber_id: null }, error: null })
    const updates = vi.fn(), stop = observeStaff(updates)
    const session = { user: { id: 'fictional' }, access_token: 'unit-only' } as Session
    auth.callback('SIGNED_IN', session)
    await vi.advanceTimersByTimeAsync(1)
    expect(updates).toHaveBeenLastCalledWith(expect.objectContaining({ session, profile: expect.objectContaining({ role: 'owner' }), checking: false }))
    auth.callback('TOKEN_REFRESHED', session)
    expect(updates).toHaveBeenLastCalledWith(expect.objectContaining({ session: null, profile: null, checking: true }))
    await vi.advanceTimersByTimeAsync(1)
    expect(updates).toHaveBeenLastCalledWith(expect.objectContaining({ session, profile: expect.objectContaining({ role: 'owner' }), checking: false }))
    expect(auth.rpc.mock.calls.every(([name]) => name === 'salonq_staff_profile')).toBe(true)
    stop(); vi.useRealTimers()
  })
  it('obtains barber route linkage from protected data, not editable metadata or a URL', async () => {
    auth.rpc.mockResolvedValueOnce({ data: { user_id: 'fictional', role: 'barber', barber_id: 'barber-1' }, error: null }).mockResolvedValueOnce({ data: { barber: { id: 'barber-1', slug: 'ravi' } }, error: null })
    expect(await loadStaffProfile()).toEqual({ user_id: 'fictional', role: 'barber', barber_id: 'barber-1', barber_slug: 'ravi' })
  })
  it('rejects an inconsistent barber identity without returning a workspace', async () => {
    auth.rpc.mockResolvedValueOnce({ data: { user_id: 'fictional', role: 'barber', barber_id: 'barber-1' }, error: null }).mockResolvedValueOnce({ data: { barber: { id: 'barber-2', slug: 'amit' } }, error: null })
    await expect(loadStaffProfile()).rejects.toThrow('FORBIDDEN')
  })
  it('signs out a valid Auth user without an enabled protected staff profile', async () => {
    auth.rpc.mockResolvedValue({ data: null, error: { message: 'FORBIDDEN' } })
    await expect(signInStaff('fictional@salonq.example', 'unit-only')).rejects.toThrow('FORBIDDEN')
    expect(auth.signOut).toHaveBeenCalled()
  })
  it('clears protected state before asynchronously revalidating a session and discards results after sign-out', async () => {
    vi.useFakeTimers()
    let resolve: (value: unknown) => void = () => {}
    auth.rpc.mockReturnValue(new Promise(done => { resolve = done }))
    const updates = vi.fn(), stop = observeStaff(updates)
    auth.callback('SIGNED_IN', { user: { id: 'fictional' } } as Session)
    expect(updates).toHaveBeenLastCalledWith(expect.objectContaining({ session: null, profile: null, checking: true }))
    await vi.advanceTimersByTimeAsync(1)
    auth.callback('SIGNED_OUT', null)
    resolve({ data: { user_id: 'fictional', role: 'owner', barber_id: null }, error: null })
    await Promise.resolve(); await Promise.resolve()
    expect(updates).toHaveBeenLastCalledWith(expect.objectContaining({ session: null, profile: null, checking: false }))
    stop(); expect(auth.unsubscribe).toHaveBeenCalledTimes(1); vi.useRealTimers()
  })
  it('treats failed server session verification as expired without loading a private profile', async () => {
    vi.useFakeTimers(); auth.getUser.mockResolvedValue({ error: { message: 'expired' } })
    const updates = vi.fn(), stop = observeStaff(updates)
    auth.callback('TOKEN_REFRESHED', { user: { id: 'fictional' } } as Session)
    await vi.advanceTimersByTimeAsync(1)
    expect(updates).toHaveBeenLastCalledWith(expect.objectContaining({ session: null, profile: null, error: 'AUTH_REQUIRED' }))
    expect(auth.rpc).not.toHaveBeenCalled(); stop(); vi.useRealTimers()
  })
})
