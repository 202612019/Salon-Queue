import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useLocale } from '../../i18n/context'
import { Button, Card, Field, PageIntro } from '../../components/ui'
import { signInStaff, staffHome } from '../../services/staff-auth'
import { useStaff } from './context'
import { BackendError } from '../../services/backend'
import { staffErrorKey } from '../../domain/staff'
import type { TranslationKey } from '../../i18n/dictionaries'
export function LoginPage() {
  const { t } = useLocale(), staff = useStaff(), navigate = useNavigate()
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [visible, setVisible] = useState(false)
  const [attempted, setAttempted] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState<TranslationKey | null>(null)
  const guard = useRef(false), validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  useEffect(() => { if (staff.profile && staff.session) navigate(staffHome(staff.profile), { replace: true }) }, [staff.profile, staff.session, navigate])
  async function submit(event: FormEvent) {
    event.preventDefault(); setAttempted(true); setMessage(null)
    if (guard.current || !validEmail || !password) return
    guard.current = true; setBusy(true)
    try { await signInStaff(email.trim(), password); setPassword('') }
    catch (error) { setMessage(staffErrorKey(error instanceof BackendError ? error.code : 'AUTH_FAILED')) }
    finally { guard.current = false; setBusy(false) }
  }
  return <section className="login-layout"><div className="login-intro"><PageIntro eyebrow={t('loginEyebrow')} title={t('loginTitle')} description={t('loginBody')} /><div className="login-illustration" aria-hidden="true"><div><ShieldCheck size={72} strokeWidth={1} /></div></div></div><Card className="login-card"><span className="login-lock"><LockKeyhole size={24} aria-hidden="true" /></span><h2>{t('staffAccess')}</h2><p>{t('staffAccessHint')}</p><form onSubmit={event => void submit(event)} noValidate aria-busy={busy}><div className="login-fields"><Field label={t('email')} name="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={t('emailPlaceholder')} autoComplete="username" disabled={busy} error={attempted && !validEmail ? t('invalidEmail') : undefined} /><div className="password-field"><Field label={t('password')} name="password" type={visible ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={t('passwordPlaceholder')} autoComplete="current-password" disabled={busy} error={attempted && !password ? t('passwordRequired') : undefined} /><button type="button" className="password-toggle" onClick={() => setVisible(value => !value)} aria-label={t(visible ? 'hidePassword' : 'showPassword')} aria-pressed={visible}>{visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</button></div></div><Button type="submit" className="full-width" icon={LockKeyhole} disabled={busy || !!staff.checking}>{t(busy ? 'signingIn' : 'signIn')}</Button>{(message || staff.error) && <p className="feedback-message" role="alert">{t(message ?? 'sessionExpired')}</p>}<p className="field-hint text-center">{t('secureStaffHint')}</p></form></Card></section>
}
