import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface HistoryNotification {
  id: string
  title: string
  message: string
  createdAt: string
  isRead: boolean
  skillId?: string
}

export interface NotificationHistoryState {
  items: HistoryNotification[]
  offeredSkillIds: string[]
}

export const initialNotificationHistory: NotificationHistoryState = {
  items: [],
  offeredSkillIds: [],
}

const notificationHistorySlice = createSlice({
  name: 'notificationHistory',
  initialState: initialNotificationHistory,
  reducers: {
    setNotificationHistory: (_state, action: PayloadAction<NotificationHistoryState>) =>
      action.payload,
    recordExchangeNotification: (
      state,
      action: PayloadAction<HistoryNotification & { skillId: string }>,
    ) => {
      const { skillId } = action.payload
      if (state.offeredSkillIds.includes(skillId)) return

      state.offeredSkillIds.push(skillId)
      state.items.push(action.payload)
    },
    markAllNotificationsRead: (state) => {
      state.items.forEach((notification) => {
        notification.isRead = true
      })
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(({ id }) => id === action.payload)
      if (notification) notification.isRead = true
    },
    clearReadNotifications: (state) => {
      state.items = state.items.filter(({ isRead }) => !isRead)
    },
  },
  selectors: {
    selectNotificationHistory: (state) => state.items,
    selectOfferedSkillIds: (state) => state.offeredSkillIds,
  },
})

export const {
  setNotificationHistory,
  recordExchangeNotification,
  markAllNotificationsRead,
  markNotificationRead,
  clearReadNotifications,
} = notificationHistorySlice.actions

export const { selectNotificationHistory, selectOfferedSkillIds } =
  notificationHistorySlice.selectors

export default notificationHistorySlice.reducer
