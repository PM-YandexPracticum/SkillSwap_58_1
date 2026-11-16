import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { useCatalogFilters } from './useCatalogFilters'
import { CITIES, SKILL_CATEGORIES, INITIAL_FILTERS_STATE } from '@/shared/lib/constants'

const renderHookWithRouter = (initialEntries: string[] = ['/']) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  )

  return renderHook(() => ({ ...useCatalogFilters(), location: useLocation() }), { wrapper })
}

describe('useCatalogFilters', () => {
  it('инициализируется дефолтными значениями (name = null)', () => {
    const { result } = renderHookWithRouter()
    expect(result.current.filters).toEqual(INITIAL_FILTERS_STATE)
    expect(result.current.filters.name).toBeNull()
  })

  it('парсит name (q) из URL', () => {
    const { result } = renderHookWithRouter(['/?q=Английский'])
    expect(result.current.filters.name).toBe('Английский')
  })

  it('поддерживает несколько городов и навыков (повторение параметра)', () => {
    const realCity1 = CITIES[0]
    const realCity2 = CITIES[1]
    const realSkill1 = SKILL_CATEGORIES[0].subcategories[0].id
    const realSkill2 = SKILL_CATEGORIES[1].subcategories[0].id

    const { result } = renderHookWithRouter([
      `/?city=${realCity1}&city=${realCity2}&subCategoryId[]=${realSkill1}&subCategoryId[]=${realSkill2}`,
    ])

    expect(result.current.filters.cities).toEqual([realCity1, realCity2])
    expect(result.current.filters.skillIds).toEqual([realSkill1, realSkill2])
  })

  it('отбрасывает невалидные значения из URL', () => {
    const { result } = renderHookWithRouter([
      '/?type=invalid&gender=invalid&city=InvalidCity&subCategoryId[]=invalidSkill',
    ])

    expect(result.current.filters.mode).toBe('all')
    expect(result.current.filters.gender).toBeNull()
    expect(result.current.filters.cities).toEqual([])
    expect(result.current.filters.skillIds).toEqual([])
    expect(result.current.filters.name).toBeNull()
  })

  it('обновляет URL при вызове setFilters', () => {
    const { result } = renderHookWithRouter()
    const newCity = CITIES[0]
    const newSkill = SKILL_CATEGORIES[0].subcategories[0].id

    act(() => {
      result.current.setFilters({
        mode: 'canTeach',
        gender: 'Женский',
        cities: [newCity],
        skillIds: [newSkill],
        name: 'Маркетинг',
      })
    })

    expect(result.current.filters.mode).toBe('canTeach')
    expect(result.current.filters.gender).toBe('Женский')
    expect(result.current.filters.cities).toEqual([newCity])
    expect(result.current.filters.skillIds).toEqual([newSkill])
    expect(result.current.filters.name).toBe('Маркетинг')
  })

  it('сбрасывает фильтры и очищает URL', () => {
    const realCity = CITIES[0]
    const { result } = renderHookWithRouter([`/?type=learn&city=${realCity}&q=Английский`])

    expect(result.current.filters.mode).toBe('wantToLearn')
    expect(result.current.filters.name).toBe('Английский')

    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.filters).toEqual(INITIAL_FILTERS_STATE)
  })
  it('сохраняет старые ссылки develop и нормализует их при записи', () => {
    const { result } = renderHookWithRouter([
      '/?mode=wantToLearn&gender=Мужской&skillId=english&name=Гитара&tab=saved',
    ])
    expect(result.current.filters).toEqual({
      ...INITIAL_FILTERS_STATE,
      mode: 'wantToLearn',
      gender: 'Мужской',
      skillIds: ['english'],
      name: 'Гитара',
    })
    act(() => result.current.setFilters((prev) => ({ ...prev, cities: [CITIES[0]] })))
    const params = new URLSearchParams(result.current.location.search)
    expect(params.get('type')).toBe('learn')
    expect(params.get('gender')).toBe('male')
    expect(params.getAll('subCategoryId[]')).toEqual(['english'])
    expect(params.get('name')).toBe('Гитара')
    expect(params.get('tab')).toBe('saved')
    expect(params.has('skillId')).toBe(false)
  })

  it('не принимает свойства прототипа как режим или пол и убирает дубликаты', () => {
    const { result } = renderHookWithRouter([
      '/?type=toString&gender=constructor&city=Москва&city=Москва&subCategoryId[]=english&subCategoryId[]=english',
    ])
    expect(result.current.filters).toEqual({
      ...INITIAL_FILTERS_STATE,
      cities: ['Москва'],
      skillIds: ['english'],
    })
  })
})
