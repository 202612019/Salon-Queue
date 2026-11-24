import { useEffect, useRef, useState } from 'react'
import { Maximize2, Scissors, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { useLocale } from '../../i18n/context'
import { formatSalonClock, formatSalonDate } from '../../lib/format'
import { classes } from '../../lib/classes'
import { barbers as previewBarbers, waitingEntries as previewWaitingEntries } from '../../services/preview-data'
import { getPublicSalon } from '../../services/backend'
import { useSnapshot } from '../../hooks/useSnapshot'
import { Brand } from '../../components/shared/Brand'
import { LanguageToggle } from '../../components/shared/LanguageToggle'
import { OfflineNotice, PreviewBanner } from '../../components/shared/PreviewBanner'
import { Avatar, Badge, Button, LinkButton } from '../../components/ui'

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.05)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.5)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.18)
    gain2.gain.setValueAtTime(0, now + 0.18)
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.23)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.18)
    osc2.stop(now + 0.9)
  } catch {
    // Graceful fallback if audio context cannot start or is blocked
  }
}

export function DisplayPage() {
  const { t, locale } = useLocale()
  const snapshot = useSnapshot(getPublicSalon, 'public-display')
  const data = snapshot.data
  const [now, setNow] = useState(() => new Date())
  const [fullscreenError, setFullscreenError] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [newlyCalled, setNewlyCalled] = useState<{ token: string; barberName: string } | null>(null)

  const prevTokensRef = useRef<Map<string, string>>(new Map())
  const isFirstLoadRef = useRef(true)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!data?.barbers) return
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false
      const initialMap = new Map<string, string>()
      for (const barber of data.barbers) {
        if (barber.status === 'called' && barber.token) {
          initialMap.set(barber.id, barber.token)
        }
      }
      prevTokensRef.current = initialMap
      return
    }

    const currentMap = new Map<string, string>()
    let detectedNew: { token: string; barberName: string } | null = null

    for (const barber of data.barbers) {
      if (barber.status === 'called' && barber.token) {
        currentMap.set(barber.id, barber.token)
        const prev = prevTokensRef.current.get(barber.id)
        if (prev !== barber.token) {
          detectedNew = { token: barber.token, barberName: barber.display_name }
        }
      }
    }

    prevTokensRef.current = currentMap

    if (detectedNew) {
      setNewlyCalled(detectedNew)
      if (soundEnabled) playChime()
      const timer = window.setTimeout(() => {
        setNewlyCalled(null)
      }, 5000)
      return () => window.clearTimeout(timer)
    }
  }, [data, soundEnabled])

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen()
      setFullscreenError(false)
    } catch {
      setFullscreenError(true)
    }
  }

  const displayBarbers = data ? data.barbers.map(b => ({
    id: b.id,
    name: b.display_name,
    initials: b.display_name.slice(0, 2).toUpperCase(),
    token: b.token,
    status: b.status,
    on_duty: b.on_duty,
    on_break: b.on_break,
    state: !b.on_duty ? ('offDuty' as const) : b.on_break ? ('onBreak' as const) : b.status === 'called' ? ('called' as const) : b.status === 'in_chair' ? ('inChair' as const) : ('available' as const),
  })) : previewBarbers.map(b => ({
    id: b.name,
    name: b.name,
    initials: b.initials,
    token: b.token,
    status: b.state === 'called' ? ('called' as const) : null,
    on_duty: true,
    on_break: b.state === 'onBreak',
    state: b.state,
  }))

  const displayNext = data ? data.next_tokens.slice(0, 5) : previewWaitingEntries.slice(0, 5).map((entry, i) => ({
    token: entry.token,
    estimate: { minutes: [29, 57, 66, 105, 96][i], state: 'approximate' as const, position: i + 1, position_kind: 'global' as const }
  }))

  return (
    <div className="display-page">
      <a className="skip-link" href="#main-content">{t('skip')}</a>
      <header className="display-header">
        <div>
          <Brand />
          <p>{data?.salon_name ?? t('salonName')}</p>
        </div>
        <div className="display-clock" aria-label={t('clockLabel')}>
          <strong className="tabular-nums">{formatSalonClock(now, locale)} IST</strong>
          <span>{formatSalonDate(now, locale)}</span>
        </div>
        <LanguageToggle />
      </header>

      <OfflineNotice />
      {!data && <PreviewBanner compact />}

      <main id="main-content" tabIndex={-1}>
        {newlyCalled && (
          <aside className="display-announcement" role="alert" aria-live="polite">
            <Sparkles size={24} aria-hidden="true" />
            <span>{t('proceedTo', { token: newlyCalled.token, barber: newlyCalled.barberName })}</span>
          </aside>
        )}

        <div className="display-title">
          <div>
            <p>{t('tvEyebrow')}</p>
            <h1>{t('nowServing')}</h1>
          </div>
          <span className="display-label">
            <Scissors size={22} aria-hidden="true" />
            {t('publicDisplay')}
          </span>
        </div>

        <section className="display-barbers" aria-label={t('nowServing')}>
          {displayBarbers.map(barber => {
            const isCalled = barber.status === 'called' || newlyCalled?.token === barber.token
            return (
              <article
                key={barber.id}
                className={classes('display-barber', isCalled && 'display-barber-called')}
              >
                <div className="display-barber-top">
                  <Avatar initials={barber.initials} size="large" />
                  <div>
                    <h2>{barber.name}</h2>
                    <Badge state={barber.state} />
                  </div>
                </div>
                <div className="display-token tabular-nums">{barber.token ?? '—'}</div>
                <p>
                  {barber.token
                    ? t(barber.status === 'called' ? 'called' : 'inChair')
                    : !barber.on_duty
                    ? t('offDuty')
                    : barber.on_break
                    ? t('takingBreak')
                    : t('available')}
                </p>
              </article>
            )
          })}
        </section>

        <section className="display-next">
          <div className="display-next-heading">
            <h2>{t('upNext')}</h2>
            <p>{t('upNextBody')}</p>
          </div>
          {displayNext.length > 0 ? (
            <div className="display-next-grid">
              {displayNext.map(item => (
                <div key={item.token}>
                  <strong className="tabular-nums">{item.token}</strong>
                  <span>
                    {item.estimate?.minutes != null
                      ? t('minutesCount', { count: item.estimate.minutes })
                      : t('approximate')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="display-empty-next">{t('emptyQueue')}</p>
          )}
        </section>
      </main>

      <footer className="display-footer">
        <p>{t('noCustomerDetails')}</p>
        <div>
          <Button
            variant="quiet"
            icon={soundEnabled ? Volume2 : VolumeX}
            onClick={() => {
              if (!soundEnabled) playChime()
              setSoundEnabled(!soundEnabled)
            }}
          >
            {t(soundEnabled ? 'soundOn' : 'enableSound')}
          </Button>
          <Button variant="quiet" icon={Maximize2} onClick={enterFullscreen}>
            {t('fullscreen')}
          </Button>
          <LinkButton variant="quiet" to="/">
            {t('home')}
          </LinkButton>
        </div>
        {fullscreenError && <p role="status">{t('fullscreenUnavailable')}</p>}
      </footer>
    </div>
  )
}
