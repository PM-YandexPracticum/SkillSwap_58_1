import type { ComponentType } from 'react'
import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'
import {
  HeartIcon,
  IdeaIcon,
  MessageTextIcon,
  RequestIcon,
  Text,
  UserIcon,
  type IconProps,
} from '@/shared/ui'
import styles from './ProfileSidebar.module.css'

export type ProfileSidebarItemId = 'requests' | 'exchanges' | 'favorites' | 'skills' | 'personal'

const ICONS: Record<ProfileSidebarItemId, ComponentType<IconProps>> = {
  requests: RequestIcon,
  exchanges: MessageTextIcon,
  favorites: HeartIcon,
  skills: IdeaIcon,
  personal: UserIcon,
}

type SidebarItem = {
  id: ProfileSidebarItemId
  label: string
  to?: string
}

const ITEMS: SidebarItem[] = [
  { id: 'requests', label: 'Заявки' },
  { id: 'exchanges', label: 'Мои обмены', to: ROUTES.EXCHANGES },
  { id: 'favorites', label: 'Избранное', to: ROUTES.FAVORITES },
  { id: 'skills', label: 'Мои навыки' },
  { id: 'personal', label: 'Личные данные', to: ROUTES.PROFILE },
]

export type ProfileSidebarProps = {
  className?: string
  activeItemId?: ProfileSidebarItemId
}

function SidebarItemContent({ id, label }: { id: ProfileSidebarItemId; label: string }) {
  const Icon = ICONS[id]

  return (
    <>
      <span className={styles.icon}>
        <Icon size={24} />
      </span>
      <Text className={styles.label}>{label}</Text>
    </>
  )
}

export function ProfileSidebar({ className, activeItemId }: ProfileSidebarProps) {
  const { pathname } = useLocation()

  return (
    <nav className={clsx(styles.sidebar, className)} aria-label="Личный кабинет">
      <ul className={styles.list}>
        {ITEMS.map((item) => {
          const isActive = activeItemId ? activeItemId === item.id : pathname === item.to

          if (!item.to) {
            return (
              <li key={item.id}>
                <button type="button" className={styles.item}>
                  <SidebarItemContent id={item.id} label={item.label} />
                </button>
              </li>
            )
          }

          return (
            <li key={item.id}>
              <Link
                to={item.to}
                className={clsx(styles.item, isActive && styles.itemActive)}
                aria-current={isActive ? 'page' : undefined}
              >
                <SidebarItemContent id={item.id} label={item.label} />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
