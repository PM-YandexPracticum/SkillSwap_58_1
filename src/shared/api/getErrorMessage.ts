import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error
}

function extractMessage(error: FetchBaseQueryError): string | null {
  const { data } = error

  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string' &&
    data.message.trim() !== ''
  ) {
    return data.message
  }

  return null
}

/**
 * Достаёт готовый текст `{ message }` из ошибки RTK Query.
 * Если текста нет (сеть, 500 и т.д.) — возвращает общий fallback.
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Что-то пошло не так. Попробуйте ещё раз.',
): string {
  if (isFetchBaseQueryError(error)) {
    const message = extractMessage(error)

    if (message) {
      return message
    }
  }

  return fallback
}
