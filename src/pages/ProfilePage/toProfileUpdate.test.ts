import { describe, expect, it } from 'vitest'
import type { ProfileFormValues } from '@/widgets/ProfileForm'
import { toProfileUpdate } from './toProfileUpdate'

const values: ProfileFormValues = {
  email: ' Mariia@gmail.com ',
  name: ' Мария ',
  birthDate: '28.10.1995',
  gender: 'female',
  city: 'Москва',
  bio: ' Люблю учиться ',
  avatar: null,
}

describe('toProfileUpdate', () => {
  it('переводит дату формы в ISO UTC и обрезает текстовые поля', () => {
    const result = toProfileUpdate(values)

    expect(result).toEqual({
      ok: true,
      payload: {
        email: 'mariia@gmail.com',
        name: 'Мария',
        birthDate: '1995-10-28T00:00:00.000Z',
        gender: 'female',
        city: 'Москва',
        bio: 'Люблю учиться',
        avatar: null,
      },
    })
  })

  it('оставляет файл аватара в запросе', () => {
    const avatar = new File(['photo'], 'photo.png', { type: 'image/png' })
    const result = toProfileUpdate({ ...values, avatar })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.payload.avatar).toBe(avatar)
  })

  it('не принимает пустые обязательные поля и неверную дату', () => {
    expect(toProfileUpdate({ ...values, name: 'А' })).toMatchObject({ ok: false })
    expect(toProfileUpdate({ ...values, gender: '' })).toMatchObject({ ok: false })
    expect(toProfileUpdate({ ...values, city: 'Город' })).toMatchObject({ ok: false })
    expect(toProfileUpdate({ ...values, birthDate: '31.02.1995' })).toMatchObject({ ok: false })
    expect(toProfileUpdate({ ...values, birthDate: '28.10.2995' })).toMatchObject({ ok: false })
  })
})
