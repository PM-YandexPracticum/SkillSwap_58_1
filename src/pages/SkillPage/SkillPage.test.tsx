import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '@/pages/LoginPage'
import { setAuthUser, logout, selectAuthUser } from '@/features/auth/model/authSlice'
import { removeNotification } from '@/features/notifications'
import { store } from '@/store'
import { NotificationStack } from '@/widgets/NotificationStack'
import { UserMenu } from '@/widgets/UserMenu'
import { SkillPage } from './index'

const currentUser = { id: 'current', name: 'Соня', email: 's@example.com', token: 'mock' }
const otherUser = { id: 'other', name: 'Миша', email: 'm@example.com', token: 'mock' }

const skills = [
  { id: 'drawing', authorId: 'alice', title: 'Рисование' },
  { id: 'music', authorId: 'ivan', title: 'Музыка' },
]

const owners = [
  { id: 'alice', name: 'Алиса', city: 'Москва' },
  { id: 'ivan', name: 'Иван', city: 'Казань' },
]

const { useGetSwapRequestsQueryMock, useCreateSwapRequestMutationMock, outgoing, createRequest } =
  vi.hoisted(() => ({
    useGetSwapRequestsQueryMock: vi.fn(),
    useCreateSwapRequestMutationMock: vi.fn(),
    outgoing: {
      itemsByUser: {} as Record<
        string,
        { skillId: string; status: 'pending' | 'accepted' | 'rejected' }[]
      >,
      errorPayload: null as unknown,
      gate: null as Promise<void> | null,
    },
    createRequest: { current: null as null | ReturnType<typeof vi.fn> },
  }))

vi.mock('@/entities/request/model/api/swapRequestApi', () => ({
  useGetSwapRequestsQuery: useGetSwapRequestsQueryMock,
  useCreateSwapRequestMutation: useCreateSwapRequestMutationMock,
}))

function renderExchange() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/skill/drawing']}>
        <UserMenu />
        <Link to="/skill/music">Другой навык</Link>
        <Link to="/">В каталог</Link>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/skill/:id" element={<SkillPage />} />
          <Route path="/" element={<h1>Каталог</h1>} />
        </Routes>
        <NotificationStack />
      </MemoryRouter>
    </Provider>,
  )
}

describe('Уведомления об обмене', () => {
  beforeEach(() => {
    localStorage.clear()

    outgoing.itemsByUser = {}
    outgoing.errorPayload = null
    outgoing.gate = null

    useGetSwapRequestsQueryMock.mockImplementation(() => {
      const user = selectAuthUser(store.getState())
      return {
        data: { items: outgoing.itemsByUser[user?.id ?? ''] ?? [] },
        isLoading: false,
      }
    })

    const createMock = vi.fn(({ skillId }: { skillId: string }) => ({
      unwrap: async () => {
        await outgoing.gate
        outgoing.gate = null

        if (outgoing.errorPayload) throw outgoing.errorPayload

        const user = selectAuthUser(store.getState())
        const items = outgoing.itemsByUser[user?.id ?? ''] ?? []
        outgoing.itemsByUser[user?.id ?? ''] = items

        if (!items.some((item) => item.skillId === skillId)) {
          items.push({ skillId, status: 'pending' })
        }

        return { id: `request-${items.length}` }
      },
    }))

    createRequest.current = createMock
    useCreateSwapRequestMutationMock.mockReturnValue([createMock, { isLoading: false }])

    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: Request) => {
        const { pathname } = new URL(request.url)
        const [, , resource, id] = pathname.split('/')
        const items = resource === 'skills' ? skills : owners
        const data = items.find((item) => item.id === id)
        return data ? Response.json(data) : new Response(null, { status: 404 })
      }),
    )
    store.dispatch(setAuthUser(currentUser))
  })

  afterEach(async () => {
    cleanup()
    await store.dispatch(logout())
    store.getState().notifications.items.forEach(({ id }) => {
      store.dispatch(removeNotification(id))
    })
    vi.unstubAllGlobals()
  })

  it('отправляет заявку, показывает модалку «Вы предложили обмен» и уведомление', async () => {
    const user = userEvent.setup()
    renderExchange()

    await screen.findByText('Алиса')
    await user.click(screen.getByRole('button', { name: 'Предложить обмен' }))

    expect(createRequest.current).toHaveBeenCalledWith({ skillId: 'drawing' })
    expect(screen.getByText('Вы предложили обмен')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Обмен предложен' })).toBeDisabled()

    const toast = screen.getByLabelText('Уведомления', { selector: 'div' })
    expect(within(toast).getByText('Вы предложили обмен пользователю Алиса')).toBeVisible()
    expect(within(toast).getByRole('link', { name: 'Перейти' })).toHaveAttribute(
      'href',
      '/skill/drawing',
    )

    await user.click(screen.getByRole('button', { name: 'Готово' }))
    expect(screen.queryByText('Вы предложили обмен')).not.toBeInTheDocument()

    await user.click(within(toast).getByRole('button', { name: 'Закрыть' }))
  })

  it('неактивная кнопка «Обмен предложен», если исходящая заявка уже есть', async () => {
    outgoing.itemsByUser[currentUser.id] = [{ skillId: 'drawing', status: 'pending' }]

    renderExchange()

    await screen.findByText('Алиса')
    expect(screen.getByRole('button', { name: 'Обмен предложен' })).toBeDisabled()
    expect(createRequest.current).not.toHaveBeenCalled()
  })

  it('не отправляет второй запрос при повторном клике во время запроса', async () => {
    const user = userEvent.setup()
    renderExchange()

    await screen.findByText('Алиса')

    let release!: () => void
    outgoing.gate = new Promise<void>((resolve) => {
      release = resolve
    })

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Предложить обмен' }))
    })
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Предложить обмен' }))
    })

    expect(createRequest.current).toHaveBeenCalledTimes(1)

    await act(async () => {
      release()
    })
    expect(await screen.findByText('Вы предложили обмен')).toBeInTheDocument()
    expect(createRequest.current).toHaveBeenCalledTimes(1)
  })

  it('показывает ошибку сервера, не меняя состояние кнопки и не открывая модалку', async () => {
    const user = userEvent.setup()
    outgoing.errorPayload = {
      status: 409,
      data: { message: 'Пользователь уже предложил вам обмен: ответьте на его заявку' },
    }

    renderExchange()

    await screen.findByText('Алиса')
    await user.click(screen.getByRole('button', { name: 'Предложить обмен' }))

    const toast = await screen.findByLabelText('Уведомления', { selector: 'div' })
    expect(
      within(toast).getByText('Пользователь уже предложил вам обмен: ответьте на его заявку'),
    ).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(store.getState().notifications.items).toEqual([
      expect.objectContaining({ type: 'error', title: 'Ошибка' }),
    ])
    expect(store.getState().notifications.items[0]).not.toHaveProperty('exchangeSkillId')
    expect(store.getState().notificationHistory.items).toEqual([])

    expect(screen.getByRole('button', { name: 'Предложить обмен' })).toBeEnabled()
    expect(screen.queryByText('Вы предложили обмен')).not.toBeInTheDocument()
  })

  it('показывает общий текст ошибки, если сервер не вернул message', async () => {
    const user = userEvent.setup()
    outgoing.errorPayload = { status: 500 }

    renderExchange()

    await screen.findByText('Алиса')
    await user.click(screen.getByRole('button', { name: 'Предложить обмен' }))

    const toast = await screen.findByLabelText('Уведомления', { selector: 'div' })
    expect(
      within(toast).getByText('Не удалось отправить заявку на обмен. Попробуйте ещё раз.'),
    ).toBeVisible()
  })

  it('после выхода показывает тост, который остаётся видимым после перехода в каталог', async () => {
    const user = userEvent.setup()
    renderExchange()

    await screen.findByText('Алиса')
    await user.click(screen.getByLabelText('Меню пользователя'))
    await user.click(screen.getByText('Выйти из аккаунта'))

    expect(await screen.findByRole('heading', { name: 'Каталог' })).toBeVisible()
    const toast = screen.getByLabelText('Уведомления', { selector: 'div' })
    expect(within(toast).getByText('Выход выполнен')).toBeVisible()
    expect(store.getState().notifications.items).toHaveLength(1)
  })

  it('кнопка отражает заявки текущего аккаунта после смены пользователя', async () => {
    outgoing.itemsByUser[currentUser.id] = [{ skillId: 'drawing', status: 'pending' }]

    renderExchange()

    await screen.findByText('Алиса')
    expect(screen.getByRole('button', { name: 'Обмен предложен' })).toBeDisabled()

    act(() => {
      store.dispatch(setAuthUser(otherUser))
    })

    expect(await screen.findByRole('button', { name: 'Предложить обмен' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Обмен предложен' })).not.toBeInTheDocument()

    act(() => {
      store.dispatch(setAuthUser(currentUser))
    })

    expect(await screen.findByRole('button', { name: 'Обмен предложен' })).toBeDisabled()
  })

  it('создаёт плашку и запись из карточки навыка, открывает владельца и очищает только просмотренные', async () => {
    const user = userEvent.setup()
    renderExchange()

    const offer = await screen.findByRole('button', { name: 'Предложить обмен' })
    await screen.findByText('Алиса')
    await user.click(offer)

    const toast = screen.getByLabelText('Уведомления', { selector: 'div' })
    expect(within(toast).getByText('Вы предложили обмен пользователю Алиса')).toBeVisible()
    expect(within(toast).getByRole('link', { name: 'Перейти' })).toHaveAttribute(
      'href',
      '/skill/drawing',
    )
    await user.click(within(toast).getByRole('button', { name: 'Закрыть' }))

    await user.click(screen.getByRole('link', { name: 'Другой навык' }))
    await screen.findByText('Иван')
    await user.click(screen.getByRole('button', { name: 'Предложить обмен' }))
    await user.click(screen.getByRole('button', { name: 'Закрыть' }))
    await user.click(screen.getByRole('link', { name: 'В каталог' }))
    const bell = screen.getByRole('button', { name: 'Уведомления' })
    expect(bell.querySelector('circle')).not.toBeNull()
    await user.click(bell)

    const links = screen.getAllByRole('link', { name: 'Перейти' })
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/skill/music',
      '/skill/drawing',
    ])
    await user.click(links[1])
    expect(await screen.findByText('Алиса')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Обмен предложен' })).toBeDisabled()
    expect(screen.queryByText('Новые уведомления')).not.toBeInTheDocument()

    await user.click(bell)
    await user.click(screen.getByRole('button', { name: 'Очистить' }))
    expect(screen.queryByText('Вы предложили обмен пользователю Алиса')).not.toBeInTheDocument()
    expect(screen.getByText('Вы предложили обмен пользователю Иван')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Прочитать все' }))
    expect(screen.queryByRole('link', { name: 'Перейти' })).not.toBeInTheDocument()
    expect(bell.querySelector('circle')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Очистить' }))
    expect(screen.getByText('Уведомлений пока нет')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Обмен предложен' })).toBeDisabled()
  })

  it('возвращает гостя к навыку после входа без автоматического предложения обмена', async () => {
    await store.dispatch(logout())
    const user = userEvent.setup()
    renderExchange()

    await user.click(await screen.findByRole('button', { name: 'Предложить обмен' }))
    expect(screen.getByRole('region', { name: 'Вход' })).toBeVisible()
    expect(createRequest.current).not.toHaveBeenCalled()

    act(() => {
      store.dispatch(setAuthUser(currentUser))
    })

    expect(await screen.findByRole('heading', { name: 'Рисование' })).toBeVisible()
    await screen.findByText('Алиса')
    expect(screen.getByRole('button', { name: 'Предложить обмен' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Закрыть' })).not.toBeInTheDocument()
  })
})
