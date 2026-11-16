import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useGetAuthMeQuery } from '../api/authApi'
import { getAuthUser, saveServerAuthUser, saveUserProfile } from '../model/authUtils'
import { logout, setAuthUser, setProfile } from '../model/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { Skeleton } from '@/shared/ui'

interface SessionGateProps {
  children: ReactNode
}

export function SessionGate({ children }: SessionGateProps) {
  const dispatch = useAppDispatch()

  /** Запоминаем сохранённую сессию при запуске приложения. */
  const [savedUser] = useState(() => getAuthUser())
  const [isFinished, setIsFinished] = useState(() => !savedUser?.token)

  const { data, error, refetch } = useGetAuthMeQuery(undefined, {
    skip: isFinished,
  })

  useEffect(() => {
    if (isFinished || !savedUser?.token) {
      return
    }

    if (data) {
      const confirmedUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        token: savedUser.token,
        ...('avatarUrl' in data ? { avatarUrl: data.avatarUrl } : {}),
      }

      saveServerAuthUser(confirmedUser)
      saveUserProfile(data)
      dispatch(setAuthUser(confirmedUser))
      dispatch(setProfile(data))
      setIsFinished(true)
      return
    }

    if (error && 'status' in error && error.status === 401) {
      void dispatch(logout()).then(() => {
        setIsFinished(true)
      })
    }
  }, [data, dispatch, error, isFinished, savedUser])

  if (isFinished) {
    return <>{children}</>
  }

  if (error && !('status' in error && error.status === 401)) {
    return (
      <div role="alert">
        <p>Не удалось проверить вход. Проверьте подключение и попробуйте ещё раз.</p>
        <button type="button" onClick={() => void refetch()}>
          Повторить
        </button>
      </div>
    )
  }

  return <Skeleton width="100%" height="100vh" />
}
