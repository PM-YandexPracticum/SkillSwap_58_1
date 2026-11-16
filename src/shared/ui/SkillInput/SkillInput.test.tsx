import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SkillInput } from './SkillInput'

describe('SkillInput', () => {
  it('отображает переданное значение', () => {
    render(<SkillInput value="Английский" onChange={vi.fn()} />)
    expect(screen.getByDisplayValue('Английский')).toBeInTheDocument()
  })

  it('вызывает onChange при вводе текста', () => {
    const handleChange = vi.fn()
    render(<SkillInput value="" onChange={handleChange} />)

    const input = screen.getByPlaceholderText('Искать навык')

    fireEvent.change(input, { target: { value: 'Маркетинг' } })

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith('Маркетинг')
  })

  it('вызывает onChange("") при клике на крестик', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<SkillInput value="Английский" onChange={handleChange} />)

    const clearButton = screen.getByRole('button', { name: /очистить поиск/i })
    await user.click(clearButton)

    expect(handleChange).toHaveBeenCalledWith('')
  })

  it('не показывает крестик, если поле пустое', () => {
    render(<SkillInput value="" onChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /очистить поиск/i })).not.toBeInTheDocument()
  })
})
