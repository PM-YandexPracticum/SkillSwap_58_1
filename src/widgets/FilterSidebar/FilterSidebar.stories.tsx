import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { FilterSidebar } from './FilterSidebar'
import { CITIES, SKILL_CATEGORIES } from '../../shared/lib/constants'

const subcategoryId = SKILL_CATEGORIES[0].subcategories[1].id
const firstCity = CITIES[0]
const secondCity = CITIES[1]

const UrlSetter = ({ url }: { url: string }) => {
  useEffect(() => {
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [url])

  return <FilterSidebar />
}

const meta: Meta<typeof UrlSetter> = {
  title: 'Widgets/FilterSidebar',
  component: UrlSetter,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', background: '#f9fafb', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof UrlSetter>

export const Default: Story = {
  args: {
    url: '/',
  },
}

export const WithActiveFilters: Story = {
  args: {
    url: `/?type=learn&subCategoryId[]=${subcategoryId}&city=${firstCity}&city=${secondCity}`,
  },
}
