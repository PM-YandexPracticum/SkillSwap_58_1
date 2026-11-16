import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { CatalogUserCard } from './CatalogUserCard'
import { getAgeWithDeclension } from '@/shared/lib/helpers'
import { SKILL_CATEGORIES } from '@/shared/lib/constants'

import type { User } from '@/shared/types'

// Тестовые данные на основе пользователя из users.json
const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-01',
  name: 'Анна',
  email: 'anna.smirnova@example.com',
  avatarUrl: '/db/avatars/figma/anna.jpg',
  createdAt: '2025-01-16T11:15:00.000Z',
  birthDate: '1995-02-08',
  gender: 'female',
  city: 'Санкт-Петербург',
  bio: 'Доброжелательная и любознательная, ценю искреннее общение и тёплые встречи с близкими.',
  likes: ['user-02'],

  canTeach: {
    id: 'skill-01',
    category: 'art',
    subCategory: 'music-sound',
  },

  wantsToLearn: ['acting', 'german', 'team-management'],

  ...overrides,
})

const getSkillTitle = (skillId: string) => {
  const category = SKILL_CATEGORIES.find((item) =>
    item.subcategories.some((skill) => skill.id === skillId),
  )

  return category?.subcategories.find((skill) => skill.id === skillId)?.title
}

function renderCard(user = createUser(), isFavorite = false) {
  const onDetails = vi.fn()
  const onFavoriteToggle = vi.fn()

  render(
    <CatalogUserCard
      user={user}
      isFavorite={isFavorite}
      onDetails={onDetails}
      onFavoriteToggle={onFavoriteToggle}
    />,
  )

  return { onDetails, onFavoriteToggle }
}

describe('CatalogUserCard', () => {
  it('отображает имя пользователя', () => {
    const user = createUser()

    renderCard(user)

    expect(screen.getByRole('heading', { name: user.name })).toBeTruthy()
  })

  it('отображает город и возраст пользователя', () => {
    const user = createUser()

    renderCard(user)

    const userInfo = `${user.city}, ${getAgeWithDeclension(user.birthDate)}`

    expect(screen.getByText(userInfo)).toBeTruthy()
  })

  it('отображает аватар пользователя', () => {
    const user = createUser()

    renderCard(user)

    const avatar = screen.getByRole('img')

    expect(avatar.getAttribute('src')).toBe(user.avatarUrl)
    expect(avatar.getAttribute('alt')).toBe(`Аватар пользователя ${user.name}`)
  })

  it('отображает навык, которому пользователь может научить', () => {
    const user = createUser()

    const skillTitle = getSkillTitle(user.canTeach.subCategory)

    renderCard(user)

    expect(skillTitle).toBeTruthy()
    expect(screen.getByText(skillTitle!)).toBeTruthy()
  })

  it('отображает первые два навыка и +N при превышении лимита', () => {
    const user = createUser()

    renderCard(user)

    const firstSkill = getSkillTitle(user.wantsToLearn[0])
    const secondSkill = getSkillTitle(user.wantsToLearn[1])
    const thirdSkill = getSkillTitle(user.wantsToLearn[2])

    expect(screen.getByText(firstSkill!)).toBeTruthy()
    expect(screen.getByText(secondSkill!)).toBeTruthy()

    expect(screen.queryByText(thirdSkill!)).toBeNull()

    expect(screen.getByText('+1')).toBeTruthy()
  })

  it('не показывает +N, если навыков не больше двух', () => {
    const user = createUser({
      wantsToLearn: ['acting', 'german'],
    })

    renderCard(user)

    expect(screen.queryByText(/^\+\d+$/)).toBeNull()
  })

  it('вызывает onDetails при нажатии на Подробнее', () => {
    const { onDetails } = renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Подробнее' }))

    expect(onDetails).toHaveBeenCalledTimes(1)
  })

  it('вызывает onFavoriteToggle при нажатии на сердечко', () => {
    const { onFavoriteToggle } = renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Добавить в избранное' }))

    expect(onFavoriteToggle).toHaveBeenCalledTimes(1)
  })

  it('правильно отображает состояние избранного', () => {
    renderCard(createUser(), true)

    const favoriteButton = screen.getByRole('button', {
      name: 'Убрать из избранного',
    })

    expect(favoriteButton.getAttribute('aria-pressed')).toBe('true')
  })

  it('показывает «Обмен предложен» вместо «Подробнее», если обмен предложен', () => {
    render(
      <CatalogUserCard
        user={createUser()}
        isFavorite={false}
        onDetails={vi.fn()}
        onFavoriteToggle={vi.fn()}
        isExchangeProposed
      />,
    )

    const button = screen.getByRole('button', { name: 'Обмен предложен' })

    expect(button).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Подробнее' })).not.toBeInTheDocument()
  })

  it('не вызывает onDetails, если обмен предложен', () => {
    const onDetails = vi.fn()

    render(
      <CatalogUserCard
        user={createUser()}
        isFavorite={false}
        onDetails={onDetails}
        onFavoriteToggle={vi.fn()}
        isExchangeProposed
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Обмен предложен' }))

    expect(onDetails).not.toHaveBeenCalled()
  })
})
