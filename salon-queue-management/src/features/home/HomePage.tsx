import { BellRing, Clock3, Scissors, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { Link } from 'react-router'
import { useCallback, useEffect } from 'react'
import { useLocale } from '../../i18n/context'
import { Avatar, Badge, Button, Card, LinkButton, Metric, SectionHeading } from '../../components/ui'
import { ConnectionNotice, EstimateText } from '../../components/shared/CustomerFeedback'
import { ServiceCard } from '../../components/shared/ServiceCard'
import { useSalon } from '../customer/context'
import { admissionReasonKey, publicBarberState } from '../../domain/customer'
import { forgetCustomerAccess, readCustomerAccess, readPendingIdentity } from '../../services/customer-access'
import { getCustomerStatus } from '../../services/backend'
import { useSnapshot } from '../../hooks/useSnapshot'

export function HomePage() {
  const { t } = useLocale()
  const salon = useSalon(), data = salon.data
  const access = readCustomerAccess()
  const locator = access?.locator ?? '', capability = access?.capability ?? ''
  const loadResume = useCallback((signal: AbortSignal) => getCustomerStatus({ locator, capability }, signal), [locator, capability])
  const resume = useSnapshot(loadResume, locator, !!access)
  useEffect(() => { if (resume.error === 'STATUS_UNAVAILABLE') forgetCustomerAccess() }, [resume.error])
  const canJoin = salon.connection === 'live' && !!data?.admission.online
  const localTime = data?.server_time ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(data.server_time)) : ''
  const open = !!data && localTime >= data.opening_time.slice(0, 5) && localTime < data.closing_time.slice(0, 5)
  return <>
    <ConnectionNotice state={salon} refresh={salon.refresh} />
    <section className="home-hero">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-line" />{data?.salon_name ?? t('welcome')}</p>
        {data && <p className="hero-availability"><span className="availability-dot" />{t(open ? 'salonOpen' : 'salonClosed')} · {t('peopleWaiting')}: <strong className="tabular-nums">{data.waiting_count}</strong></p>}
        <h1 className="hero-title">{t('heroFirst')}<br /><em>{t('heroSecond')}</em></h1>
        <p className="hero-description">{t('heroBody')}</p>
        <div className="hero-actions">{canJoin ? <LinkButton to="/join" icon={Scissors}>{t('join')}</LinkButton> : <Button icon={Scissors} disabled>{t('join')}</Button>}{resume.data && resume.error !== 'STATUS_UNAVAILABLE' ? <LinkButton to={`/status/${locator}`} variant="quiet">{t('resumeStatus')}</LinkButton> : <LinkButton to="/status/preview" variant="quiet">{t('viewStatus')}</LinkButton>}</div>
        <p className="hero-assurance"><ShieldCheck size={17} aria-hidden="true" />{t('noAccount')}</p>
        {data && !data.admission.online && <p className="inline-note">{t(admissionReasonKey(data.admission.reason))}</p>}
        {readPendingIdentity() && <Link className="text-link" to="/join">{t('checkPrevious')}</Link>}
      </div>
      <div className="hero-pass-wrap"><div className="pass-frame" aria-hidden="true" /><Card className="queue-pass"><div className="pass-top"><span className="eyebrow">{t('yourQueuePass')}</span><span className="sample-label">{t('sample')}</span></div><div className="pass-salon"><Sparkles size={18} aria-hidden="true" />{data?.salon_name ?? t('appName')}</div><div className="pass-token tabular-nums">S-014</div><p className="pass-caption">{t('passCaption')}</p><div className="pass-perforation" /><p className="field-hint">{t('illustrativePass')}</p><div className="pass-state"><Badge state="waiting" /><Link to="/status/preview">{t('openPreview')}</Link></div></Card><p className="pass-footnote">{t('passFooter')}</p></div>
    </section>
    {!data ? <Card className="form-card" role="status"><p>{t(salon.error ? 'backendUnavailable' : 'loadingSalon')}</p>{salon.error && <Button onClick={salon.refresh}>{t('retry')}</Button>}</Card> : <>
      <Card className="queue-overview"><div className="queue-overview-title"><p className="eyebrow">{data.salon_name}</p><h2>{t('queueAtGlance')}</h2><p>{t('queueAtGlanceBody')}</p></div><Metric label={t('peopleWaiting')} value={data.waiting_count} icon={UsersRound} /><Metric label={t('estimatedWait')} value={<EstimateText estimate={data.estimate} />} hint={t('estimateNote')} icon={Clock3} /><div className="opening-summary"><strong>{data.opening_time.slice(0, 5)}–{data.closing_time.slice(0, 5)} IST</strong><p>{t('onDutyCount', { count: data.barbers.filter(b => b.on_duty).length })}</p><p>{t('workingCount', { count: data.barbers.filter(b => b.on_duty && !b.on_break).length })}</p><p>{t(admissionReasonKey(data.admission.reason))}</p></div></Card>
      <section className="home-section"><SectionHeading title={t('featuredServices')} /><div className="featured-services">{data.services.length ? data.services.map(service => <ServiceCard key={service.id} service={service} />) : <p>{t('emptyCatalog')}</p>}</div></section>
      <section className="home-section"><SectionHeading title={t('meetBarbers')} description={t('meetBarbersBody')} /><div className="barber-grid">{data.barbers.length ? data.barbers.map(barber => <article className="barber-card" key={barber.id}><div className="barber-identity"><Avatar initials={barber.display_name.slice(0, 2).toUpperCase()} /><h3>{barber.display_name}</h3></div><Badge state={publicBarberState(barber)} /></article>) : <p>{t('emptyBarbers')}</p>}</div></section>
    </>}
    <section className="home-section how-section"><SectionHeading title={t('howItWorks')} /><div className="how-grid">{[
      { icon: Scissors, title: 'stepOne', body: 'stepOneBody' }, { icon: Clock3, title: 'stepTwo', body: 'stepTwoBody' }, { icon: BellRing, title: 'stepThree', body: 'stepThreeBody' },
    ].map(({ icon: Icon, title, body }, index) => <article key={title}><span className="journey-step">0{index + 1}</span><Icon size={24} strokeWidth={1.4} aria-hidden="true" /><h3>{t(title as 'stepOne' | 'stepTwo' | 'stepThree')}</h3><p>{t(body as 'stepOneBody' | 'stepTwoBody' | 'stepThreeBody')}</p></article>)}</div></section>
  </>
}
