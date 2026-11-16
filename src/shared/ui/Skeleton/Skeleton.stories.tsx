import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton } from './Skeleton'
import { Card } from '../Card'

const meta = {
  title: 'shared/ui/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Rect: Story = {
  args: { variant: 'rect', width: 200, height: 100 },
}

export const Circle: Story = {
  args: { variant: 'circle', width: 64, height: 64 },
}

export const Text: Story = {
  args: { variant: 'text', width: '60%' },
}

export const Dark: Story = {
  args: { variant: 'rect', width: 200, height: 100 },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ padding: 16, backgroundColor: 'var(--color-bg)' }}>
        <Story />
      </div>
    ),
  ],
}

export const CardPlaceholder: Story = {
  render: () => (
    <Card style={{ width: 324 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Skeleton variant="circle" width={48} height={48} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <Skeleton variant="rect" width="100%" height={120} />
      </div>
    </Card>
  ),
}
