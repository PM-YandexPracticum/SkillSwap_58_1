import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FilterChip } from './FilterChip'

describe('FilterChip', () => {
  it('отображает переданный текст', () => {
    render(<FilterChip label="Английский" onRemove={vi.fn()} />)
    expect(screen.getByText('Английский')).toBeInTheDocument()
  })

  it('вызывает onRemove при клике на кнопку', async () => {
    const user = userEvent.setup()
    const handleRemove = vi.fn()

    render(<FilterChip label="Английский" onRemove={handleRemove} />)

    await user.click(screen.getByRole('button', { name: /английский/i }))

    await waitFor(() => {
      expect(handleRemove).toHaveBeenCalledTimes(1)
    })
  })
})
