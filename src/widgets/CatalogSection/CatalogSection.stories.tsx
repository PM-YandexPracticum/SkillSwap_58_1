import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { User } from '@/shared/types'
import { CatalogSection } from './index'

const users: User[] = Array.from({ length: 12 }, (_, index) => ({
  id: `demo-user-${index + 1}`,
  name: `Пользователь ${index + 1}`,
  email: `user${index + 1}@example.com`,
  avatarUrl: '/db/avatars/figma/anna.jpg',
  birthDate: '1995-02-08',
  gender: 'female',
  city: 'Санкт-Петербург',
  bio: '',
  createdAt: '2025-01-16T11:15:00.000Z',
  likes: [],
  canTeach: {
    id: `demo-skill-${index + 1}`,
    category: 'art',
    subCategory: 'music-sound',
  },
  wantsToLearn: ['acting', 'german'],
}))

function CatalogSectionPreview() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  const handleFavoriteToggle = (user: User) => {
    setFavoriteIds((previous) =>
      previous.includes(user.id) ? previous.filter((id) => id !== user.id) : [...previous, user.id],
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 48,
        padding: 24,
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <CatalogSection
        title="Популярное"
        users={users}
        favoriteIds={favoriteIds}
        onDetails={(user) => console.info('Подробнее:', user.id)}
        onFavoriteToggle={handleFavoriteToggle}
      />

      <CatalogSection
        title="Новое"
        users={users.slice(3)}
        favoriteIds={favoriteIds}
        onDetails={(user) => console.info('Подробнее:', user.id)}
        onFavoriteToggle={handleFavoriteToggle}
      />

      <CatalogSection
        title="Рекомендуем"
        users={users.slice(0, 3)}
        favoriteIds={favoriteIds}
        onDetails={(user) => console.info('Подробнее:', user.id)}
        onFavoriteToggle={handleFavoriteToggle}
        showExpandButton={false}
      />
    </div>
  )
}

const meta = {
  title: 'widgets/CatalogSection',
  component: CatalogSection,
  args: {
    title: 'Каталог',
    users,
    favoriteIds: [],
    onDetails: () => {},
    onFavoriteToggle: () => {},
  },
} satisfies Meta<typeof CatalogSection>

export default meta
type Story = StoryObj<typeof meta>

export const SeveralSections: Story = {
  render: () => <CatalogSectionPreview />,
}

export const WithSkeletons: Story = {
  render: () => (
    <div
      style={{
        padding: 24,
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <CatalogSection
        title="Загрузка (скелетоны)"
        users={users.slice(0, 5)}
        favoriteIds={[]}
        onDetails={() => {}}
        onFavoriteToggle={() => {}}
        hasMore={true}
        isLoadingMore={true}
        onLoadMore={() => console.log('Загрузка еще...')}
      />
    </div>
  ),
}
