import { describe, expect, it } from 'vitest'
import type { AuthUser } from '@/shared/types'
import { apiErrorMessage, nextAuthUser, profileDateFromIso, toProfileDefaults } from './profileUser'

const current: AuthUser = {
  id: 'user-01',
  name: 'Анна',
  email: 'anna@example.com',
  token: 'token-user-01',
}

describe('profileUser', () => {
  it('переводит дату профиля в формат поля', () => {
    expect(profileDateFromIso('1990-01-01T00:00:00.000Z')).toBe('01.01.1990')
    expect(profileDateFromIso('не дата')).toBe('')
  })

  it('собирает начальные значения формы', () => {
    expect(
      toProfileDefaults({
        email: 'anna@example.com',
        name: 'Анна',
        birthDate: '1990-01-01T00:00:00.000Z',
        gender: 'female',
        city: 'Москва',
        bio: 'Учу рисовать',
      }),
    ).toEqual({
      email: 'anna@example.com',
      name: 'Анна',
      birthDate: '01.01.1990',
      gender: 'female',
      city: 'Москва',
      bio: 'Учу рисовать',
    })
  })

  it('возвращает новую сессию только когда изменились имя, почта или аватар', () => {
    expect(
      nextAuthUser(current, {
        id: 'user-01',
        name: 'Анна',
        email: 'anna@example.com',
        avatarUrl: null,
      }),
    ).toBeNull()

    expect(
      nextAuthUser(current, {
        id: 'user-01',
        name: 'Мария',
        email: 'anna@example.com',
        avatarUrl: null,
      }),
    ).toEqual({
      ...current,
      name: 'Мария',
      avatarUrl: null,
    })
  })

  it('читает сообщение ошибки API', () => {
    expect(apiErrorMessage({ data: { message: 'Этот email уже занят' } })).toBe(
      'Этот email уже занят',
    )
    expect(apiErrorMessage({ status: 500 })).toBe('Не удалось сохранить профиль')
  })
})
