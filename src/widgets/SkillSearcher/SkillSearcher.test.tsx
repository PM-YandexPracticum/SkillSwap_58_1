import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCatalogFilters } from '@/features/catalog-filter'
import { SkillSearcher } from './SkillSearcher'

function LocationOutput() {
  const location = useLocation()
  return <output data-testid="search">{location.search}</output>
}

function ChangeRoute() {
  const { setFilters, resetFilters } = useCatalogFilters()
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => setFilters((prev) => ({ ...prev, cities: ['Москва'] }))}>Город</button>
      <button onClick={resetFilters}>Сброс</button>
      <button onClick={() => navigate(-1)}>Назад</button>
      <output data-testid="pathname">{useLocation().pathname}</output>
    </>
  )
}

function renderSearcher(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SkillSearcher />
      <LocationOutput />
      <ChangeRoute />
    </MemoryRouter>,
  )
}

describe('SkillSearcher', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('откладывает ввод параметра и записывает строку без начальных и конечных пробелов в параметр name', async () => {
    vi.useFakeTimers()
    renderSearcher()

    fireEvent.change(screen.getByPlaceholderText('Искать навык'), {
      target: { value: '  Музыка и звук  ' },
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(999)
    })
    expect(screen.getByTestId('search').textContent).toBe('')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(new URLSearchParams(screen.getByTestId('search').textContent ?? '').get('name')).toBe(
      'Музыка и звук',
    )
  })

  it('записывает только последнее значение, если ввод меняется во время debounce', async () => {
    vi.useFakeTimers()
    renderSearcher()
    const input = screen.getByPlaceholderText('Искать навык')

    fireEvent.change(input, { target: { value: 'муз' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    fireEvent.change(input, { target: { value: 'музыка' } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(new URLSearchParams(screen.getByTestId('search').textContent ?? '').get('name')).toBe(
      'музыка',
    )
  })

  it('инициализирует поле из URL и удаляет name из URL при очистке', async () => {
    vi.useFakeTimers()
    renderSearcher('/?name=Гитара')
    const input = screen.getByPlaceholderText('Искать навык') as HTMLInputElement

    expect(input.value).toBe('Гитара')
    fireEvent.change(input, { target: { value: '' } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(new URLSearchParams(screen.getByTestId('search').textContent ?? '').has('name')).toBe(
      false,
    )
  })
  it('переходит в каталог с другой страницы', () => {
    renderSearcher('/about')
    fireEvent.change(screen.getByPlaceholderText('Искать навык'), { target: { value: 'Гитара' } })
    expect(screen.getByTestId('pathname')).toHaveTextContent('/')
    expect(new URLSearchParams(screen.getByTestId('search').textContent ?? '').get('name')).toBe(
      'Гитара',
    )
  })

  it('не теряет другие фильтры, изменённые во время debounce', async () => {
    vi.useFakeTimers()
    renderSearcher('/?type=learn')
    fireEvent.change(screen.getByPlaceholderText('Искать навык'), { target: { value: 'Гитара' } })
    fireEvent.click(screen.getByText('Город'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    const params = new URLSearchParams(screen.getByTestId('search').textContent ?? '')
    expect(params.get('city')).toBe('Москва')
    expect(params.get('type')).toBe('learn')
    expect(params.get('name')).toBe('Гитара')
  })

  it('сброс не восстанавливает старый поиск после debounce', async () => {
    vi.useFakeTimers()
    renderSearcher('/?name=Гитара')
    fireEvent.change(screen.getByPlaceholderText('Искать навык'), { target: { value: 'Барабаны' } })
    fireEvent.click(screen.getByText('Сброс'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(screen.getByPlaceholderText('Искать навык')).toHaveValue('')
    expect(screen.getByTestId('search').textContent).toBe('')
  })

  it('назад отменяет незавершённый поиск и восстанавливает URL', async () => {
    vi.useFakeTimers()
    renderSearcher('/about')
    fireEvent.change(screen.getByPlaceholderText('Искать навык'), { target: { value: 'Гитара' } })
    fireEvent.change(screen.getByPlaceholderText('Искать навык'), { target: { value: 'Барабаны' } })
    fireEvent.click(screen.getByText('Назад'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(screen.getByTestId('pathname')).toHaveTextContent('/about')
    expect(screen.getByTestId('search').textContent).toBe('')
    expect(screen.getByPlaceholderText('Искать навык')).toHaveValue('')
  })
  it('сброс отменяет отложенный ввод, даже если name ещё не появился в URL', async () => {
    vi.useFakeTimers()
    renderSearcher('/?city=Москва')
    fireEvent.change(screen.getByPlaceholderText('Искать навык'), { target: { value: 'Гитара' } })
    fireEvent.click(screen.getByText('Сброс'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(screen.getByPlaceholderText('Искать навык')).toHaveValue('')
    expect(screen.getByTestId('search').textContent).toBe('')
  })
})
