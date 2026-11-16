import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import authReducer from '@/features/auth/model/authSlice'
import notificationsReducer from '@/features/notifications/model/notificationsSlice'
import type { AuthUser } from '@/shared/types'
import { baseApi } from '@/shared/api'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import ProfilePage from './index'

const authUser: AuthUser = {
  id: 'user-01',
  name: 'Анна',
  email: 'anna@example.com',
  token: 'token-user-01',
}

const profile = {
  id: 'user-01',
  name: 'Анна',
  email: 'anna@example.com',
  avatarUrl: null,
  birthDate: '1990-01-01T00:00:00.000Z',
  gender: 'female',
  city: 'Москва',
  bio: 'Учу рисовать',
  createdAt: '2020-01-01T00:00:00.000Z',
  likes: [],
  canTeach: { id: 'skill-01', category: 'business', subCategory: 'management' },
  wantsToLearn: [],
}

function renderPage() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      notifications: notificationsReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    preloadedState: {
      auth: {
        user: authUser,
        profile: null,
      },
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  })

  render(
    <Provider store={store}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </Provider>,
  )

  return store
}

function requestOf(input: RequestInfo | URL) {
  return input instanceof Request ? input : new Request(String(input))
}

describe('ProfilePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('заполняет форму данными пользователя и обновляет сессию после сохранения', async () => {
    const user = userEvent.setup()
    const saved = JSON.stringify(authUser)
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_USER, saved)
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const request = requestOf(input)
      if (request.method === 'PATCH') {
        return Response.json({ ...profile, name: 'Мария' })
      }
      return Response.json(profile)
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = renderPage()

    expect(await screen.findByLabelText('Почта')).toHaveValue('anna@example.com')
    expect(screen.getByLabelText('Имя')).toHaveValue('Анна')
    expect(screen.getByLabelText('Дата рождения')).toHaveValue('01.01.1990')
    expect(screen.getByText('Женский')).toBeInTheDocument()
    expect(screen.getByText('Москва')).toBeInTheDocument()
    expect(screen.getByLabelText('О себе')).toHaveValue('Учу рисовать')

    await user.click(screen.getByRole('button', { name: 'Очистить имя' }))
    await user.type(screen.getByLabelText('Имя'), 'Мария')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([input]) => requestOf(input).method === 'PATCH')).toBe(
        true,
      ),
    )
    const patch = fetchMock.mock.calls
      .map(([input]) => requestOf(input))
      .find((request) => request.method === 'PATCH')
    if (!patch) throw new Error('PATCH не отправлен')

    expect(patch.url).toBe('http://localhost/api/auth/me')
    expect(patch.headers.get('Authorization')).toBe('Bearer token-user-01')
    expect(await patch.clone().json()).toEqual({
      email: 'anna@example.com',
      name: 'Мария',
      birthDate: '1990-01-01T00:00:00.000Z',
      gender: 'female',
      city: 'Москва',
      bio: 'Учу рисовать',
    })
    await waitFor(() => expect(store.getState().auth.user?.name).toBe('Мария'))
    expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER) ?? 'null')).toMatchObject({
      name: 'Мария',
      email: 'anna@example.com',
      token: 'token-user-01',
    })
    expect(store.getState().notifications.items).toEqual([
      expect.objectContaining({ type: 'success', message: 'Профиль сохранён' }),
    ])
  })

  it('показывает ошибку API и не меняет сессию', async () => {
    const user = userEvent.setup()
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_USER, JSON.stringify(authUser))
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const request = requestOf(input)
      if (request.method === 'PATCH') {
        return Response.json({ message: 'Этот email уже занят' }, { status: 409 })
      }
      return Response.json(profile)
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = renderPage()
    await screen.findByLabelText('Почта')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Этот email уже занят')
    expect(store.getState().notifications.items).toEqual([
      expect.objectContaining({ type: 'error', message: 'Этот email уже занят' }),
    ])
    expect(store.getState().auth.user).toEqual(authUser)
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)).toBe(JSON.stringify(authUser))
  })

  it('не перезаписывает сессию, если имя, почта и аватар не изменились', async () => {
    const user = userEvent.setup()
    const saved = JSON.stringify(authUser)
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_USER, saved)
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const request = requestOf(input)
      if (request.method === 'PATCH') {
        return Response.json({ ...profile, bio: 'Новый рассказ' })
      }
      return Response.json(profile)
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = renderPage()
    await screen.findByLabelText('О себе')
    await user.clear(screen.getByLabelText('О себе'))
    await user.type(screen.getByLabelText('О себе'), 'Новый рассказ')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([input]) => requestOf(input).method === 'PATCH')).toBe(
        true,
      ),
    )
    const patchIndex = fetchMock.mock.calls.findIndex(
      ([input]) => requestOf(input).method === 'PATCH',
    )
    await act(async () => {
      await fetchMock.mock.results[patchIndex]?.value
    })

    expect(store.getState().auth.user).toEqual(authUser)
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)).toBe(saved)
  })
})
