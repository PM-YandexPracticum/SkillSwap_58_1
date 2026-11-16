import type { CategoryId, City, SubCategoryId } from '@/shared/lib/constants'

// ─── Skill ───────────────────────────────────────────────
export type SkillType = 'teach' | 'learn'

export interface Skill {
  id: string
  title: string
  description: string
  type: SkillType
  category: CategoryId
  subCategory: SubCategoryId
  tags: string[]
  imageUrls: string[]
  authorId: string
  createdAt: string
}

// ─── User ────────────────────────────────────────────────
export interface TeachSkill {
  id: string
  category: CategoryId
  subCategory: SubCategoryId
}

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  birthDate: string
  gender: 'female' | 'male'
  city: City
  bio: string
  createdAt: string
  likes: string[]
  canTeach: TeachSkill
  wantsToLearn: SubCategoryId[]
}

// ─── Request ─────────────────────────────────────────────
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'inProgress' | 'done'

export interface SwapRequest {
  id: string
  skillId: string
  fromUserId: string
  toUserId: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
}

/** Заявка на обмен вместе с участниками и навыками обеих сторон. */
export interface SwapRequestDetails extends SwapRequest {
  fromUser: User
  toUser: User
  /** Навык получателя, на который предложен обмен. */
  skill: Skill
  /** Навык инициатора, который он предлагает взамен. */
  offeredSkill: Skill
}

// ─── Auth ────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  token: string
  avatarUrl?: string | null
}

// ─── Filters ─────────────────────────────────────────────
export type FilterMode = 'all' | 'wantToLearn' | 'canTeach'
export type Gender = 'Мужской' | 'Женский'

export interface FiltersState {
  mode: FilterMode
  gender: Gender | null
  cities: string[]
  skillIds: SubCategoryId[]
  name: string | null
}
