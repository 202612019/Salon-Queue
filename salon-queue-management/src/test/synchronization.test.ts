import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { synchronizeSnapshot } from '../services/synchronization'

const realtime = vi.hoisted(() => {
  const events: Record<string, (payload: Record<string, unknown>) => void> = {}
  const state = { status: (_status: string) => { void _status }, events, removeChannel: vi.fn(), createChannel: vi.fn() }
  const channel = {
    on(type: string, _filter: unknown, callback: (payload: Record<string, unknown>) => void) { events[type] = callback; return this },
    subscribe(callback: (status: string) => void) { state.status = callback; return this },
  }
  return { ...state, channel, setStatus: (status: string) => state.status(status) }
})
vi.mock('../lib/supabase', () => ({ getSupabaseClient: () => ({ channel: () => { realtime.createChannel(); return realtime.channel }, removeChannel: realtime.removeChannel }) }))
const flush = async () => { await Promise.resolve(); await Promise.resolve() }
let stop: (() => void) | undefined
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
})
afterEach(() => { stop?.(); stop = undefined; vi.useRealTimers() })

describe('authorized snapshot reconciliation', () => {
  it('refetches writes missed between WebSocket subscription and Postgres listener readiness', async () => {
    const load = vi.fn().mockResolvedValueOnce({ version: 1 }).mockResolvedValueOnce({ version: 1 }).mockResolvedValueOnce({ version: 2 })
    const state = vi.fn()
    stop = synchronizeSnapshot(load, state)
    await flush()
    realtime.setStatus('SUBSCRIBED')
    await vi.advanceTimersByTimeAsync(80)
    realtime.events.system({ extension: 'postgres_changes', status: 'ok' })
    await flush()
    expect(load).toHaveBeenCalledTimes(3)
    expect(state).toHaveBeenLastCalledWith(expect.objectContaining({ data: { version: 2 }, connection: 'live' }))
  })
  it('marks database-listener errors stale while retaining the last authorized snapshot', async () => {
    const state = vi.fn()
    stop = synchronizeSnapshot(vi.fn().mockResolvedValue({ version: 1 }), state)
    await flush()
    realtime.events.system({ extension: 'postgres_changes', status: 'error' })
    expect(state).toHaveBeenLastCalledWith(expect.objectContaining({ data: { version: 1 }, connection: 'stale' }))
  })
  it('discards older reads and prevents delivery after a context is disposed', async () => {
    let completeOld: (value: { version: number }) => void = () => {}
    const old = new Promise<{ version: number }>(resolve => { completeOld = resolve })
    const load = vi.fn().mockReturnValueOnce(old).mockResolvedValueOnce({ version: 2 })
    const state = vi.fn()
    stop = synchronizeSnapshot(load, state)
    realtime.events.system({ extension: 'postgres_changes', status: 'ok' })
    await flush()
    completeOld({ version: 1 })
    await flush()
    expect(state).toHaveBeenCalledTimes(1)
    expect(state).toHaveBeenLastCalledWith(expect.objectContaining({ data: { version: 2 } }))
    stop(); stop = undefined
    realtime.events.system({ extension: 'postgres_changes', status: 'ok' })
    await flush()
    expect(state).toHaveBeenCalledTimes(1)
    expect(realtime.removeChannel).toHaveBeenCalledTimes(1)
  })
  it('shares the sanitized subscription across public and private loaders until the last consumer leaves', async () => {
    const first = synchronizeSnapshot(vi.fn().mockResolvedValue({ public: true }), vi.fn())
    const second = synchronizeSnapshot(vi.fn().mockResolvedValue({ private: true }), vi.fn())
    await flush()
    expect(realtime.createChannel).toHaveBeenCalledTimes(1)
    first(); expect(realtime.removeChannel).not.toHaveBeenCalled()
    second(); expect(realtime.removeChannel).toHaveBeenCalledTimes(1)
  })
  it('does not claim Live before listener readiness and refetches after offline/foreground recovery', async () => {
    const load = vi.fn().mockResolvedValue({ version: 1 }), state = vi.fn()
    stop = synchronizeSnapshot(load, state)
    await flush()
    expect(state).toHaveBeenLastCalledWith(expect.objectContaining({ connection: 'connecting' }))
    realtime.events.system({ extension: 'postgres_changes', status: 'ok' }); await flush()
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    window.dispatchEvent(new Event('offline'))
    expect(state).toHaveBeenLastCalledWith(expect.objectContaining({ connection: 'stale' }))
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    window.dispatchEvent(new Event('online')); await flush()
    expect(state).toHaveBeenLastCalledWith(expect.objectContaining({ connection: 'live' }))
    document.dispatchEvent(new Event('visibilitychange')); await flush()
    expect(load.mock.calls.length).toBeGreaterThanOrEqual(4)
  })
  it('debounces duplicate invalidations and retains the foreground polling fallback', async () => {
    const load = vi.fn().mockResolvedValue({ version: 1 })
    stop = synchronizeSnapshot(load, vi.fn()); await flush()
    realtime.events.postgres_changes({}); realtime.events.postgres_changes({}); realtime.events.postgres_changes({})
    await vi.advanceTimersByTimeAsync(80)
    expect(load).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(4000)
    expect(load).toHaveBeenCalledTimes(3)
  })
  it('clears private data and stops automatic retries after definitive access expiry', async () => {
    const load = vi.fn().mockResolvedValueOnce({ token: 'fictional' }).mockRejectedValueOnce(new Error('STATUS_UNAVAILABLE')), state = vi.fn()
    stop = synchronizeSnapshot(load, state); await flush()
    realtime.events.system({ extension: 'postgres_changes', status: 'ok' }); await flush()
    expect(state).toHaveBeenLastCalledWith(expect.objectContaining({ data: null, error: 'STATUS_UNAVAILABLE' }))
    await vi.advanceTimersByTimeAsync(8000)
    expect(load).toHaveBeenCalledTimes(2)
  })
})
