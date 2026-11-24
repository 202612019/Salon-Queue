import { useState } from 'react'
import { Clock3, Plus, Scissors, UsersRound } from 'lucide-react'
import { useLocale } from '../../i18n/context'
import { formatPrice } from '../../lib/format'
import type { OwnerService, OwnerSnapshot, StaffBarber } from '../../domain/database'
import { useStaffSnapshot } from '../../hooks/useStaffSnapshot'
import { useStaffCommand } from '../../hooks/useStaffCommand'
import { ConnectionNotice } from '../../components/shared/CustomerFeedback'
import { Avatar, Badge, Button, Card, Field, Metric, PageIntro, SectionHeading, Switch } from '../../components/ui'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ServiceModal } from './ServiceModal'

function computeCutoff(closingTime: string, subtractMinutes = 30): string {
  const [h, m] = closingTime.slice(0, 5).split(':').map(Number)
  let totalMinutes = h * 60 + m - subtractMinutes
  if (totalMinutes < 0) totalMinutes += 24 * 60
  const ch = Math.floor(totalMinutes / 60).toString().padStart(2, '0')
  const cm = (totalMinutes % 60).toString().padStart(2, '0')
  return `${ch}:${cm} IST`
}

export function AdminPage() {
  const { t, locale } = useLocale()
  const state = useStaffSnapshot<OwnerSnapshot>()
  const data = state.data
  const fresh = state.connection === 'live' && !state.error
  const command = useStaffCommand(state.refresh, fresh)

  const [editingService, setEditingService] = useState<OwnerService | null | 'new'>(null)
  const [editedOpening, setEditedOpening] = useState<string | null>(null)
  const [editedClosing, setEditedClosing] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    title: string
    body: string
    onConfirm: () => void
  } | null>(null)

  const openingTime = editedOpening ?? data?.settings?.opening_time.slice(0, 5) ?? '10:00'
  const closingTime = editedClosing ?? data?.settings?.closing_time.slice(0, 5) ?? '21:00'

  function toggleOnlineQueue() {
    if (!data || command.busy || !fresh) return
    if (data.settings.online_enabled) {
      setConfirmModal({
        title: t('confirmCloseOnlineTitle'),
        body: t('confirmCloseOnlineBody'),
        onConfirm: () => {
          void command.run('save_settings', {
            salon_name: data.settings.salon_name,
            opening_time: data.settings.opening_time,
            closing_time: data.settings.closing_time,
            online_enabled: false,
            version: data.settings.version,
          }).finally(() => setConfirmModal(null))
        },
      })
    } else {
      void command.run('save_settings', {
        salon_name: data.settings.salon_name,
        opening_time: data.settings.opening_time,
        closing_time: data.settings.closing_time,
        online_enabled: true,
        version: data.settings.version,
      })
    }
  }

  function handleSaveHours() {
    if (!data || command.busy || !fresh) return
    setConfirmModal({
      title: t('confirmSettingsTitle'),
      body: t('confirmSettingsBody'),
      onConfirm: () => {
        void command.run('save_settings', {
          salon_name: data.settings.salon_name,
          opening_time: openingTime + ':00',
          closing_time: closingTime + ':00',
          online_enabled: data.settings.online_enabled,
          version: data.settings.version,
        }).then(result => {
          if (result) {
            setEditedOpening(null)
            setEditedClosing(null)
          }
        }).finally(() => setConfirmModal(null))
      },
    })
  }

  function toggleService(service: OwnerService) {
    if (!data || command.busy || !fresh) return
    void command.run('save_service', {
      id: service.id,
      name_en: service.name_en,
      name_gu: service.name_gu,
      price_paise: service.price_paise,
      duration_minutes: service.duration_minutes,
      enabled: !service.enabled,
      version: service.version,
    })
  }

  function handleSaveService(payload: {
    id: string | null
    name_en: string
    name_gu: string
    price_paise: number
    duration_minutes: number
    enabled: boolean
    version?: number
  }) {
    if (!data || command.busy || !fresh) return
    void command.run('save_service', payload).then(res => {
      if (res) setEditingService(null)
    })
  }

  function toggleBarberDuty(barber: StaffBarber) {
    if (!data || command.busy || !fresh) return
    void command.run('set_duty', {
      barber_id: barber.id,
      version: barber.version,
      on_duty: !barber.on_duty,
      on_break: false,
    })
  }

  function toggleBarberBreak(barber: StaffBarber) {
    if (!data || command.busy || !fresh) return
    void command.run('set_duty', {
      barber_id: barber.id,
      version: barber.version,
      on_duty: true,
      on_break: !barber.on_break,
    })
  }

  const hasHoursChanged = !!data?.settings && (
    openingTime !== data.settings.opening_time.slice(0, 5) ||
    closingTime !== data.settings.closing_time.slice(0, 5)
  )

  return (
    <>
      <PageIntro eyebrow={t('adminEyebrow')} title={t('adminTitle')} description={t('adminBody')} />
      <ConnectionNotice state={state} refresh={state.refresh} />
      {command.message && <p className="feedback-message" role="status">{t(command.message)}</p>}
      {command.pending && !command.busy && (
        <div className="recovery-notice">
          <p>{t('staffUncertain')}</p>
          <Button disabled={!fresh} onClick={() => void command.retry()}>{t('retryStaffAction')}</Button>
        </div>
      )}

      <SectionHeading title={t('todayOverview')} />
      <Card className="metrics-row admin-metrics">
        <Metric
          label={t('served')}
          value={data?.statistics?.served != null ? data.statistics.served.toString().padStart(2, '0') : '—'}
          hint={t('completedToday')}
          icon={UsersRound}
        />
        <Metric
          label={t('averageWait')}
          value={data?.statistics?.average_wait_minutes != null ? t('minutesCount', { count: new Intl.NumberFormat(locale === 'gu' ? 'gu-IN' : 'en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(data.statistics.average_wait_minutes) }) : '—'}
          hint={t('joinToCall')}
          icon={Clock3}
        />
        <Metric
          label={t('noShows')}
          value={data?.statistics?.no_shows != null ? data.statistics.no_shows.toString().padStart(2, '0') : '—'}
          hint={t('noShowToday')}
          icon={Scissors}
        />
      </Card>

      <div className="admin-grid">
        <Card className="form-card">
          <div className="setting-heading">
            <div>
              <h2>{t('onlineQueue')}</h2>
              <p>{t('onlineQueueHint')}</p>
            </div>
            <Switch
              label={t('onlineQueue')}
              checked={data?.settings?.online_enabled ?? false}
              disabled={!data || command.busy || !fresh}
              onChange={toggleOnlineQueue}
            />
          </div>
          <div className="admission-state">
            <span
              className="status-dot"
              style={{ background: data?.settings?.online_enabled ? 'var(--color-success)' : 'var(--color-warning)' }}
              aria-hidden="true"
            />
            <strong>{t(data?.settings?.online_enabled ? 'accepting' : 'salonClosed')}</strong>
          </div>
          <dl className="summary-list">
            <div>
              <dt>{t('onlineCutoff')}</dt>
              <dd className="tabular-nums">
                {data?.settings ? computeCutoff(data.settings.closing_time, 30) : '—'}
              </dd>
            </div>
            <div>
              <dt>{t('walkInCutoff')}</dt>
              <dd className="tabular-nums">
                {data?.settings ? data.settings.closing_time.slice(0, 5) + ' IST' : '—'}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="form-card">
          <h2>{t('openingHours')}</h2>
          <div className="field-grid hours-fields">
            <Field
              label={t('opens')}
              type="time"
              value={openingTime}
              disabled={!data || command.busy || !fresh}
              onChange={e => setEditedOpening(e.target.value)}
            />
            <Field
              label={t('closes')}
              type="time"
              value={closingTime}
              disabled={!data || command.busy || !fresh}
              onChange={e => setEditedClosing(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            disabled={!data || command.busy || !fresh || !hasHoursChanged}
            onClick={handleSaveHours}
          >
            {t('saveHours')}
          </Button>
        </Card>
      </div>

      <Card className="catalog-card">
        <SectionHeading
          title={t('serviceCatalog')}
          description={t('serviceCatalogHint')}
          action={
            <Button
              icon={Plus}
              disabled={!data || command.busy || !fresh}
              onClick={() => setEditingService('new')}
            >
              {t('addService')}
            </Button>
          }
        />
        <div className="catalog-list">
          {data?.services.map(service => (
            <div className="catalog-row" key={service.id}>
              <span className="service-icon">
                <Scissors size={21} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div className="catalog-name">
                <strong lang="en">{service.name_en}</strong>
                <span lang="gu">{service.name_gu}</span>
              </div>
              <span className="catalog-duration tabular-nums">{t('minutesCount', { count: service.duration_minutes })}</span>
              <strong className="tabular-nums catalog-price">{formatPrice(service.price_paise, locale)}</strong>
              <Switch
                label={`${service.name_en} · ${t('enabled')}`}
                checked={service.enabled}
                disabled={command.busy || !fresh}
                onChange={() => toggleService(service)}
              />
              <Button
                variant="quiet"
                disabled={command.busy || !fresh}
                aria-label={`${t('edit')} · ${service.name_en}`}
                onClick={() => setEditingService(service)}
              >
                {t('edit')}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="form-card team-duty">
        <SectionHeading title={t('teamDuty')} description={t('teamDutyHint')} />
        <div className="team-duty-grid">
          {data?.barbers.map(barber => {
            const isOccupied = data.entries?.some(
              e => e.assigned_barber?.id === barber.id && ['called', 'in_chair'].includes(e.status)
            )
            const hasWaiting = data.entries?.some(
              e => e.status === 'waiting' && e.preferred_barber?.id === barber.id
            )
            const current = data.entries?.find(e => e.assigned_barber?.id === barber.id && ['called', 'in_chair'].includes(e.status))
            const badgeState = !barber.on_duty ? 'offDuty' : barber.on_break ? 'onBreak' : current?.status === 'called' ? 'called' : current ? 'inChair' : 'available'
            return (
              <div className="setting-row" key={barber.id}>
                <div className="barber-identity">
                  <Avatar initials={barber.display_name.slice(0, 2).toUpperCase()} />
                  <div>
                    <strong>{barber.display_name}</strong>
                    <Badge state={badgeState} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Switch
                    label={`${barber.display_name} · ${t('barbersOnDuty')}`}
                    checked={barber.on_duty}
                    disabled={command.busy || !fresh || (barber.on_duty && (isOccupied || hasWaiting))}
                    onChange={() => toggleBarberDuty(barber)}
                  />
                  {barber.on_duty && (
                    <Button
                      variant="quiet"
                      disabled={command.busy || !fresh || isOccupied}
                      onClick={() => toggleBarberBreak(barber)}
                    >
                      {t(barber.on_break ? 'returnFromBreak' : 'takeBreak')}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {editingService && (
        <ServiceModal
          service={editingService === 'new' ? null : editingService}
          busy={command.busy}
          disabled={!fresh || command.pending}
          onSave={handleSaveService}
          onClose={() => setEditingService(null)}
        />
      )}

      {confirmModal && (
        <ConfirmDialog
          title={confirmModal.title}
          description={confirmModal.body}
          confirm={t('confirmAction')}
          dismiss={t('dismissDialog')}
          busy={command.busy}
          confirmDisabled={!fresh}
          onConfirm={confirmModal.onConfirm}
          onDismiss={() => setConfirmModal(null)}
        />
      )}
    </>
  )
}
