import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('блокируется и помечается занятой, пока идёт загрузка', () => {
    render(<Button isLoading>Войти</Button>)

    const button = screen.getByRole('button')

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('не блокируется без isLoading', () => {
    render(<Button>Войти</Button>)

    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('не вызывает onClick, пока идёт загрузка', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(
      <Button isLoading onClick={onClick}>
        Войти
      </Button>,
    )

    await user.click(screen.getByRole('button'))

    expect(onClick).not.toHaveBeenCalled()
  })
})
