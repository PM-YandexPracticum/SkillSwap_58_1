import { useGetAuthMeQuery } from '@/features/auth/api/authApi'
import { clearFavoriteUsers, loadFavoriteUsers } from '@/entities/user/model/usersSlice'
import { useFavoriteLikes } from '@/features/favorites'
import type { RootState } from '@/store'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { ROUTES } from '@/shared/lib/constants'
import { Button, Card, Skeleton } from '@/shared/ui'
import type { User } from '@/shared/types'
import { CatalogSection } from '@/widgets'
import { useCallback, useEffect } from 'react'
import { generatePath, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ErrorWidget } from '@/widgets/ErrorWidget'

const EMPTY_IDS: string[] = []

export default function FavoritesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const name = searchParams.get('name')?.trim() ?? ''
  const openSkill = (user: User) => navigate(generatePath(ROUTES.SKILL, { id: user.canTeach.id }))
  const dispatch = useAppDispatch()
  const { favoriteUsers, isFavoritesLoading, favoritesError, favoritesPage, favoritesHasMore } =
    useAppSelector((state: RootState) => state.users)
  const { data: currentUser, error: profileError } = useGetAuthMeQuery()
  const likedUserIds = currentUser?.likes ?? EMPTY_IDS
  const { removeFavorite } = useFavoriteLikes({ likedUserIds, name })

  const loadFavorites = useCallback(
    (nextPage: number) =>
      dispatch(loadFavoriteUsers({ ids: likedUserIds, page: nextPage, limit: 12, name })),
    [dispatch, likedUserIds, name],
  )

  useEffect(() => {
    if (!currentUser || profileError) return
    if (likedUserIds.length === 0) {
      dispatch(clearFavoriteUsers())
      return
    }
    void loadFavorites(1)
  }, [currentUser, profileError, likedUserIds, loadFavorites, dispatch])

  const errorMessage = profileError ? 'Не удалось загрузить профиль пользователя' : favoritesError

  return (
    <main>
      {!currentUser && !profileError ? null : isFavoritesLoading && favoriteUsers.length === 0 ? (
        <CatalogPreloader />
      ) : errorMessage ? (
        <ErrorWidget type={500} />
      ) : favoriteUsers.length === 0 && likedUserIds.length > 0 && name ? (
        <p>По запросу «{name}» ничего не найдено</p>
      ) : favoriteUsers.length === 0 ? (
        <Link to={ROUTES.HOME}>
          <Button>Вернуться в каталог</Button>
        </Link>
      ) : (
        <CatalogSection
          title="Избранное"
          users={favoriteUsers}
          hasMore={favoritesHasMore}
          isLoadingMore={isFavoritesLoading}
          onLoadMore={() => void loadFavorites(favoritesPage + 1)}
          favoriteIds={likedUserIds}
          onDetails={openSkill}
          onFavoriteToggle={removeFavorite}
        />
      )}
    </main>
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
