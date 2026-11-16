import { TextInput, SearchIcon, CloseIcon } from '@/shared/ui'
import styles from './SkillInput.module.css'

interface SkillInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function SkillInput({
  value,
  onChange,
  className,
  placeholder = 'Искать навык',
}: SkillInputProps) {
  return (
    <TextInput
      className={className}
      aria-label={placeholder}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      leftContent={<SearchIcon width={20} height={20} color="var(--color-text-secondary)" />}
      rightContent={
        value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className={styles.clearButton}
            aria-label="Очистить поиск"
          >
            <CloseIcon width={16} height={16} />
          </button>
        ) : null
      }
    />
  )
}
