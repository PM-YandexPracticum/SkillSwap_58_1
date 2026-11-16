import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { swapRequestApi } from './swapRequestApi'
import { baseApi } from '@/shared/api'
import { store } from '@/store'
import { logout } from '@/features/auth/model/authSlice'

const mockDetails = {
  id: 'swap-01',
  skillId: 'skill-07',
  fromUserId: 'user-01',
  toUserId: 'user-02',
  status: 'pending',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  fromUser: {},
  toUser: {},
  skill: {},
  offeredSkill: {},
}

let fetchMock: ReturnType<typeof vi.fn>

// fetchBaseQuery передаёт в fetch один аргумент — объект Request,
// URL, метод и тело лежат внутри него
const getCall = (index: number): Request => {
  const call = fetchMock.mock.calls[index]

  if (!call) {
    throw new Error(`fetch был вызван ${fetchMock.mock.calls.length} раз, а ожидалось ${index + 1}`)
  }

  const [input] = call

  if (!(input instanceof Request)) {
    throw new Error('ожидался объект Request из fetchBaseQuery')
  }

  return input
}

const readBody = async (request: Request): Promise<string> => request.clone().text()

beforeEach(() => {
  fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify(mockDetails), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  )
  vi.stubGlobal('fetch', fetchMock)
  store.dispatch(baseApi.util.resetApiState())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

afterAll(() => {
  store.dispatch(baseApi.util.resetApiState())
})

describe('swapRequestApi', () => {
  it('GET отправляет role и status в query, только если они заданы', async () => {
    await store.dispatch(
      swapRequestApi.endpoints.getSwapRequests.initiate({ role: 'incoming', status: 'pending' }),
    )

    const request = getCall(0)
    const params = new URL(request.url).searchParams
    expect(request.url).toContain('/api/swap-requests')
    expect(params.get('role')).toBe('incoming')
    expect(params.get('status')).toBe('pending')
    expect(params.has('page')).toBe(false)
    expect(params.has('limit')).toBe(false)
  })

  it('GET без аргументов не добавляет параметров', async () => {
    await store.dispatch(swapRequestApi.endpoints.getSwapRequests.initiate({}))

    const request = getCall(0)
    const params = new URL(request.url).searchParams

    expect(request.url).toContain('/api/swap-requests')
    expect([...params.keys()]).toEqual([])
  })

  it('POST отправляет skillId и инвалидирует тег SwapRequest', async () => {
    await store.dispatch(swapRequestApi.endpoints.getSwapRequests.initiate({}))

    await store.dispatch(
      swapRequestApi.endpoints.createSwapRequest.initiate({ skillId: 'skill-07' }),
    )

    const request = getCall(1)
    expect(request.method).toBe('POST')
    expect(JSON.parse(await readBody(request))).toEqual({ skillId: 'skill-07' })

    const invalidated = baseApi.util.selectInvalidatedBy(store.getState(), ['SwapRequest'])
    expect(invalidated.length).toBeGreaterThan(0)
  })

  it('PATCH отправляет статус и инвалидирует тег SwapRequest', async () => {
    await store.dispatch(swapRequestApi.endpoints.getSwapRequests.initiate({}))

    await store.dispatch(
      swapRequestApi.endpoints.respondToSwapRequest.initiate({
        id: 'swap-01',
        status: 'accepted',
      }),
    )

    const request = getCall(1)
    expect(request.url).toContain('/api/swap-requests/swap-01')
    expect(request.method).toBe('PATCH')
    expect(JSON.parse(await readBody(request))).toEqual({ status: 'accepted' })

    const invalidated = baseApi.util.selectInvalidatedBy(store.getState(), ['SwapRequest'])
    expect(invalidated.length).toBeGreaterThan(0)
  })

  it('DELETE уходит без тела и инвалидирует тег SwapRequest', async () => {
    await store.dispatch(swapRequestApi.endpoints.getSwapRequests.initiate({}))

    fetchMock.mockImplementationOnce(async () => new Response(null, { status: 204 }))

    await store.dispatch(swapRequestApi.endpoints.deleteSwapRequest.initiate('swap-01'))

    const request = getCall(1)
    expect(request.url).toContain('/api/swap-requests/swap-01')
    expect(request.method).toBe('DELETE')
    expect(await readBody(request)).toBe('')

    const invalidated = baseApi.util.selectInvalidatedBy(store.getState(), ['SwapRequest'])
    expect(invalidated.length).toBeGreaterThan(0)
  })

  it('кеш заявок сбрасывается при выходе', async () => {
    await store.dispatch(swapRequestApi.endpoints.getSwapRequests.initiate({ role: 'outgoing' }))

    expect(Object.keys(store.getState()[baseApi.reducerPath].queries)).not.toHaveLength(0)

    await store.dispatch(logout())

    expect(store.getState()[baseApi.reducerPath].queries).toEqual({})
  })
})
