import { baseApi } from '@/shared/api'
import type { AuthUser } from '@/shared/types'
import type { RegistrationFormValues } from '../model/registrationSchema'

export const buildRegistrationFormData = (values: RegistrationFormValues): FormData => {
  const formData = new FormData()
  const [day, month, year] = values.birthDate.split('.')

  formData.append(
    'data',
    JSON.stringify({
      email: values.email,
      password: values.password,
      name: values.name,
      birthDate: new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString(),
      gender: values.gender,
      city: values.city,
      wantsToLearn: [values.wantedSubCategory],
      canTeach: {
        title: values.teachSkillName,
        category: values.teachCategory,
        subCategory: values.teachSubCategory,
        description: values.teachDescription,
      },
    }),
  )

  if (values.avatar) formData.append('avatar', values.avatar)
  if (values.teachImage) formData.append('images', values.teachImage)

  return formData
}

export const registrationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthUser, FormData>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useRegisterMutation } = registrationApi
