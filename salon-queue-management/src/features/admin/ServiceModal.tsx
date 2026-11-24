import { useState, type FormEvent } from 'react'
import type { OwnerService } from '../../domain/database'
import { useLocale } from '../../i18n/context'
import { Button, Field, Switch } from '../../components/ui'
import { Modal } from '../../components/ui/Modal'

export function ServiceModal({
  service,
  busy,
  disabled = false,
  onSave,
  onClose,
}: {
  service: OwnerService | null
  busy: boolean
  disabled?: boolean
  onSave: (payload: {
    id: string | null
    name_en: string
    name_gu: string
    price_paise: number
    duration_minutes: number
    enabled: boolean
    version?: number
  }) => void
  onClose: () => void
}) {
  const { t } = useLocale()
  const [nameEn, setNameEn] = useState(service?.name_en ?? '')
  const [nameGu, setNameGu] = useState(service?.name_gu ?? '')
  const [priceInr, setPriceInr] = useState(service ? (service.price_paise / 100).toString() : '200')
  const [duration, setDuration] = useState(service ? service.duration_minutes.toString() : '30')
  const [enabled, setEnabled] = useState(service?.enabled ?? true)
  const [attempted, setAttempted] = useState(false)

  const isEditing = !!service
  const parsedPrice = Number(priceInr)
  const parsedDuration = Number(duration)

  const validName = (name: string) => Array.from(name.trim()).length >= 2 && Array.from(name.trim()).length <= 80 && !/\p{Cc}/u.test(name)
  const validNameEn = validName(nameEn)
  const validNameGu = validName(nameGu)
  const validPrice = /^\d+(?:\.\d{1,2})?$/.test(priceInr.trim()) && parsedPrice >= 0 && parsedPrice <= 100000
  const validDuration = /^\d+$/.test(duration.trim()) && Number.isInteger(parsedDuration) && parsedDuration >= 1 && parsedDuration <= 480

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setAttempted(true)
    if (!validNameEn || !validNameGu || !validPrice || !validDuration || busy || disabled) return

    onSave({
      id: service?.id ?? null,
      name_en: nameEn.trim(),
      name_gu: nameGu.trim(),
      price_paise: Math.round(parsedPrice * 100),
      duration_minutes: parsedDuration,
      enabled,
      ...(service ? { version: service.version } : {}),
    })
  }

  return (
    <Modal title={t(isEditing ? 'editServiceTitle' : 'addServiceTitle')} busy={busy} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field-grid">
          <Field
            label={t('englishName')}
            value={nameEn}
            onChange={e => setNameEn(e.target.value)}
            disabled={busy}
            autoComplete="off"
            error={attempted && !validNameEn ? t('invalidServiceName') : undefined}
          />
          <Field
            label={t('gujaratiName')}
            value={nameGu}
            onChange={e => setNameGu(e.target.value)}
            disabled={busy}
            autoComplete="off"
            error={attempted && !validNameGu ? t('invalidServiceName') : undefined}
          />
        </div>

        <div className="field-grid">
          <Field
            label={t('price')}
            type="number"
            min="0"
            max="100000"
            step="0.01"
            value={priceInr}
            onChange={e => setPriceInr(e.target.value)}
            disabled={busy}
            hint="₹ INR"
            error={attempted && !validPrice ? t('invalidServicePrice') : undefined}
          />
          <Field
            label={t('duration')}
            type="number"
            min="1"
            max="480"
            step="1"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            disabled={busy}
            hint={t('serviceDurationHint')}
            error={attempted && !validDuration ? t('invalidServiceDuration') : undefined}
          />
        </div>

        <div className="setting-row" style={{ border: 0, paddingBlock: '8px 16px' }}>
          <span>{t('enabled')}</span>
          <Switch label={t('enabled')} checked={enabled} disabled={busy} onChange={setEnabled} />
        </div>

        <div className="dialog-actions">
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            {t('dismissDialog')}
          </Button>
          <Button type="submit" disabled={busy || disabled}>
            {busy ? t('actionInProgress') : t('saveService')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

