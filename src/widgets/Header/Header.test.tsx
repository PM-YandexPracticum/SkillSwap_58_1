import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'
import { Header } from './index'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import notificationHistoryReducer from '@/features/notifications/model/notificationHistorySlice'
import authReducer from '@/features/auth/model/authSlice'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'

function renderHeader() {
  const store = configureStore({
    reducer: { auth: authReducer, notificationHistory: notificationHistoryReducer },
    preloadedState: {
      auth: { user: null, profile: null },
    },
  })

  render(
    <Provider store={store}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </Provider>,
  )
}

describe('Header', () => {
  it('показывает логотип, ссылку «О проекте» и кнопку меню навыков', () => {
    renderHeader()

    const header = within(screen.getByRole('banner'))
    const expectedLinks = [
      ['SkillSwap', ROUTES.HOME],
      ['О проекте', ROUTES.ABOUT],
    ] as const

    expect(header.getAllByRole('link')).toHaveLength(expectedLinks.length)
    expect(header.getByRole('button', { name: 'Открыть меню навыков' })).toBeInTheDocument()

    for (const [name, href] of expectedLinks) {
      expect(header.getByRole('link', { name })).toHaveAttribute('href', href)
    }
  })

  it('показывает поле поиска с надписью "Искать навык"', () => {
    renderHeader()

    expect(screen.getByPlaceholderText('Искать навык')).toBeInTheDocument()
  })

  it('показывает кнопку войти', () => {
    renderHeader()

    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument()
  })

  it('показывает кнопку зарегистрироваться', () => {
    renderHeader()

    expect(screen.getByRole('button', { name: 'Зарегистрироваться' })).toBeInTheDocument()
  })

  it('выходит из аккаунта и переводит пользователя в каталог', async () => {
    const user = {
      id: 'user-01',
      name: 'Анна',
      email: 'anna.smirnova@example.com',
      token: 'token-user-01',
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_USER, JSON.stringify(user))

    const store = configureStore({
      reducer: { auth: authReducer, notificationHistory: notificationHistoryReducer },
      preloadedState: {
        auth: { user, profile: null },
      },
    })

    const userEvents = userEvent.setup()

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/profile']}>
          <Header />

          <Routes>
            <Route path="/profile" element={<p>Профиль</p>} />
            <Route path={ROUTES.HOME} element={<p>Каталог</p>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    )

    await userEvents.click(screen.getByRole('button', { name: 'Меню пользователя' }))
    await userEvents.click(screen.getByRole('button', { name: 'Выйти из аккаунта' }))

    expect(await screen.findByText('Каталог')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument()
    expect(store.getState().auth.user).toBeNull()
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)).toBeNull()
  })
})
