import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { FilterSidebar } from './FilterSidebar'
import { CITIES } from '@/shared/lib/constants'

const renderWithRouter = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <FilterSidebar />
    </MemoryRouter>,
  )
}

describe('FilterSidebar', () => {
  it('вызывает изменение URL при выборе режима', async () => {
    const user = userEvent.setup()
    renderWithRouter(['/'])

    await user.click(screen.getByLabelText('Хочу научиться'))

    expect(screen.getByLabelText('Хочу научиться')).toBeChecked()
  })

  it('показывает счетчик и кнопку сброса, если есть активные фильтры', () => {
    renderWithRouter([`/?city=${CITIES[0]}`])

    expect(screen.getByText(/Фильтры \(1\)/)).toBeInTheDocument()
    expect(screen.getByText('Сбросить')).toBeInTheDocument()
  })

  it('очищает URL при клике на кнопку сброса', async () => {
    const user = userEvent.setup()
    renderWithRouter([`/?city=${CITIES[0]}`])

    const resetBtn = screen.getByText('Сбросить')
    await user.click(resetBtn)

    expect(screen.getByText('Фильтры')).toBeInTheDocument()
  })

  it('выбирает город при клике на чекбокс', async () => {
    const user = userEvent.setup()
    renderWithRouter(['/'])

    const cityCheckbox = screen.getByLabelText(CITIES[0])
    await user.click(cityCheckbox)

    expect(cityCheckbox).toBeChecked()
  })
})
