import { configureStore } from '@reduxjs/toolkit'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INITIAL_FILTERS_STATE } from '@/shared/lib/constants'
import type { FiltersState, User } from '@/shared/types'
import CatalogPage from './index'

const { loadUsersMock, useOutgoingPendingSkillIdsMock } = vi.hoisted(() => ({
  loadUsersMock: vi.fn(
    (_params: { page?: number; sort: string; filters?: FiltersState }) => () =>
      Object.assign(Promise.resolve(), { abort: vi.fn() }),
  ),
  useOutgoingPendingSkillIdsMock: vi.fn<() => string[]>(() => []),
}))

vi.mock('@/entities/user/model/usersSlice', () => ({
  loadUsers: loadUsersMock,
}))

vi.mock('@/features/exchange', () => ({
  useOutgoingPendingSkillIds: useOutgoingPendingSkillIdsMock,
}))

function createUsers(count: number): User[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `user-${index + 1}`,
    name: `Пользователь ${index + 1}`,
    email: `user${index + 1}@example.com`,
    avatarUrl: null,
    birthDate: '1995-02-08',
    gender: 'female',
    city: 'Санкт-Петербург',
    bio: '',
    createdAt: '2025-01-16T11:15:00.000Z',
    likes: [],
    canTeach: {
      id: `skill-${index + 1}`,
      category: 'art',
      subCategory: 'music-sound',
    },
    wantsToLearn: ['acting'],
  }))
}

type UsersState = {
  popularUsers: User[]
  newUsers: User[]
  recommendedUsers: User[]
  pages: { popular: number; new: number; random: number }
  hasMore: { popular: boolean; new: boolean; random: boolean }
  isPopularLoading: boolean
  isNewLoading: boolean
  isRecommendedLoading: boolean
  errors: Partial<Record<'popular' | 'new' | 'random', string>>
}

const defaultUsersState: UsersState = {
  popularUsers: [],
  newUsers: [],
  recommendedUsers: [],
  pages: { popular: 0, new: 0, random: 0 },
  hasMore: { popular: true, new: true, random: true },
  isPopularLoading: false,
  isNewLoading: false,
  isRecommendedLoading: false,
  errors: {},
}

function renderCatalogPage(usersState: UsersState = defaultUsersState, initialEntry = '/') {
  const store = configureStore({
    reducer: { users: (state = usersState) => state },
  })

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <CatalogPage />
        </MemoryRouter>
      </Provider>,
    ),
  }
}

describe('CatalogPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    loadUsersMock.mockClear()
    useOutgoingPendingSkillIdsMock.mockReturnValue([])
  })

  it('запрашивает первую страницу популярных, новых и рекомендуемых пользователей', () => {
    renderCatalogPage()

    expect(loadUsersMock).toHaveBeenCalledTimes(3)
    expect(loadUsersMock).toHaveBeenNthCalledWith(1, {
      page: 1,
      sort: 'popular',
      filters: INITIAL_FILTERS_STATE,
    })
    expect(loadUsersMock).toHaveBeenNthCalledWith(2, {
      page: 1,
      sort: 'new',
      filters: INITIAL_FILTERS_STATE,
    })
    expect(loadUsersMock).toHaveBeenNthCalledWith(3, {
      page: 1,
      sort: 'random',
      filters: INITIAL_FILTERS_STATE,
    })
  })

  it('показывает каталоги пользователей для всех трёх подборок', () => {
    renderCatalogPage({
      ...defaultUsersState,
      popularUsers: createUsers(1),
      newUsers: createUsers(2),
      recommendedUsers: createUsers(1),
    })

    expect(screen.getByRole('region', { name: 'Популярное' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Новое' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Рекомендуем' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Подробнее' })).toHaveLength(4)
  })

  it('показывает скелетоны для подборок, которые ещё загружаются и пока пусты', () => {
    renderCatalogPage({
      ...defaultUsersState,
      isPopularLoading: true,
      isNewLoading: true,
    })

    expect(document.querySelectorAll('[aria-hidden="true"]')).toHaveLength(24)
    expect(screen.getByRole('region', { name: 'Рекомендуем' })).toBeInTheDocument()
  })

  it('показывает ошибку конкретной подборки, не скрывая остальные', () => {
    renderCatalogPage({
      ...defaultUsersState,
      errors: { popular: 'Сервис временно недоступен' },
      newUsers: createUsers(1),
      recommendedUsers: createUsers(1),
    })

    expect(
      screen.getByRole('heading', { name: 'Ошибка: Сервис временно недоступен' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Новое' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Рекомендуем' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Популярное' })).not.toBeInTheDocument()
  })

  it('запрашивает следующую страницу популярного каталога при раскрытии списка', async () => {
    const user = userEvent.setup()
    const users = createUsers(4)

    class MockIntersectionObserver {
      readonly root = null
      readonly rootMargin = ''
      readonly scrollMargin = ''
      readonly thresholds = []

      constructor(private callback: IntersectionObserverCallback) {}

      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        )
      }

      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    renderCatalogPage({
      ...defaultUsersState,
      popularUsers: users,
      pages: { popular: 2, new: 0, random: 0 },
    })

    const popularSection = screen.getByRole('region', { name: 'Популярное' })
    await user.click(within(popularSection).getByRole('button', { name: 'Смотреть все' }))

    expect(loadUsersMock).toHaveBeenCalledWith({
      page: 3,
      sort: 'popular',
      filters: INITIAL_FILTERS_STATE,
    })
  })

  it('передаёт name из URL при загрузке следующих страниц', async () => {
    const user = userEvent.setup()
    const users = createUsers(4)

    class MockIntersectionObserver {
      readonly root = null
      readonly rootMargin = ''
      readonly scrollMargin = ''
      readonly thresholds = []

      constructor(private callback: IntersectionObserverCallback) {}

      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        )
      }

      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    renderCatalogPage(
      {
        ...defaultUsersState,
        popularUsers: users,
        pages: { popular: 2, new: 0, random: 0 },
      },
      '/?name=Музыка%20и%20звук',
    )

    const popularSection = screen.getByRole('region', { name: 'Популярное' })
    await user.click(within(popularSection).getByRole('button', { name: 'Смотреть все' }))

    expect(loadUsersMock).toHaveBeenCalledWith({
      page: 3,
      sort: 'popular',
      filters: { ...INITIAL_FILTERS_STATE, name: 'Музыка и звук' },
    })
  })
})
