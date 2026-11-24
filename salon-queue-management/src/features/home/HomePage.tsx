import { BellRing, Check, Clock3, Scissors, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { Link } from 'react-router'
import { useLocale } from '../../i18n/context'
import { barbers, waitingEntries } from '../../services/preview-data'
import { BarberCard } from '../../components/shared/BarberCard'
import { Badge, Card, LinkButton, Metric, SectionHeading } from '../../components/ui'

export function HomePage() {
  const { t } = useLocale()
  return <>
    <section className="home-hero">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-line" />{t('welcome')}</p>
        <h1 className="hero-title">{t('heroFirst')}<br /><em>{t('heroSecond')}</em></h1>
        <p className="hero-description">{t('heroBody')}</p>
        <div className="hero-actions"><LinkButton to="/join" icon={Scissors}>{t('join')}</LinkButton><LinkButton to="/status/preview" variant="quiet">{t('viewStatus')}</LinkButton></div>
        <p className="hero-assurance"><ShieldCheck size={17} aria-hidden="true" />{t('noAccount')}</p>
      </div>
      <div className="hero-pass-wrap">
        <div className="pass-frame" aria-hidden="true" />
        <Card className="queue-pass">
          <div className="pass-top"><span className="eyebrow">{t('yourQueuePass')}</span><span className="sample-label">{t('sample')}</span></div>
          <div className="pass-salon"><Sparkles size={18} strokeWidth={1.5} aria-hidden="true" />{t('salonName')}</div>
          <div className="pass-token tabular-nums">S-014</div>
          <p className="pass-caption">{t('passCaption')}</p>
          <div className="pass-perforation" />
          <div className="pass-detail"><div><span>{t('globalPosition')}</span><strong className="tabular-nums">01</strong></div><div><span>{t('estimatedWait')}</span><strong>{t('minutesCount', { count: 29 })}</strong></div></div>
          <div className="pass-state"><Badge state="waiting" /><Link to="/status/preview">{t('myStatus')}</Link></div>
        </Card>
        <p className="pass-footnote">{t('passFooter')}</p>
      </div>
    </section>

    <Card className="queue-overview">
      <div className="queue-overview-title"><p className="eyebrow">{t('salonName')}</p><h2>{t('queueAtGlance')}</h2><p>{t('queueAtGlanceBody')}</p><span className="sample-label">{t('notLive')}</span></div>
      <Metric label={t('peopleWaiting')} value={waitingEntries.length.toString().padStart(2, '0')} icon={UsersRound} />
      <Metric label={t('estimatedWait')} value={t('minutesCount', { count: 119 })} hint={t('exampleEstimate')} icon={Clock3} />
      <div className="opening-summary"><span><Check size={16} aria-hidden="true" />{t('sampleOpen')}</span><strong>{t('hoursValue')}</strong><p>{t('sampleClosing')}</p></div>
    </Card>

    <section className="home-section"><SectionHeading title={t('meetBarbers')} description={t('meetBarbersBody')} action={<span className="sample-label">{t('sample')}</span>} /><div className="barber-grid">{barbers.map(barber => <BarberCard key={barber.name} barber={barber} />)}</div></section>
    <section className="home-section how-section"><SectionHeading title={t('howItWorks')} /><div className="how-grid">{[
      { icon: Scissors, title: 'stepOne', body: 'stepOneBody' },
      { icon: Clock3, title: 'stepTwo', body: 'stepTwoBody' },
      { icon: BellRing, title: 'stepThree', body: 'stepThreeBody' },
    ].map(({ icon: Icon, title, body }) => <article key={title}><Icon size={24} strokeWidth={1.4} aria-hidden="true" /><h3>{t(title as 'stepOne' | 'stepTwo' | 'stepThree')}</h3><p>{t(body as 'stepOneBody' | 'stepTwoBody' | 'stepThreeBody')}</p></article>)}</div></section>
  </>
}
