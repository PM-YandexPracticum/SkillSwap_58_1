import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExchangeModal } from './ExchangeModal'

function ExchangeModalPreview() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div>
      <button type="button" onClick={() => setIsOpen(true)}>
        Открыть модалку
      </button>
      <ExchangeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  )
}

const meta = {
  title: 'Features/ExchangeModal',
  component: ExchangeModal,
} satisfies Meta<typeof ExchangeModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { isOpen: true, onClose: () => {} },
  render: () => <ExchangeModalPreview />,
}
