import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'

import { Avatar } from './Avatar'
import styles from './Avatar.module.css'

const meta = {
  component: Avatar,
  args: {
    src: '/favicon.svg',
    alt: 'Иван Петров',
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Medium: Story = {
  play: async ({ canvas, args }) => {
    const img = canvas.getByRole('img', { name: args.alt })
    await expect(img).toHaveAttribute('src', args.src)
  },
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const Large: Story = {
  args: { size: 'lg' },
}

export const NoSource: Story = {
  args: { src: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Иван Петров' })).toHaveClass(styles.fallback)
  },
}

export const EmptySource: Story = {
  args: { src: '' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Иван Петров' })).toHaveClass(styles.fallback)
  },
}

export const BrokenImage: Story = {
  args: { src: '/db/not-an-image.png' },
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByRole('img', { name: 'Иван Петров' })).toHaveClass(styles.fallback)
    })
  },
}
