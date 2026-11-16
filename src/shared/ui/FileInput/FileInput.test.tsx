import { createRef } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileInput } from './FileInput'

describe('FileInput', () => {
  it('должен рендерить текст подсказки для варианта skill', () => {
    render(<FileInput onChange={vi.fn()} variant="skill" />)
    expect(screen.getByText(/Перетащите или выберите изображения навыка/i)).toBeInTheDocument()
    expect(screen.getByText(/Выберите изображение/i)).toBeInTheDocument()
  })

  it('должен рендерить иконку-плейсхолдер для варианта avatar (без текста)', () => {
    render(<FileInput onChange={vi.fn()} variant="avatar" />)

    expect(
      screen.queryByText(/Перетащите или выберите изображения навыка/i),
    ).not.toBeInTheDocument()
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument()
  })

  it('должен вызывать onChange при выборе валидного файла', () => {
    const handleChange = vi.fn()
    render(<FileInput onChange={handleChange} />)

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    expect(handleChange).toHaveBeenCalledWith(file)
  })

  it('должен обрабатывать Drop файла', () => {
    const handleChange = vi.fn()
    render(<FileInput onChange={handleChange} />)

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const dropzone = document.querySelector('input[type="file"]')?.parentElement as HTMLDivElement

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    })

    expect(handleChange).toHaveBeenCalledWith(file)
  })

  it('задаёт размер только аватарному варианту', () => {
    const { container } = render(<FileInput onChange={vi.fn()} variant="avatar" size={244} />)
    const dropzone = container.querySelector('input[type="file"]')?.parentElement

    expect(dropzone).toHaveStyle({ '--file-input-avatar-size': '244px' })
  })

  it('прокидывает ref на input файла и оставляет клик по зоне выбора', () => {
    const ref = createRef<HTMLInputElement>()
    render(<FileInput ref={ref} onChange={vi.fn()} />)

    const input = document.querySelector('input[type="file"]')
    expect(ref.current).toBe(input)

    const click = vi.spyOn(ref.current as HTMLInputElement, 'click')
    fireEvent.click(input?.parentElement as HTMLDivElement)

    expect(click).toHaveBeenCalled()
  })

  it('показывает сохранённый адрес аватара и не открывает выбор по клику', () => {
    const ref = createRef<HTMLInputElement>()
    render(
      <FileInput
        ref={ref}
        onChange={vi.fn()}
        variant="avatar"
        previewUrl="http://localhost/api/uploads/avatars/user-01/photo.png"
      />,
    )

    expect(screen.getByAltText('Превью')).toHaveAttribute(
      'src',
      'http://localhost/api/uploads/avatars/user-01/photo.png',
    )
    const click = vi.spyOn(ref.current as HTMLInputElement, 'click')
    fireEvent.click(screen.getByAltText('Превью'))
    expect(click).not.toHaveBeenCalled()
  })

  it('после загрузки фото аватара не открывает выбор файла по клику и перетаскиванию', () => {
    const handleChange = vi.fn()
    const ref = createRef<HTMLInputElement>()
    render(<FileInput ref={ref} onChange={handleChange} variant="avatar" />)

    const first = new File(['photo'], 'photo.png', { type: 'image/png' })
    fireEvent.change(ref.current as HTMLInputElement, { target: { files: [first] } })
    handleChange.mockClear()

    const click = vi.spyOn(ref.current as HTMLInputElement, 'click')
    fireEvent.click(screen.getByAltText('Превью'))

    const second = new File(['next'], 'next.png', { type: 'image/png' })
    fireEvent.drop(screen.getByAltText('Превью').parentElement as HTMLDivElement, {
      dataTransfer: { files: [second] },
    })

    expect(click).not.toHaveBeenCalled()
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('отзывает прежний адрес превью при смене файла и при размонтировании', () => {
    let count = 0
    const create = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => `blob:preview-${count++}`)
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    try {
      const { unmount } = render(<FileInput onChange={vi.fn()} />)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, {
        target: { files: [new File(['a'], 'a.png', { type: 'image/png' })] },
      })
      fireEvent.change(input, {
        target: { files: [new File(['b'], 'b.png', { type: 'image/png' })] },
      })

      expect(screen.getByAltText('Превью')).toHaveAttribute('src', 'blob:preview-1')
      expect(revoke).toHaveBeenCalledWith('blob:preview-0')

      unmount()
      expect(revoke).toHaveBeenCalledWith('blob:preview-1')
    } finally {
      create.mockRestore()
      revoke.mockRestore()
    }
  })
})
