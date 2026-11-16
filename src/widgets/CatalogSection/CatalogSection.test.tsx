import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { User } from '@/shared/types'
import { CatalogSection } from './CatalogSection'

const { useOutgoingPendingSkillIdsMock } = vi.hoisted(() => ({
  useOutgoingPendingSkillIdsMock: vi.fn<() => string[]>(() => []),
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

describe('CatalogSection', () => {
  beforeEach(() => {
    useOutgoingPendingSkillIdsMock.mockReturnValue([])
  })

  it('показывает 3 карточки, раскрывает все загруженные и сворачивает обратно', async () => {
    const user = userEvent.setup()

    render(
      <CatalogSection
        title="Популярное"
        users={createUsers(12)}
        favoriteIds={[]}
        onDetails={() => {}}
        onFavoriteToggle={() => {}}
      />,
    )

    expect(screen.getAllByRole('button', { name: 'Подробнее' })).toHaveLength(3)

    const toggle = screen.getByRole('button', { name: 'Смотреть все' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)

    expect(screen.getAllByRole('button', { name: 'Подробнее' })).toHaveLength(12)
    expect(screen.getByRole('button', { name: 'Скрыть' })).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('button', { name: 'Скрыть' }))

    expect(screen.getAllByRole('button', { name: 'Подробнее' })).toHaveLength(3)
  })

  it('не показывает кнопку раскрытия, если карточек не больше трёх', () => {
    render(
      <CatalogSection
        title="Новое"
        users={createUsers(3)}
        favoriteIds={[]}
        onDetails={() => {}}
        onFavoriteToggle={() => {}}
      />,
    )

    expect(screen.getAllByRole('button', { name: 'Подробнее' })).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Смотреть все' })).not.toBeInTheDocument()
  })

  it('передаёт выбранного пользователя в обработчик', async () => {
    const user = userEvent.setup()
    const users = createUsers(2)
    const onDetails = vi.fn()

    render(
      <CatalogSection
        title="Каталог"
        users={users}
        favoriteIds={[]}
        onDetails={onDetails}
        onFavoriteToggle={() => {}}
      />,
    )

    const section = screen.getByRole('region', { name: 'Каталог' })
    const detailsButtons = within(section).getAllByRole('button', { name: 'Подробнее' })

    await user.click(detailsButtons[1])

    expect(onDetails).toHaveBeenCalledWith(users[1])
  })

  it('позволяет скрыть кнопку раскрытия', () => {
    render(
      <CatalogSection
        title="Рекомендуем"
        users={createUsers(5)}
        favoriteIds={[]}
        onDetails={() => {}}
        onFavoriteToggle={() => {}}
        showExpandButton={false}
      />,
    )

    expect(screen.getAllByRole('button', { name: 'Подробнее' })).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Смотреть все' })).not.toBeInTheDocument()
  })

  it('показывает «Обмен предложен» только у карточки с предложенным навыком', () => {
    useOutgoingPendingSkillIdsMock.mockReturnValue(['skill-2'])

    render(
      <CatalogSection
        title="Каталог"
        users={createUsers(3)}
        favoriteIds={[]}
        onDetails={() => {}}
        onFavoriteToggle={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Обмен предложен' })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Подробнее' })).toHaveLength(2)
  })

  it('показывает 9 скелетонов при isLoadingMore = true и hasMore = true', async () => {
    const user = userEvent.setup()
    render(
      <CatalogSection
        title="Тест скелетонов"
        users={createUsers(5)}
        favoriteIds={[]}
        onDetails={() => {}}
        onFavoriteToggle={() => {}}
        hasMore={true}
        isLoadingMore={true}
      />,
    )

    expect(screen.queryAllByTestId('user-card-skeleton')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Смотреть все' }))

    expect(screen.queryByText('Загружаем ещё…')).not.toBeInTheDocument()

    const skeletons = screen.getAllByTestId('user-card-skeleton')
    expect(skeletons).toHaveLength(9)
  })

  it('не показывает скелетоны, если isLoadingMore = false', async () => {
    const user = userEvent.setup()
    render(
      <CatalogSection
        title="Тест без загрузки"
        users={createUsers(5)}
        favoriteIds={[]}
        onDetails={() => {}}
        onFavoriteToggle={() => {}}
        hasMore={true}
        isLoadingMore={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Смотреть все' }))

    const skeletons = screen.queryAllByTestId('user-card-skeleton')
    expect(skeletons).toHaveLength(0)
  })
})
