import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import authReducer from '../model/authSlice'
import { SessionGate } from './SessionGate'
import type { User } from '@/shared/types'

const { queryState, queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  queryState: {
    data: undefined as User | undefined,
    error: undefined as { status: number | string } | undefined,
    refetch: vi.fn(),
  },
}))

vi.mock('../api/authApi', () => ({
  useGetAuthMeQuery: (...args: [unknown, { skip: boolean }]) => {
    queryMock(...args)
    return queryState
  },
}))

const savedUser = {
  id: 'user-01',
  name: 'Старое имя',
  email: 'old@example.com',
  token: 'token-user-01',
}

function renderSessionGate() {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: null, profile: null },
    },
  })

  render(
    <Provider store={store}>
      <SessionGate>
        <p>Приложение открыто</p>
      </SessionGate>
    </Provider>,
  )

  return store
}

describe('SessionGate', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_USER, JSON.stringify(savedUser))
    queryMock.mockClear()
    queryState.data = undefined
    queryState.error = undefined
    queryState.refetch.mockReset()
  })

  it('открывает приложение без запроса, если сохранённой сессии нет', () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_USER)

    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: { user: null, profile: null },
      },
    })

    render(
      <Provider store={store}>
        <SessionGate>
          <p>Приложение открыто</p>
        </SessionGate>
      </Provider>,
    )

    expect(screen.getByText('Приложение открыто')).toBeInTheDocument()

    expect(queryMock).toHaveBeenCalledWith(undefined, { skip: true })
  })

  it('обновляет пользователя после подтверждения сессии', async () => {
    queryState.data = {
      id: 'user-01',
      name: 'Анна',
      email: 'anna.smirnova@example.com',
      avatarUrl: null,
      birthDate: '1995-02-08T00:00:00.000Z',
      gender: 'female',
      city: 'Москва',
      bio: 'Люблю рисовать',
      createdAt: '2025-01-01T00:00:00.000Z',
      likes: [],
      canTeach: {
        id: 'skill-01',
        category: 'art',
        subCategory: 'illustration',
      },
      wantsToLearn: [],
    }

    const store = renderSessionGate()

    expect(await screen.findByText('Приложение открыто')).toBeInTheDocument()

    const expectedUser = {
      id: queryState.data.id,
      name: queryState.data.name,
      email: queryState.data.email,
      token: savedUser.token,
      avatarUrl: null as string | null,
    }

    expect(store.getState().auth.user).toEqual(expectedUser)

    expect(store.getState().auth.profile).toEqual(queryState.data)
    const savedProfile = localStorage.getItem('skillswap_user_profile')
    expect(savedProfile).not.toBeNull()
    expect(JSON.parse(savedProfile ?? 'null')).toEqual(queryState.data)

    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)
    expect(JSON.parse(saved ?? 'null')).toEqual(expectedUser)
  })

  it('очищает сессию, если сервер вернул 401', async () => {
    queryState.error = { status: 401 }

    const store = renderSessionGate()

    expect(await screen.findByText('Приложение открыто')).toBeInTheDocument()

    await waitFor(() => {
      expect(store.getState().auth.user).toBeNull()
    })

    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)).toBeNull()
  })

  it('сохраняет сессию при ошибке сервера и позволяет повторить проверку', async () => {
    queryState.error = { status: 'FETCH_ERROR' }

    const userEvents = userEvent.setup()
    const store = renderSessionGate()

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось проверить вход')

    expect(store.getState().auth.user).toBeNull()

    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)
    expect(JSON.parse(saved ?? 'null')).toEqual(savedUser)

    await userEvents.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(queryState.refetch).toHaveBeenCalledOnce()
  })

  it('не считает пользователя вошедшим, пока сессия проверяется', () => {
    const store = renderSessionGate()

    expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    expect(store.getState().auth.user).toBeNull()
    expect(screen.queryByText('Приложение открыто')).not.toBeInTheDocument()
  })
})
