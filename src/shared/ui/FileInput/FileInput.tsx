import { forwardRef, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import clsx from 'clsx'
import styles from './FileInput.module.css'
import { FileInputIcon } from './FileInputIcon'
import { AvatarPlaceholderIcon } from './AvatarPlaceholderIcon'

export interface FileInputProps {
  onChange: (file: File) => void
  variant?: 'skill' | 'avatar'
  size?: number
  previewUrl?: string | null
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(function FileInput(
  { onChange, variant = 'skill', size, previewUrl },
  ref,
) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleFile = (next: File) => {
    setFile(next)
    onChange(next)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const shownPreview = preview ?? previewUrl ?? null
  const avatarLocked = variant === 'avatar' && shownPreview !== null

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (avatarLocked) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (avatarLocked) return
    setIsDragOver(true)
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === inputRef.current || avatarLocked) return
    inputRef.current?.click()
  }

  const handleDragLeave = () => setIsDragOver(false)

  return (
    <div className={clsx(styles.wrapper, variant === 'avatar' && styles.wrapperAvatar)}>
      <div
        className={clsx(
          styles.dropzone,
          isDragOver && styles.active,
          variant === 'avatar' ? styles.dropzoneAvatar : styles.dropzoneSkill,
          avatarLocked && styles.dropzoneAvatarLocked,
        )}
        style={
          variant === 'avatar' && size !== undefined
            ? ({ '--file-input-avatar-size': `${size}px` } as CSSProperties)
            : undefined
        }
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          ref={setInputRef}
          onChange={handleInputChange}
          accept="image/jpeg, image/png, image/webp"
          hidden
        />

        {shownPreview ? (
          <img
            src={shownPreview}
            alt="Превью"
            className={variant === 'avatar' ? styles.previewAvatar : styles.previewSkill}
          />
        ) : variant === 'avatar' ? (
          <AvatarPlaceholderIcon className={styles.avatarIcon} />
        ) : (
          <>
            <p className={styles.text}>Перетащите или выберите изображения навыка</p>
            <div className={styles.iconLink}>
              <FileInputIcon />
              <p className={styles.linkText}>Выберите изображение</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
})
