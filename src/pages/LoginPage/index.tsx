import { generatePath, Navigate, useLocation } from 'react-router'
import { useAppSelector } from '@/store/hooks'
import { AuthDecoration, AuthWidget } from '@/widgets'
import { selectIsAuthenticated } from '@/features/auth/model/authSlice'
import { ROUTES } from '@/shared/lib/constants'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { state } = useLocation()
  const skillId: unknown = state?.returnToSkillId
  const returnTo =
    typeof skillId === 'string' && skillId
      ? generatePath(ROUTES.SKILL, { id: encodeURIComponent(skillId) })
      : ROUTES.HOME
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  if (isAuthenticated) {
    return <Navigate to={returnTo} replace />
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <AuthWidget returnTo={returnTo} />
        <AuthDecoration />
      </div>
    </main>
  )
}
