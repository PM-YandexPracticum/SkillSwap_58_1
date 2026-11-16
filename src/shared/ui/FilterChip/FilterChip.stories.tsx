import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FilterChip } from './FilterChip'

const meta: Meta<typeof FilterChip> = {
  title: 'Shared/UI/FilterChip',
  component: FilterChip,
  tags: ['autodocs'],
  argTypes: {
    onRemove: { action: 'removed' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', background: '#f9fafb' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Хочу научиться',
    onRemove: fn(),
  },
}

export const LongLabel: Story = {
  args: {
    label: 'Очень длинное название фильтра, которое может не поместиться',
    onRemove: fn(),
  },
}
