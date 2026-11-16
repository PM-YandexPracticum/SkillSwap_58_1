import { createListenerMiddleware } from '@reduxjs/toolkit'
import {
  initialNotificationHistory,
  recordExchangeNotification,
  setNotificationHistory,
  type NotificationHistoryState,
} from './notificationHistorySlice'
import { readNotificationHistory, saveNotificationHistory } from './notificationHistoryStorage'
import {
  addNotification,
  removeNotification,
  selectNotifications,
  type NotificationItem,
} from './notificationsSlice'

interface HistoryListenerState {
  auth: { user: { id: string } | null }
  notifications: { items: NotificationItem[] }
  notificationHistory: NotificationHistoryState
}

export const notificationHistoryListener = createListenerMiddleware<HistoryListenerState>()

notificationHistoryListener.startListening({
  predicate: (action, current, previous) =>
    current.auth.user?.id !== previous.auth.user?.id ||
    addNotification.match(action) ||
    (!setNotificationHistory.match(action) &&
      current.notificationHistory !== previous.notificationHistory),

  effect: (action, { getState, getOriginalState, dispatch }) => {
    const previous = getOriginalState()
    const current = getState()
    const userId = current.auth.user?.id

    if (previous.auth.user?.id !== userId) {
      selectNotifications(current).forEach(({ id, exchangeSkillId }) => {
        if (exchangeSkillId) dispatch(removeNotification(id))
      })
      dispatch(
        setNotificationHistory(
          userId ? readNotificationHistory(userId) : initialNotificationHistory,
        ),
      )
      return
    }

    if (addNotification.match(action)) {
      const { id, title, message, createdAt, isRead, exchangeSkillId: skillId } = action.payload
      if (!skillId) return

      if (!userId || current.notificationHistory.offeredSkillIds.includes(skillId)) {
        dispatch(removeNotification(id))
        return
      }

      dispatch(recordExchangeNotification({ id, title, message, createdAt, isRead, skillId }))
    }

    if (userId && current.notificationHistory !== previous.notificationHistory) {
      saveNotificationHistory(userId, current.notificationHistory)
    }
  },
})
