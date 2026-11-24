import { useEffect, useState } from 'react'
// Time display comes from a server offset; authorization is still checked by PostgreSQL.
export function useSalonClock(serverTime: string | undefined, verifiedAt: number | null) {
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => { const interval = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(interval) }, [])
  return serverTime && verifiedAt ? Date.parse(serverTime) + Math.max(0, tick - verifiedAt) : null
}
