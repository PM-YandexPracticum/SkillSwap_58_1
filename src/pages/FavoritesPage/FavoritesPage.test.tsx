import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/shared/types'
import authReducer from '@/features/auth/model/authSlice'
import { useGetAuthMeQuery, useRemoveLikeMutation } from '@/features/auth/api/authApi'
import usersReducer from '@/entities/user/model/usersSlice'
import { fetchUsersByIds } from '@/api/users'
import FavoritesPage from './index'

vi.mock('@/features/auth/api/authApi', () => ({
  useGetAuthMeQuery: vi.fn(),
  useRemoveLikeMutation: vi.fn(),
}))

vi.mock('@/api/users', () => ({
  fetchUsers: vi.fn(),
  fetchUsersByIds: vi.fn(),
}))

vi.mock('@/widgets', () => ({
  CatalogSection: ({
    title,
    users,
    onLoadMore,
    onFavoriteToggle,
  }: {
    title: string
    users: User[]
    onLoadMore: () => void
    onFavoriteToggle: (user: User) => void
  }) => (
    <section aria-label={title}>
      {users.map((user) => (
        <div key={user.id}>
          <p>{user.name}</p>
          <button type="button" onClick={() => onFavoriteToggle(user)}>
            Убрать из избранного {user.id}
          </button>
        </div>
      ))}
      <button type="button" onClick={onLoadMore}>
        Загрузить ещё
      </button>
    </section>
  ),
}))

const queryMock = vi.mocked(useGetAuthMeQuery)
const removeLikeMutationMock = vi.mocked(useRemoveLikeMutation)
const fetchUsersByIdsMock = vi.mocked(fetchUsersByIds)
const removeLikeMock = vi.fn()

const createUser = (id: string): User => ({
  id,
  name: `Пользователь ${id}`,
  email: `${id}@example.com`,
  avatarUrl: null,
  birthDate: '1995-02-08',
  gender: 'female',
  city: 'Москва',
  bio: '',
  createdAt: '2025-01-16T11:15:00.000Z',
  likes: [],
  canTeach: { id: `skill-${id}`, category: 'art', subCategory: 'music-sound' },
  wantsToLearn: ['acting'],
})

function renderFavoritesPage(initialEntry = '/') {
  const store = configureStore({ reducer: { users: usersReducer, auth: authReducer } })
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <FavoritesPage />
      </MemoryRouter>
    </Provider>,
  )

  return { store, ...view }
}

describe('FavoritesPage', () => {
  beforeEach(() => {
    fetchUsersByIdsMock.mockReset()
    queryMock.mockReset()
    removeLikeMock.mockReset()
    removeLikeMutationMock.mockReturnValue([removeLikeMock] as never)
  })

  it('загружает пользователей по likes, а не запрашивает общий каталог', async () => {
    const user = createUser('user-01')
    queryMock.mockReturnValue({ data: { ...user, likes: ['user-02', 'user-03'] } } as never)
    fetchUsersByIdsMock.mockResolvedValue({ users: [createUser('user-02')], hasMore: false })

    renderFavoritesPage()

    expect(await screen.findByText('Пользователь user-02')).toBeVisible()
    await waitFor(() => {
      expect(fetchUsersByIdsMock).toHaveBeenCalledWith(['user-02', 'user-03'], 1, 12)
    })
  })

  it('передаёт поисковый запрос в выборку избранного и сохраняет фильтр при загрузке следующей страницы', async () => {
    const user = userEvent.setup()
    queryMock.mockReturnValue({ data: { ...createUser('current'), likes: ['user-02'] } } as never)
    fetchUsersByIdsMock
      .mockResolvedValueOnce({ users: [createUser('user-02')], hasMore: true })
      .mockResolvedValueOnce({ users: [createUser('user-03')], hasMore: false })

    renderFavoritesPage('/?name=%20%D0%93%D0%B8%D1%82%D0%B0%D1%80%D0%B0%20')

    await screen.findByText('Пользователь user-02')
    expect(fetchUsersByIdsMock).toHaveBeenNthCalledWith(1, ['user-02'], 1, 12, 'Гитара')
    await user.click(screen.getByRole('button', { name: 'Загрузить ещё' }))

    expect(await screen.findByText('Пользователь user-03')).toBeVisible()
    expect(fetchUsersByIdsMock).toHaveBeenNthCalledWith(2, ['user-02'], 2, 12, 'Гитара')
  })

  it('показывает пустое состояние и не делает запрос каталога при пустом likes', async () => {
    queryMock.mockReturnValue({ data: { ...createUser('current'), likes: [] } } as never)

    renderFavoritesPage()

    expect(await screen.findByRole('button', { name: 'Вернуться в каталог' })).toBeVisible()
    expect(fetchUsersByIdsMock).not.toHaveBeenCalled()
  })

  it('запрашивает и отображает следующую страницу избранного', async () => {
    const user = userEvent.setup()
    queryMock.mockReturnValue({ data: { ...createUser('current'), likes: ['user-02'] } } as never)
    fetchUsersByIdsMock
      .mockResolvedValueOnce({ users: [createUser('user-02')], hasMore: true })
      .mockResolvedValueOnce({ users: [createUser('user-03')], hasMore: false })

    renderFavoritesPage()

    await screen.findByText('Пользователь user-02')
    await user.click(screen.getByRole('button', { name: 'Загрузить ещё' }))

    expect(await screen.findByText('Пользователь user-03')).toBeVisible()
    expect(fetchUsersByIdsMock).toHaveBeenNthCalledWith(2, ['user-02'], 2, 12)
  })

  it('показывает ошибку загрузки избранного', async () => {
    queryMock.mockReturnValue({ data: { ...createUser('current'), likes: ['user-02'] } } as never)
    fetchUsersByIdsMock.mockRejectedValueOnce(new Error('Ошибка сети'))

    renderFavoritesPage()

    expect(await screen.findByRole('heading', { name: /500|ошибка/i })).toBeVisible()
  })

  it('снимает лайк и удаляет карточку после успешного ответа сервера', async () => {
    const user = userEvent.setup()
    queryMock.mockReturnValue({
      data: { ...createUser('current'), likes: ['user-02', 'user-03'] },
    } as never)
    fetchUsersByIdsMock.mockResolvedValue({
      users: [createUser('user-02'), createUser('user-03')],
      hasMore: false,
    })
    const unwrap = vi.fn().mockResolvedValue(undefined)
    removeLikeMock.mockReturnValue({ unwrap })

    const { store } = renderFavoritesPage()
    await screen.findByText('Пользователь user-02')

    await user.click(screen.getByRole('button', { name: 'Убрать из избранного user-02' }))

    expect(removeLikeMock).toHaveBeenCalledWith('user-02')
    expect(unwrap).toHaveBeenCalledOnce()
    expect(screen.queryByText('Пользователь user-02')).not.toBeInTheDocument()
    expect(screen.getByText('Пользователь user-03')).toBeVisible()
    expect(store.getState().users.favoritesIdsKey).toBe('user-03\u0001')
  })

  it('оставляет карточку в избранном, если сервер не снял лайк', async () => {
    const user = userEvent.setup()
    queryMock.mockReturnValue({
      data: { ...createUser('current'), likes: ['user-02'] },
    } as never)
    fetchUsersByIdsMock.mockResolvedValue({ users: [createUser('user-02')], hasMore: false })
    const unwrap = vi.fn().mockRejectedValue(new Error('Ошибка сети'))
    removeLikeMock.mockReturnValue({ unwrap })

    renderFavoritesPage()
    await screen.findByText('Пользователь user-02')

    await user.click(screen.getByRole('button', { name: 'Убрать из избранного user-02' }))

    expect(removeLikeMock).toHaveBeenCalledWith('user-02')
    expect(screen.getByText('Пользователь user-02')).toBeVisible()
  })
})
