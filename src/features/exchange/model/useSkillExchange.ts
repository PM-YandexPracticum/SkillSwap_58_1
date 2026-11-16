import { useCallback, useMemo, useRef } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  useCreateSwapRequestMutation,
  useGetSwapRequestsQuery,
} from '@/entities/request/model/api/swapRequestApi'
import { selectAuthUser } from '@/features/auth/model/authSlice'
import { useNotify } from '@/features/notifications'
import { useAppSelector } from '@/store/hooks'
import type { RequestStatus } from '@/shared/types'

const OUTGOING_LIMIT = 100

export type SkillExchangeStatus = RequestStatus | 'idle'

type ErrorPayload = { message?: string }

export function getSwapRequestErrorMessage(error: unknown): string {
  const payload = (error as { data?: ErrorPayload } | undefined)?.data

  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  return 'Не удалось отправить заявку на обмен. Попробуйте ещё раз.'
}

export function useSkillExchange(skillId?: string) {
  const user = useAppSelector(selectAuthUser)
  const { data, isLoading: isRequestsLoading } = useGetSwapRequestsQuery(
    user && skillId ? { role: 'outgoing', limit: OUTGOING_LIMIT } : skipToken,
  )
  const [createSwapRequest, { isLoading: isCreating }] = useCreateSwapRequestMutation()
  const notify = useNotify()

  const isSubmittingRef = useRef(false)

  const request = useMemo(
    () => data?.items.find((item) => item.skillId === skillId),
    [data, skillId],
  )

  const status: SkillExchangeStatus = request?.status ?? 'idle'

  const propose = useCallback(async (): Promise<boolean> => {
    if (!skillId || request || isSubmittingRef.current) return false

    isSubmittingRef.current = true

    try {
      await createSwapRequest({ skillId }).unwrap()
      return true
    } catch (submitError) {
      notify.error(getSwapRequestErrorMessage(submitError))
      return false
    } finally {
      isSubmittingRef.current = false
    }
  }, [createSwapRequest, notify, request, skillId])

  return {
    status,
    isProposed: status !== 'idle',
    isLoading: isRequestsLoading || isCreating,
    propose,
  }
}

export function useOutgoingPendingSkillIds(): string[] {
  const user = useAppSelector(selectAuthUser)
  const { data } = useGetSwapRequestsQuery(
    user ? { role: 'outgoing', limit: OUTGOING_LIMIT } : skipToken,
  )

  return useMemo(
    () =>
      data?.items
        .filter((item) => item.status === 'pending' || item.status === 'accepted')
        .map((item) => item.skillId) ?? [],
    [data],
  )
}
