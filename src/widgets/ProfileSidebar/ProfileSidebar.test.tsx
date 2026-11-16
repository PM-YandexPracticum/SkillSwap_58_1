import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/shared/lib/constants'
import { ProfileSidebar } from './ProfileSidebar'
import styles from './ProfileSidebar.module.css'

const STUB_LABELS = ['Заявки', 'Мои навыки'] as const

function LocationProbe() {
  const { pathname } = useLocation()
  return <div data-testid="location">{pathname}</div>
}

function renderSidebar(initialPath: string = ROUTES.PROFILE) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ProfileSidebar />
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('ProfileSidebar', () => {
  it('показывает пункты меню в порядке макета', () => {
    renderSidebar()

    const nav = screen.getByRole('navigation', { name: 'Личный кабинет' })
    const labels = [...nav.querySelectorAll('button, a')].map((item) => item.textContent?.trim())

    expect(labels).toEqual(['Заявки', 'Мои обмены', 'Избранное', 'Мои навыки', 'Личные данные'])
  })

  it('делает ссылками «Мои обмены», «Личные данные» и «Избранное»', async () => {
    const user = userEvent.setup()
    renderSidebar()

    expect(screen.getByRole('link', { name: 'Мои обмены' })).toHaveAttribute(
      'href',
      ROUTES.EXCHANGES,
    )
    expect(screen.getByRole('link', { name: 'Личные данные' })).toHaveAttribute(
      'href',
      ROUTES.PROFILE,
    )
    expect(screen.getByRole('link', { name: 'Избранное' })).toHaveAttribute(
      'href',
      ROUTES.FAVORITES,
    )
    expect(screen.getAllByRole('link')).toHaveLength(3)

    for (const label of STUB_LABELS) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }

    await user.click(screen.getByRole('button', { name: 'Заявки' }))
    expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.PROFILE)

    await user.click(screen.getByRole('link', { name: 'Избранное' }))

    expect(screen.getByTestId('location')).toHaveTextContent(ROUTES.FAVORITES)
  })

  it('подсвечивает «Личные данные» на странице профиля', () => {
    renderSidebar(ROUTES.PROFILE)

    const personalData = screen.getByRole('link', { name: 'Личные данные' })

    expect(personalData).toHaveAttribute('aria-current', 'page')
    expect(personalData).toHaveClass(styles.itemActive)
  })

  it('подсвечивает «Мои обмены» на странице обменов', () => {
    renderSidebar(ROUTES.EXCHANGES)

    const exchangesLink = screen.getByRole('link', { name: 'Мои обмены' })
    const personalData = screen.getByRole('link', { name: 'Личные данные' })

    expect(exchangesLink).toHaveAttribute('aria-current', 'page')
    expect(exchangesLink).toHaveClass(styles.itemActive)
    expect(personalData).not.toHaveAttribute('aria-current')
    expect(personalData).not.toHaveClass(styles.itemActive)
  })

  it('не подсвечивает ссылки на другом маршруте', () => {
    renderSidebar(ROUTES.HOME)

    const exchangesLink = screen.getByRole('link', { name: 'Мои обмены' })
    const personalData = screen.getByRole('link', { name: 'Личные данные' })

    expect(exchangesLink).not.toHaveAttribute('aria-current')
    expect(exchangesLink).not.toHaveClass(styles.itemActive)
    expect(personalData).not.toHaveAttribute('aria-current')
    expect(personalData).not.toHaveClass(styles.itemActive)
  })

  it('подсвечивает пункт, переданный через activeItemId', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.HOME]}>
        <ProfileSidebar activeItemId="personal" />
      </MemoryRouter>,
    )

    const personalData = screen.getByRole('link', { name: 'Личные данные' })

    expect(personalData).toHaveAttribute('aria-current', 'page')
    expect(personalData).toHaveClass(styles.itemActive)

    for (const label of STUB_LABELS) {
      expect(screen.getByRole('button', { name: label })).not.toHaveClass(styles.itemActive)
    }
  })
})
