import { BellRing, Check, Clock3, LockKeyhole, Scissors, Ticket, UserRound } from 'lucide-react'
import { useParams } from 'react-router'
import { useLocale } from '../../i18n/context'
import { formatPrice } from '../../lib/format'
import { services } from '../../services/preview-data'
import { Badge, Button, Card, LinkButton, PageIntro } from '../../components/ui'

export function StatusPage() {
  const { id } = useParams()
  const { t, locale } = useLocale()
  if (id !== 'preview') return <section className="empty-state"><LockKeyhole size={40} strokeWidth={1.4} aria-hidden="true" /><h1>{t('privateTitle')}</h1><p>{t('privateBody')}</p><LinkButton to="/status/preview">{t('openPreview')}</LinkButton></section>
  return <>
    <PageIntro eyebrow={t('statusEyebrow')} title={t('statusTitle')} description={t('statusBody')} />
    <div className="status-layout">
      <Card className="status-pass"><div className="status-pass-header"><span className="eyebrow">{t('yourQueuePass')}</span><Badge state="waiting" /></div><span className="status-token-label">{t('token')}</span><div className="status-token tabular-nums">S-014</div><p className="field-hint">{t('salonName')} · {t('sample')}</p><div className="status-pass-metrics"><div><div className="position-ring"><span>01</span></div><p>{t('globalPosition')}</p></div><div><Clock3 size={24} strokeWidth={1.5} aria-hidden="true" /><strong>{t('minutesCount', { count: 29 })}</strong><p>{t('exampleEstimate')}</p></div></div><p className="field-hint text-center">{t('approximate')}</p><div className="arrival-note"><BellRing size={23} aria-hidden="true" /><div><strong>{t('statusNear')}</strong><p>{t('statusNearBody')}</p></div></div></Card>
      <div className="status-details"><Card className="form-card"><h2>{t('yourServices')}</h2><div className="status-services">{services.slice(0, 2).map(service => <div key={service.id}><span className="service-icon"><Scissors size={18} aria-hidden="true" /></span><div><strong>{t(service.name)}</strong><p>{t('minutesCount', { count: service.minutes })}</p></div><span className="tabular-nums">{formatPrice(service.paise, locale)}</span></div>)}</div><dl className="summary-list"><div><dt>{t('bookedDuration')}</dt><dd>{t('minutesCount', { count: 45 })}</dd></div><div><dt>{t('total')}</dt><dd>{formatPrice(23000, locale)}</dd></div><div><dt><UserRound size={15} aria-hidden="true" />{t('selectedBarber')}</dt><dd>{t('anyBarber')}</dd></div></dl></Card><Card className="form-card"><h2>{t('myStatus')}</h2><ol className="status-timeline">{[
        { key: 'waitingFor', icon: Check, active: true }, { key: 'calledStep', icon: BellRing, active: false }, { key: 'serviceStep', icon: Scissors, active: false }, { key: 'finishStep', icon: Ticket, active: false },
      ].map(({ key, icon: Icon, active }) => <li key={key} className={active ? 'timeline-active' : ''}><span><Icon size={16} aria-hidden="true" /></span>{t(key as 'waitingFor' | 'calledStep' | 'serviceStep' | 'finishStep')}</li>)}</ol></Card></div>
    </div><div className="cancel-area"><Button variant="quiet" disabled>{t('cancel')}</Button><p>{t('cancelUnavailable')}</p></div>
  </>
}
