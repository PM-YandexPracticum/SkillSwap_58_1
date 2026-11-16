import { yupResolver } from '@hookform/resolvers/yup'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { registrationDefaultValues, registrationSchema } from './registrationSchema'
import type { RegistrationFormValues } from './registrationSchema'
import { useRegistrationForm } from './useRegistrationForm'

interface HarnessProps {
  onNext: () => void
}

function RegistrationFormHarness({ children }: PropsWithChildren) {
  const methods = useForm<RegistrationFormValues>({
    defaultValues: registrationDefaultValues,
    resolver: yupResolver(registrationSchema),
    shouldUnregister: false,
    mode: 'onTouched',
  })

  return <FormProvider {...methods}>{children}</FormProvider>
}

function RegistrationFormProbe({ onNext }: HarnessProps) {
  const form = useRegistrationForm()
  const { errors } = form.formState

  return (
    <>
      <button type="button" onClick={() => void form.validateStep(1)}>
        Проверить шаг 1
      </button>
      <button type="button" onClick={() => void form.continueStep(1, onNext)}>
        Перейти дальше
      </button>
      <button
        type="button"
        onClick={() => {
          form.setValue('email', 'learner@example.com')
          form.setValue('password', 'secure-pass-123')
        }}
      >
        Заполнить шаг 1
      </button>
      <button type="button" onClick={() => form.setSubcategory('wantedSubCategory', 'english')}>
        Выбрать английский
      </button>
      <button type="button" onClick={() => form.setCategory('teachCategory', 'languages')}>
        Выбрать языки
      </button>
      <button
        type="button"
        onClick={() => {
          form.setAvatar(new File(['avatar'], 'avatar.png', { type: 'image/png' }))
          form.setTeachImage(new File(['skill'], 'skill.png', { type: 'image/png' }))
          form.setGender('female')
          form.setCity('Москва')
          form.setBirthDate(new Date(2000, 0, 2))
        }}
      >
        Заполнить остальные данные
      </button>
      <output data-testid="form-values">
        {JSON.stringify({
          email: form.getValues('email'),
          password: form.getValues('password'),
          wantedCategory: form.getValues('wantedCategory'),
          wantedSubCategory: form.getValues('wantedSubCategory'),
          teachCategory: form.getValues('teachCategory'),
          teachSubCategory: form.getValues('teachSubCategory'),
          avatar: form.getValues('avatar')?.name ?? null,
          teachImage: form.getValues('teachImage')?.name ?? null,
          gender: form.getValues('gender'),
          city: form.getValues('city'),
          birthDate: form.getValues('birthDate'),
        })}
      </output>
      <output data-testid="step-errors">
        {JSON.stringify({ email: errors.email?.message, password: errors.password?.message })}
      </output>
      <output data-testid="subcategory-options">
        {JSON.stringify({
          wanted: form.wantedSubcategoryOptions.map(({ value }) => value),
          teach: form.teachSubcategoryOptions.map(({ value }) => value),
        })}
      </output>
    </>
  )
}

function renderRegistrationForm(onNext = vi.fn()) {
  return render(
    <RegistrationFormHarness>
      <RegistrationFormProbe onNext={onNext} />
    </RegistrationFormHarness>,
  )
}

describe('useRegistrationForm', () => {
  it('валидирует поля текущего шага и отображает их ошибки', async () => {
    renderRegistrationForm()

    fireEvent.click(screen.getByRole('button', { name: 'Проверить шаг 1' }))

    await waitFor(() => {
      expect(screen.getByTestId('step-errors')).toHaveTextContent('Email должен быть введён')
      expect(screen.getByTestId('step-errors')).toHaveTextContent(
        'Длина пароля должна быть не менее 8 символов',
      )
    })
  })

  it('переходит дальше только после успешной проверки текущего шага', async () => {
    const onNext = vi.fn()
    renderRegistrationForm(onNext)

    fireEvent.click(screen.getByRole('button', { name: 'Перейти дальше' }))
    await waitFor(() =>
      expect(screen.getByTestId('step-errors')).toHaveTextContent(
        'Длина пароля должна быть не менее 8 символов',
      ),
    )
    expect(onNext).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Заполнить шаг 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Перейти дальше' }))

    await waitFor(() => expect(onNext).toHaveBeenCalledOnce())
  })

  it('при выборе подкатегории автоматически сохраняет родительскую категорию', async () => {
    renderRegistrationForm()

    fireEvent.click(screen.getByRole('button', { name: 'Выбрать английский' }))

    await waitFor(() => {
      expect(screen.getByTestId('form-values')).toHaveTextContent('"wantedCategory":"languages"')
      expect(screen.getByTestId('form-values')).toHaveTextContent('"wantedSubCategory":"english"')
      expect(screen.getByTestId('subcategory-options')).toHaveTextContent('"wanted":["english"')
    })
  })

  it('при смене категории сбрасывает подкатегорию и список подкатегорий', async () => {
    renderRegistrationForm()

    fireEvent.click(screen.getByRole('button', { name: 'Выбрать английский' }))
    fireEvent.click(screen.getByRole('button', { name: 'Выбрать языки' }))

    await waitFor(() => {
      expect(screen.getByTestId('form-values')).toHaveTextContent('"teachCategory":"languages"')
      expect(screen.getByTestId('form-values')).toHaveTextContent('"teachSubCategory":""')
      expect(screen.getByTestId('subcategory-options')).toHaveTextContent('"teach":["english"')
    })
  })

  it('сохраняет файлы и значения полей в состоянии формы', async () => {
    renderRegistrationForm()

    fireEvent.click(screen.getByRole('button', { name: 'Заполнить остальные данные' }))

    await waitFor(() => {
      expect(screen.getByTestId('form-values')).toHaveTextContent('"avatar":"avatar.png"')
      expect(screen.getByTestId('form-values')).toHaveTextContent('"teachImage":"skill.png"')
      expect(screen.getByTestId('form-values')).toHaveTextContent('"gender":"female"')
      expect(screen.getByTestId('form-values')).toHaveTextContent('"city":"Москва"')
      expect(screen.getByTestId('form-values')).toHaveTextContent('"birthDate":"02.01.2000"')
    })
  })
})
