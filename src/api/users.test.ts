import { beforeEach, describe, expect, it, vi } from 'vitest'
import { INITIAL_FILTERS_STATE } from '@/shared/lib/constants'
import type { FilterMode } from '@/shared/types'
import { fetchUsers, fetchUsersByIds } from './users'

const fetchMock = vi.fn()

describe('fetchUsers query parameters', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], page: 1, limit: 10, total: 0, hasMore: false }),
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  it.each<[FilterMode, string]>([
    ['all', 'all'],
    ['wantToLearn', 'learn'],
    ['canTeach', 'teach'],
  ])('передаёт режим %s как type=%s', async (mode, type) => {
    await fetchUsers(1, 10, 'popular', { ...INITIAL_FILTERS_STATE, mode })

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.searchParams.get('type')).toBe(type)
  })

  it('кодирует name в URL и восстанавливает исходное значение при чтении параметров', async () => {
    const name = 'Музыка & звук + C++'
    await fetchUsers(1, 10, 'popular', { ...INITIAL_FILTERS_STATE, name })

    const requestUrl = String(fetchMock.mock.calls[0][0])
    const url = new URL(requestUrl, 'http://localhost')
    expect(requestUrl).toContain(`name=${new URLSearchParams({ name }).toString().slice(5)}`)
    expect(url.searchParams.get('name')).toBe(name)
    expect(url.searchParams.size).toBe(6)
  })

  it('не передаёт пустой name в запросе', async () => {
    await fetchUsers(1, 10, 'popular', { ...INITIAL_FILTERS_STATE, name: '' })

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.searchParams.has('name')).toBe(false)
  })
})

describe('fetchUsersByIds', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], page: 1, limit: 12, total: 0, hasMore: false }),
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  it('запрашивает избранных пользователей по ID, не используя каталог', async () => {
    await fetchUsersByIds(['user-01', 'user-03'], 2, 12)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.pathname).toBe('/api/users')
    expect(url.searchParams.getAll('ids[]')).toEqual(['user-01', 'user-03'])
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('limit')).toBe('12')
    expect(url.searchParams.has('sort')).toBe(false)
    expect(url.searchParams.has('type')).toBe(false)
  })

  it('передаёт название навыка при поиске среди избранных', async () => {
    await fetchUsersByIds(['user-01'], 1, 12, 'Гитара & звук')

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.searchParams.get('name')).toBe('Гитара & звук')
    expect(url.searchParams.getAll('ids[]')).toEqual(['user-01'])
  })

  it('возвращает пустой результат без запроса, если ID нет', async () => {
    await expect(fetchUsersByIds([])).resolves.toEqual({ users: [], hasMore: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('отклоняет запрос с понятной ошибкой при неуспешном ответе', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false })

    await expect(fetchUsersByIds(['user-01'])).rejects.toThrow(
      'Не удалось загрузить избранных пользователей',
    )
  })
})
