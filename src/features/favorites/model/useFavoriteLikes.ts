import { useCallback } from 'react'
import { removeFavoriteUser } from '@/entities/user/model/usersSlice'
import { useRemoveLikeMutation } from '@/features/auth/api/authApi'
import type { User } from '@/shared/types'
import { useAppDispatch } from '@/store/hooks'

interface UseFavoriteLikesOptions {
  likedUserIds: string[]
  name: string
}

export function useFavoriteLikes({ likedUserIds, name }: UseFavoriteLikesOptions) {
  const dispatch = useAppDispatch()
  const [removeLike] = useRemoveLikeMutation()

  const removeFavorite = useCallback(
    async (user: User) => {
      try {
        await removeLike(user.id).unwrap()
        const remainingIds = likedUserIds.filter((id) => id !== user.id)

        dispatch(
          removeFavoriteUser({
            userId: user.id,
            favoritesIdsKey: `${remainingIds.join('\u0000')}\u0001${name}`,
          }),
        )
      } catch {
        // Сохраняем карточку в списке, если сервер не снял лайк.
      }
    },
    [dispatch, likedUserIds, name, removeLike],
  )

  return { removeFavorite }
}
