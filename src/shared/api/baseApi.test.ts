import { configureStore } from '@reduxjs/toolkit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { baseApi } from './baseApi'
import apiErrorReducer from './model/apiErrorSlice'

// Добавляем тестовый endpoint к существующему API
const testApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTestData: builder.query<{ success: boolean }, void>({
      query: () => 'http://localhost/api/test',
    }),
  }),
})

const createTestStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      apiError: apiErrorReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  })

const mockResponse = (status: number, body: unknown) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    ),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('baseApi — обработка ошибок', () => {
  it('перехватывает ошибку 404', async () => {
    mockResponse(404, { message: 'Not found' })

    const store = createTestStore()

    await store.dispatch(testApi.endpoints.getTestData.initiate())

    expect(store.getState().apiError.status).toBe(404)
  })

  it('перехватывает ошибку 500', async () => {
    mockResponse(500, { message: 'Server error' })

    const store = createTestStore()

    await store.dispatch(testApi.endpoints.getTestData.initiate())

    expect(store.getState().apiError.status).toBe(500)
  })

  it('не записывает ошибку при успешном запросе', async () => {
    mockResponse(200, { success: true })

    const store = createTestStore()

    await store.dispatch(testApi.endpoints.getTestData.initiate())

    expect(store.getState().apiError.status).toBeNull()
  })

  it('не перенаправляет при ошибке 400', async () => {
    mockResponse(400, { message: 'Bad request' })

    const store = createTestStore()

    await store.dispatch(testApi.endpoints.getTestData.initiate())

    expect(store.getState().apiError.status).toBeNull()
  })
})
