import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { UserMenu } from './index'
import notificationHistoryReducer from '@/features/notifications/model/notificationHistorySlice'
import notificationsReducer from '@/features/notifications/model/notificationsSlice'
import authReducer, { setAuthUser } from '@/features/auth/model/authSlice'
import { LOCAL_STORAGE_KEYS, ROUTES } from '@/shared/lib/constants'
import type { AuthUser } from '@/shared/types'

const mockedNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  }
})

const user: AuthUser = {
  id: '1',
  name: 'Соня',
  email: 's@t.com',
  token: 't',
}

function renderUserMenu(authUser: AuthUser | null = null) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      notifications: notificationsReducer,
      notificationHistory: notificationHistoryReducer,
    },
    preloadedState: { auth: { user: authUser, profile: null } },
  })

  render(
    <Provider store={store}>
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    </Provider>,
  )

  return store
}

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('показывает кнопку "Войти" и не показывает иконки уведомлений для гостя', () => {
    renderUserMenu()

    expect(screen.getByText('Войти')).toBeInTheDocument()
    expect(screen.getByText('Зарегистрироваться')).toBeInTheDocument()
    expect(screen.queryByLabelText('Уведомления')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Избранное')).not.toBeInTheDocument()
  })

  it('показывает имя пользователя и иконки уведомлений', () => {
    renderUserMenu(user)

    expect(screen.getByText('Соня')).toBeInTheDocument()
    expect(screen.getByLabelText('Уведомления')).toBeInTheDocument()
    expect(screen.getByLabelText('Избранное')).toHaveAttribute('href', ROUTES.FAVORITES)
  })

  it('открывает дропдаун по клику на триггер', () => {
    renderUserMenu(user)

    fireEvent.click(screen.getByLabelText('Меню пользователя'))

    expect(screen.getByText('Личный кабинет')).toHaveAttribute('href', ROUTES.PROFILE)
    expect(screen.getByText('Выйти из аккаунта')).toBeInTheDocument()
  })

  it('очищает сессию и переводит в каталог при выходе из аккаунта', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_USER, JSON.stringify(user))
    const store = renderUserMenu(user)

    fireEvent.click(screen.getByLabelText('Меню пользователя'))
    fireEvent.click(screen.getByText('Выйти из аккаунта'))

    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith(ROUTES.HOME))
    expect(store.getState().auth.user).toBeNull()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)).toBeNull()
    expect(screen.getByText('Войти')).toBeInTheDocument()
    expect(store.getState().notifications.items).toEqual([
      expect.objectContaining({ type: 'success', message: 'Выход выполнен' }),
    ])
  })

  it('переключает тему по клику на луну', () => {
    renderUserMenu()

    fireEvent.click(screen.getByLabelText(/Включить темную тему/i))

    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.THEME)).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('обновляет меню при авторизации через Redux', () => {
    const store = renderUserMenu()

    act(() => {
      store.dispatch(setAuthUser(user))
    })

    expect(screen.getByText('Соня')).toBeInTheDocument()
    expect(screen.queryByText('Войти')).not.toBeInTheDocument()
  })
})
