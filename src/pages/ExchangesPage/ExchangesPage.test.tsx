import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { authSlice } from '@/features/auth/model/authSlice'
import ExchangesPage from './index'
import * as swapRequestApi from '@/entities/request/model/api/swapRequestApi'
import type { SwapRequestDetails, User } from '@/shared/types'

vi.mock('@/entities/request/model/api/swapRequestApi', () => ({
  useRespondToSwapRequestMutation: vi.fn(),
  useDeleteSwapRequestMutation: vi.fn(),
}))

vi.mock('@/features/exchange/model/useSwapRequestsList', () => ({
  useSwapRequestsList: vi.fn(),
}))

vi.mock('@/features/notifications/model/useNotify', () => ({
  useNotify: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

import { useSwapRequestsList } from '@/features/exchange/model/useSwapRequestsList'

const createTestStore = (profile: User | null = null) => {
  const store = configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        user: profile
          ? {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              token: 'mock',
            }
          : null,
        profile: profile as User | null,
      },
    },
  })
  return store
}

const mockRequest: SwapRequestDetails = {
  id: 'req-1',
  skillId: 'skill-1',
  fromUserId: 'user-1',
  toUserId: 'user-2',
  status: 'pending',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  fromUser: {
    id: 'user-1',
    name: 'Инициатор',
    email: 'init@test.com',
    avatarUrl: null,
    birthDate: '1990-01-01',
    gender: 'male',
    city: 'Москва',
    bio: '',
    createdAt: '2025-01-01',
    likes: [],
    canTeach: { id: 's1', category: 'art', subCategory: 'music-sound' },
    wantsToLearn: [],
  },
  toUser: {
    id: 'user-2',
    name: 'Получатель',
    email: 'rec@test.com',
    avatarUrl: null,
    birthDate: '1992-01-01',
    gender: 'female',
    city: 'Москва',
    bio: '',
    createdAt: '2025-01-01',
    likes: [],
    canTeach: { id: 's2', category: 'art', subCategory: 'music-sound' },
    wantsToLearn: [],
  },
  skill: {
    id: 'skill-1',
    title: 'Навык получателя',
    description: '',
    type: 'teach',
    category: 'art',
    subCategory: 'music-sound',
    tags: [],
    imageUrls: [],
    authorId: 'user-2',
    createdAt: '',
  },
  offeredSkill: {
    id: 'skill-2',
    title: 'Навык инициатора',
    description: '',
    type: 'teach',
    category: 'art',
    subCategory: 'music-sound',
    tags: [],
    imageUrls: [],
    authorId: 'user-1',
    createdAt: '',
  },
}

const createEmptyList = () => ({
  items: [],
  isLoading: false,
  hasMore: false,
  loadMore: vi.fn(),
  removeItem: vi.fn(),
  addItem: vi.fn(),
  reset: vi.fn(),
})

const createListWithItem = (item: SwapRequestDetails) => ({
  items: [item],
  isLoading: false,
  hasMore: false,
  loadMore: vi.fn(),
  removeItem: vi.fn(),
  addItem: vi.fn(),
  reset: vi.fn(),
})

describe('ExchangesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('показывает пустое состояние, если нет заявок', () => {
    vi.mocked(useSwapRequestsList).mockReturnValue(createEmptyList())

    vi.mocked(swapRequestApi.useRespondToSwapRequestMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as unknown as ReturnType<typeof swapRequestApi.useRespondToSwapRequestMutation>)
    vi.mocked(swapRequestApi.useDeleteSwapRequestMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as unknown as ReturnType<typeof swapRequestApi.useDeleteSwapRequestMutation>)

    const store = createTestStore(mockRequest.fromUser)

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ExchangesPage />
        </MemoryRouter>
      </Provider>,
    )

    expect(screen.getByText('У вас пока нет обменов')).toBeInTheDocument()
  })

  it('позволяет принять входящую заявку', async () => {
    const respondMock = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve() })
    const deleteMock = vi.fn()

    vi.mocked(swapRequestApi.useRespondToSwapRequestMutation).mockReturnValue([
      respondMock,
      { isLoading: false },
    ] as unknown as ReturnType<typeof swapRequestApi.useRespondToSwapRequestMutation>)
    vi.mocked(swapRequestApi.useDeleteSwapRequestMutation).mockReturnValue([
      deleteMock,
      { isLoading: false },
    ] as unknown as ReturnType<typeof swapRequestApi.useDeleteSwapRequestMutation>)

    vi.mocked(useSwapRequestsList).mockImplementation(({ role }) => {
      if (role === 'incoming') return createListWithItem(mockRequest)
      return createEmptyList()
    })

    const store = createTestStore(mockRequest.toUser)

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ExchangesPage />
        </MemoryRouter>
      </Provider>,
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Принять' }))

    await waitFor(() => {
      expect(respondMock).toHaveBeenCalledWith({ id: 'req-1', status: 'accepted' })
    })
  })

  it('позволяет отклонить входящую заявку', async () => {
    const respondMock = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve() })

    vi.mocked(swapRequestApi.useRespondToSwapRequestMutation).mockReturnValue([
      respondMock,
      { isLoading: false },
    ] as unknown as ReturnType<typeof swapRequestApi.useRespondToSwapRequestMutation>)
    vi.mocked(swapRequestApi.useDeleteSwapRequestMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as unknown as ReturnType<typeof swapRequestApi.useDeleteSwapRequestMutation>)

    vi.mocked(useSwapRequestsList).mockImplementation(({ role }) => {
      if (role === 'incoming') return createListWithItem(mockRequest)
      return createEmptyList()
    })

    const store = createTestStore(mockRequest.toUser)

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ExchangesPage />
        </MemoryRouter>
      </Provider>,
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Отклонить' }))

    await waitFor(() => {
      expect(respondMock).toHaveBeenCalledWith({ id: 'req-1', status: 'rejected' })
    })
  })

  it('позволяет отменить свою исходящую заявку', async () => {
    const deleteMock = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve() })

    vi.mocked(swapRequestApi.useRespondToSwapRequestMutation).mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as unknown as ReturnType<typeof swapRequestApi.useRespondToSwapRequestMutation>)
    vi.mocked(swapRequestApi.useDeleteSwapRequestMutation).mockReturnValue([
      deleteMock,
      { isLoading: false },
    ] as unknown as ReturnType<typeof swapRequestApi.useDeleteSwapRequestMutation>)

    vi.mocked(useSwapRequestsList).mockImplementation(({ role, status }) => {
      if (role === 'outgoing' && status === 'pending') return createListWithItem(mockRequest)
      return createEmptyList()
    })

    const store = createTestStore(mockRequest.fromUser)

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ExchangesPage />
        </MemoryRouter>
      </Provider>,
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Отменить' }))

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith('req-1')
    })
  })
})
