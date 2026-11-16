import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { generateId } from '@/shared/lib/helpers'

export type NotificationItem = {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message: string
  duration: number
  createdAt: string
  isRead: boolean
  exchangeSkillId?: string
}

type NewNotification = Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>

interface NotificationsState {
  items: NotificationItem[]
}

const initialState: NotificationsState = {
  items: [],
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    removeNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
    addNotification: {
      reducer: (state, action: PayloadAction<NotificationItem>) => {
        state.items.push(action.payload)
      },
      prepare: (notification: NewNotification) => ({
        payload: {
          id: generateId(),
          createdAt: new Date().toISOString(),
          isRead: false,
          ...notification,
        },
      }),
    },
  },
  selectors: {
    selectNotifications: (state) => state.items,
  },
})

export const { removeNotification, addNotification } = notificationsSlice.actions
export const { selectNotifications } = notificationsSlice.selectors
export default notificationsSlice.reducer
