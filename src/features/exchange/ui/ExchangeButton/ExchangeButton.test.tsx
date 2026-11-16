import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExchangeButton } from './ExchangeButton'

describe('ExchangeButton', () => {
  it('вызывает onClick при нажатии на «Предложить обмен»', () => {
    const onClick = vi.fn()

    render(<ExchangeButton isProposed={false} onClick={onClick} />)

    fireEvent.click(screen.getByRole('button', { name: 'Предложить обмен' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('показывает заблокированную кнопку «Обмен предложен»', () => {
    render(<ExchangeButton isProposed onClick={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Обмен предложен' })).toBeDisabled()
  })

  it('не вызывает onClick, когда обмен уже предложен', () => {
    const onClick = vi.fn()

    render(<ExchangeButton isProposed onClick={onClick} />)

    fireEvent.click(screen.getByRole('button', { name: 'Обмен предложен' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})
