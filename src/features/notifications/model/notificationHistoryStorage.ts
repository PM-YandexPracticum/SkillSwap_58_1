import {
  initialNotificationHistory,
  type HistoryNotification,
  type NotificationHistoryState,
} from './notificationHistorySlice'

const STORAGE_KEY_PREFIX = 'skillswap_notification_history_'

function isHistoryNotification(value: unknown): value is HistoryNotification {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'message' in value &&
    typeof value.message === 'string' &&
    'createdAt' in value &&
    typeof value.createdAt === 'string' &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    'isRead' in value &&
    typeof value.isRead === 'boolean' &&
    (!('skillId' in value) || typeof value.skillId === 'string')
  )
}

export function readNotificationHistory(userId: string): NotificationHistoryState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + userId)
    const parsed: unknown = saved ? JSON.parse(saved) : null

    // Поддерживаем ранее сохраненную историю в формате массива.
    if (Array.isArray(parsed)) {
      return { ...initialNotificationHistory, items: parsed.filter(isHistoryNotification) }
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      'items' in parsed &&
      Array.isArray(parsed.items) &&
      'offeredSkillIds' in parsed &&
      Array.isArray(parsed.offeredSkillIds)
    ) {
      return {
        items: parsed.items.filter(isHistoryNotification),
        offeredSkillIds: parsed.offeredSkillIds.filter((id) => typeof id === 'string'),
      }
    }
  } catch {
    return initialNotificationHistory
  }

  return initialNotificationHistory
}

export function saveNotificationHistory(userId: string, history: NotificationHistoryState): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(history))
  } catch (error) {
    console.error('Не удалось сохранить историю уведомлений', error)
  }
}
