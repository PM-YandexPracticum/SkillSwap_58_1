import { useCallback, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import type { FiltersState, FilterMode, Gender } from '@/shared/types'
import { CITIES, SKILL_CATEGORIES } from '@/shared/lib/constants'
import { generateId } from '@/shared/lib/helpers'
import type { City, SubCategoryId } from '@/shared/lib/constants'

const VALID_CITIES = new Set<string>(CITIES)
const VALID_SKILLS = new Set<string>(
  SKILL_CATEGORIES.flatMap((category) => category.subcategories.map((sub) => sub.id)),
)
const FILTER_PARAMS = ['type', 'mode', 'gender', 'city', 'subCategoryId[]', 'skillId', 'name', 'q']

function readFilters(params: URLSearchParams): FiltersState {
  const type = params.get('type') ?? params.get('mode')
  const mode: FilterMode =
    type === 'learn' || type === 'wantToLearn'
      ? 'wantToLearn'
      : type === 'teach' || type === 'canTeach'
        ? 'canTeach'
        : 'all'
  const genderParam = params.get('gender')
  const gender: Gender | null =
    genderParam === 'male' || genderParam === 'Мужской'
      ? 'Мужской'
      : genderParam === 'female' || genderParam === 'Женский'
        ? 'Женский'
        : null

  return {
    mode,
    gender,
    cities: [...new Set(params.getAll('city'))].filter((city) => VALID_CITIES.has(city)) as City[],
    skillIds: [
      ...new Set([...params.getAll('subCategoryId[]'), ...params.getAll('skillId')]),
    ].filter((id) => VALID_SKILLS.has(id)) as SubCategoryId[],
    name: (params.get('name') ?? params.get('q'))?.trim() || null,
  }
}

export const useCatalogFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { state } = useLocation()
  const filters = useMemo(() => readFilters(searchParams), [searchParams])

  const setFilters: React.Dispatch<React.SetStateAction<FiltersState>> = useCallback(
    (newFilters) => {
      setSearchParams(
        (current) => {
          const next =
            typeof newFilters === 'function' ? newFilters(readFilters(current)) : newFilters
          const params = new URLSearchParams(current)
          FILTER_PARAMS.forEach((key) => params.delete(key))
          if (next.mode !== 'all')
            params.set('type', next.mode === 'wantToLearn' ? 'learn' : 'teach')
          if (next.gender) params.set('gender', next.gender === 'Мужской' ? 'male' : 'female')
          if (next.name?.trim()) params.set('name', next.name.trim())
          next.cities.forEach((city) => params.append('city', city))
          next.skillIds.forEach((id) => params.append('subCategoryId[]', id))
          return params
        },
        { replace: true, state },
      )
    },
    [setSearchParams, state],
  )

  const resetFilters = useCallback(() => {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current)
        FILTER_PARAMS.forEach((key) => params.delete(key))
        return params
      },
      { replace: true, state: { ...state, catalogFiltersResetId: generateId() } },
    )
  }, [setSearchParams, state])

  return { filters, setFilters, resetFilters }
}
