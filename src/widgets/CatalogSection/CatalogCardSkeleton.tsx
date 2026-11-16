import { Card, Skeleton } from '@/shared/ui'
import styles from './CatalogSection.module.css'

export function CatalogCardSkeleton() {
  return (
    <Card className={styles.skeletonCard} data-testid="user-card-skeleton">
      <div className={styles.skeletonHeader}>
        <Skeleton variant="circle" width={48} height={48} />
        <div className={styles.skeletonInfo}>
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" width="50%" height={16} />
        </div>
      </div>

      <div className={styles.skeletonSkills}>
        <Skeleton variant="text" width="40%" height={16} />
        <div className={styles.skeletonChips}>
          <Skeleton variant="rect" width={80} height={32} />
          <Skeleton variant="rect" width={80} height={32} />
        </div>
      </div>

      <div className={styles.skeletonSkills}>
        <Skeleton variant="text" width="40%" height={16} />
        <div className={styles.skeletonChips}>
          <Skeleton variant="rect" width={80} height={32} />
          <Skeleton variant="rect" width={80} height={32} />
        </div>
      </div>

      <Skeleton variant="rect" width="100%" height={48} className={styles.skeletonButton} />
    </Card>
  )
}
