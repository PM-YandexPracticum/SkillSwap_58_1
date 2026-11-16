import { renderHook, act, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'

import { baseApi } from '@/shared/api'
import { setAuthUser } from '@/features/auth/model/authSlice'
import { addNotification } from '@/features/notifications'
import { saveServerAuthUser } from '@/features/auth/model/authUtils'
import { useRegistrationSubmit } from './useRegistrationSubmit'
import type { RegistrationFormValues } from './registrationSchema'

// ─── Моки ────────────────────────────────────────────────
const dispatch = vi.fn()

vi.mock('@/store/hooks', () => ({
  useAppDispatch: () => dispatch,
}))

vi.mock('@/features/auth/model/authUtils', () => ({
  saveServerAuthUser: vi.fn(),
}))

const SERVER_USER = {
  id: '1',
  name: 'Иван',
  email: 'ivan@example.com',
  token: 'jwt-token',
}

const validValues: RegistrationFormValues = {
  email: 'ivan@example.com',
  password: '12345678',
  name: 'Иван',
  birthDate: '01.01.1990',
  gender: 'male',
  city: 'Москва',
  wantedCategory: 'music',
  wantedSubCategory: 'guitar',
  teachSkillName: 'Гитара',
  teachCategory: 'music',
  teachSubCategory: 'guitar',
  teachDescription: 'Научу играть',
  avatar: null,
  teachImage: null,
} as RegistrationFormValues

// ─── MSW ─────────────────────────────────────────────────
const REGISTER_URL = '*/api/auth/register'

const server = setupServer(
  http.post(REGISTER_URL, () => HttpResponse.json(SERVER_USER, { status: 201 })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── Обёртка со стором ───────────────────────────────────
function createWrapper() {
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }

  return Wrapper
}

const FALLBACK_ERROR =
  'Не удалось завершить регистрацию. Проверьте подключение к интернету и попробуйте ещё раз.'

describe('useRegistrationSubmit', () => {
  beforeEach(() => {
    dispatch.mockClear()
    vi.mocked(saveServerAuthUser).mockClear()
  })

  it('успешная регистрация: сохраняет пользователя в Redux и localStorage', async () => {
    const { result } = renderHook(() => useRegistrationSubmit(), {
      wrapper: createWrapper(),
    })

    let ok = false
    await act(async () => {
      ok = await result.current.registerUser(validValues)
    })

    expect(ok).toBe(true)
    expect(dispatch).toHaveBeenCalledWith(setAuthUser(SERVER_USER))
    expect(saveServerAuthUser).toHaveBeenCalledWith(SERVER_USER)
    expect(result.current.error).toBeNull()
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: addNotification.type }),
    )
  })

  it('во время отправки isSubmitting = true и повторный вызов заблокирован', async () => {
    server.use(
      http.post(REGISTER_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json(SERVER_USER, { status: 201 })
      }),
    )

    const { result } = renderHook(() => useRegistrationSubmit(), {
      wrapper: createWrapper(),
    })

    let first!: Promise<boolean>
    let secondResult: boolean | undefined

    // стартуем первый запрос — он «висит» 100 мс на моке
    await act(async () => {
      first = result.current.registerUser(validValues)
      // второй вызов сразу же: pendingRef ещё true — должен вернуть false
      secondResult = await result.current.registerUser(validValues)
    })

    expect(secondResult).toBe(false) // повторная отправка заблокирована

    await waitFor(() => expect(result.current.isSubmitting).toBe(true))

    let firstResult = false
    await act(async () => {
      firstResult = await first
    })

    expect(firstResult).toBe(true)
    await waitFor(() => expect(result.current.isSubmitting).toBe(false))
  })

  it('400: показывает message сервера, авторизация не выполняется', async () => {
    server.use(
      http.post(REGISTER_URL, () =>
        HttpResponse.json(
          { message: 'Пользователь с таким email уже существует' },
          { status: 400 },
        ),
      ),
    )

    const { result } = renderHook(() => useRegistrationSubmit(), {
      wrapper: createWrapper(),
    })

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.registerUser(validValues)
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe('Пользователь с таким email уже существует')
    expect(dispatch).not.toHaveBeenCalledWith(setAuthUser(expect.anything()))
    expect(saveServerAuthUser).not.toHaveBeenCalled()
  })

  it('409: показывает message сервера', async () => {
    server.use(
      http.post(REGISTER_URL, () =>
        HttpResponse.json({ message: 'Email уже зарегистрирован' }, { status: 409 }),
      ),
    )

    const { result } = renderHook(() => useRegistrationSubmit(), {
      wrapper: createWrapper(),
    })

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.registerUser(validValues)
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe('Email уже зарегистрирован')
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: addNotification.type,
        payload: expect.objectContaining({ type: 'error', message: 'Email уже зарегистрирован' }),
      }),
    )
  })

  it('5xx без message: показывает запасное сообщение', async () => {
    server.use(http.post(REGISTER_URL, () => HttpResponse.json({}, { status: 500 })))

    const { result } = renderHook(() => useRegistrationSubmit(), {
      wrapper: createWrapper(),
    })

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.registerUser(validValues)
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe(FALLBACK_ERROR)
  })

  it('сетевая ошибка: показывает запасное сообщение', async () => {
    server.use(http.post(REGISTER_URL, () => HttpResponse.error()))

    const { result } = renderHook(() => useRegistrationSubmit(), {
      wrapper: createWrapper(),
    })

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.registerUser(validValues)
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe(FALLBACK_ERROR)
  })

  it('после ошибки clearError сбрасывает сообщение', async () => {
    server.use(http.post(REGISTER_URL, () => HttpResponse.error()))

    const { result } = renderHook(() => useRegistrationSubmit(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.registerUser(validValues)
    })
    expect(result.current.error).toBe(FALLBACK_ERROR)

    act(() => {
      result.current.clearError()
    })
    expect(result.current.error).toBeNull()
  })
})
