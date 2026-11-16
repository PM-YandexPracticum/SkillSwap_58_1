import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ProfileForm } from './ProfileForm'

const meta = {
  title: 'Widgets/ProfileForm',
  component: ProfileForm,
  tags: ['autodocs'],
  args: {
    onSubmit: fn(),
    onPasswordChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 36, background: 'var(--color-bg)', minHeight: 860 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProfileForm>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Filled: Story = {
  args: {
    defaultValues: {
      email: 'Mariia@gmail.com',
      name: 'Мария',
      birthDate: '28.10.1995',
      gender: 'female',
      city: 'Москва',
      bio: 'Люблю учиться новому, особенно если это можно делать за чаем и в пижаме. Всегда готова пообщаться и обменяться чем-то интересным!',
    },
  },
}
