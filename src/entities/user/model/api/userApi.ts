import { baseApi } from '@/shared/api'
import type { User } from '@/shared/types'

const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserById: builder.query<User, string>({
      query: (id) => `/users/${encodeURIComponent(id)}`,
    }),
  }),
})

export const { useGetUserByIdQuery } = userApi
