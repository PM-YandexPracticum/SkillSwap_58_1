import { fireEvent, render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'
import styles from './Avatar.module.css'

describe('Avatar', () => {
  it('с валидным src рендерит img с src и alt', () => {
    render(<Avatar src="/avatar.jpg" alt="Аватар Ивана" />)

    const img = screen.getByRole('img', { name: 'Аватар Ивана' })

    expect(img).toHaveAttribute('src', '/avatar.jpg')
    expect(img).toHaveAttribute('alt', 'Аватар Ивана')
  })

  it('при src === null показывает заглушку', () => {
    render(<Avatar src={null} alt="Аватар" />)

    expect(screen.getByRole('img', { name: 'Аватар' })).toHaveClass(styles.fallback)
  })

  it('при отсутствии src показывает заглушку', () => {
    render(<Avatar alt="Аватар" />)

    expect(screen.getByRole('img', { name: 'Аватар' })).toHaveClass(styles.fallback)
  })

  it.each(['', '   '])('при пустом src="%s" показывает заглушку', (src) => {
    render(<Avatar src={src} alt="Аватар" />)

    expect(screen.getByRole('img', { name: 'Аватар' })).toHaveClass(styles.fallback)
  })

  it('при ошибке загрузки показывает заглушку вместо изображения', () => {
    const { container } = render(<Avatar src="/broken.jpg" alt="Аватар" />)

    fireEvent.error(screen.getByRole('img'))

    expect(screen.getByRole('img', { name: 'Аватар' })).toHaveClass(styles.fallback)
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('при изменении src после ошибки показывает новое изображение', () => {
    const { rerender } = render(<Avatar src="/broken.jpg" alt="Аватар" />)

    fireEvent.error(screen.getByRole('img'))

    rerender(<Avatar src="/avatar.jpg" alt="Аватар" />)

    expect(screen.getByRole('img')).toHaveAttribute('src', '/avatar.jpg')
  })

  it('по умолчанию применяет класс md', () => {
    render(<Avatar src="/avatar.jpg" alt="Аватар" />)

    expect(screen.getByRole('img')).toHaveClass(styles.md)
  })

  it.each(['sm', 'lg'] as const)('size=%s применяет свой класс', (size) => {
    render(<Avatar src="/avatar.jpg" alt="Аватар" size={size} />)

    expect(screen.getByRole('img')).toHaveClass(styles[size])
  })

  it.each(['sm', 'md', 'lg'] as const)('заглушка размера %s сохраняет нужный класс', (size) => {
    render(<Avatar src={null} alt="Аватар" size={size} />)

    expect(screen.getByRole('img', { name: 'Аватар' })).toHaveClass(styles[size], styles.fallback)
  })
})
