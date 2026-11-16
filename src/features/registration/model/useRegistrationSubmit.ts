import { useCallback, useRef, useState } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { saveServerAuthUser } from '@/features/auth/model/authUtils'
import { setAuthUser } from '@/features/auth/model/authSlice'
import { getErrorMessage } from '@/shared/api/getErrorMessage'
import { useNotify } from '@/features/notifications'
import { buildRegistrationFormData, useRegisterMutation } from '../api/registrationApi'
import type { RegistrationFormValues } from './registrationSchema'

const FALLBACK_ERROR =
  'Не удалось завершить регистрацию. Проверьте подключение к интернету и попробуйте ещё раз.'

export function useRegistrationSubmit() {
  const dispatch = useAppDispatch()
  const [register, { isLoading }] = useRegisterMutation()
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef(false)
  const notify = useNotify()

  const clearError = useCallback(() => setError(null), [])

  const registerUser = useCallback(
    async (values: RegistrationFormValues): Promise<boolean> => {
      if (pendingRef.current) return false

      setError(null)
      pendingRef.current = true

      try {
        const user = await register(buildRegistrationFormData(values)).unwrap()

        dispatch(setAuthUser(user))
        saveServerAuthUser(user)

        return true
      } catch (requestError) {
        const message = getErrorMessage(requestError, FALLBACK_ERROR)
        setError(message)
        notify.error(message)
        return false
      } finally {
        pendingRef.current = false
      }
    },
    [dispatch, notify, register],
  )

  return { registerUser, isSubmitting: isLoading, error, clearError }
}
