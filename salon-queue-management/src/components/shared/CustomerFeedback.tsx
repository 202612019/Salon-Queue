import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import type { Estimate } from '../../domain/database'
import { useLocale } from '../../i18n/context'
import { formatSalonClock } from '../../lib/format'
import { Button } from '../ui'
import type { SyncState } from '../../services/synchronization'
export function EstimateText({ estimate }: { estimate: Estimate | null | undefined }) {
  const { t } = useLocale()
  return <>{!estimate || estimate.state === 'unavailable' ? t('estimateUnavailable') : estimate.state === 'uncertain' ? t('estimateUncertain') : estimate.state === 'ready' ? t('readyEstimate') : t('minutesCount', { count: estimate.minutes ?? '—' })}</>
}
export function ConnectionNotice({ state, refresh }: { state: Pick<SyncState<unknown>, 'connection' | 'lastUpdated' | 'error'>; refresh: () => void }) {
  const { t, locale } = useLocale()
  return <div className={`connection-notice connection-${state.connection}`} role="status"><span>{state.connection === 'live' ? <Wifi size={16} aria-hidden="true" /> : <WifiOff size={16} aria-hidden="true" />}{t(state.connection === 'live' ? 'liveVerified' : state.connection === 'connecting' ? 'connectingData' : 'staleData')}</span>{state.lastUpdated && <small>{t('lastVerified', { time: formatSalonClock(new Date(state.lastUpdated), locale) })}</small>}{state.connection === 'stale' && <Button variant="quiet" icon={RefreshCw} onClick={refresh}>{t('retry')}</Button>}</div>
}
