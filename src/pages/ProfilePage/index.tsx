import { useState } from 'react'
import { authApi, useGetAuthMeQuery, useUpdateProfileMutation } from '@/features/auth/api/authApi'
import { getAuthUser, saveServerAuthUser } from '@/features/auth/model/authUtils'
import { selectAuthUser, setAuthUser } from '@/features/auth/model/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useNotify } from '@/features/notifications'
import { ProfileForm, type ProfileFormValues } from '@/widgets/ProfileForm'
import { ProfileSidebar } from '@/widgets/ProfileSidebar'
import { apiErrorMessage, nextAuthUser, toProfileDefaults } from './profileUser'
import { toProfileUpdate } from './toProfileUpdate'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector(selectAuthUser)
  const { data: profile, isError, error: loadError } = useGetAuthMeQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const notify = useNotify()

  const handleSubmit = async (values: ProfileFormValues) => {
    const result = toProfileUpdate(values)
    if (!result.ok) {
      setSubmitError(result.message)
      return
    }

    try {
      const updated = await updateProfile(result.payload).unwrap()
      setSubmitError(null)
      dispatch(authApi.util.updateQueryData('getAuthMe', undefined, () => updated))
      const next = nextAuthUser(authUser ?? getAuthUser(), updated)
      if (next) {
        saveServerAuthUser(next)
        dispatch(setAuthUser(next))
      }
      notify.success('Профиль сохранён')
    } catch (error) {
      const message = apiErrorMessage(error)
      setSubmitError(message)
      notify.error(message)
    }
  }

  const message = submitError ?? (isError ? apiErrorMessage(loadError) : null)

  return (
    <div className={styles.page}>
      <ProfileSidebar />
      {profile ? (
        <ProfileForm
          defaultValues={toProfileDefaults(profile)}
          avatarUrl={profile.avatarUrl}
          error={message}
          isSubmitting={isUpdating}
          onSubmit={(values) => {
            void handleSubmit(values)
          }}
        />
      ) : null}
    </div>
  )
}
