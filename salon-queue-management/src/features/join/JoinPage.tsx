import { Check, Info, LockKeyhole, Scissors, UsersRound } from 'lucide-react'
import { useLocale } from '../../i18n/context'
import { services, barbers } from '../../services/preview-data'
import { formatPrice } from '../../lib/format'
import { Avatar, Button, Card, Field, PageIntro, SectionHeading } from '../../components/ui'
import { ServiceCard } from '../../components/shared/ServiceCard'

export function JoinPage() {
  const { t, locale } = useLocale()
  return <>
    <PageIntro eyebrow={t('joinEyebrow')} title={t('joinTitle')} description={t('joinBody')} />
    <div className="join-layout">
      <div className="form-sections">
        <Card className="form-card"><SectionHeading title={t('yourDetails')} description={t('detailsHint')} /><div className="field-grid"><Field label={t('name')} placeholder={t('namePlaceholder')} autoComplete="off" disabled /><Field label={t('phone')} type="tel" placeholder={t('phonePlaceholder')} hint={t('phoneHint')} autoComplete="off" disabled /></div></Card>
        <Card className="form-card"><SectionHeading title={t('chooseServices')} description={t('servicesHint')} /><fieldset className="service-grid" aria-label={t('chooseServices')}>{services.map((service, i) => <ServiceCard key={service.id} service={service} selected={i < 2} />)}</fieldset></Card>
        <Card className="form-card"><SectionHeading title={t('chooseBarber')} /><fieldset className="barber-picker" aria-label={t('chooseBarber')}><label className="barber-option barber-option-selected"><input type="radio" name="barber" defaultChecked disabled /><span className="barber-option-icon"><UsersRound size={21} aria-hidden="true" /></span><span><strong>{t('anyBarber')}</strong><small>{t('anyBarberHint')}</small></span><Check size={17} aria-hidden="true" /></label>{barbers.map(barber => <label className="barber-option" key={barber.name}><input type="radio" name="barber" disabled /><Avatar initials={barber.initials} /><span><strong>{barber.name}</strong><small>{t(barber.state)}</small></span></label>)}</fieldset><p className="inline-note"><Info size={16} aria-hidden="true" />{t('barberBreakHint')}</p></Card>
      </div>
      <aside className="selection-column"><Card className="selection-card"><div className="selection-heading"><Scissors size={21} aria-hidden="true" /><h2>{t('yourSelection')}</h2><span className="sample-label">{t('sample')}</span></div><p className="field-hint">{t('serviceCount', { count: 2 })}</p><div className="selection-services">{services.slice(0, 2).map(service => <div key={service.id}><span>{t(service.name)}</span><span className="tabular-nums">{formatPrice(service.paise, locale)}</span></div>)}</div><dl className="summary-list"><div><dt>{t('duration')}</dt><dd>{t('minutesCount', { count: 45 })}</dd></div><div><dt>{t('selectedBarber')}</dt><dd>{t('anyBarber')}</dd></div><div><dt>{t('estimatedWait')}</dt><dd>{t('minutesCount', { count: 119 })}</dd></div></dl><p className="field-hint">{t('approximate')}</p><div className="selection-total"><span>{t('total')}</span><strong className="tabular-nums">{formatPrice(23000, locale)}</strong></div><Button disabled className="full-width">{t('confirmJoin')}</Button><p className="disabled-explanation">{t('joinUnavailable')}</p></Card><p className="privacy-note"><LockKeyhole size={17} aria-hidden="true" />{t('privacyNote')}</p></aside>
    </div>
  </>
}
