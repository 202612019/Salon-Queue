import { useEffect, useState } from 'react'
import { Maximize2, Scissors, VolumeX } from 'lucide-react'
import { useLocale } from '../../i18n/context'
import { formatSalonClock, formatSalonDate } from '../../lib/format'
import { barbers, waitingEntries } from '../../services/preview-data'
import { Brand } from '../../components/shared/Brand'
import { LanguageToggle } from '../../components/shared/LanguageToggle'
import { OfflineNotice, PreviewBanner } from '../../components/shared/PreviewBanner'
import { Avatar, Badge, Button, LinkButton } from '../../components/ui'

export function DisplayPage() {
  const { t, locale } = useLocale()
  const [now, setNow] = useState(() => new Date())
  const [fullscreenError, setFullscreenError] = useState(false)
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 15000); return () => window.clearInterval(timer) }, [])
  async function enterFullscreen() {
    try { await document.documentElement.requestFullscreen() } catch { setFullscreenError(true) }
  }
  return <div className="display-page"><a className="skip-link" href="#main-content">{t('skip')}</a><header className="display-header"><div><Brand /><p>{t('salonName')}</p></div><div className="display-clock" aria-label={t('clockLabel')}><strong className="tabular-nums">{formatSalonClock(now, locale)}</strong><span>{formatSalonDate(now, locale)}</span></div><LanguageToggle /></header><OfflineNotice /><PreviewBanner compact /><main id="main-content" tabIndex={-1}><div className="display-title"><div><p>{t('tvEyebrow')}</p><h1>{t('nowServing')}</h1></div><span className="display-label"><Scissors size={22} aria-hidden="true" />{t('publicDisplay')}</span></div><section className="display-barbers" aria-label={t('nowServing')}>{barbers.map(barber => <article key={barber.name} className={`display-barber${barber.state === 'called' ? ' display-barber-called' : ''}`}><div className="display-barber-top"><Avatar initials={barber.initials} size="large" /><div><h2>{barber.name}</h2><Badge state={barber.state} /></div></div><div className="display-token tabular-nums">{barber.token ?? '—'}</div><p>{barber.token ? t('token') : t('takingBreak')}</p></article>)}</section><section className="display-next"><div className="display-next-heading"><h2>{t('upNext')}</h2><p>{t('upNextBody')}</p></div><div className="display-next-grid">{waitingEntries.slice(0, 5).map((entry, i) => <div key={entry.token}><strong className="tabular-nums">{entry.token}</strong><span>{t('minutesCount', { count: [29, 57, 66, 105, 96][i] })}</span></div>)}</div></section></main><footer className="display-footer"><p>{t('noCustomerDetails')}</p><div><Button variant="quiet" icon={VolumeX} disabled>{t('notConnected')}</Button><Button variant="quiet" icon={Maximize2} onClick={enterFullscreen}>{t('fullscreen')}</Button><LinkButton variant="quiet" to="/">{t('home')}</LinkButton></div>{fullscreenError && <p role="status">{t('fullscreenUnavailable')}</p>}</footer></div>
}
