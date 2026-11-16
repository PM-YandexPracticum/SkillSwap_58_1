import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from '@/shared/api'
import skillsReducer from '@/entities/skill/model/skillsSlice'
import usersReducer from '@/entities/user/model/usersSlice'
import authReducer from '@/features/auth/model/authSlice'
import notificationsReducer from '@/features/notifications/model/notificationsSlice'
import apiErrorReducer from '@/shared/api/model/apiErrorSlice'
import notificationHistoryReducer from '@/features/notifications/model/notificationHistorySlice'
import { notificationHistoryListener } from '@/features/notifications/model/notificationHistoryListener'

export const store = configureStore({
  reducer: {
    skills: skillsReducer,
    users: usersReducer,
    auth: authReducer,
    notifications: notificationsReducer,
    notificationHistory: notificationHistoryReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    apiError: apiErrorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(notificationHistoryListener.middleware)
      .concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
