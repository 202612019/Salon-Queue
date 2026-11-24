import { Navigate, Outlet, useParams } from 'react-router'
import type { StaffProfile } from '../../domain/database'
import { useStaff } from './context'
import { useLocale } from '../../i18n/context'
import { LinkButton } from '../../components/ui'
import { staffHome } from '../../services/staff-auth'
export function ProtectedStaff({ roles, linkedBarber = false }: { roles: StaffProfile['role'][]; linkedBarber?: boolean }) {
  const staff = useStaff(), { t } = useLocale(), { name } = useParams()
  if (staff.checking) return <main className="container empty-state" role="status">{t('restoringSession')}</main>
  if (!staff.profile || !staff.session) return <Navigate to="/login" replace />
  if (!roles.includes(staff.profile.role) || (linkedBarber && staff.profile.barber_slug !== name)) return <main className="container empty-state"><h1>{t('accessDenied')}</h1><p>{t('accessDeniedBody')}</p><LinkButton to={staffHome(staff.profile)}>{t('myWorkspace')}</LinkButton></main>
  return <Outlet key={`${staff.profile.user_id}:${staff.profile.role}:${staff.profile.barber_id}:${staff.generation}`} />
}
