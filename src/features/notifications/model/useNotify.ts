import { useMemo } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { addNotification, type NotificationItem } from './notificationsSlice'

const DEFAULT_DURATION = 5000

export type NotifyOptions = {
  duration?: number
  exchangeSkillId?: string
}

export function useNotify() {
  const dispatch = useAppDispatch()

  return useMemo(() => {
    const notify =
      (type: NotificationItem['type'], defaultTitle: string) =>
      (message: string, title = defaultTitle, options: NotifyOptions = {}) =>
        dispatch(
          addNotification({
            type,
            title,
            message,
            duration: options.duration ?? DEFAULT_DURATION,
            ...(options.exchangeSkillId ? { exchangeSkillId: options.exchangeSkillId } : {}),
          }),
        )

    return {
      success: notify('success', 'Успешно'),
      error: notify('error', 'Ошибка'),
      info: notify('info', 'Инфо'),
    }
  }, [dispatch])
}
