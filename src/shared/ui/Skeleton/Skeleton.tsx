import clsx from 'clsx'
import styles from './Skeleton.module.css'

type SkeletonProps = {
  variant?: 'rect' | 'circle' | 'text'
  width?: number | string
  height?: number | string
  className?: string
}

export function Skeleton({ variant = 'rect', width, height, className }: SkeletonProps) {
  return (
    <div
      className={clsx(styles.skeleton, styles[variant], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
