import { getSupabaseClient } from '../lib/supabase'

export type SyncState<T> = { data: T | null; connection: 'connecting' | 'live' | 'stale'; lastUpdated: number | null }

// Subscribe only to the sanitized signal; every snapshot loader must authorize its own data.
export function synchronizeSnapshot<T>(load: (signal: AbortSignal) => Promise<T>, onState: (state: SyncState<T>) => void) {
  let stopped = false; let revision = 0; let controller: AbortController | null = null
  let debounce: ReturnType<typeof setTimeout> | undefined
  let state: SyncState<T> = { data: null, connection: 'connecting', lastUpdated: null }
  const publish = (patch: Partial<SyncState<T>>) => { state = { ...state, ...patch }; if (!stopped) onState(state) }
  const refetch = async () => {
    if (stopped) return
    if (!navigator.onLine) { publish({ connection: 'stale' }); return }
    const current = ++revision
    controller?.abort(); controller = new AbortController()
    try {
      const data = await load(controller.signal)
      if (!stopped && current === revision) publish({ data, connection: 'live', lastUpdated: Date.now() })
    } catch { if (!stopped && current === revision) publish({ connection: 'stale' }) }
  }
  const invalidate = () => { clearTimeout(debounce); debounce = setTimeout(() => void refetch(), 75) }
  const channel = getSupabaseClient().channel(`salonq-signal-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'salonq_changes' }, invalidate)
    .subscribe(status => { if (status === 'SUBSCRIBED') void refetch(); else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') publish({ connection: 'stale' }) })
  const online = () => void refetch()
  const offline = () => { revision++; controller?.abort(); publish({ connection: 'stale' }) }
  const foreground = () => { if (document.visibilityState === 'visible') void refetch() }
  window.addEventListener('online', online); window.addEventListener('offline', offline)
  document.addEventListener('visibilitychange', foreground)
  const timer = setInterval(() => { if (document.visibilityState === 'visible') void refetch() }, 4000)
  void refetch()
  return () => {
    stopped = true; revision++; controller?.abort(); clearTimeout(debounce); clearInterval(timer)
    window.removeEventListener('online', online); window.removeEventListener('offline', offline)
    document.removeEventListener('visibilitychange', foreground)
    void getSupabaseClient().removeChannel(channel)
  }
}
