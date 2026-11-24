import { getSupabaseClient } from '../lib/supabase'

export type SyncState<T> = { data: T | null; connection: 'connecting' | 'live' | 'stale'; lastUpdated: number | null; error: string | null }
type SignalListener = { change: () => void; status: (status: 'ready' | 'connecting' | 'error') => void }
type SignalBus = { listeners: Set<SignalListener>; ready: boolean; channel: ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null }
let sharedBus: SignalBus | null = null

// One sanitized subscription per browser client; snapshot loaders authorize their own data.
function subscribeSignal(listener: SignalListener) {
  if (!sharedBus) {
    const bus: SignalBus = { listeners: new Set(), ready: false, channel: null }
    sharedBus = bus
    const status = (value: 'ready' | 'connecting' | 'error') => {
      bus.ready = value === 'ready'
      for (const item of bus.listeners) item.status(value)
    }
    bus.channel = getSupabaseClient().channel(`salonq-signal-${crypto.randomUUID()}`)
      .on('system', {}, payload => {
        if (payload.extension === 'postgres_changes') status(payload.status === 'ok' ? 'ready' : 'error')
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'salonq_changes' }, () => { for (const item of bus.listeners) item.change() })
      .subscribe(value => {
        if (value === 'SUBSCRIBED') { for (const item of bus.listeners) item.change() }
        else if (value === 'CHANNEL_ERROR' || value === 'TIMED_OUT' || value === 'CLOSED') status('error')
      })
  }
  const bus = sharedBus
  bus.listeners.add(listener)
  listener.status(bus.ready ? 'ready' : 'connecting')
  return () => {
    bus.listeners.delete(listener)
    if (!bus.listeners.size) {
      if (sharedBus === bus) sharedBus = null
      if (bus.channel) void getSupabaseClient().removeChannel(bus.channel)
    }
  }
}

export function synchronizeSnapshot<T>(load: (signal: AbortSignal) => Promise<T>, onState: (state: SyncState<T>) => void) {
  let stopped = false; let revision = 0; let controller: AbortController | null = null
  let debounce: ReturnType<typeof setTimeout> | undefined; let ready = false; let inFlight = false
  let state: SyncState<T> = { data: null, connection: 'connecting', lastUpdated: null, error: null }
  const publish = (patch: Partial<SyncState<T>>) => { state = { ...state, ...patch }; if (!stopped) onState(state) }
  const refetch = async () => {
    if (stopped || state.error === 'STATUS_UNAVAILABLE') return
    if (!navigator.onLine) { publish({ connection: 'stale' }); return }
    const current = ++revision
    controller?.abort(); controller = new AbortController(); inFlight = true
    try {
      const data = await load(controller.signal)
      if (!stopped && current === revision) publish({ data, connection: ready ? 'live' : 'connecting', lastUpdated: Date.now(), error: null })
    } catch (error) {
      if (!stopped && current === revision) {
        const code = error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : 'BACKEND_UNAVAILABLE'
        publish({ connection: 'stale', error: code, ...(code === 'STATUS_UNAVAILABLE' ? { data: null } : {}) })
      }
    } finally { if (current === revision) inFlight = false }
  }
  const invalidate = () => { clearTimeout(debounce); debounce = setTimeout(() => void refetch(), 75) }
  const unsubscribe = subscribeSignal({ change: invalidate, status: status => {
    ready = status === 'ready'
    if (status === 'ready') void refetch()
    else if (status === 'error') publish({ connection: 'stale' })
  } })
  const online = () => { publish({ connection: 'connecting' }); void refetch() }
  const offline = () => { revision++; controller?.abort(); inFlight = false; publish({ connection: 'stale' }) }
  const foreground = () => { if (document.visibilityState === 'visible') { publish({ connection: 'connecting' }); void refetch() } }
  window.addEventListener('online', online); window.addEventListener('offline', offline)
  document.addEventListener('visibilitychange', foreground)
  const timer = setInterval(() => {
    if (document.visibilityState !== 'visible') return
    if (state.lastUpdated && Date.now() - state.lastUpdated > 8000) publish({ connection: 'stale' })
    if (!inFlight) void refetch()
  }, 4000)
  void refetch()
  return () => {
    stopped = true; revision++; controller?.abort(); clearTimeout(debounce); clearInterval(timer); unsubscribe()
    window.removeEventListener('online', online); window.removeEventListener('offline', offline)
    document.removeEventListener('visibilitychange', foreground)
  }
}
