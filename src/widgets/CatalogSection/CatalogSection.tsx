import { useId, useState } from 'react'
import { Title } from '@/shared/ui'
import type { User } from '@/shared/types'
import { CatalogUserCard } from '@/widgets/CatalogUserCard'
import { useOutgoingPendingSkillIds } from '@/features/exchange'
import styles from './CatalogSection.module.css'
import { useInfiniteScroll } from '../../shared/hooks/useInfiniteScroll'
import { CatalogCardSkeleton } from './CatalogCardSkeleton'

const COLLAPSED_COUNT = 3
const SKELETON_COUNT = 9

interface CatalogSectionProps {
  title: string
  users: User[]
  favoriteIds: string[]
  onDetails: (user: User) => void
  onFavoriteToggle: (user: User) => void
  showExpandButton?: boolean
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

export function CatalogSection({
  title,
  users,
  favoriteIds,
  onDetails,
  onFavoriteToggle,
  showExpandButton = true,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: CatalogSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const headingId = useId()
  const listId = useId()
  const outgoingPendingSkillIds = useOutgoingPendingSkillIds()

  const visibleCount = isExpanded ? users.length : COLLAPSED_COUNT
  const visibleUsers = users.slice(0, visibleCount)
  const canExpand = showExpandButton && users.length > COLLAPSED_COUNT

  const sentinelRef = useInfiniteScroll({
    enabled: isExpanded && hasMore && !isLoadingMore,
    itemsCount: users.length,
    onLoadMore,
  })

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.header}>
        <Title level={2} size={1} id={headingId}>
          {title}
        </Title>

        {canExpand && (
          <button
            type="button"
            className={styles.expandButton}
            aria-expanded={isExpanded}
            aria-controls={listId}
            onClick={() => setIsExpanded((previous) => !previous)}
          >
            {isExpanded ? 'Скрыть' : 'Смотреть все'}
          </button>
        )}
      </div>

      <div id={listId} className={styles.grid}>
        {visibleUsers.map((user) => (
          <CatalogUserCard
            key={user.id}
            user={user}
            isFavorite={favoriteIds.includes(user.id)}
            isExchangeProposed={outgoingPendingSkillIds.includes(user.canTeach.id)}
            onDetails={() => onDetails(user)}
            onFavoriteToggle={() => onFavoriteToggle(user)}
          />
        ))}

        {isExpanded && hasMore && isLoadingMore && (
          <>
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <CatalogCardSkeleton key={`skeleton-${index}`} />
            ))}
          </>
        )}
      </div>

      {isExpanded && hasMore && (
        <div ref={sentinelRef} className={styles.loadMoreSentinel} aria-hidden="true" />
      )}
    </section>
  )
}
