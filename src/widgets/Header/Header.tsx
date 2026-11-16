import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES, SKILL_CATEGORIES } from '@/shared/lib/constants'
import { getAuthReturnPath } from '@/shared/lib/authRedirect'
import {
  CloseIcon,
  ChevronDown,
  Dropdown,
  Button,
  Logo,
  BriefcaseIcon,
  PaletteIcon,
  GlobalIcon,
  BookIcon,
  HomeIcon,
  LifestyleIcon,
} from '@/shared/ui'
import styles from './Header.module.css'
import { UserMenu } from '@/widgets/UserMenu'
import { SkillSearcher } from '@/widgets/SkillSearcher'

const CATEGORY_ICONS = {
  business: BriefcaseIcon,
  art: PaletteIcon,
  languages: GlobalIcon,
  education: BookIcon,
  'home-coziness': HomeIcon,
  health: LifestyleIcon,
}

export function Header() {
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/'
  const isCompact = normalizedPathname === ROUTES.LOGIN || normalizedPathname === ROUTES.REGISTER
  const handleClose = () => {
    navigate(getAuthReturnPath(state), { replace: true })
  }

  if (isCompact) {
    return (
      <header className={`${styles.header} ${styles.compact}`}>
        <div className={styles.left}>
          <Logo />
        </div>
        <div className={styles.right}>
          <Button
            variant="tertiary"
            trailingIcon={<CloseIcon />}
            className={styles.closeButton}
            onClick={handleClose}
          >
            Закрыть
          </Button>
        </div>
      </header>
    )
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Logo />
        <Link to={ROUTES.ABOUT}>О проекте</Link>
        <Dropdown
          trigger={
            <>
              Все навыки
              <ChevronDown aria-hidden="true" />
            </>
          }
          triggerLabel="Открыть меню навыков"
        >
          {() => (
            <div className={styles.skillsMenu}>
              {SKILL_CATEGORIES.map((category) => {
                const CategoryIcon = CATEGORY_ICONS[category.id]

                return (
                  <section key={category.id}>
                    <div className={styles.categoryTitle}>
                      <span className={styles.categoryIcon} data-category={category.id}>
                        <CategoryIcon size={20} />
                      </span>
                      <h3>{category.title}</h3>
                    </div>
                    <ul>
                      {category.subcategories.map((subcategory) => (
                        <li key={subcategory.id}>{subcategory.title}</li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          )}
        </Dropdown>
      </div>
      <div className={styles.center}>
        <SkillSearcher />
      </div>
      <div className={styles.right}>
        <UserMenu />
      </div>
    </header>
  )
}
