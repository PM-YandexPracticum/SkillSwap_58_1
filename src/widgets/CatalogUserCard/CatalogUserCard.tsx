import { Text, Title } from '@/shared/ui'
import { Card } from '@/shared/ui'
import { Avatar } from '@/shared/ui'
import { Chip } from '@/shared/ui'
import { Button, ClockIcon } from '@/shared/ui'
import { getAgeWithDeclension } from '@/shared/lib/helpers'
import { SKILL_CATEGORIES } from '@/shared/lib/constants'
import type { User } from '@/shared/types'
import type { SubCategoryId } from '@/shared/lib/constants'
import styles from './CatalogUserCard.module.css'

interface CatalogUserCardProps {
  user: User
  isFavorite: boolean
  onDetails: () => void
  onFavoriteToggle: () => void
  isExchangeProposed?: boolean
}

const MAX_VISIBLE_SKILLS = 2

function HeartIcon({ filled }: { filled: boolean }) {
  const outlinePath =
    'M12 20.9535C11.7116 20.9535 11.4326 20.9163 11.2 20.8326C7.64651 19.614 2 15.2884 2 8.89767C2 5.64186 4.63256 3 7.86977 3C9.44186 3 10.9116 3.61395 12 4.71163C13.0884 3.61395 14.5581 3 16.1302 3C19.3674 3 22 5.65116 22 8.89767C22 15.2977 16.3535 19.614 12.8 20.8326C12.5674 20.9163 12.2884 20.9535 12 20.9535Z'

  const innerPath =
    'M7.86977 4.39535C5.40465 4.39535 3.39535 6.41395 3.39535 8.89767C3.39535 15.2512 9.50698 18.786 11.6558 19.5209C11.8233 19.5767 12.186 19.5767 12.3535 19.5209C14.493 18.786 20.614 15.2605 20.614 8.89767C20.614 6.41395 18.6047 4.39535 16.1395 4.39535C14.7256 4.39535 13.414 5.05581 12.5674 6.2C12.307 6.55349 11.7116 6.55349 11.4512 6.2C10.586 5.04651 9.28372 4.39535 7.86977 4.39535Z'

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d={filled ? outlinePath : `${outlinePath} ${innerPath}`}
        fill="currentColor"
        fillRule="nonzero"
      />
    </svg>
  )
}

export function CatalogUserCard({
  user,
  isFavorite,
  onDetails,
  onFavoriteToggle,
  isExchangeProposed = false,
}: CatalogUserCardProps) {
  const teachCategory = SKILL_CATEGORIES.find((category) => category.id === user.canTeach.category)

  const teachSkill = teachCategory?.subcategories.find(
    (skill) => skill.id === user.canTeach.subCategory,
  )

  const skillsToLearn = user.wantsToLearn.map((skillId: SubCategoryId) => {
    const category = SKILL_CATEGORIES.find((item) =>
      item.subcategories.some((skill) => skill.id === skillId),
    )

    const skill = category?.subcategories.find((item) => item.id === skillId)

    return {
      id: skillId,
      title: skill?.title ?? skillId,
      category: category?.id,
    }
  })

  const visibleSkills = skillsToLearn.slice(0, MAX_VISIBLE_SKILLS)
  const remainingSkillsCount = Math.max(0, skillsToLearn.length - MAX_VISIBLE_SKILLS)

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Avatar src={user.avatarUrl} alt={`Аватар пользователя ${user.name}`} size="md" />

        <div className={styles.userInfo}>
          <Title level={3} className={styles.name}>
            {user.name}
          </Title>

          <Text color="secondary" variant="sm">
            {user.city}, {getAgeWithDeclension(user.birthDate)}
          </Text>
        </div>

        <Button
          variant="tertiary"
          size="sm"
          className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''}`}
          icon={<HeartIcon filled={isFavorite} />}
          aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          aria-pressed={isFavorite}
          onClick={onFavoriteToggle}
        />
      </div>

      <div className={styles.skillsSection}>
        <Text weight="medium">Может научить:</Text>

        <div className={styles.skills}>
          {teachSkill && <Chip label={teachSkill.title} category={user.canTeach.category} />}
        </div>
      </div>

      <div className={styles.skillsSection}>
        <Text weight="medium">Хочет научиться:</Text>

        <div className={styles.skills}>
          {visibleSkills.map((skill) => (
            <Chip key={skill.id} label={skill.title} category={skill.category} />
          ))}

          {remainingSkillsCount > 0 && (
            <span className={styles.remainingSkills}>
              <Chip label={`+${remainingSkillsCount}`} />
            </span>
          )}
        </div>
      </div>

      {isExchangeProposed ? (
        <Button variant="secondary" icon={<ClockIcon />} className={styles.detailsButton} disabled>
          Обмен предложен
        </Button>
      ) : (
        <Button variant="primary" className={styles.detailsButton} onClick={onDetails}>
          Подробнее
        </Button>
      )}
    </Card>
  )
}
