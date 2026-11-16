import { configureStore } from '@reduxjs/toolkit'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Provider } from 'react-redux'
import type { User } from '@/shared/types'
import usersReducer from '@/entities/user/model/usersSlice'
import authReducer from '@/features/auth/model/authSlice'
import { baseApi } from '@/shared/api'
import CatalogPage from './index'

const createUsers = (prefix: string, count: number): User[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    name: 'Анна Смирнова',
    email: 'anna.smirnova@example.com',
    avatarUrl: '/db/avatars/figma/anna.jpg',
    birthDate: '1995-02-08',
    gender: 'female',
    city: 'Санкт-Петербург',
    bio: '',
    createdAt: '2025-01-16T11:15:00.000Z',
    likes: [],
    canTeach: {
      id: 'anna-skill',
      category: 'art',
      subCategory: 'music-sound',
    },
    wantsToLearn: ['acting'],
  }))

const usersState = {
  favoriteUsers: [],
  pages: { popular: 1, new: 1, random: 1 },
  hasMore: { popular: false, new: false, random: false },
  isFavoritesLoading: false,
  favoritesPage: 0,
  favoritesHasMore: false,
  favoritesError: null,
  favoritesIdsKey: '',
  isExpanded: false,
}

interface CatalogPageStoryArgs {
  popularCount: number
  popularLoading: boolean
  popularError: string
  newCount: number
  newLoading: boolean
  newError: string
  recommendedCount: number
  recommendedLoading: boolean
  recommendedError: string
}

function CatalogPageStory({
  popularCount,
  popularLoading,
  popularError,
  newCount,
  newLoading,
  newError,
  recommendedCount,
  recommendedLoading,
  recommendedError,
}: CatalogPageStoryArgs) {
  const state = {
    ...usersState,
    popularUsers: createUsers('popular', popularLoading ? 0 : popularCount),
    newUsers: createUsers('new', newLoading ? 0 : newCount),
    recommendedUsers: createUsers('recommended', recommendedLoading ? 0 : recommendedCount),
    isPopularLoading: popularLoading,
    isNewLoading: newLoading,
    isRecommendedLoading: recommendedLoading,
    errors: {
      ...(popularError ? { popular: popularError } : {}),
      ...(newError ? { new: newError } : {}),
      ...(recommendedError ? { random: recommendedError } : {}),
    },
  }
  const store = configureStore({
    reducer: { users: usersReducer, auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: { users: state },
  })

  return (
    <Provider store={store}>
      <CatalogPage />
    </Provider>
  )
}

const meta = {
  title: 'pages/CatalogPage',
  component: CatalogPageStory,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    popularCount: {
      name: 'Количество карточек',
      control: { type: 'number', min: 0, max: 12, step: 1 },
      table: { category: 'Популярное' },
    },
    popularLoading: { name: 'Загрузка', control: 'boolean', table: { category: 'Популярное' } },
    popularError: { name: 'Текст ошибки', control: 'text', table: { category: 'Популярное' } },
    newCount: {
      name: 'Количество карточек',
      control: { type: 'number', min: 0, max: 12, step: 1 },
      table: { category: 'Новое' },
    },
    newLoading: { name: 'Загрузка', control: 'boolean', table: { category: 'Новое' } },
    newError: { name: 'Текст ошибки', control: 'text', table: { category: 'Новое' } },
    recommendedCount: {
      name: 'Количество карточек',
      control: { type: 'number', min: 0, max: 12, step: 1 },
      table: { category: 'Рекомендуем' },
    },
    recommendedLoading: {
      name: 'Загрузка',
      control: 'boolean',
      table: { category: 'Рекомендуем' },
    },
    recommendedError: { name: 'Текст ошибки', control: 'text', table: { category: 'Рекомендуем' } },
  },
  args: {
    popularCount: 6,
    popularLoading: false,
    popularError: '',
    newCount: 4,
    newLoading: false,
    newError: '',
    recommendedCount: 5,
    recommendedLoading: false,
    recommendedError: '',
  },
} satisfies Meta<typeof CatalogPageStory>

export default meta
type Story = StoryObj<typeof meta>

export const Catalog: Story = {
  render: (args) => <CatalogPageStory {...args} />,
}
