import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { useLocale } from '../i18n/context'
import { CustomerLayout, StaffLayout } from './layouts'
import { HomePage } from '../features/home/HomePage'
import { JoinPage } from '../features/join/JoinPage'
import { StatusPage } from '../features/status/StatusPage'
import { ReceptionPage } from '../features/reception/ReceptionPage'
import { BarberPage } from '../features/barber/BarberPage'
import { DisplayPage } from '../features/display/DisplayPage'
import { AdminPage } from '../features/admin/AdminPage'
import { LoginPage } from '../features/auth/LoginPage'
import { NotFoundPage } from '../features/errors/NotFoundPage'

export function App() {
  const { pathname } = useLocation()
  const { t } = useLocale()
  useEffect(() => { document.title = t('fullName') }, [t])
  useEffect(() => { window.scrollTo(0, 0); document.getElementById('main-content')?.focus({ preventScroll: true }) }, [pathname])
  return <Routes>
    <Route element={<CustomerLayout />}>
      <Route index element={<HomePage />} />
      <Route path="join" element={<JoinPage />} />
      <Route path="status/:id" element={<StatusPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route element={<StaffLayout />}>
      <Route path="reception" element={<ReceptionPage />} />
      <Route path="barber/:name" element={<BarberPage />} />
      <Route path="admin" element={<AdminPage />} />
    </Route>
    <Route path="display" element={<DisplayPage />} />
  </Routes>
}
