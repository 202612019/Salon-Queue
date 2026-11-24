import { Coffee, Home, LayoutDashboard, Monitor, Scissors, Settings2, Ticket, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router'
import { useLocale } from '../../i18n/context'
import type { TranslationKey } from '../../i18n/dictionaries'
import { useStaff } from '../../features/auth/context'

const links = [
  { to: '/', label: 'home', icon: Home }, { to: '/join', label: 'join', icon: Scissors },
  { to: '/status/preview', label: 'myStatus', icon: Ticket }, { to: '/reception', label: 'reception', icon: LayoutDashboard },
  { to: '/barber/ravi', label: 'barber', icon: UsersRound }, { to: '/display', label: 'display', icon: Monitor },
  { to: '/admin', label: 'admin', icon: Settings2 },
] satisfies { to: string; label: TranslationKey; icon: typeof Home }[]

export function PreviewExplorer({ sidebar = false }: { sidebar?: boolean }) {
  const { t } = useLocale()
  const { profile } = useStaff()
  const allowed = links.filter(link => !['/reception', '/barber/ravi', '/admin'].includes(link.to) || (link.to === '/reception' && (profile?.role === 'owner' || profile?.role === 'receptionist')) || (link.to === '/barber/ravi' && profile?.role === 'barber') || (link.to === '/admin' && profile?.role === 'owner')).map(link => link.to === '/barber/ravi' && profile?.barber_slug ? { ...link, to: `/barber/${profile.barber_slug}` } : link)
  return <nav className={sidebar ? 'preview-explorer sidebar-links' : 'preview-explorer'} aria-label={t('staffNavigation')}><p className="eyebrow">{t(sidebar ? 'staffNavigation' : 'previewNav')}</p>{allowed.map(({ to, label, icon: Icon }) => <NavLink end={to === '/'} to={to} key={to}><Icon size={17} aria-hidden="true" /><span>{t(label)}</span></NavLink>)}{sidebar && <div className="sidebar-note"><Coffee size={22} strokeWidth={1.5} aria-hidden="true" /><p>{t('secureStaffHint')}</p></div>}</nav>
}
