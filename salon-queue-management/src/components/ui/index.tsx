import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { Check, Clock3, Coffee, type LucideIcon } from 'lucide-react'
import { classes } from '../../lib/classes'
import { useLocale } from '../../i18n/context'
import type { TranslationKey } from '../../i18n/dictionaries'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'
export function Button({ children, className, variant = 'primary', icon: Icon, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: LucideIcon }) {
  return <button type={type} className={classes('button', `button-${variant}`, className)} {...props}>{Icon && <Icon size={18} aria-hidden="true" />}{children}</button>
}
export function LinkButton({ children, className, variant = 'primary', icon: Icon, ...props }: LinkProps & { variant?: Variant; icon?: LucideIcon }) {
  return <Link className={classes('button', `button-${variant}`, className)} {...props}>{Icon && <Icon size={18} aria-hidden="true" />}{children}</Link>
}
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={classes('card', className)} {...props}>{children}</section>
}
export function Avatar({ initials, size = 'normal' }: { initials: string; size?: 'normal' | 'large' }) {
  return <span aria-hidden="true" className={classes('avatar', size === 'large' && 'avatar-large')}>{initials}</span>
}
export function Badge({ state, children }: { state: TranslationKey; children?: ReactNode }) {
  const { t } = useLocale()
  const tone = state === 'inChair' ? 'info' : state === 'called' ? 'accent' : state === 'available' ? 'success' : state === 'onBreak' ? 'muted' : 'neutral'
  const Icon = state === 'onBreak' ? Coffee : state === 'available' ? Check : Clock3
  return <span className={`badge badge-${tone}`}><Icon size={13} aria-hidden="true" />{children ?? t(state)}</span>
}
export function Field({ label, hint, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const generatedId = useId()
  const id = props.id ?? generatedId
  return <div className="field"><label htmlFor={id}>{label}</label><input {...props} id={id} aria-invalid={!!error || props['aria-invalid']} aria-describedby={[hint && `${id}-hint`, error && `${id}-error`, props['aria-describedby']].filter(Boolean).join(' ') || undefined} />{hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}{error && <p id={`${id}-error`} className="field-error">{error}</p>}</div>
}
export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro-copy">{description}</p></div>{action && <div className="intro-action">{action}</div>}</header>
}
export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}
export function Metric({ label, value, hint, icon: Icon }: { label: string; value: ReactNode; hint?: string; icon?: LucideIcon }) {
  return <div className="metric"><div className="metric-label">{Icon && <Icon size={17} aria-hidden="true" />}<span>{label}</span></div><div className="metric-value tabular-nums">{value}</div>{hint && <p className="metric-hint">{hint}</p>}</div>
}
export function ReadOnlySwitch({ label, checked = true }: { label: string; checked?: boolean }) {
  return <button className="switch" type="button" role="switch" aria-label={label} aria-checked={checked} disabled><span /></button>
}
