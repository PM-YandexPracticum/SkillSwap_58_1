import { useAppSelector } from '@/store/hooks'
import {
  useRespondToSwapRequestMutation,
  useDeleteSwapRequestMutation,
} from '@/entities/request/model/api/swapRequestApi'
import { selectProfile } from '@/features/auth/model/authSlice'
import { SwapRequestCard } from '@/widgets/SwapRequestCard'
import { ProfileSidebar } from '@/widgets/ProfileSidebar'
import { Title, Skeleton, Text, Button } from '@/shared/ui'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'
import { useNotify } from '@/features/notifications/model/useNotify'
import { useSwapRequestsList } from '@/features/exchange/model/useSwapRequestsList'
import styles from './ExchangesPage.module.css'

type FetchBaseQueryError = {
  status: number
  data?: {
    message?: string
  }
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error
}

export default function ExchangesPage() {
  const profile = useAppSelector(selectProfile)
  const currentUserId = profile?.id || ''
  const notify = useNotify()

  const incoming = useSwapRequestsList({ role: 'incoming', status: 'pending' })
  const outgoing = useSwapRequestsList({ role: 'outgoing', status: 'pending' })
  const rejected = useSwapRequestsList({ role: 'outgoing', status: 'rejected' })
  const accepted = useSwapRequestsList({ status: 'accepted' })

  const [respondToSwap, { isLoading: isResponding }] = useRespondToSwapRequestMutation()
  const [deleteSwap, { isLoading: isDeleting }] = useDeleteSwapRequestMutation()

  const getErrorMessage = (error: unknown): string => {
    if (isFetchBaseQueryError(error)) {
      if (error.data?.message) return error.data.message
    }
    return 'Произошла ошибка'
  }

  const handleRespond = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await respondToSwap({ id, status }).unwrap()
      incoming.removeItem(id)

      if (status === 'accepted') {
        const acceptedItem = incoming.items.find((item) => item.id === id)
        if (acceptedItem) {
          accepted.addItem({ ...acceptedItem, status: 'accepted' })
        }
      }

      notify.success(status === 'accepted' ? 'Обмен подтверждён' : 'Заявка отклонена', 'Готово')
    } catch (error: unknown) {
      notify.error(getErrorMessage(error), 'Ошибка')
      if (isFetchBaseQueryError(error) && error.status === 409) {
        incoming.reset()
        outgoing.reset()
        rejected.reset()
        accepted.reset()
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSwap(id).unwrap()
      outgoing.removeItem(id)
      rejected.removeItem(id)
      notify.info('Заявка удалена', 'Удалено')
    } catch (error: unknown) {
      notify.error(getErrorMessage(error), 'Ошибка')
      if (isFetchBaseQueryError(error) && error.status === 409) {
        incoming.reset()
        outgoing.reset()
        rejected.reset()
        accepted.reset()
      }
    }
  }

  const isLoading =
    incoming.isLoading || outgoing.isLoading || rejected.isLoading || accepted.isLoading
  const allEmpty =
    !incoming.items.length &&
    !outgoing.items.length &&
    !rejected.items.length &&
    !accepted.items.length

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <ProfileSidebar activeItemId="exchanges" />
      </aside>

      <main className={styles.content}>
        {isLoading && allEmpty ? (
          <Skeleton width="100%" height="500px" />
        ) : (
          <>
            <Title level={1} className={styles.mainTitle}>
              Мои обмены
            </Title>

            {incoming.items.length > 0 && (
              <section className={styles.section}>
                <Title level={2} className={styles.sectionTitle}>
                  Входящие предложения
                </Title>
                <div className={styles.list}>
                  {incoming.items.map((req) => (
                    <SwapRequestCard
                      key={req.id}
                      request={req}
                      currentUserId={currentUserId}
                      isLoading={isResponding}
                      onAccept={() => handleRespond(req.id, 'accepted')}
                      onReject={() => handleRespond(req.id, 'rejected')}
                    />
                  ))}
                </div>
                {incoming.hasMore && (
                  <Button
                    variant="secondary"
                    onClick={incoming.loadMore}
                    disabled={incoming.isLoading}
                  >
                    Показать ещё
                  </Button>
                )}
              </section>
            )}

            {outgoing.items.length > 0 && (
              <section className={styles.section}>
                <Title level={2} className={styles.sectionTitle}>
                  Ожидают ответа
                </Title>
                <div className={styles.list}>
                  {outgoing.items.map((req) => (
                    <SwapRequestCard
                      key={req.id}
                      request={req}
                      currentUserId={currentUserId}
                      isLoading={isDeleting}
                      onCancel={() => handleDelete(req.id)}
                    />
                  ))}
                </div>
                {outgoing.hasMore && (
                  <Button
                    variant="secondary"
                    onClick={outgoing.loadMore}
                    disabled={outgoing.isLoading}
                  >
                    Показать ещё
                  </Button>
                )}
              </section>
            )}

            {rejected.items.length > 0 && (
              <section className={styles.section}>
                <Title level={2} className={styles.sectionTitle}>
                  Отклонённые
                </Title>
                <div className={styles.list}>
                  {rejected.items.map((req) => (
                    <SwapRequestCard
                      key={req.id}
                      request={req}
                      currentUserId={currentUserId}
                      isLoading={isDeleting}
                      onDelete={() => handleDelete(req.id)}
                    />
                  ))}
                </div>
                {rejected.hasMore && (
                  <Button
                    variant="secondary"
                    onClick={rejected.loadMore}
                    disabled={rejected.isLoading}
                  >
                    Показать ещё
                  </Button>
                )}
              </section>
            )}

            {accepted.items.length > 0 && (
              <section className={styles.section}>
                <Title level={2} className={styles.sectionTitle}>
                  Подтверждённые обмены
                </Title>
                <div className={styles.list}>
                  {accepted.items.map((req) => (
                    <SwapRequestCard key={req.id} request={req} currentUserId={currentUserId} />
                  ))}
                </div>
                {accepted.hasMore && (
                  <Button
                    variant="secondary"
                    onClick={accepted.loadMore}
                    disabled={accepted.isLoading}
                  >
                    Показать ещё
                  </Button>
                )}
              </section>
            )}

            {allEmpty && (
              <div className={styles.empty}>
                <Title level={2}>У вас пока нет обменов</Title>
                <Text>Найдите интересные навыки в каталоге и предложите обмен!</Text>
                <Link to={ROUTES.HOME}>
                  <Button variant="primary">Перейти в каталог</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
