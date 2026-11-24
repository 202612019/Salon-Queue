import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { useLocale } from '../../i18n/context'
import { Button, Card, Field, PageIntro } from '../../components/ui'

export function LoginPage() {
  const { t } = useLocale()
  return <section className="login-layout"><div className="login-intro"><PageIntro eyebrow={t('loginEyebrow')} title={t('loginTitle')} description={t('loginBody')} /><div className="login-illustration" aria-hidden="true"><div><ShieldCheck size={72} strokeWidth={1} /></div></div></div><Card className="login-card"><span className="login-lock"><LockKeyhole size={24} aria-hidden="true" /></span><h2>{t('staffAccess')}</h2><p>{t('staffAccessHint')}</p><div className="login-fields"><Field label={t('email')} type="email" placeholder={t('emailPlaceholder')} autoComplete="off" disabled /><Field label={t('password')} type="password" placeholder={t('passwordPlaceholder')} autoComplete="off" disabled /></div><Button className="full-width" icon={LockKeyhole} disabled>{t('signIn')}</Button><div className="login-warning" role="note">{t('authUnavailable')}</div><p className="field-hint text-center">{t('noSignup')}</p></Card></section>
}
