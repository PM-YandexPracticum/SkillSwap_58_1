import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SkillInput } from './SkillInput'

const meta: Meta<typeof SkillInput> = {
  title: 'Shared/UI/SkillInput',
  component: SkillInput,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', width: '400px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onChange: fn(),
  },
}

export default meta
type Story = StoryObj<typeof meta>

const InteractiveSkillInput = (args: React.ComponentProps<typeof SkillInput>) => {
  const [value, setValue] = useState(args.value || '')

  return (
    <SkillInput
      {...args}
      value={value}
      onChange={(newValue) => {
        setValue(newValue)
        args.onChange?.(newValue)
      }}
    />
  )
}

export const Default: Story = {
  render: (args) => <InteractiveSkillInput {...args} />,
  args: {
    value: '',
  },
}

export const WithValue: Story = {
  render: (args) => <InteractiveSkillInput {...args} />,
  args: {
    value: 'Английский',
  },
}
