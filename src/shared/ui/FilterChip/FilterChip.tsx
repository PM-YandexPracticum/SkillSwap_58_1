import clsx from 'clsx'
import { Button } from '../Button'
import { CloseIcon } from '../icons'
import styles from './FilterChip.module.css'
import { useState } from 'react'

interface FilterChipProps {
  label: string
  onRemove: () => void
}

export const FilterChip = ({ label, onRemove }: FilterChipProps) => {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRemoving(true)
    setTimeout(() => {
      onRemove()
    }, 200)
  }

  return (
    <Button
      variant="tertiary"
      size="sm"
      onClick={handleRemove}
      trailingIcon={<CloseIcon style={{ width: 11, height: 11 }} />}
      className={clsx(styles.chip, { [styles.removing]: isRemoving })}
    >
      {label}
    </Button>
  )
}
