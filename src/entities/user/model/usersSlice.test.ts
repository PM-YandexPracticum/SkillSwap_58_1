import { configureStore } from '@reduxjs/toolkit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { INITIAL_FILTERS_STATE } from '@/shared/lib/constants'
import type { User } from '@/shared/types'
import usersReducer, { loadUsers } from './usersSlice'

function deferredResponse() {
  let resolve!: (value: Response) => void
  const promise = new Promise<Response>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
function response(id: string, hasMore = false) {
  return new Response(JSON.stringify({ items: [{ id } as User], hasMore, total: 1 }))
}
const makeStore = () => configureStore({ reducer: { users: usersReducer } })

afterEach(() => vi.unstubAllGlobals())

describe('каталог при смене фильтров', () => {
  it('запускает новый фильтр во время загрузки и игнорирует запоздалый ответ', async () => {
    const first = deferredResponse()
    const second = deferredResponse()
    const fetchMock = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    vi.stubGlobal('fetch', fetchMock)
    const store = makeStore()
    const oldRequest = store.dispatch(
      loadUsers({ sort: 'popular', filters: INITIAL_FILTERS_STATE }),
    )
    const latest = store.dispatch(
      loadUsers({ sort: 'popular', filters: { ...INITIAL_FILTERS_STATE, name: 'Гитара' } }),
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
    second.resolve(response('guitar'))
    await latest
    first.resolve(response('old'))
    await oldRequest
    expect(store.getState().users.popularUsers.map((user) => user.id)).toEqual(['guitar'])
  })

  it('сбрасывает старые страницы и не подмешивает ответ догрузки другого фильтра', async () => {
    const oldPage = deferredResponse()
    const nextFilter = deferredResponse()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response('first', true))
        .mockReturnValueOnce(oldPage.promise)
        .mockReturnValueOnce(nextFilter.promise),
    )
    const store = makeStore()
    await store.dispatch(loadUsers({ sort: 'new' }))
    const more = store.dispatch(loadUsers({ sort: 'new', page: 2 }))
    const fresh = store.dispatch(
      loadUsers({ sort: 'new', filters: { ...INITIAL_FILTERS_STATE, gender: 'Женский' } }),
    )
    expect(store.getState().users.newUsers).toEqual([])
    expect(store.getState().users.pages.new).toBe(0)
    oldPage.resolve(response('stale-page'))
    await more
    expect(store.getState().users.isNewLoading).toBe(true)
    nextFilter.resolve(response('filtered'))
    await fresh
    expect(store.getState().users.newUsers.map((user) => user.id)).toEqual(['filtered'])
    expect(store.getState().users.pages.new).toBe(1)
  })

  it('передаёт отмену в fetch и не показывает AbortError пользователю', async () => {
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, _init?: RequestInit) => new Promise<Response>(() => undefined),
    )
    vi.stubGlobal('fetch', fetchMock)
    const store = makeStore()
    const request = store.dispatch(loadUsers({ sort: 'random' }))
    request.abort()
    await request
    const options = fetchMock.mock.calls[0][1] as RequestInit
    expect(options.signal?.aborted).toBe(true)
    expect(store.getState().users.errors.random).toBeUndefined()
    expect(store.getState().users.isRecommendedLoading).toBe(false)
  })

  it('после исчерпания списка допускает первую страницу новых фильтров', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(response('first')).mockResolvedValueOnce(response('next')),
    )
    const store = makeStore()
    await store.dispatch(loadUsers({ sort: 'popular' }))
    expect(store.getState().users.hasMore.popular).toBe(false)
    await store.dispatch(
      loadUsers({ sort: 'popular', filters: { ...INITIAL_FILTERS_STATE, name: 'Музыка' } }),
    )
    expect(store.getState().users.popularUsers.map((user) => user.id)).toEqual(['next'])
  })
})
