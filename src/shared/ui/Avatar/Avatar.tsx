import { useState } from 'react'
import clsx from 'clsx'
import styles from './Avatar.module.css'

type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: AvatarSize
}

export function Avatar({ src, alt, size = 'md' }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const className = clsx(styles.avatar, styles[size])

  if (!src?.trim() || failedSrc === src) {
    return <div className={clsx(className, styles.fallback)} role="img" aria-label={alt} />
  }

  return <img className={className} src={src} alt={alt} onError={() => setFailedSrc(src)} />
}
