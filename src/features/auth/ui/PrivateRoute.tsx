import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { selectAuthUser } from '../model/authSlice'
import { ROUTES } from '@/shared/lib/constants'
import { useAppSelector } from '@/store/hooks'

export function PrivateRoute() {
  const user = useAppSelector(selectAuthUser)
  const location = useLocation()

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
