import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { LogIn, Menu, X } from 'lucide-react'
import { Brand } from '../components/shared/Brand'
import { LanguageToggle } from '../components/shared/LanguageToggle'
import { OfflineNotice, PreviewBanner } from '../components/shared/PreviewBanner'
import { PreviewExplorer } from '../components/shared/PreviewExplorer'
import { useLocale } from '../i18n/context'
import { SalonProvider } from '../features/customer/SalonProvider'
import { useSalon } from '../features/customer/context'
import { readCustomerAccess } from '../services/customer-access'

function Header() {
  const { t } = useLocale()
  const [menuOpen, setMenuOpen] = useState(false)
  const statusPath = readCustomerAccess() ? `/status/${readCustomerAccess()!.locator}` : '/status/resume'
  return <header className="site-header"><div className="header-inner"><Brand /><nav className="primary-nav" aria-label={t('menu')}><NavLink end to="/">{t('home')}</NavLink><NavLink to="/join">{t('join')}</NavLink><NavLink to={statusPath}>{t('myStatus')}</NavLink></nav><div className="header-actions"><LanguageToggle /><Link className="staff-link" to="/login"><LogIn size={16} aria-hidden="true" /><span>{t('login')}</span></Link><button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={t(menuOpen ? 'closeMenu' : 'menu')} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div></div>{menuOpen && <nav id="mobile-navigation" className="mobile-nav" aria-label={t('menu')}>{[['/', 'home'], ['/join', 'join'], [statusPath, 'myStatus'], ['/login', 'login']].map(([to, key]) => <Link to={to} key={to} onClick={() => setMenuOpen(false)}>{t(key as 'home' | 'join' | 'myStatus' | 'login')}</Link>)}</nav>}</header>
}
function Footer() {
  const { t } = useLocale()
  const salon = useSalon()
  return <footer className="site-footer"><div className="footer-top"><div><Brand /><p>{t('footerTag')}</p></div><div className="footer-meta"><span>{salon.data?.salon_name ?? t('appName')}</span><span>{t('footerTime')}</span><Link to="/login">{t('staffArea')}</Link></div></div><details className="explorer-details"><summary>{t('previewNav')}</summary><PreviewExplorer /></details></footer>
}
export function CustomerLayout() {
  return <SalonProvider><CustomerShell /></SalonProvider>
}
function CustomerShell() {
  const { t } = useLocale()
  const { pathname } = useLocation()
  const preview = pathname === '/status/preview' || pathname === '/login' || (pathname !== '/' && pathname !== '/join' && !pathname.startsWith('/status/'))
  return <><a className="skip-link" href="#main-content">{t('skip')}</a><Header /><OfflineNotice />{preview && <div className="container"><PreviewBanner /></div>}<main id="main-content" tabIndex={-1} className="container customer-main"><Outlet /></main><Footer /></>
}
export function StaffLayout() {
  const { t } = useLocale()
  return <><a className="skip-link" href="#main-content">{t('skip')}</a><Header /><OfflineNotice /><div className="staff-shell"><aside className="staff-sidebar"><PreviewExplorer sidebar /><Link to="/login" className="sidebar-sign-in"><LogIn size={17} aria-hidden="true" />{t('login')}</Link></aside><div className="staff-body"><PreviewBanner /><main id="main-content" tabIndex={-1}><Outlet /></main></div></div></>
}
