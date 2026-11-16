import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'
import authReducer, { logout, setAuthUser } from './authSlice'
import notificationsReducer from '@/features/notifications/model/notificationsSlice'
import { saveServerAuthUser } from './authUtils'
import { useAuthForm } from './useAuthForm'
import { MemoryRouter } from 'react-router'

const { loginMock, profileMock, loadingState } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  profileMock: vi.fn(),
  loadingState: { isLoading: false },
}))

vi.mock('../api/authApi', () => ({
  useLoginMutation: () => [loginMock, loadingState],
  authApi: {
    endpoints: {
      getAuthMe: {
        initiate: () => () => ({
          unwrap: profileMock,
        }),
      },
    },
  },
}))

const user = {
  id: 'user-01',
  name: 'Анна',
  email: 'anna.smirnova@example.com',
  token: 'token-user-01',
}

const profile = {
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

function AuthFormProbe() {
  const { register, handleSubmit, errors, isSubmitting, error } = useAuthForm()

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <input {...register('email')} />
      </label>

      <label>
        Пароль
        <input {...register('password')} />
      </label>

      <button type="submit" disabled={isSubmitting}>
        Войти
      </button>

      {errors.email?.message ? <p>{errors.email.message}</p> : null}
      {errors.password?.message ? <p>{errors.password.message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </form>
  )
}

function renderAuthForm() {
  const store = configureStore({
    reducer: { auth: authReducer, notifications: notificationsReducer },
    preloadedState: {
      auth: { user: null, profile: null },
    },
  })

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    )
  }

  return { store, ...render(<AuthFormProbe />, { wrapper }) }
}

describe('useAuthForm', () => {
  beforeEach(() => {
    localStorage.clear()
    loginMock.mockReset()
    profileMock.mockReset()
    profileMock.mockResolvedValue(profile)
    loadingState.isLoading = false
  })

  it('очищает сессию, если сервер отклонил токен при загрузке профиля', async () => {
    loginMock.mockReturnValue({
      unwrap: () => Promise.resolve(user),
    })

    profileMock.mockRejectedValue({ status: 401 })

    const userEvents = userEvent.setup()
    const { store } = renderAuthForm()

    await userEvents.type(screen.getByRole('textbox', { name: 'Email' }), user.email)
    await userEvents.type(screen.getByLabelText('Пароль'), 'test-password')
    await userEvents.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(store.getState().auth.user).toBeNull()
    })

    expect(store.getState().auth.profile).toBeNull()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)).toBeNull()
    expect(localStorage.getItem('skillswap_user_profile')).toBeNull()
  })

  it('не сохраняет старый профиль после выхода и повторного входа', async () => {
    loginMock.mockReturnValue({
      unwrap: () => Promise.resolve(user),
    })

    let finishProfileRequest!: (value: typeof profile) => void

    profileMock.mockReturnValue(
      new Promise<typeof profile>((resolve) => {
        finishProfileRequest = resolve
      }),
    )

    const userEvents = userEvent.setup()
    const { store } = renderAuthForm()

    await userEvents.type(screen.getByRole('textbox', { name: 'Email' }), user.email)
    await userEvents.type(screen.getByLabelText('Пароль'), 'test-password')
    await userEvents.click(screen.getByRole('button', { name: 'Войти' }))

    // Дожидаемся начала запроса профиля.
    await waitFor(() => {
      expect(profileMock).toHaveBeenCalled()
    })

    // Выходим и создаём новую сессию с тем же токеном.
    await act(async () => {
      await store.dispatch(logout())

      const newUser = { ...user }

      saveServerAuthUser(newUser)
      store.dispatch(setAuthUser(newUser))
    })

    // После повторного входа приходит ответ старого запроса.
    await act(async () => {
      finishProfileRequest(profile)
      await Promise.resolve()
    })

    expect(store.getState().auth.profile).toBeNull()
    expect(localStorage.getItem('skillswap_user_profile')).toBeNull()
  })

  it('не отправляет пустую форму и показывает ошибки полей', async () => {
    const userEvents = userEvent.setup()
    renderAuthForm()

    await userEvents.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Введите email')).toBeInTheDocument()
    expect(screen.getByText('Введите пароль')).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('блокирует кнопку, пока выполняется вход', async () => {
    loginMock.mockReturnValue({
      unwrap: () => new Promise<typeof user>(() => {}), // логин "висит"
    })

    const userEvents = userEvent.setup()
    renderAuthForm()

    await userEvents.type(screen.getByRole('textbox', { name: 'Email' }), user.email)
    await userEvents.type(screen.getByLabelText('Пароль'), 'test-password')
    await userEvents.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Войти' })).toBeDisabled()
    })
  })

  it('сохраняет данные и токен после успешного входа', async () => {
    loginMock.mockReturnValue({
      unwrap: () => Promise.resolve(user),
    })

    const userEvents = userEvent.setup()
    const { store } = renderAuthForm()

    await userEvents.type(screen.getByRole('textbox', { name: 'Email' }), user.email)
    await userEvents.type(screen.getByLabelText('Пароль'), 'test-password')
    await userEvents.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(store.getState().auth.user).toEqual(user)
    })

    expect(loginMock).toHaveBeenCalledWith({
      email: user.email,
      password: 'test-password',
    })

    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)

    expect(JSON.parse(saved ?? 'null')).toEqual(user)

    await waitFor(() => {
      expect(store.getState().auth.profile).toEqual(profile)
    })

    const savedProfile = localStorage.getItem('skillswap_user_profile')

    expect(JSON.parse(savedProfile ?? 'null')).toEqual(profile)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(store.getState().notifications.items).toEqual([
      expect.objectContaining({ type: 'success', message: 'Вы вошли в аккаунт' }),
    ])
  })

  it('показывает сообщение сервера при неверных данных', async () => {
    loginMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 401,
          data: { message: 'Неправильные почта или пароль' },
        }),
    })

    const userEvents = userEvent.setup()
    const { store } = renderAuthForm()

    await userEvents.type(screen.getByRole('textbox', { name: 'Email' }), user.email)
    await userEvents.type(screen.getByLabelText('Пароль'), 'wrong')
    await userEvents.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Неправильные почта или пароль')
    expect(store.getState().auth.user).toBeNull()
    expect(store.getState().notifications.items).toEqual([
      expect.objectContaining({ type: 'error', message: 'Неправильные почта или пароль' }),
    ])
  })

  it('показывает общее сообщение, если сервер недоступен', async () => {
    loginMock.mockReturnValue({
      unwrap: () => Promise.reject({ status: 'FETCH_ERROR' }),
    })

    const userEvents = userEvent.setup()
    renderAuthForm()

    await userEvents.type(screen.getByRole('textbox', { name: 'Email' }), user.email)
    await userEvents.type(screen.getByLabelText('Пароль'), 'test-password')
    await userEvents.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось войти. Попробуйте ещё раз.',
    )
  })

  it('показывает ошибку, если сервер вернул ответ без токена', async () => {
    loginMock.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          id: 'user-01',
          name: 'Анна',
          email: 'anna.smirnova@example.com',
        }),
    })

    const userEvents = userEvent.setup()
    const { store } = renderAuthForm()

    await userEvents.type(screen.getByRole('textbox', { name: 'Email' }), user.email)
    await userEvents.type(screen.getByLabelText('Пароль'), 'test-password')
    await userEvents.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось войти. Попробуйте ещё раз.',
    )

    expect(store.getState().auth.user).toBeNull()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)).toBeNull()
  })

  it('показывает общее сообщение при ошибке сервера 500', async () => {
    loginMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 500,
          data: { message: 'Внутренняя ошибка сервера' },
        }),
    })

    const userEvents = userEvent.setup()
    const { store } = renderAuthForm()

    await userEvents.type(screen.getByRole('textbox', { name: 'Email' }), user.email)
    await userEvents.type(screen.getByLabelText('Пароль'), 'test-password')
    await userEvents.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось войти. Попробуйте ещё раз.',
    )

    expect(store.getState().auth.user).toBeNull()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)).toBeNull()
  })

  it('показывает сообщение сервера при ошибке 400', async () => {
    loginMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 400,
          data: { message: 'Некорректные данные' },
        }),
    })

    const userEvents = userEvent.setup()
    const { store } = renderAuthForm()

    await userEvents.type(screen.getByRole('textbox', { name: 'Email' }), user.email)
    await userEvents.type(screen.getByLabelText('Пароль'), 'test-password')
    await userEvents.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Некорректные данные')
    expect(store.getState().auth.user).toBeNull()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)).toBeNull()
  })
})
