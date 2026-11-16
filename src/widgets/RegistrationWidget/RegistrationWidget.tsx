import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'
import { Controller } from 'react-hook-form'
import {
  RegistrationFormProvider,
  useRegistrationForm,
  type RegistrationFormValues,
} from '@/features/registration'
import { useRegistrationSubmit } from '@/features/registration/model/useRegistrationSubmit'
import { ALLOWED_IMAGE_TYPES, CITIES, SKILL_CATEGORIES, ROUTES } from '@/shared/lib/constants'
import { Button, TextInput, DateInput, FileInput, Select, AvatarPlaceholderIcon } from '@/shared/ui'
import { SkillInfoCard } from '@/widgets/SkillInfoCard'
import { OfferConfirmationModal } from './OfferConfirmationModal'
import type { Skill } from '@/shared/types'
import type { CategoryId, SubCategoryId } from '@/shared/lib/constants'

import styles from './RegistrationWidget.module.css'

interface RegistrationWidgetProps {
  step: number
  onNext?: () => void
  onBack?: () => void
  className?: string
}

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24.0002 12.2667C24.0002 11.28 23.9185 10.56 23.7417 9.81335H12.2451V14.2666H18.9934C18.8574 15.3733 18.1227 17.04 16.49 18.1599L16.4671 18.309L20.1021 21.0687L20.354 21.0934C22.6668 19 24.0002 15.92 24.0002 12.2667Z"
      fill="#4285F4"
    />
    <path
      d="M12.245 24C15.551 24 18.3265 22.9333 20.3538 21.0934L16.4898 18.1599C15.4558 18.8666 14.068 19.3599 12.245 19.3599C9.00688 19.3599 6.25861 17.2667 5.27892 14.3734L5.13532 14.3853L1.35558 17.252L1.30615 17.3866C3.31974 21.3066 7.4558 24 12.245 24Z"
      fill="#34A853"
    />
    <path
      d="M5.27886 14.3733C5.02036 13.6266 4.87076 12.8266 4.87076 12C4.87076 11.1732 5.02036 10.3733 5.26526 9.62661L5.25841 9.46759L1.43131 6.55487L1.30609 6.61324C0.476196 8.23993 0 10.0666 0 12C0 13.9333 0.476196 15.7599 1.30609 17.3866L5.27886 14.3733Z"
      fill="#FBBC05"
    />
    <path
      d="M12.245 4.63997C14.5442 4.63997 16.0952 5.6133 16.9796 6.42669L20.4354 3.12C18.313 1.18667 15.551 0 12.245 0C7.4558 0 3.31974 2.69331 1.30615 6.61328L5.26532 9.62665C6.25861 6.73333 9.00688 4.63997 12.245 4.63997Z"
      fill="#EB4335"
    />
  </svg>
)

const AppleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.6543 5.77578C11.3983 4.3804 12.0581 2.94439 12.8527 1.97664C13.7284 0.908854 15.2312 0.0899883 16.5154 0C16.7324 1.46297 16.1353 2.88836 15.3494 3.8966C14.5064 4.97974 13.0569 5.8197 11.6543 5.77578ZM19.1873 10.832C19.5847 9.72329 20.3719 8.72577 21.5932 8.05273C20.359 6.5126 18.6262 5.61845 16.991 5.61845C14.8274 5.61845 13.9127 6.64923 12.4099 6.64923C10.8619 6.64923 9.6875 5.61845 7.81348 5.61845C5.97581 5.61845 4.01969 6.73851 2.77911 8.65142C2.32297 9.3585 2.01397 10.2369 1.84546 11.2153C1.37786 13.96 2.07635 17.535 4.15993 20.7094C5.173 22.2497 6.52335 23.9847 8.28742 23.9998C9.85888 24.0152 10.3047 22.9951 12.432 22.9846C14.5626 22.9725 14.9663 24.0104 16.5356 23.9954C18.3002 23.9805 19.725 22.0604 20.738 20.5203C21.4594 19.4151 21.7322 18.8568 22.2931 17.6073C19.4409 16.5317 18.2679 13.3889 19.1873 10.832Z"
      fill="#253017"
    />
  </svg>
)

const EyeIcon = ({ crossed }: { crossed: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M2.5 12S6.2 6.5 12 6.5 21.5 12 21.5 12 17.8 17.5 12 17.5 2.5 12 2.5 12Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    {crossed ? (
      <path d="M5 19 19 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    ) : null}
  </svg>
)

const toOptions = (list: readonly string[]) => list.map((item) => ({ value: item, label: item }))

const CITY_OPTIONS = toOptions(CITIES)

const CATEGORY_OPTIONS = SKILL_CATEGORIES.map((category) => ({
  value: category.id,
  label: category.title,
}))

export function RegistrationWidget({ ...widgetProps }: RegistrationWidgetProps) {
  return (
    <RegistrationFormProvider>
      <RegistrationWidgetForm {...widgetProps} />
    </RegistrationFormProvider>
  )
}

function RegistrationWidgetForm({
  step,
  onNext,
  onBack,
  className: outerClassName,
}: RegistrationWidgetProps) {
  const location = useLocation()
  const className = clsx(styles.widget, {
    [styles['step-1']]: step === 1,
    [styles['step-2']]: step === 2,
    [styles['step-3']]: step === 3,
  })

  const navigate = useNavigate()
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [submittedValues, setSubmittedValues] = useState<RegistrationFormValues | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const { registerUser, isSubmitting, error, clearError } = useRegistrationSubmit()

  const form = useRegistrationForm()
  const {
    control,
    register,
    setCategory,
    setGender,
    setCity,
    setSubcategory,
    setAvatar,
    setTeachImage,
    setBirthDate,
    wantedSubcategoryOptions,
    teachSubcategoryOptions,
    continueStep: validateAndContinue,
    handleSubmit,
    formState: { errors },
  } = form

  const previewSkill = useMemo<Skill | null>(() => {
    if (!submittedValues) return null
    return {
      id: 'registration-preview',
      title: submittedValues.teachSkillName,
      description: submittedValues.teachDescription,
      type: 'teach',
      category: submittedValues.teachCategory as CategoryId,
      subCategory: submittedValues.teachSubCategory as SubCategoryId,
      tags: [],
      imageUrls: submittedValues.teachImage
        ? [URL.createObjectURL(submittedValues.teachImage)]
        : [],
      authorId: '',
      createdAt: new Date().toISOString(),
    }
  }, [submittedValues])

  useEffect(() => {
    return () => {
      previewSkill?.imageUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewSkill])

  const continueStep = async () => {
    if (step === 3) {
      await handleSubmit((values) => {
        clearError()
        setSubmittedValues(values) // валидация прошла — открываем модалку подтверждения
      })()
      return
    }
    await validateAndContinue(step as 1 | 2, onNext)
  }

  // «Готово»: отправка на бекенд; при успехе — сообщение и переход на главную
  const confirmRegistration = async () => {
    if (!submittedValues || isSubmitting) return
    const ok = await registerUser(submittedValues)
    if (ok) {
      setSubmittedValues(null)
      setIsSuccess(true)
      setTimeout(() => navigate(ROUTES.HOME), 1500)
    }
    // при ошибке submittedValues не сбрасываем — модалка остаётся открытой с текстом ошибки
  }

  // «Редактировать»: закрыть модалку без отправки, вернуться к заполненному шагу 3
  const closeAndEdit = () => {
    if (isSubmitting) return
    setSubmittedValues(null)
    clearError()
  }

  return (
    <section className={clsx(className, outerClassName)}>
      {step === 1 && (
        <>
          <div className={styles.socialBlock}>
            <button type="button" className={styles.socialBtn}>
              <GoogleIcon />
              Продолжить с Google
            </button>
            <button type="button" className={styles.socialBtn}>
              <AppleIcon />
              Продолжить с Apple
            </button>
          </div>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>или</span>
            <span className={styles.dividerLine} />
          </div>

          <div className={styles.inputsBlock}>
            <div className={styles.field}>
              <label htmlFor="reg-email" className={styles.label}>
                Email
              </label>
              <TextInput
                id="reg-email"
                type="email"
                placeholder="Введите email"
                className={styles.input}
                {...register('email')}
              />
              {errors.email && <p className={styles.error}>{errors.email.message}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="reg-password" className={styles.label}>
                Пароль
              </label>
              <TextInput
                id="reg-password"
                placeholder="Придумайте надёжный пароль"
                type={isPasswordVisible ? 'text' : 'password'}
                className={styles.input}
                {...register('password')}
                rightContent={
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                    aria-pressed={isPasswordVisible}
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                  >
                    <EyeIcon crossed={isPasswordVisible} />
                  </button>
                }
              />
              <p className={styles.hint}>Пароль должен содержать не менее 8 знаков</p>
              {errors.password && <p className={styles.error}>{errors.password.message}</p>}
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            className={styles.mainBtn}
            onClick={continueStep}
            disabled={isSubmitting}
          >
            Далее
          </Button>

          <div className={styles.footerLink}>
            Уже есть аккаунт?{' '}
            <Link to={ROUTES.LOGIN} state={location.state} replace className={styles.link}>
              Войти
            </Link>
          </div>
        </>
      )}

      {step === 2 && (
        <div className={styles.formBlock}>
          <div className={styles.avatarWrapper}>
            <label className={styles.avatar} htmlFor="reg-avatar">
              <AvatarPlaceholderIcon />
              <input
                id="reg-avatar"
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                className={styles.avatarInput}
                aria-label="Загрузить аватар"
                onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div className={styles.field}>
            <label htmlFor="reg-name" className={styles.label}>
              Имя
            </label>
            <TextInput
              id="reg-name"
              placeholder="Введите ваше имя"
              className={styles.input}
              {...register('name', { onChange: () => void form.trigger('name') })}
            />
            {errors.name && <p className={styles.error}>{errors.name.message}</p>}
          </div>
          <div className={styles.row}>
            <div>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <DateInput
                    name="reg-birth"
                    label="Дата рождения"
                    className={styles.dateField}
                    value={field.value}
                    onChange={setBirthDate}
                  />
                )}
              />
              {errors.birthDate && <p className={styles.error}>{errors.birthDate.message}</p>}
            </div>
            <div>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    label="Пол"
                    placeholder="Не указан"
                    className={styles.selectRoot}
                    options={[
                      { value: 'other', label: 'Не указан' },
                      { value: 'male', label: 'Мужской' },
                      { value: 'female', label: 'Женский' },
                    ]}
                    value={field.value}
                    onChange={(values) => setGender(values[0] ?? '')}
                  />
                )}
              />
              {errors.gender && <p className={styles.error}>{errors.gender.message}</p>}
            </div>
          </div>
          <div>
            <Controller
              control={control}
              name="city"
              render={({ field }) => (
                <Select
                  label="Город"
                  placeholder="Не указан"
                  options={[{ value: 'other', label: 'Не указан' }, ...CITY_OPTIONS]}
                  value={field.value}
                  onChange={(values) => setCity(values[0] ?? '')}
                />
              )}
            />
            {errors.city && <p className={styles.error}>{errors.city.message}</p>}
          </div>
          <div>
            <Controller
              control={control}
              name="wantedCategory"
              render={({ field }) => (
                <Select
                  label="Категория навыка, которому хотите научиться"
                  placeholder="Выберите категорию"
                  options={CATEGORY_OPTIONS}
                  value={field.value}
                  onChange={(values) => setCategory('wantedCategory', values[0])}
                />
              )}
            />
            {errors.wantedCategory && (
              <p className={styles.error}>{errors.wantedCategory.message}</p>
            )}
          </div>
          <div>
            <Controller
              control={control}
              name="wantedSubCategory"
              render={({ field }) => (
                <Select
                  label="Подкатегория навыка, которому хотите научиться"
                  placeholder="Выберите подкатегорию"
                  options={wantedSubcategoryOptions}
                  value={field.value}
                  onChange={(values) => setSubcategory('wantedSubCategory', values[0] ?? '')}
                />
              )}
            />
            {errors.wantedSubCategory && (
              <p className={styles.error}>{errors.wantedSubCategory.message}</p>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={styles.formBlock}>
          <div className={styles.field}>
            <label htmlFor="reg-skill-name" className={styles.label}>
              Название навыка
            </label>
            <TextInput
              id="reg-skill-name"
              placeholder="Введите название вашего навыка"
              className={styles.input}
              {...register('teachSkillName')}
            />
            {errors.teachSkillName && (
              <p className={styles.error}>{errors.teachSkillName.message}</p>
            )}
          </div>
          <div>
            <Controller
              control={control}
              name="teachCategory"
              render={({ field }) => (
                <Select
                  label="Категория навыка"
                  placeholder="Выберите категорию навыка"
                  options={CATEGORY_OPTIONS}
                  value={field.value}
                  onChange={(values) => setCategory('teachCategory', values[0])}
                />
              )}
            />
            {errors.teachCategory && <p className={styles.error}>{errors.teachCategory.message}</p>}
          </div>
          <div>
            <Controller
              control={control}
              name="teachSubCategory"
              render={({ field }) => (
                <Select
                  label="Подкатегория навыка"
                  placeholder="Выберите подкатегорию навыка"
                  options={teachSubcategoryOptions}
                  value={field.value}
                  onChange={(values) => setSubcategory('teachSubCategory', values[0] ?? '')}
                />
              )}
            />
            {errors.teachSubCategory && (
              <p className={styles.error}>{errors.teachSubCategory.message}</p>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="reg-skill-desc" className={styles.label}>
              Описание
            </label>
            <textarea
              id="reg-skill-desc"
              placeholder="Коротко опишите, чему можете научить"
              className={styles.textarea}
              {...register('teachDescription')}
            />
            {errors.teachDescription && (
              <p className={styles.error}>{errors.teachDescription.message}</p>
            )}
          </div>
          <div className={styles.field}>
            <FileInput variant="skill" onChange={setTeachImage} />
          </div>
        </div>
      )}

      {/* ---------- Навигация ---------- */}
      {step > 1 && (
        <div className={styles.navButtons}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Назад
          </Button>
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={continueStep}
            disabled={isSubmitting}
          >
            Продолжить
          </Button>
        </div>
      )}
      {/* ---------- Сообщение об успехе ---------- */}
      {step === 3 && isSuccess && <p className={styles.success}>Регистрация прошла успешно!</p>}

      {/* ---------- Модалка подтверждения ---------- */}
      <OfferConfirmationModal
        isOpen={submittedValues !== null}
        isLoading={isSubmitting}
        error={error}
        onClose={closeAndEdit}
        onConfirm={confirmRegistration}
      >
        {previewSkill && <SkillInfoCard skill={previewSkill} />}
      </OfferConfirmationModal>
    </section>
  )
}
