import { useCallback } from 'react'
import { generatePath, Link } from 'react-router-dom'
import {
  removeNotification,
  selectNotifications,
  type NotificationItem,
} from '@/features/notifications'
import { ROUTES } from '@/shared/lib/constants'
import { IdeaIcon, Notification } from '@/shared/ui'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import styles from './NotificationStack.module.css'

interface NotificationStackItemProps {
  notification: NotificationItem
}

function NotificationStackItem({ notification }: NotificationStackItemProps) {
  const dispatch = useAppDispatch()

  const handleClose = useCallback(() => {
    dispatch(removeNotification(notification.id))
  }, [dispatch, notification.id])

  return (
    <Notification
      type={notification.type}
      title={notification.title}
      message={notification.message}
      duration={notification.duration}
      onClose={handleClose}
      icon={notification.exchangeSkillId && <IdeaIcon />}
      action={
        notification.exchangeSkillId && (
          <Link
            className={styles.link}
            to={generatePath(ROUTES.SKILL, {
              id: encodeURIComponent(notification.exchangeSkillId),
            })}
            onClick={handleClose}
          >
            Перейти
          </Link>
        )
      }
    />
  )
}

export function NotificationStack() {
  const notifications = useAppSelector(selectNotifications)

  // Берём последние пять записей, не изменяя список в Redux.
  const visibleNotifications = notifications.slice(-5).reverse()

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className={styles.stack} aria-label="Уведомления">
      {visibleNotifications.map((notification) => (
        <NotificationStackItem key={notification.id} notification={notification} />
      ))}
    </div>
  )
}
