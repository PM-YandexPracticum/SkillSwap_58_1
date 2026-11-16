import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it } from 'vitest'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import authReducer, {
  logout,
  selectAuthUser,
  selectIsAuthenticated,
  setAuthUser,
} from './authSlice'
import { getAuthUser, saveServerAuthUser } from './authUtils'

const user = {
  id: 'user-01',
  name: 'Анна',
  email: 'anna.smirnova@example.com',
  token: 'token-user-01',
}

function createStore() {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: null, profile: null },
    },
  })
}

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('сохраняет пользователя в состоянии после входа', () => {
    const store = createStore()

    store.dispatch(setAuthUser(user))

    expect(selectAuthUser(store.getState())).toEqual(user)
    expect(selectIsAuthenticated(store.getState())).toBe(true)
  })

  it('сохраняет данные, полученные от сервера, в localStorage', () => {
    saveServerAuthUser(user)

    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)

    expect(saved).not.toBeNull()
    expect(JSON.parse(saved ?? 'null')).toEqual(user)
  })

  it('очищает пользователя и localStorage при выходе', async () => {
    const store = createStore()

    saveServerAuthUser(user)
    localStorage.setItem('skillswap_user_profile', JSON.stringify({ id: user.id }))
    store.dispatch(setAuthUser(user))

    await store.dispatch(logout())

    expect(selectAuthUser(store.getState())).toBeNull()
    expect(selectIsAuthenticated(store.getState())).toBe(false)
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)).toBeNull()
    expect(localStorage.getItem('skillswap_user_profile')).toBeNull()
  })

  it('не считает пользователя без токена авторизованным', () => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.AUTH_USER,
      JSON.stringify({
        id: 'user-01',
        name: 'Анна',
        email: 'anna.smirnova@example.com',
      }),
    )

    expect(getAuthUser()).toBeNull()
  })

  it('не считает повреждённую запись действующей сессией', () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_USER, 'неверные данные')

    expect(getAuthUser()).toBeNull()
  })
})
