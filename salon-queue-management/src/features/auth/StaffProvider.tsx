import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { observeStaff, signOutStaff, type StaffState } from '../../services/staff-auth'
import { StaffContext } from './context'
export function StaffProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StaffState & { generation: number }>({ session: null, profile: null, error: null, checking: true, generation: 0 })
  const invalidate = useCallback(() => setState(old => ({ session: null, profile: null, error: 'AUTH_REQUIRED', checking: false, generation: old.generation + 1 })), [])
  useEffect(() => {
    try { return observeStaff(value => setState(old => ({ ...value, generation: old.generation + 1 }))) }
    catch {
      let disposed = false
      queueMicrotask(() => { if (!disposed) invalidate() })
      return () => { disposed = true }
    }
  }, [invalidate])
  const signOut = useCallback(async () => { invalidate(); await signOutStaff() }, [invalidate])
  return <StaffContext.Provider value={{ ...state, invalidate, signOut }}>{children}</StaffContext.Provider>
}
