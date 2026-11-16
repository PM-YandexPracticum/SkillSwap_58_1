import { describe, expect, it } from 'vitest'
import { profileUpdateQuery, type ProfileUpdatePayload } from './profileUpdateQuery'

const payload: ProfileUpdatePayload = {
  email: 'mariia@gmail.com',
  name: 'Мария',
  birthDate: '1995-10-28T00:00:00.000Z',
  gender: 'female',
  city: 'Москва',
  bio: 'Люблю учиться',
  avatar: null,
}

describe('profileUpdateQuery', () => {
  it('отправляет поля профиля JSON-запросом', () => {
    expect(profileUpdateQuery(payload)).toEqual({
      url: '/auth/me',
      method: 'PATCH',
      body: {
        email: payload.email,
        name: payload.name,
        birthDate: payload.birthDate,
        gender: payload.gender,
        city: payload.city,
        bio: payload.bio,
      },
    })
  })

  it('отправляет аватар отдельным файлом вместе с полями', () => {
    const avatar = new File(['photo'], 'photo.png', { type: 'image/png' })
    const query = profileUpdateQuery({ ...payload, avatar })

    expect(query.body).toBeInstanceOf(FormData)
    const form = query.body as FormData
    expect(form.get('avatar')).toBe(avatar)
    expect(JSON.parse(String(form.get('data')))).toEqual({
      email: payload.email,
      name: payload.name,
      birthDate: payload.birthDate,
      gender: payload.gender,
      city: payload.city,
      bio: payload.bio,
    })
  })
})
