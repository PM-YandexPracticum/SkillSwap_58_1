import { SkillInput } from '@/shared/ui'
import styles from './SkillSearcher.module.css'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCatalogFilters } from '@/features/catalog-filter'
import { ROUTES } from '@/shared/lib/constants'

export function SkillSearcher() {
  const { filters, setFilters } = useCatalogFilters()
  const routeName = filters.name ?? ''
  const { pathname, state } = useLocation()
  const resetId = state?.catalogFiltersResetId
  const navigate = useNavigate()
  const [name, setName] = useState(routeName)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const updateFilters = useRef(setFilters)
  updateFilters.current = setFilters

  useEffect(() => {
    clearTimeout(timer.current)
    setName(routeName)
    return () => clearTimeout(timer.current)
  }, [routeName, pathname, resetId])

  const handleChange = (value: string) => {
    clearTimeout(timer.current)
    setName(value)
    const nextName = value.trim() || null
    if (pathname !== ROUTES.HOME) {
      const params = new URLSearchParams()
      if (nextName) params.set('name', nextName)
      navigate({ pathname: ROUTES.HOME, search: params.toString() })
      return
    }
    const apply = () => updateFilters.current((prev) => ({ ...prev, name: nextName }))
    if (nextName === null) apply()
    else timer.current = setTimeout(apply, 1000)
  }

  return <SkillInput className={styles.searchInput} value={name} onChange={handleChange} />
}
