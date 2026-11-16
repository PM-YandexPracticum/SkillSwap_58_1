import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, describe, expect, it, vi } from 'vitest'
import notificationsReducer, {
  addNotification,
} from '@/features/notifications/model/notificationsSlice'
import { NotificationStack } from './NotificationStack'

function createTestStore() {
  return configureStore({
    reducer: {
      notifications: notificationsReducer,
    },
  })
}

function addTestNotification(
  store: ReturnType<typeof createTestStore>,
  title: string,
  duration = 0,
) {
  store.dispatch(
    addNotification({
      type: 'info',
      title,
      message: `Сообщение: ${title}`,
      duration,
    }),
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('NotificationStack', () => {
  it('ничего не показывает, если уведомлений нет', () => {
    const store = createTestStore()

    const { container } = render(
      <Provider store={store}>
        <NotificationStack />
      </Provider>,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('показывает последние пять уведомлений: новые сверху', () => {
    const store = createTestStore()

    for (let number = 1; number <= 6; number += 1) {
      addTestNotification(store, `Уведомление ${number}`)
    }

    render(
      <Provider store={store}>
        <NotificationStack />
      </Provider>,
    )

    const titles = screen.getAllByRole('heading', { level: 4 })

    expect(titles.map((title) => title.textContent)).toEqual([
      'Уведомление 6',
      'Уведомление 5',
      'Уведомление 4',
      'Уведомление 3',
      'Уведомление 2',
    ])

    expect(screen.queryByText('Уведомление 1')).not.toBeInTheDocument()
    expect(store.getState().notifications.items).toHaveLength(6)
  })

  it('удаляет закрытое уведомление и показывает следующее', () => {
    const store = createTestStore()

    for (let number = 1; number <= 6; number += 1) {
      addTestNotification(store, `Уведомление ${number}`)
    }

    render(
      <Provider store={store}>
        <NotificationStack />
      </Provider>,
    )

    const newestNotification = screen.getByText('Уведомление 6').closest('div')?.parentElement

    expect(newestNotification).not.toBeNull()

    if (!newestNotification) {
      throw new Error('Плашка уведомления не найдена')
    }

    fireEvent.click(within(newestNotification).getByRole('button', { name: 'Закрыть' }))

    expect(screen.queryByText('Уведомление 6')).not.toBeInTheDocument()
    expect(screen.getByText('Уведомление 1')).toBeInTheDocument()
    expect(store.getState().notifications.items).toHaveLength(5)
  })

  it('удаляет уведомление после окончания таймера', () => {
    vi.useFakeTimers()

    const store = createTestStore()
    addTestNotification(store, 'Временное уведомление', 5000)

    render(
      <Provider store={store}>
        <NotificationStack />
      </Provider>,
    )

    expect(screen.getByText('Временное уведомление')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.queryByText('Временное уведомление')).not.toBeInTheDocument()
    expect(store.getState().notifications.items).toHaveLength(0)
  })
})
