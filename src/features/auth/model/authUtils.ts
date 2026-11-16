import type { AuthUser, User } from '@/shared/types'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'

/** Читает текущего авторизованного пользователя из localStorage */
export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_USER)

    if (!raw) {
      return null
    }

    const user: unknown = JSON.parse(raw)

    if (
      typeof user === 'object' &&
      user !== null &&
      'id' in user &&
      typeof user.id === 'string' &&
      'name' in user &&
      typeof user.name === 'string' &&
      'email' in user &&
      typeof user.email === 'string' &&
      'token' in user &&
      typeof user.token === 'string' &&
      user.token.length > 0
    ) {
      const avatarUrl =
        'avatarUrl' in user && (typeof user.avatarUrl === 'string' || user.avatarUrl === null)
          ? user.avatarUrl
          : undefined

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        token: user.token,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      }
    }

    return null
  } catch {
    return null
  }
}

/** Сохраняет пользователя и токен, полученные от сервера */
export function saveServerAuthUser(user: AuthUser): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_USER, JSON.stringify(user))
}

/** Удаляет пользователя из localStorage (logout) */
export function clearAuthUser(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_USER)
}

const PROFILE_STORAGE_KEY = 'skillswap_user_profile'

/** Сохраняет полный профиль, полученный от сервера */
export function saveUserProfile(profile: User): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

/** Удаляет сохраненный профиль */
export function clearUserProfile(): void {
  localStorage.removeItem(PROFILE_STORAGE_KEY)
}
