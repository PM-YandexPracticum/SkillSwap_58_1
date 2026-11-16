import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'
import notificationsReducer from './notificationsSlice'
import { useNotify } from './useNotify'

function setup() {
  const store = configureStore({ reducer: { notifications: notificationsReducer } })

  function wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }

  const hook = renderHook(() => useNotify(), { wrapper })
  return { store, ...hook }
}

describe('useNotify', () => {
  it('success, error и info добавляют уведомление нужного типа с заголовком по умолчанию', () => {
    const { store, result } = setup()

    act(() => {
      result.current.success('Готово')
      result.current.error('Не вышло')
      result.current.info('К сведению')
    })

    expect(store.getState().notifications.items).toEqual([
      expect.objectContaining({
        type: 'success',
        title: 'Успешно',
        message: 'Готово',
        duration: 5000,
      }),
      expect.objectContaining({
        type: 'error',
        title: 'Ошибка',
        message: 'Не вышло',
        duration: 5000,
      }),
      expect.objectContaining({
        type: 'info',
        title: 'Инфо',
        message: 'К сведению',
        duration: 5000,
      }),
    ])
  })

  it('принимает свой заголовок, длительность и exchangeSkillId', () => {
    const { store, result } = setup()

    act(() => {
      result.current.success('Рисование', 'Вы предложили обмен', {
        exchangeSkillId: 'skill-1',
        duration: 1000,
      })
    })

    expect(store.getState().notifications.items[0]).toMatchObject({
      title: 'Вы предложили обмен',
      message: 'Рисование',
      duration: 1000,
      exchangeSkillId: 'skill-1',
    })
  })

  it('без exchangeSkillId не добавляет это поле: такие уведомления не попадают в историю', () => {
    const { store, result } = setup()

    act(() => {
      result.current.error('Ошибка сети')
    })

    expect(store.getState().notifications.items[0]).not.toHaveProperty('exchangeSkillId')
  })

  it('возвращает стабильную ссылку между рендерами', () => {
    const { result, rerender } = setup()
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })
})
