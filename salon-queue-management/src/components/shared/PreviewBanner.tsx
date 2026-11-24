import { Eye, LockKeyhole, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocale } from '../../i18n/context'

export function PreviewBanner({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale()
  return <aside role="note" className={`preview-banner${compact ? ' preview-banner-compact' : ''}`}><Eye size={16} aria-hidden="true" /><strong>{t('preview')}</strong><span>{t('previewDetail')}</span></aside>
}
export function StaffNotice() {
  const { t } = useLocale()
  return <p className="staff-notice"><LockKeyhole size={15} aria-hidden="true" />{t('staffPreviewHint')}</p>
}
export function OfflineNotice() {
  const { t } = useLocale()
  const [offline, setOffline] = useState(() => !navigator.onLine)
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  return offline ? <aside role="status" className="offline-notice"><WifiOff size={18} aria-hidden="true" /><strong>{t('offline')}</strong><span>{t('offlineBody')}</span></aside> : null
}
