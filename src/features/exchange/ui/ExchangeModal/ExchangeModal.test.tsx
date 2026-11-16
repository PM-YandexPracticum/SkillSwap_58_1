import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExchangeModal } from './ExchangeModal'

describe('ExchangeModal', () => {
  it('показывает сообщение, когда открыта', () => {
    render(<ExchangeModal isOpen onClose={vi.fn()} />)

    expect(screen.getByText('Вы предложили обмен')).toBeInTheDocument()
  })

  it('ничего не показывает, когда закрыта', () => {
    render(<ExchangeModal isOpen={false} onClose={vi.fn()} />)

    expect(screen.queryByText('Вы предложили обмен')).not.toBeInTheDocument()
  })

  it('вызывает onClose при нажатии на «Готово»', () => {
    const onClose = vi.fn()

    render(<ExchangeModal isOpen onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Готово' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
