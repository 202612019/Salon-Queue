import type { ReactNode } from 'react'
import { useSnapshot } from '../../hooks/useSnapshot'
import { getPublicSalon } from '../../services/backend'
import { SalonContext } from './context'
export function SalonProvider({ children }: { children: ReactNode }) {
  const salon = useSnapshot(getPublicSalon, 'public-salon')
  return <SalonContext.Provider value={salon}>{children}</SalonContext.Provider>
}
