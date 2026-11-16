import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useStore } from 'react-redux'
import * as yup from 'yup'
import type { store } from '@/store'
import { useAppDispatch } from '@/store/hooks'
import type { AuthUser } from '@/shared/types'
import { authApi, useLoginMutation } from '../api/authApi'
import { logout, setAuthUser, setProfile } from './authSlice'
import { getAuthUser, saveServerAuthUser, saveUserProfile } from './authUtils'
import { useNavigate } from 'react-router'
import { ROUTES } from '@/shared/lib/constants'
import { useNotify } from '@/features/notifications'

const authFormSchema = yup.object({
  email: yup.string().trim().required('Введите email'),
  password: yup.string().required('Введите пароль'),
})

export type AuthFormValues = yup.InferType<typeof authFormSchema>

const DEFAULT_ERROR = 'Не удалось войти. Попробуйте ещё раз.'

function isAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'email' in value &&
    typeof value.email === 'string' &&
    'token' in value &&
    typeof value.token === 'string' &&
    value.token.length > 0
  )
}

function getLoginError(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error.status === 400 || error.status === 401) &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'message' in error.data &&
    typeof error.data.message === 'string'
  ) {
    return error.data.message
  }

  return DEFAULT_ERROR
}

export function useAuthForm(returnTo: string = ROUTES.HOME) {
  const dispatch = useAppDispatch()
  const appStore = useStore.withTypes<typeof store>()()
  const [login] = useLoginMutation()
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const notify = useNotify()

  function showError(message: string) {
    setError(message)
    notify.error(message)
  }

  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: '', password: '' },
    resolver: yupResolver(authFormSchema),
  })

  const submitCredentials = handleSubmit(async (values) => {
    try {
      const user = await login(values).unwrap()

      if (!isAuthUser(user)) {
        throw new Error('Некорректный ответ сервера')
      }

      saveServerAuthUser(user)
      dispatch(setAuthUser(user))

      const currentSession = appStore.getState().auth.user

      try {
        const profile = await dispatch(
          authApi.endpoints.getAuthMe.initiate(undefined, {
            subscribe: false,
            forceRefetch: true,
          }),
        ).unwrap()

        // Не сохраняем ответ, если пользователь вышел или вошел заново.
        if (
          appStore.getState().auth.user === currentSession &&
          getAuthUser()?.token === user.token
        ) {
          saveUserProfile(profile)
          dispatch(setProfile(profile))
          notify.success('Вы вошли в аккаунт')
          navigate(returnTo, { replace: true })
        }
      } catch (profileError) {
        // Не обрабатываем ошибку, если сессия уже изменилась.
        if (
          appStore.getState().auth.user !== currentSession ||
          getAuthUser()?.token !== user.token
        ) {
          return
        }

        if (
          typeof profileError === 'object' &&
          profileError !== null &&
          'status' in profileError &&
          profileError.status === 401
        ) {
          await dispatch(logout())
          showError('Сессия недействительна. Войдите ещё раз.')
          return
        }

        showError('Вы вошли, но не удалось загрузить профиль. Попробуйте обновить страницу.')
      }
    } catch (requestError) {
      showError(getLoginError(requestError))
    }
  })

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    clearErrors()
    setError(null)
    void submitCredentials(event)
  }

  return {
    register,
    handleSubmit: handleFormSubmit,
    errors,
    isSubmitting,
    error,
  }
}
