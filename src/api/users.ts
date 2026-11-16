import type { FiltersState, User } from '@/shared/types'
import { INITIAL_FILTERS_STATE } from '@/shared/lib/constants'

const BASE_URL = '/api'

interface UsersResponse {
  items: User[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export async function fetchUsers(
  page = 1,
  limit = 10,
  sort = 'random',
  filters: FiltersState = INITIAL_FILTERS_STATE,
  signal?: AbortSignal,
): Promise<{ users: User[]; hasMore: boolean; total: number }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    delay: '100',
    sort,
    type: filters.mode === 'wantToLearn' ? 'learn' : filters.mode === 'canTeach' ? 'teach' : 'all',
  })
  if (filters.name?.trim()) params.set('name', filters.name.trim())
  if (filters.gender) params.set('gender', filters.gender === 'Мужской' ? 'male' : 'female')
  if (filters.cities.length === 1) params.set('city', filters.cities[0])
  else filters.cities.forEach((city) => params.append('city[]', city))
  filters.skillIds.forEach((id) => params.append('subCategoryId[]', id))

  const response = await fetch(`${BASE_URL}/users?${params}`, { signal })
  if (!response.ok) throw new Error('Failed to fetch users')
  const data: UsersResponse = await response.json()
  return { users: data.items, hasMore: data.hasMore, total: data.total }
}

export async function fetchUsersByIds(
  ids: string[],
  page = 1,
  limit = 12,
  name: string = '',
): Promise<{ users: User[]; hasMore: boolean }> {
  if (ids.length === 0) return { users: [], hasMore: false }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(name ? { name } : {}),
  })
  ids.forEach((id) => params.append('ids[]', id))

  const response = await fetch(`${BASE_URL}/users?${params}`)
  if (!response.ok) throw new Error('Не удалось загрузить избранных пользователей')

  const data: UsersResponse = await response.json()
  return { users: data.items, hasMore: data.hasMore }
}

export async function fetchUserById(id: string): Promise<User | undefined> {
  const { users } = await fetchUsers()
  return users.find((user) => user.id === id)
}
