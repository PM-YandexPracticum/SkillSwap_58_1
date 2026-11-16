import { useState } from 'react'
import {
  RadioGroup,
  CheckboxGroup,
  FilterSection,
  SkillCategoryGroup,
  Text,
  Button,
  CloseIcon,
} from '@/shared/ui'
import { SKILL_CATEGORIES, CITIES, MODE_OPTIONS, GENDER_OPTIONS } from '@/shared/lib/constants'
import { FilterMode, Gender } from '@/shared/types'
import styles from './FilterSidebar.module.css'
import clsx from 'clsx'
import { useCatalogFilters } from '@/features/catalog-filter'

const VISIBLE_SKILLS_COUNT = 6

export const FilterSidebar = () => {
  const { filters, setFilters, resetFilters } = useCatalogFilters()

  const [showAllSkills, setShowAllSkills] = useState(false)
  const [showAllCities, setShowAllCities] = useState(false)
  const [resetCounter, setResetCounter] = useState(0)

  const activeFiltersCount =
    (filters.mode !== 'all' ? 1 : 0) +
    (filters.gender ? 1 : 0) +
    filters.cities.length +
    filters.skillIds.length +
    (filters.name ? 1 : 0)

  const visibleCategories = showAllSkills
    ? SKILL_CATEGORIES
    : SKILL_CATEGORIES.slice(0, VISIBLE_SKILLS_COUNT)

  const allCityOptions = CITIES.map((city) => ({ value: city, label: city }))

  const handleReset = () => {
    setResetCounter((prev) => prev + 1)
    setShowAllSkills(false)
    setShowAllCities(false)
    resetFilters()
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <Text variant="xl" weight="bold" as="h2">
          Фильтры {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Text>
        {activeFiltersCount > 0 && (
          <Button
            className={styles.resetBtn}
            variant="tertiary"
            size="sm"
            onClick={handleReset}
            trailingIcon={<CloseIcon />}
          >
            Сбросить
          </Button>
        )}
      </div>

      <FilterSection>
        <RadioGroup
          name="mode"
          options={MODE_OPTIONS}
          value={filters.mode}
          onChange={(val) => setFilters((prev) => ({ ...prev, mode: val as FilterMode }))}
        />
      </FilterSection>

      <FilterSection
        title="Навыки"
        actionText={showAllSkills ? 'Скрыть' : 'Все категории'}
        onActionClick={() => setShowAllSkills(!showAllSkills)}
        isExpanded={showAllSkills}
      >
        {visibleCategories.map((category) => (
          <SkillCategoryGroup
            key={`${category.id}-${showAllSkills}`}
            category={category}
            selectedSkills={filters.skillIds}
            onChange={(skills) => setFilters((prev) => ({ ...prev, skillIds: skills }))}
            forceCollapse={resetCounter}
          />
        ))}
      </FilterSection>

      <FilterSection title="Пол автора">
        <RadioGroup
          name="gender"
          options={GENDER_OPTIONS}
          value={filters.gender || 'Не имеет значения'}
          onChange={(val) =>
            setFilters((prev) => ({
              ...prev,
              gender: val === 'Не имеет значения' ? null : (val as Gender),
            }))
          }
        />
      </FilterSection>

      <FilterSection
        title="Город"
        actionText={showAllCities ? 'Скрыть' : 'Все города'}
        onActionClick={() => setShowAllCities(!showAllCities)}
        isExpanded={showAllCities}
      >
        <div className={clsx(styles.citiesList, { [styles.showAll]: showAllCities })}>
          <CheckboxGroup
            options={allCityOptions}
            values={filters.cities}
            onChange={(selectedCities) => {
              setFilters((prev) => ({ ...prev, cities: selectedCities }))
            }}
          />
        </div>
      </FilterSection>
    </aside>
  )
}
