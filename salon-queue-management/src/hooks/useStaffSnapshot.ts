import { useCallback, useEffect } from 'react'
import { useStaff } from '../features/auth/context'
import { staffOperation } from '../services/backend'
import { useSnapshot } from './useSnapshot'
export function useStaffSnapshot<T>() {
  const { profile, generation, invalidate } = useStaff()
  const load = useCallback((signal: AbortSignal) => staffOperation<T>('snapshot', {}, signal), [])
  const snapshot = useSnapshot(load, `${profile?.user_id}:${profile?.role}:${profile?.barber_id}:${generation}`, !!profile)
  useEffect(() => { if (snapshot.error === 'AUTH_REQUIRED' || snapshot.error === 'FORBIDDEN') invalidate() }, [snapshot.error, invalidate])
  return snapshot
}
