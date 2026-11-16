import { generatePath, Link } from 'react-router-dom'
import { Avatar, Button, Card, Text, Title, Chip } from '@/shared/ui'
import { getAgeWithDeclension } from '@/shared/lib/helpers'
import { ROUTES } from '@/shared/lib/constants'
import type { SwapRequestDetails } from '@/shared/types'
import styles from './SwapRequestCard.module.css'

interface SwapRequestCardProps {
  request: SwapRequestDetails
  currentUserId: string
  isLoading?: boolean
  onAccept?: () => void
  onReject?: () => void
  onCancel?: () => void
  onDelete?: () => void
}

export function SwapRequestCard({
  request,
  currentUserId,
  isLoading = false,
  onAccept,
  onReject,
  onCancel,
  onDelete,
}: SwapRequestCardProps) {
  const isInitiator = request.fromUserId === currentUserId
  const opponent = isInitiator ? request.toUser : request.fromUser

  const skillToLearn = isInitiator ? request.skill : request.offeredSkill
  const skillToTeach = isInitiator ? request.offeredSkill : request.skill

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Avatar src={opponent.avatarUrl} alt={`Аватар ${opponent.name}`} size="md" />
        <div className={styles.userInfo}>
          <Title level={3} className={styles.name}>
            {opponent.name}
          </Title>
          <Text color="secondary" variant="sm">
            {opponent.city}, {getAgeWithDeclension(opponent.birthDate)}
          </Text>
        </div>
      </div>

      <div className={styles.skills}>
        <div className={styles.skillRow}>
          <Text weight="medium" color="secondary">
            Вы учите:
          </Text>
          <Link to={generatePath(ROUTES.SKILL, { id: skillToLearn.id })}>
            <Chip label={skillToLearn.title} category={skillToLearn.category} />
          </Link>
        </div>
        <div className={styles.skillRow}>
          <Text weight="medium" color="secondary">
            Вы учитесь:
          </Text>
          <Chip label={skillToTeach.title} category={skillToTeach.category} />
        </div>
      </div>

      <div className={styles.actions}>
        {request.status === 'pending' && !isInitiator && (
          <>
            <Button variant="primary" onClick={onAccept} disabled={isLoading}>
              Принять
            </Button>
            <Button variant="secondary" onClick={onReject} disabled={isLoading}>
              Отклонить
            </Button>
          </>
        )}

        {request.status === 'pending' && isInitiator && (
          <>
            <Text variant="sm" className={styles.statusText}>
              Ожидает ответа
            </Text>
            <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
              Отменить
            </Button>
          </>
        )}

        {request.status === 'rejected' && (
          <>
            <Text variant="sm" className={styles.statusText}>
              Отклонена
            </Text>
            <Button variant="secondary" onClick={onDelete} disabled={isLoading}>
              Удалить
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
