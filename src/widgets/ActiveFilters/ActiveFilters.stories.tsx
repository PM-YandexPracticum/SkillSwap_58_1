import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FilterMode, FiltersState } from '@/shared/types'
import { ActiveFilters } from './ActiveFilters'
import {
  CITIES,
  INITIAL_FILTERS_STATE,
  MODE_OPTIONS,
  SKILL_CATEGORIES,
} from '@/shared/lib/constants'
import { useState } from 'react'

const REAL_CITY_1 = CITIES[0]
const REAL_SKILL_ID = SKILL_CATEGORIES[0].subcategories[0].id
const REAL_MODE = MODE_OPTIONS[1].value as FilterMode
const REAL_SKILL_ID_2 = SKILL_CATEGORIES[1].subcategories[0].id
const REAL_SKILL_ID_3 = SKILL_CATEGORIES[2].subcategories[0].id

const meta: Meta<typeof ActiveFilters> = {
  title: 'Widgets/ActiveFilters',
  component: ActiveFilters,
  tags: ['autodocs'],
  argTypes: {
    onRemoveFilter: { action: 'filterRemoved' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', background: '#f9fafb', minHeight: '100px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

const InteractiveActiveFilters = (args: React.ComponentProps<typeof ActiveFilters>) => {
  const [filters, setFilters] = useState<FiltersState>(args.filters)

  const handleRemoveFilter = (field: keyof FiltersState, value: string | null) => {
    if (field === 'cities') {
      setFilters((prev) => ({ ...prev, cities: prev.cities.filter((c) => c !== value) }))
    } else if (field === 'skillIds') {
      setFilters((prev) => ({ ...prev, skillIds: prev.skillIds.filter((id) => id !== value) }))
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }))
    }

    args.onRemoveFilter?.(field, value)
  }

  return <ActiveFilters {...args} filters={filters} onRemoveFilter={handleRemoveFilter} />
}

export const OnlyMode: Story = {
  render: (args) => <InteractiveActiveFilters {...args} />,
  args: {
    filters: {
      ...INITIAL_FILTERS_STATE,
      mode: REAL_MODE,
    },
    onRemoveFilter: fn(),
  },
}

export const FullSet: Story = {
  render: (args) => <InteractiveActiveFilters {...args} />,
  args: {
    filters: {
      ...INITIAL_FILTERS_STATE,
      mode: REAL_MODE,
      gender: 'Мужской',
      cities: [REAL_CITY_1],
      skillIds: [REAL_SKILL_ID],
    },
    onRemoveFilter: fn(),
  },
}

export const Empty: Story = {
  args: {
    filters: {
      ...INITIAL_FILTERS_STATE,
    },
    onRemoveFilter: fn(),
  },
}

export const ManyChips: Story = {
  render: (args) => <InteractiveActiveFilters {...args} />,
  args: {
    filters: {
      ...INITIAL_FILTERS_STATE,
      mode: REAL_MODE,
      gender: 'Женский',
      cities: [...CITIES],
      skillIds: [REAL_SKILL_ID, REAL_SKILL_ID_2, REAL_SKILL_ID_3],
    },
    onRemoveFilter: fn(),
  },
}
