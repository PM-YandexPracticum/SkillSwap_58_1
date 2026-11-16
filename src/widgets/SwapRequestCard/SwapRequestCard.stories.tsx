import type { Meta, StoryObj } from '@storybook/react-vite'
import { SwapRequestCard } from './SwapRequestCard'
import type { SwapRequestDetails, User, Skill } from '@/shared/types'
import { fn } from 'storybook/test'

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

const meta = {
  title: 'widgets/SwapRequestCard',
  component: SwapRequestCard,
} satisfies Meta<typeof SwapRequestCard>

export default meta
type Story = StoryObj<typeof meta>

export const IncomingPending: Story = {
  args: {
    request: baseRequest,
    currentUserId: 'user-2',
    onAccept: fn(),
    onReject: fn(),
  },
}

export const OutgoingPending: Story = {
  args: {
    request: baseRequest,
    currentUserId: 'user-1',
    onCancel: fn(),
  },
}

export const Rejected: Story = {
  args: {
    request: { ...baseRequest, status: 'rejected' },
    currentUserId: 'user-1',
    onDelete: fn(),
  },
}

export const Accepted: Story = {
  args: {
    request: { ...baseRequest, status: 'accepted' },
    currentUserId: 'user-1',
  },
}

export const Loading: Story = {
  args: {
    request: baseRequest,
    currentUserId: 'user-2',
    isLoading: true,
  },
}
