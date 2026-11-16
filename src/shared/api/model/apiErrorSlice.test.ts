import { describe, it, expect } from 'vitest'
import reducer, { setApiError, clearApiError } from './apiErrorSlice'

describe('apiErrorSlice', () => {
  it('возвращает начальное состояние', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual({
      status: null,
    })
  })

  it('сохраняет ошибку 404', () => {
    const state = reducer(undefined, setApiError(404))

    expect(state.status).toBe(404)
  })

  it('сохраняет ошибку 500', () => {
    const state = reducer(undefined, setApiError(500))

    expect(state.status).toBe(500)
  })

  it('сбрасывает ошибку', () => {
    const stateWithError = reducer(undefined, setApiError(404))
    const clearedState = reducer(stateWithError, clearApiError())

    expect(clearedState.status).toBeNull()
  })
})
