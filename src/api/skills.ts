import type { Skill } from '@/shared/types'

const API_URL = 'http://localhost:4000/api'

export async function fetchSkills(params?: { type?: string; category?: string }): Promise<Skill[]> {
  const url = new URL(`${API_URL}/skills`, window.location.origin)

  if (params?.type) {
    url.searchParams.append('type', params.type)
  }
  if (params?.category) {
    url.searchParams.append('category', params.category)
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error('Не удалось загрузить навыки')
  }

  const data = await response.json()

  return data.items
}
