import { useCallback, useEffect, useState } from 'react'
import { synchronizeSnapshot, type SyncState } from '../services/synchronization'

const initial = <T,>(): SyncState<T> => ({ data: null, connection: 'connecting', lastUpdated: null, error: null })
export function useSnapshot<T>(load: (signal: AbortSignal) => Promise<T>, key: string, enabled = true) {
  const [value, setValue] = useState<{ key: string; state: SyncState<T> }>(() => ({ key, state: initial<T>() }))
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!enabled) return
    try { return synchronizeSnapshot(load, state => setValue({ key, state })) }
    catch {
      let disposed = false
      queueMicrotask(() => { if (!disposed) setValue({ key, state: { ...initial<T>(), connection: 'stale', error: 'BACKEND_NOT_CONFIGURED' } }) })
      return () => { disposed = true }
    }
  }, [load, key, enabled, revision])
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  return { ...(value.key === key && enabled ? value.state : initial<T>()), refresh }
}
