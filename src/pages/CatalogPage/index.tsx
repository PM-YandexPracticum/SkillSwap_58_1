import { loadUsers } from '@/entities/user/model/usersSlice'
import { Card, Skeleton } from '@/shared/ui'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { ActiveFilters, CatalogSection, FilterSidebar } from '@/widgets'
import { useEffect } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'
import type { FiltersState, User } from '@/shared/types'
import { useCatalogFilters } from '@/features/catalog-filter'
import styles from './CatalogPage.module.css'

export default function CatalogPage() {
  const {
    newUsers,
    popularUsers,
    recommendedUsers,
    isPopularLoading,
    isNewLoading,
    isRecommendedLoading,
    errors,
    pages,
    hasMore,
  } = useAppSelector((store) => store.users)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { filters, setFilters } = useCatalogFilters()

  const openSkill = (user: User) => navigate(generatePath(ROUTES.SKILL, { id: user.canTeach.id }))

  useEffect(() => {
    const requests = [
      dispatch(loadUsers({ page: 1, sort: 'popular', filters })),
      dispatch(loadUsers({ page: 1, sort: 'new', filters })),
      dispatch(loadUsers({ page: 1, sort: 'random', filters })),
    ]
    return () => requests.forEach((request) => request.abort())
  }, [dispatch, filters])

  const handleRemoveFilter = (field: keyof FiltersState, value: string | null) => {
    switch (field) {
      case 'cities':
        setFilters((prev) => ({ ...prev, cities: prev.cities.filter((c) => c !== value) }))
        break
      case 'skillIds':
        setFilters((prev) => ({ ...prev, skillIds: prev.skillIds.filter((id) => id !== value) }))
        break
      case 'gender':
        setFilters((prev) => ({ ...prev, gender: null }))
        break
      case 'mode':
        setFilters((prev) => ({ ...prev, mode: 'all' }))
        break
      case 'name':
        setFilters((prev) => ({ ...prev, name: null }))
        break
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <FilterSidebar />

        <div className={styles.content}>
          <ActiveFilters filters={filters} onRemoveFilter={handleRemoveFilter} />

          <div className={styles.sections}>
            <section>
              {isPopularLoading && popularUsers.length === 0 ? (
                <CatalogPreloader />
              ) : errors.popular ? (
                <h2>Ошибка: {errors.popular}</h2>
              ) : (
                <CatalogSection
                  title={'Популярное'}
                  users={popularUsers}
                  hasMore={hasMore.popular}
                  isLoadingMore={isPopularLoading}
                  onLoadMore={() =>
                    dispatch(loadUsers({ page: pages.popular + 1, sort: 'popular', filters }))
                  }
                  favoriteIds={[]}
                  onDetails={openSkill}
                  onFavoriteToggle={() => undefined}
                />
              )}
            </section>
            <section>
              {isNewLoading && newUsers.length === 0 ? (
                <CatalogPreloader />
              ) : errors.new ? (
                <h2>Ошибка: {errors.new}</h2>
              ) : (
                <CatalogSection
                  title={'Новое'}
                  users={newUsers}
                  hasMore={hasMore.new}
                  isLoadingMore={isNewLoading}
                  onLoadMore={() =>
                    dispatch(loadUsers({ page: pages.new + 1, sort: 'new', filters }))
                  }
                  favoriteIds={[]}
                  onDetails={openSkill}
                  onFavoriteToggle={() => undefined}
                />
              )}
            </section>
            <section>
              {isRecommendedLoading && recommendedUsers.length === 0 ? (
                <CatalogPreloader />
              ) : errors.random ? (
                <h2>Ошибка: {errors.random}</h2>
              ) : (
                <CatalogSection
                  title={'Рекомендуем'}
                  users={recommendedUsers}
                  hasMore={hasMore.random}
                  isLoadingMore={isRecommendedLoading}
                  onLoadMore={() =>
                    dispatch(loadUsers({ page: pages.random + 1, sort: 'random', filters }))
                  }
                  favoriteIds={[]}
                  onDetails={openSkill}
                  onFavoriteToggle={() => undefined}
                />
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

const CatalogPreloader = () => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: 24 }}>
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index} style={{ width: 324 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Skeleton variant="circle" width={48} height={48} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Skeleton variant="rect" width="100%" height={120} />
          </div>
        </Card>
      ))}
    </div>
  )
}
