import type { AuthUser, Skill, User } from '@/shared/types'

export type StoredUser = User & { password: string }

export interface LoginRequest {
  email: string
  password: string
}

export type ProfileUpdate = Partial<
  Pick<User, 'email' | 'name' | 'birthDate' | 'gender' | 'city' | 'bio'>
>

export type RegisterRequest = LoginRequest &
  Pick<User, 'name' | 'birthDate' | 'gender' | 'city' | 'wantsToLearn'> & {
    canTeach: Pick<Skill, 'title' | 'category' | 'subCategory' | 'description'>
  }

export interface ApiError {
  message: string
}

export interface Paginated<T> {
  items: T[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export type AuthResponse = AuthUser | ApiError

export interface ListQuery {
  page?: string
  limit?: string
  sort?: string
  category?: string
  subCategory?: string
  type?: string
  q?: string
}

export interface SwapRequestListQuery extends Pick<ListQuery, 'page' | 'limit'> {
  role?: string
  status?: string
}

export interface UserListQuery extends ListQuery {
  gender?: string
  city?: string
  'city[]'?: string | string[]
  name?: string
  'ids[]'?: string | string[]
  'subCategoryId[]'?: string | string[]
}
