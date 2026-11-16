import { baseApi } from '@/shared/api'
import type { AuthUser, User } from '@/shared/types'
import type { LoginCredentials } from '../model/authSlice'
import { profileUpdateQuery, type ProfileUpdatePayload } from './profileUpdateQuery'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthUser, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    getAuthMe: builder.query<User, void>({
      query: () => '/auth/me',
    }),

    removeLike: builder.mutation<void, string>({
      query: (targetUserId) => ({
        url: `/auth/me/likes/${encodeURIComponent(targetUserId)}`,
        method: 'DELETE',
      }),
      async onQueryStarted(targetUserId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(
            authApi.util.updateQueryData('getAuthMe', undefined, (user) => {
              user.likes = user.likes.filter((id) => id !== targetUserId)
            }),
          )
        } catch {
          // При ошибке запроса профиль и избранное остаются без изменений.
        }
      },
    }),

    updateProfile: builder.mutation<User, ProfileUpdatePayload>({
      query: profileUpdateQuery,
    }),
  }),
})

export const {
  useLoginMutation,
  useGetAuthMeQuery,
  useRemoveLikeMutation,
  useUpdateProfileMutation,
} = authApi
