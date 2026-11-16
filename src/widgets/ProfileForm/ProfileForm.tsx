import clsx from 'clsx'
import { useRef, useState, type FormEvent } from 'react'
import { CITIES } from '@/shared/lib/constants'
import {
  Button,
  DateInput,
  FileInput,
  GalleryEditIcon,
  PencilIcon,
  Select,
  TextInput,
  Skeleton,
} from '@/shared/ui'
import styles from './ProfileForm.module.css'

const GENDER_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
]

const CITY_OPTIONS = CITIES.map((city) => ({ value: city, label: city }))

export type ProfileFormValues = {
  email: string
  name: string
  birthDate: string
  gender: string
  city: string
  bio: string
  avatar: File | null
}

export type ProfileFormProps = {
  className?: string
  defaultValues?: Partial<Omit<ProfileFormValues, 'avatar'>>
  avatarUrl?: string | null
  error?: string | null
  onSubmit: (values: ProfileFormValues) => void
  onPasswordChange?: () => void
  isLoading?: boolean
  isSubmitting?: boolean
}

const toBirthDate = (value: Date | string | null) => {
  if (value instanceof Date) return value.toLocaleDateString('ru-RU')
  return value ?? ''
}

export function ProfileForm({
  className,
  defaultValues,
  avatarUrl,
  error,
  onSubmit,
  onPasswordChange,
  isLoading = false,
  isSubmitting = false,
}: ProfileFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const birthRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState(defaultValues?.email ?? '')
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [birthDate, setBirthDate] = useState(defaultValues?.birthDate ?? '')
  const [gender, setGender] = useState(defaultValues?.gender ?? '')
  const [city, setCity] = useState(defaultValues?.city ?? '')
  const [bio, setBio] = useState(defaultValues?.bio ?? '')
  const [avatar, setAvatar] = useState<File | null>(null)

  if (isLoading) {
    return (
      <form className={clsx(styles.form, className)} aria-hidden="true">
        <div className={styles.fields}>
          <div className={styles.inputs}>
            {/* почта + «Изменить пароль» */}
            <Skeleton variant="rect" height={112} />
            {/* имя */}
            <Skeleton variant="rect" height={76} />
            {/* дата рождения + пол */}
            <Skeleton variant="rect" height={76} />
            {/* город */}
            <Skeleton variant="rect" height={76} />
            {/* о себе */}
            <Skeleton variant="rect" height={120} />
          </div>
          <Skeleton variant="rect" height={48} className={styles.submit} />
        </div>
        <div className={styles.avatar}>
          <Skeleton variant="circle" width={244} height={244} />
        </div>
      </form>
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      email,
      name,
      birthDate: birthRef.current?.value ?? birthDate,
      gender,
      city,
      bio,
      avatar,
    })
  }

  return (
    <form className={clsx(styles.form, className)} onSubmit={handleSubmit} noValidate>
      <div className={styles.fields}>
        <div className={styles.inputs}>
          <div className={styles.emailBlock}>
            <div className={styles.field}>
              <label htmlFor="profile-email">Почта</label>
              <TextInput
                id="profile-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Введите почту"
                value={email}
                className={styles.control}
                onChange={(event) => setEmail(event.target.value)}
                rightContent={
                  email ? (
                    <button
                      type="button"
                      className={styles.clear}
                      aria-label="Очистить почту"
                      onClick={() => setEmail('')}
                    >
                      ×
                    </button>
                  ) : null
                }
              />
            </div>
            <button type="button" className={styles.passwordButton} onClick={onPasswordChange}>
              Изменить пароль
            </button>
          </div>

          <div className={styles.field}>
            <label htmlFor="profile-name">Имя</label>
            <TextInput
              id="profile-name"
              name="name"
              autoComplete="name"
              placeholder="Введите ваше имя"
              value={name}
              className={styles.control}
              onChange={(event) => setName(event.target.value)}
              rightContent={
                name ? (
                  <button
                    type="button"
                    className={styles.clear}
                    aria-label="Очистить имя"
                    onClick={() => setName('')}
                  >
                    ×
                  </button>
                ) : null
              }
            />
          </div>

          <div className={styles.row}>
            <DateInput
              ref={birthRef}
              name="profile-birth"
              label="Дата рождения"
              value={birthDate}
              onChange={(value) => setBirthDate(toBirthDate(value))}
            />
            <Select
              label="Пол"
              placeholder="Не указан"
              options={GENDER_OPTIONS}
              value={gender}
              chevron="outline"
              clearable={false}
              onChange={(values) => setGender(values[0] ?? '')}
            />
          </div>

          <Select
            label="Город"
            placeholder="Не указан"
            options={CITY_OPTIONS}
            value={city}
            chevron="outline"
            onChange={(values) => setCity(values[0] ?? '')}
          />

          <div className={styles.field}>
            <label htmlFor="profile-bio">О себе</label>
            <div className={styles.textareaWrap}>
              <textarea
                id="profile-bio"
                name="bio"
                className={styles.textarea}
                placeholder="Коротко расскажите о себе"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
              <span className={styles.textareaIcon}>
                <PencilIcon size={20} />
              </span>
            </div>
          </div>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          className={styles.submit}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? <Skeleton variant="rect" width="56%" height={16} /> : 'Сохранить'}
        </Button>
      </div>

      <div className={styles.avatar}>
        <FileInput
          ref={fileRef}
          variant="avatar"
          size={244}
          previewUrl={avatarUrl}
          onChange={setAvatar}
        />
        <button
          type="button"
          className={styles.edit}
          aria-label="Изменить фото"
          onClick={() => fileRef.current?.click()}
        >
          <GalleryEditIcon />
        </button>
      </div>
    </form>
  )
}
