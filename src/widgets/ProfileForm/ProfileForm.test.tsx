import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProfileForm } from './ProfileForm'

describe('ProfileForm', () => {
  it('показывает поля личных данных и загрузку фото', () => {
    render(<ProfileForm onSubmit={vi.fn()} />)

    expect(screen.getByLabelText('Почта')).toBeInTheDocument()
    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
    expect(screen.getByLabelText('Дата рождения')).toBeInTheDocument()
    expect(screen.getByLabelText('Пол')).toBeInTheDocument()
    expect(screen.getByLabelText('Город')).toBeInTheDocument()
    expect(screen.getByLabelText('О себе')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Изменить пароль' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Изменить фото' })).toBeInTheDocument()
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument()
  })

  it('открывает выбор файла по кнопке изменения фото', () => {
    render(<ProfileForm onSubmit={vi.fn()} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const click = vi.spyOn(input, 'click')

    fireEvent.click(screen.getByRole('button', { name: 'Изменить фото' }))

    expect(click).toHaveBeenCalled()
  })

  it('показывает превью выбранного фото', () => {
    render(<ProfileForm onSubmit={vi.fn()} />)

    const file = new File(['photo'], 'photo.png', { type: 'image/png' })
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    })

    expect(screen.getByAltText('Превью')).toBeInTheDocument()
  })

  it('не показывает крестик очистки у поля «Пол»', () => {
    render(<ProfileForm onSubmit={vi.fn()} />)

    fireEvent.keyDown(screen.getByLabelText('Пол'), { key: 'ArrowDown' })
    fireEvent.click(screen.getByRole('option', { name: 'Женский' }))

    expect(screen.getByText('Женский')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Очистить выбор' })).not.toBeInTheDocument()
  })

  it('очищает почту и имя крестиком', async () => {
    const user = userEvent.setup()
    render(<ProfileForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText('Почта'), 'anna@example.com')
    await user.type(screen.getByLabelText('Имя'), 'Анна')
    await user.click(screen.getByRole('button', { name: 'Очистить почту' }))
    await user.click(screen.getByRole('button', { name: 'Очистить имя' }))

    expect(screen.getByLabelText('Почта')).toHaveValue('')
    expect(screen.getByLabelText('Имя')).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Очистить почту' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Очистить имя' })).not.toBeInTheDocument()
  })

  it('после загрузки фото меняет его только кнопкой', () => {
    render(<ProfileForm onSubmit={vi.fn()} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, {
      target: { files: [new File(['photo'], 'photo.png', { type: 'image/png' })] },
    })

    const click = vi.spyOn(input, 'click')
    fireEvent.click(screen.getByAltText('Превью'))
    expect(click).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Изменить фото' }))
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('отправляет введённые данные по кнопке «Сохранить»', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ProfileForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Почта'), 'anna@example.com')
    await user.type(screen.getByLabelText('Имя'), 'Анна')
    await user.type(screen.getByLabelText('Дата рождения'), '01011990')
    await user.click(screen.getByTestId('confirm-btn'))
    fireEvent.keyDown(screen.getByLabelText('Пол'), { key: 'ArrowDown' })
    fireEvent.click(screen.getByRole('option', { name: 'Женский' }))
    fireEvent.keyDown(screen.getByLabelText('Город'), { key: 'ArrowDown' })
    fireEvent.click(screen.getByRole('option', { name: 'Москва' }))
    await user.type(screen.getByLabelText('О себе'), 'Учу рисовать')

    const file = new File(['photo'], 'photo.png', { type: 'image/png' })
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    })
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'anna@example.com',
      name: 'Анна',
      birthDate: '01.01.1990',
      gender: 'female',
      city: 'Москва',
      bio: 'Учу рисовать',
      avatar: file,
    })
  })

  it('отправляет дату из поля без кнопки «Выбрать»', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ProfileForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Дата рождения'), '01011990')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ birthDate: '01.01.1990' }))
  })

  it('отправляет дату, исправленную в поле после «Выбрать»', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ProfileForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Дата рождения'), '01011990')
    await user.click(screen.getByTestId('confirm-btn'))
    await user.clear(screen.getByLabelText('Дата рождения'))
    await user.type(screen.getByLabelText('Дата рождения'), '02021991')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ birthDate: '02.02.1991' }))
  })

  it('отправляет почту без встроенной проверки браузера', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ProfileForm onSubmit={onSubmit} />)

    expect(document.querySelector('form')).toHaveAttribute('novalidate')
    await user.type(screen.getByLabelText('Почта'), 'anna@')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ email: 'anna@' }))
  })

  it('не отправляет форму по ссылке «Изменить пароль»', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onPasswordChange = vi.fn()
    render(<ProfileForm onSubmit={onSubmit} onPasswordChange={onPasswordChange} />)

    await user.click(screen.getByRole('button', { name: 'Изменить пароль' }))

    expect(onPasswordChange).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
