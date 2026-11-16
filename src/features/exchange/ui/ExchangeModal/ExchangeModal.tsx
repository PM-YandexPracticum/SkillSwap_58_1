import { BellIcon, Button, Modal, Text, Title } from '@/shared/ui'
import styles from './ExchangeModal.module.css'

interface ExchangeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ExchangeModal({ isOpen, onClose }: ExchangeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className={styles.bell}>
        <BellIcon size={100} />
      </div>
      <div className={styles.body}>
        <div className={styles.content}>
          <Title level={3}>Вы предложили обмен</Title>
          <Text>Теперь дождитесь подтверждения. Вам придёт уведомление</Text>
        </div>
        <Button className={styles.button} onClick={onClose}>
          Готово
        </Button>
      </div>
    </Modal>
  )
}
