import { Clock3, Plus, Scissors, UsersRound } from 'lucide-react'
import { useLocale } from '../../i18n/context'
import { en, gu } from '../../i18n/dictionaries'
import { formatPrice } from '../../lib/format'
import { services, barbers } from '../../services/preview-data'
import { StaffNotice } from '../../components/shared/PreviewBanner'
import { Avatar, Button, Card, Field, Metric, PageIntro, ReadOnlySwitch, SectionHeading } from '../../components/ui'

export function AdminPage() {
  const { t, locale } = useLocale()
  return <>
    <PageIntro eyebrow={t('adminEyebrow')} title={t('adminTitle')} description={t('adminBody')} />
    <StaffNotice />
    <SectionHeading title={t('todayOverview')} action={<span className="sample-label">{t('sample')}</span>} />
    <Card className="metrics-row admin-metrics"><Metric label={t('served')} value="28" hint={t('completedToday')} icon={UsersRound} /><Metric label={t('averageWait')} value={t('minutesCount', { count: 32 })} hint={t('joinToCall')} icon={Clock3} /><Metric label={t('noShows')} value="02" hint={t('noShowToday')} icon={Scissors} /></Card>
    <div className="admin-grid"><Card className="form-card"><div className="setting-heading"><div><h2>{t('onlineQueue')}</h2><p>{t('onlineQueueHint')}</p></div><ReadOnlySwitch label={t('onlineQueue')} /></div><div className="admission-state"><span className="status-dot" aria-hidden="true" /><strong>{t('accepting')}</strong></div><dl className="summary-list"><div><dt>{t('onlineCutoff')}</dt><dd className="tabular-nums">20:30 IST</dd></div><div><dt>{t('walkInCutoff')}</dt><dd className="tabular-nums">21:00 IST</dd></div></dl></Card><Card className="form-card"><h2>{t('openingHours')}</h2><div className="field-grid hours-fields"><Field label={t('opens')} type="time" value="10:00" readOnly disabled /><Field label={t('closes')} type="time" value="21:00" readOnly disabled /></div><Button variant="secondary" disabled>{t('saveHours')}</Button></Card></div>
    <Card className="catalog-card"><SectionHeading title={t('serviceCatalog')} description={t('serviceCatalogHint')} action={<Button icon={Plus} disabled>{t('addService')}</Button>} /><div className="catalog-list">{services.map(service => <div className="catalog-row" key={service.id}><span className="service-icon"><Scissors size={21} strokeWidth={1.5} aria-hidden="true" /></span><div className="catalog-name"><strong lang="en">{en[service.name]}</strong><span lang="gu">{gu[service.name]}</span></div><span className="catalog-duration">{t('minutesCount', { count: service.minutes })}</span><strong className="tabular-nums catalog-price">{formatPrice(service.paise, locale)}</strong><ReadOnlySwitch label={`${t(service.name)} · ${t('enabled')}`} /><Button variant="quiet" disabled aria-label={`${t('edit')} · ${t(service.name)}`}>{t('edit')}</Button></div>)}</div></Card>
    <Card className="form-card team-duty"><SectionHeading title={t('teamDuty')} /><div className="team-duty-grid">{barbers.map(barber => <div className="setting-row" key={barber.name}><div className="barber-identity"><Avatar initials={barber.initials} /><strong>{barber.name}</strong></div><ReadOnlySwitch label={`${barber.name} · ${t('barbersOnDuty')}`} /></div>)}</div><p className="field-hint">{t('settingsUnavailable')}</p></Card>
  </>
}
