import { FilterChip } from '@/shared/ui'
import { FiltersState } from '@/shared/types'
import { SKILL_CATEGORIES, MODE_OPTIONS } from '@/shared/lib/constants'
import clsx from 'clsx'
import styles from './ActiveFilters.module.css'

interface ActiveFiltersProps {
  filters: FiltersState
  onRemoveFilter: (field: keyof FiltersState, value: string | null) => void
}

export const ActiveFilters = ({ filters, onRemoveFilter }: ActiveFiltersProps) => {
  const chips: { id: string; label: string; field: keyof FiltersState; value: string | null }[] = []

  if (filters.mode !== 'all') {
    const modeLabel = MODE_OPTIONS.find((m) => m.value === filters.mode)?.label
    if (modeLabel) {
      chips.push({ id: 'mode', label: modeLabel, field: 'mode', value: 'all' })
    }
  }

  if (filters.gender) {
    chips.push({ id: 'gender', label: filters.gender, field: 'gender', value: null })
  }

  filters.cities.forEach((city) => {
    chips.push({ id: `city-${city}`, label: city, field: 'cities', value: city })
  })

  filters.skillIds.forEach((skillId) => {
    let skillName = ''
    for (const category of SKILL_CATEGORIES) {
      const sub = category.subcategories.find((s) => s.id === skillId)
      if (sub) {
        skillName = sub.title
        break
      }
    }
    if (skillName) {
      chips.push({ id: `skill-${skillId}`, label: skillName, field: 'skillIds', value: skillId })
    }
  })

  if (filters.name) {
    chips.push({ id: 'name', label: filters.name, field: 'name', value: null })
  }

  const hasChips = chips.length > 0

  return (
    <div className={clsx(styles.wrapper, { [styles.isVisible]: hasChips })}>
      <div className={styles.container}>
        {chips.map((chip) => (
          <FilterChip
            key={chip.id}
            label={chip.label}
            onRemove={() => onRemoveFilter(chip.field, chip.value)}
          />
        ))}
      </div>
    </div>
  )
}
