import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'
import styles from './Skeleton.module.css'

describe('Skeleton', () => {
  it('по умолчанию применяет класс rect', () => {
    const { container } = render(<Skeleton />)

    expect(container.firstChild).toHaveClass(styles.rect)
  })

  it.each(['circle', 'text'] as const)('variant=%s применяет свой класс', (variant) => {
    const { container } = render(<Skeleton variant={variant} />)

    expect(container.firstChild).toHaveClass(styles[variant])
  })

  it('применяет width и height как стили', () => {
    const { container } = render(<Skeleton width={64} height="2rem" />)

    expect(container.firstChild).toHaveStyle({ width: '64px', height: '2rem' })
  })
})
