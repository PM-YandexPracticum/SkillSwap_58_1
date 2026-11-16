import { CITIES, type City } from '@/shared/lib/constants'
import type { ProfileFormValues } from '@/widgets/ProfileForm'
import type { ProfileUpdatePayload } from '@/features/auth/api/profileUpdateQuery'

type ProfileUpdateResult =
  | { ok: true; payload: ProfileUpdatePayload }
  | { ok: false; message: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ruDateToIso = (value: string): string | null => {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim())
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getTime() > Date.now()
  ) {
    return null
  }

  return date.toISOString()
}

export const toProfileUpdate = (values: ProfileFormValues): ProfileUpdateResult => {
  const email = values.email.trim().toLowerCase()
  const name = values.name.trim()
  const bio = values.bio.trim()
  const birthDate = ruDateToIso(values.birthDate)
  const city = CITIES.find((item) => item === values.city)

  if (!EMAIL_PATTERN.test(email)) return { ok: false, message: 'Укажите корректную почту' }
  if (name.length < 2) return { ok: false, message: 'Имя должно содержать минимум 2 символа' }
  if (!birthDate) return { ok: false, message: 'Укажите дату рождения' }
  if (values.gender !== 'female' && values.gender !== 'male') {
    return { ok: false, message: 'Укажите пол' }
  }
  if (!city) return { ok: false, message: 'Укажите город' }
  if (bio.length > 500) return { ok: false, message: 'О себе не длиннее 500 символов' }

  return {
    ok: true,
    payload: {
      email,
      name,
      birthDate,
      gender: values.gender,
      city: city as City,
      bio,
      avatar: values.avatar,
    },
  }
}
