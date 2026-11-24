import { createContext, useContext } from 'react'
import type { StaffState } from '../../services/staff-auth'
export type StaffContextValue = StaffState & { generation: number; invalidate: () => void; signOut: () => Promise<void> }
export const StaffContext = createContext<StaffContextValue | null>(null)
export function useStaff() {
  const context = useContext(StaffContext)
  if (!context) throw new Error('Staff session provider is required')
  return context
}
