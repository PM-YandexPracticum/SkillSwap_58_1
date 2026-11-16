import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import { setApiError } from './model/apiErrorSlice'

const getToken = (): string | null => {
  try {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)

    if (!savedUser) {
      return null
    }

    const user: unknown = JSON.parse(savedUser)

    if (
      typeof user === 'object' &&
      user !== null &&
      'token' in user &&
      typeof user.token === 'string'
    ) {
      return user.token
    }

    return null
  } catch {
    return null
  }
}

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: isTest ? 'http://localhost/api' : '/api',
  prepareHeaders: (headers) => {
    const token = getToken()

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return headers
  },
})

// Перехватчик ошибок API
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error) {
    const status = result.error.status

    if (status === 404 || status === 500) {
      api.dispatch(setApiError(status))
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery,
  tagTypes: ['Skill', 'SwapRequest'],
  endpoints: () => ({}),
})
