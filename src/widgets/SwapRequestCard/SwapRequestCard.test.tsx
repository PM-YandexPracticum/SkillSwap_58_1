import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SwapRequestCard } from './SwapRequestCard'
import type { SwapRequestDetails, User, Skill } from '@/shared/types'

const mockUser1: User = {
  id: 'user-1',
  name: 'Анна Смирнова',
  email: 'anna@example.com',
  avatarUrl: null,
  city: 'Москва',
  birthDate: '1998-05-15',
  gender: 'female',
  bio: '',
  createdAt: '2024-01-01',
  likes: [],
  canTeach: { id: '1', category: 'art', subCategory: 'music-sound' },
  wantsToLearn: [],
}

const mockUser2: User = {
  id: 'user-2',
  name: 'Иван Петров',
  email: 'ivan@example.com',
  avatarUrl: null,
  city: 'Санкт-Петербург',
  birthDate: '1995-10-20',
  gender: 'male',
  bio: '',
  createdAt: '2024-01-01',
  likes: [],
  canTeach: { id: '2', category: 'business', subCategory: 'personal-development' },
  wantsToLearn: [],
}

const mockSkill1: Skill = {
  id: 'skill-1',
  title: 'Звуковой дизайн',
  description: '',
  type: 'teach',
  category: 'art',
  subCategory: 'music-sound',
  tags: [],
  imageUrls: [],
  authorId: 'user-1',
  createdAt: '2024-01-01',
}

const mockSkill2: Skill = {
  id: 'skill-2',
  title: 'Управление',
  description: '',
  type: 'teach',
  category: 'business',
  subCategory: 'personal-development',
  tags: [],
  imageUrls: [],
  authorId: 'user-2',
  createdAt: '2024-01-01',
}

const baseRequest: SwapRequestDetails = {
  id: 'req-1',
  skillId: 'skill-1',
  fromUserId: 'user-1',
  toUserId: 'user-2',
  status: 'pending',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  fromUser: mockUser1,
  toUser: mockUser2,
  skill: mockSkill1,
  offeredSkill: mockSkill2,
}

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('SwapRequestCard', () => {
  it('показывает данные собеседника (а не текущего пользователя)', () => {
    renderWithRouter(<SwapRequestCard request={baseRequest} currentUserId="user-1" />)

    expect(screen.getByText(/Иван/)).toBeInTheDocument()
    expect(screen.queryByText(/Анна/)).not.toBeInTheDocument()
  })

  it('показывает кнопки "Принять" и "Отклонить" для входящей заявки', () => {
    renderWithRouter(<SwapRequestCard request={baseRequest} currentUserId="user-2" />)

    expect(screen.getByRole('button', { name: 'Принять' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Отклонить' })).toBeInTheDocument()
  })

  it('показывает кнопку "Отменить" для исходящей заявки', () => {
    renderWithRouter(<SwapRequestCard request={baseRequest} currentUserId="user-1" />)

    expect(screen.getByText('Ожидает ответа')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Отменить' })).toBeInTheDocument()
  })

  it('показывает кнопку "Удалить" для отклоненной заявки', () => {
    const rejectedRequest = { ...baseRequest, status: 'rejected' as const }
    renderWithRouter(<SwapRequestCard request={rejectedRequest} currentUserId="user-1" />)

    expect(screen.getByText('Отклонена')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument()
  })

  it('не показывает кнопок для подтвержденного обмена', () => {
    const acceptedRequest = { ...baseRequest, status: 'accepted' as const }
    renderWithRouter(<SwapRequestCard request={acceptedRequest} currentUserId="user-1" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('вызывает onAccept при клике на "Принять"', async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn()

    renderWithRouter(
      <SwapRequestCard request={baseRequest} currentUserId="user-2" onAccept={onAccept} />,
    )

    await user.click(screen.getByRole('button', { name: 'Принять' }))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('блокирует кнопки при isLoading = true', () => {
    renderWithRouter(
      <SwapRequestCard request={baseRequest} currentUserId="user-2" isLoading={true} />,
    )

    expect(screen.getByRole('button', { name: 'Принять' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Отклонить' })).toBeDisabled()
  })
})
