import { Coffee, Home, LayoutDashboard, Monitor, Scissors, Settings2, Ticket, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router'
import { useLocale } from '../../i18n/context'
import type { TranslationKey } from '../../i18n/dictionaries'

const links = [
  { to: '/', label: 'home', icon: Home }, { to: '/join', label: 'join', icon: Scissors },
  { to: '/status/preview', label: 'myStatus', icon: Ticket }, { to: '/reception', label: 'reception', icon: LayoutDashboard },
  { to: '/barber/ravi', label: 'barber', icon: UsersRound }, { to: '/display', label: 'display', icon: Monitor },
  { to: '/admin', label: 'admin', icon: Settings2 },
] satisfies { to: string; label: TranslationKey; icon: typeof Home }[]

export function PreviewExplorer({ sidebar = false }: { sidebar?: boolean }) {
  const { t } = useLocale()
  return <nav className={sidebar ? 'preview-explorer sidebar-links' : 'preview-explorer'} aria-label={t('previewNav')}><p className="eyebrow">{t('previewNav')}</p>{links.map(({ to, label, icon: Icon }) => <NavLink end={to === '/'} to={to} key={to}><Icon size={17} aria-hidden="true" /><span>{t(label)}</span></NavLink>)}{sidebar && <div className="sidebar-note"><Coffee size={22} strokeWidth={1.5} aria-hidden="true" /><p>{t('previewNavHint')}</p></div>}</nav>
}
