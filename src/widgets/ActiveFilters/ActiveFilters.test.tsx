import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ActiveFilters } from './ActiveFilters'
import { FilterMode } from '@/shared/types'
import {
  CITIES,
  INITIAL_FILTERS_STATE,
  MODE_OPTIONS,
  SKILL_CATEGORIES,
} from '@/shared/lib/constants'

const REAL_CITY = CITIES[0]
const REAL_SKILL_ID = SKILL_CATEGORIES[0].subcategories[0].id
const REAL_SKILL_TITLE = SKILL_CATEGORIES[0].subcategories[0].title

const REAL_MODE_VALUE = MODE_OPTIONS[1].value as FilterMode
const REAL_MODE_LABEL = MODE_OPTIONS[1].label

const REAL_GENDER = 'Мужской'

describe('ActiveFilters', () => {
  it('не рендерит чипы, если фильтры пустые', () => {
    render(<ActiveFilters filters={INITIAL_FILTERS_STATE} onRemoveFilter={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('отображает чип для режима', () => {
    render(
      <ActiveFilters
        filters={{ ...INITIAL_FILTERS_STATE, mode: REAL_MODE_VALUE }}
        onRemoveFilter={vi.fn()}
      />,
    )
    expect(screen.getByText(REAL_MODE_LABEL)).toBeInTheDocument()
  })

  it('отображает чипы для городов из констант', () => {
    render(
      <ActiveFilters
        filters={{ ...INITIAL_FILTERS_STATE, cities: [REAL_CITY] }}
        onRemoveFilter={vi.fn()}
      />,
    )
    expect(screen.getByText(REAL_CITY)).toBeInTheDocument()
  })

  it('отображает чипы для навыков (по реальному названию из констант)', () => {
    render(
      <ActiveFilters
        filters={{ ...INITIAL_FILTERS_STATE, skillIds: [REAL_SKILL_ID] }}
        onRemoveFilter={vi.fn()}
      />,
    )
    expect(screen.getByText(REAL_SKILL_TITLE)).toBeInTheDocument()
  })

  it('вызывает onRemoveFilter с правильными аргументами при клике на крестик города', async () => {
    const user = userEvent.setup()
    const handleRemove = vi.fn()

    render(
      <ActiveFilters
        filters={{ ...INITIAL_FILTERS_STATE, cities: [REAL_CITY] }}
        onRemoveFilter={handleRemove}
      />,
    )

    await user.click(screen.getByRole('button', { name: new RegExp(REAL_CITY, 'i') }))

    await waitFor(() => {
      expect(handleRemove).toHaveBeenCalledWith('cities', REAL_CITY)
    })
  })

  it('вызывает onRemoveFilter для режима при клике', async () => {
    const user = userEvent.setup()
    const handleRemove = vi.fn()

    render(
      <ActiveFilters
        filters={{ ...INITIAL_FILTERS_STATE, mode: REAL_MODE_VALUE }}
        onRemoveFilter={handleRemove}
      />,
    )

    await user.click(screen.getByRole('button', { name: new RegExp(REAL_MODE_LABEL, 'i') }))

    await waitFor(() => {
      expect(handleRemove).toHaveBeenCalledWith('mode', 'all')
    })
  })

  it('вызывает onRemoveFilter для пола при клике', async () => {
    const user = userEvent.setup()
    const handleRemove = vi.fn()

    render(
      <ActiveFilters
        filters={{ ...INITIAL_FILTERS_STATE, gender: REAL_GENDER }}
        onRemoveFilter={handleRemove}
      />,
    )

    await user.click(screen.getByRole('button', { name: new RegExp(REAL_GENDER, 'i') }))

    await waitFor(() => {
      expect(handleRemove).toHaveBeenCalledWith('gender', null)
    })
  })
  it('позволяет удалить строку поиска отдельным чипом', async () => {
    const onRemove = vi.fn()
    render(
      <ActiveFilters
        filters={{ ...INITIAL_FILTERS_STATE, name: 'Гитара' }}
        onRemoveFilter={onRemove}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Гитара/i }))
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith('name', null))
  })
})
