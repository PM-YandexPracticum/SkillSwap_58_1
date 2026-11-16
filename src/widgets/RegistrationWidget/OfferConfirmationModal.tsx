import { ReactNode } from 'react'
import { Modal, Title, Text, Button } from '@/shared/ui'
import penIcon from './pen.svg'
import styles from './OfferConfirmationModal.module.css'

interface OfferConfirmationModalProps {
  isOpen: boolean
  /** «Редактировать» — закрывает модалку, пользователь возвращается к шагу 3 */
  onClose: () => void
  /** «Готово» — подтверждение данных */
  onConfirm: () => void
  /** Пока запрос на бекенд в полёте: кнопки неактивны */
  isLoading?: boolean
  /** Сообщение об ошибке регистрации (400/409/сеть) — показывается внутри модалки */
  error?: string | null
  /** Содержимое модалки: описание навыка + галерея (виджет) */
  children: ReactNode
}

export function OfferConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  error = null,
  children,
}: OfferConfirmationModalProps) {
  const handleClose = () => {
    if (!isLoading) onClose()
  }
  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className={styles.content}>
        <div className={styles.header}>
          <Title level={2} className={styles.headerTitle}>
            Ваше предложение
          </Title>
          <Text variant="sm" className={styles.headerSubtitle}>
            Пожалуйста, проверьте и подтвердите правильность данных
          </Text>
        </div>

        <div className={styles.body}>
          {children}

          {isLoading && (
            <p className={styles.pending} role="status">
              Отправляем данные…
            </p>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="md"
            trailingIcon={<img src={penIcon} alt="" width={24} height={24} />}
            onClick={handleClose}
            disabled={isLoading}
          >
            Редактировать
          </Button>
          <Button variant="primary" size="md" disabled={isLoading} onClick={onConfirm}>
            Готово
          </Button>
        </div>
      </div>
    </Modal>
  )
}
