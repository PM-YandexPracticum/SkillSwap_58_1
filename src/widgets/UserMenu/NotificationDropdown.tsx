import { generatePath, Link } from 'react-router-dom'
import {
  clearReadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  selectNotificationHistory,
  type HistoryNotification,
} from '@/features/notifications'
import { ROUTES } from '@/shared/lib/constants'
import { BellIcon, Dropdown, IdeaIcon } from '@/shared/ui'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import styles from './NotificationDropdown.module.css'

const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

export function NotificationDropdown() {
  const dispatch = useAppDispatch()
  const history = useAppSelector(selectNotificationHistory)
  const notifications = history.slice().reverse()
  const unread = notifications.filter(({ isRead }) => !isRead)
  const read = notifications.filter(({ isRead }) => isRead)

  function renderItem(notification: HistoryNotification, close: () => void) {
    const { id, title, message, createdAt, isRead, skillId } = notification

    return (
      <li className={styles.item} key={id}>
        <span className={styles.itemIcon}>
          <IdeaIcon />
        </span>
        <div className={styles.itemBody}>
          <div className={styles.itemHeading}>
            <strong>{title}</strong>
            <time dateTime={createdAt}>{dateFormat.format(new Date(createdAt))}</time>
          </div>
          {message && <p>{message}</p>}
          {!isRead && skillId && (
            <Link
              className={styles.link}
              to={generatePath(ROUTES.SKILL, { id: encodeURIComponent(skillId) })}
              onClick={() => {
                dispatch(markNotificationRead(id))
                close()
              }}
            >
              Перейти
            </Link>
          )}
        </div>
      </li>
    )
  }

  return (
    <Dropdown triggerLabel="Уведомления" trigger={<BellIcon badge={unread.length > 0} />}>
      {(close) => (
        <div className={styles.panel}>
          {history.length === 0 ? (
            <p className={styles.empty}>Уведомлений пока нет</p>
          ) : (
            <>
              <section>
                <div className={styles.sectionHeading}>
                  <h2>Новые уведомления</h2>
                  <button
                    className={styles.textButton}
                    type="button"
                    disabled={unread.length === 0}
                    onClick={() => dispatch(markAllNotificationsRead())}
                  >
                    Прочитать все
                  </button>
                </div>
                {unread.length > 0 && (
                  <ul className={styles.list}>{unread.map((item) => renderItem(item, close))}</ul>
                )}
              </section>
              <section>
                <div className={styles.sectionHeading}>
                  <h2>Просмотренные</h2>
                  <button
                    className={styles.textButton}
                    type="button"
                    disabled={read.length === 0}
                    onClick={() => dispatch(clearReadNotifications())}
                  >
                    Очистить
                  </button>
                </div>
                {read.length > 0 && (
                  <ul className={styles.list}>{read.map((item) => renderItem(item, close))}</ul>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </Dropdown>
  )
}
