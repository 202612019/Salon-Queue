import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { synchronizeSnapshot } from '../services/synchronization'

const realtime = vi.hoisted(() => {
  const events: Record<string, (payload: Record<string, unknown>) => void> = {}
  const state = { status: (_status: string) => { void _status }, events, removeChannel: vi.fn() }
  const channel = {
    on(type: string, _filter: unknown, callback: (payload: Record<string, unknown>) => void) { events[type] = callback; return this },
    subscribe(callback: (status: string) => void) { state.status = callback; return this },
  }
  return { ...state, channel, setStatus: (status: string) => state.status(status) }
})
vi.mock('../lib/supabase', () => ({ getSupabaseClient: () => ({ channel: () => realtime.channel, removeChannel: realtime.removeChannel }) }))
const flush = async () => { await Promise.resolve(); await Promise.resolve() }
let stop: (() => void) | undefined
beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
})
afterEach(() => { stop?.(); stop = undefined })

describe('authorized snapshot reconciliation', () => {
  it('refetches writes missed between WebSocket subscription and Postgres listener readiness', async () => {
    const load = vi.fn().mockResolvedValueOnce({ version: 1 }).mockResolvedValueOnce({ version: 1 }).mockResolvedValueOnce({ version: 2 })
    const state = vi.fn()
    stop = synchronizeSnapshot(load, state)
    await flush()
    realtime.setStatus('SUBSCRIBED')
    await flush()
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
})
