import { useState } from 'react'
import { useAuthForm } from '@/features/auth/model/useAuthForm'
import { TextInput, Button } from '@/shared/ui'
import styles from './AuthWidget.module.css'

export function AuthWidget({ returnTo }: { returnTo?: string }) {
  const { register, handleSubmit, errors, isSubmitting, error } = useAuthForm(returnTo)
  const [passwordVisible, setPasswordVisible] = useState(false)

  return (
    <section className={styles.card} aria-label="Вход">
      <form className={styles.panel} onSubmit={handleSubmit} noValidate>
        <div className={styles.socials}>
          <button type="button" className={styles.social}>
            <GoogleIcon />
            Продолжить с Google
          </button>
          <button type="button" className={styles.social}>
            <AppleIcon />
            Продолжить с Apple
          </button>
        </div>

        <p className={styles.separator}>или</p>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="auth-email">
              Email
            </label>
            <TextInput
              id="auth-email"
              type="email"
              autoComplete="username"
              placeholder="Введите email"
              className={styles.input}
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email?.message ? (
              <p className={styles.fieldError}>{errors.email.message}</p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="auth-password">
              Пароль
            </label>
            <TextInput
              id="auth-password"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Введите пароль"
              className={styles.input}
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
              rightContent={
                <button
                  type="button"
                  className={styles.eye}
                  aria-label={passwordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                  aria-pressed={passwordVisible}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  <EyeIcon crossed={passwordVisible} />
                </button>
              }
            />
            {errors.password?.message ? (
              <p className={styles.fieldError}>{errors.password.message}</p>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="primary" className={styles.submit} isLoading={isSubmitting}>
          Войти
        </Button>
      </form>
    </section>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="2 2 20 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      />
    </svg>
  )
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
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
}
