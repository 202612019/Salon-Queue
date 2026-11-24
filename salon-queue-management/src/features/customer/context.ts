import { createContext, useContext } from 'react'
import type { PublicSalon } from '../../domain/database'
import type { SyncState } from '../../services/synchronization'
export const SalonContext = createContext<(SyncState<PublicSalon> & { refresh: () => void }) | null>(null)
export function useSalon() {
  const value = useContext(SalonContext)
  if (!value) throw new Error('Customer salon provider is required')
  return value
}
