import type { City } from '@/shared/lib/constants'

export type ProfileUpdatePayload = {
  email: string
  name: string
  birthDate: string
  gender: 'female' | 'male'
  city: City
  bio: string
  avatar: File | null
}

type ProfileUpdateQuery = {
  url: '/auth/me'
  method: 'PATCH'
  body: FormData | Omit<ProfileUpdatePayload, 'avatar'>
}

export const profileUpdateQuery = (payload: ProfileUpdatePayload): ProfileUpdateQuery => {
  const { avatar, ...data } = payload
  if (!avatar) {
    return { url: '/auth/me', method: 'PATCH', body: data }
  }

  const form = new FormData()
  form.append('data', JSON.stringify(data))
  form.append('avatar', avatar)
  return { url: '/auth/me', method: 'PATCH', body: form }
}
