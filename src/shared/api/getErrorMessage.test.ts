import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './getErrorMessage'

const errorWith = (data: unknown) => ({ status: 400, data })

describe('getErrorMessage', () => {
  it('достаёт message из ошибки RTK Query', () => {
    expect(getErrorMessage(errorWith({ message: 'Свой навык' }))).toBe('Свой навык')
  })

  it('игнорирует пустой message', () => {
    expect(getErrorMessage(errorWith({ message: '   ' }))).toBe(
      'Что-то пошло не так. Попробуйте ещё раз.',
    )
  })

  it('возвращает fallback, если message — не строка', () => {
    expect(getErrorMessage(errorWith({ message: 42 }))).toBe(
      'Что-то пошло не так. Попробуйте ещё раз.',
    )
  })

  it('возвращает кастомный fallback', () => {
    expect(getErrorMessage(new Error('fail'), 'Свой текст')).toBe('Свой текст')
  })

  it('не падает на null и примитивах', () => {
    expect(getErrorMessage(null)).toBe('Что-то пошло не так. Попробуйте ещё раз.')
    expect(getErrorMessage('string error')).toBe('Что-то пошло не так. Попробуйте ещё раз.')
  })
})
