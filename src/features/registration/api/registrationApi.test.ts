import { describe, it, expect } from 'vitest'
import { buildRegistrationFormData } from './registrationApi'
import type { RegistrationFormValues } from '../model/registrationSchema'

const mockFile = new File(['avatar'], 'avatar.png', { type: 'image/png' })
const values: RegistrationFormValues = {
  email: 'a@b.com',
  password: '12345678',
  name: 'Иван',
  birthDate: '01.01.1990',
  gender: 'male',
  city: 'Москва',
  wantedCategory: 'languages',
  wantedSubCategory: 'english',
  teachSkillName: 'Гитара',
  teachCategory: 'art',
  teachSubCategory: 'music-sound',
  teachDescription: 'Научу играть',
  avatar: null,
  teachImage: null,
}

describe('buildRegistrationFormData', () => {
  it('отправляет JSON формы в data с датой ISO UTC и вложенным навыком', () => {
    const formData = buildRegistrationFormData(values)

    expect(JSON.parse(String(formData.get('data')))).toEqual({
      email: values.email,
      password: values.password,
      name: values.name,
      birthDate: '1990-01-01T00:00:00.000Z',
      gender: values.gender,
      city: values.city,
      wantsToLearn: ['english'],
      canTeach: {
        title: 'Гитара',
        category: 'art',
        subCategory: 'music-sound',
        description: 'Научу играть',
      },
    })
    expect([...formData.keys()]).toEqual(['data'])
  })

  it('передаёт аватар и фото навыка в разных файловых полях одного запроса', () => {
    const teachImage = new File(['skill'], 'skill.png', { type: 'image/png' })
    const formData = buildRegistrationFormData({ ...values, avatar: mockFile, teachImage })

    expect(formData.get('avatar')).toBe(mockFile)
    expect(formData.getAll('images')).toEqual([teachImage])
    expect(formData.get('teachImage')).toBeNull()
  })
})
