import { ROUTES } from './constants'

export interface AuthRedirectState {
  from?: string
}

const AUTH_ROUTES: string[] = [ROUTES.LOGIN, ROUTES.REGISTER]

// Возвращает страницу, с которой пользователь пришёл на вход или регистрацию
export function getAuthReturnPath(state: unknown): string {
  if (state && typeof state === 'object' && 'from' in state) {
    const { from } = state as AuthRedirectState
    const pathname = from?.split(/[?#]/)[0]

    if (typeof from === 'string' && from.startsWith('/') && !AUTH_ROUTES.includes(pathname ?? '')) {
      return from
    }
  }

  return ROUTES.HOME
}
