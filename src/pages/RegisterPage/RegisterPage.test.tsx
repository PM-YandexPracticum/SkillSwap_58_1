import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage, { RegistrationStep } from './index'
import userEvent from '@testing-library/user-event'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

vi.mock('@/features/registration/model/useRegistrationSubmit', () => ({
  useRegistrationSubmit: () => ({
    registerUser: vi.fn().mockResolvedValue(true),
    isSubmitting: false,
    error: null,
    clearError: vi.fn(),
  }),
}))

const stepTitles = {
  1: 'Добро пожаловать в SkillSwap!',
  2: 'Расскажите немного о себе',
  3: 'Укажите, чем вы готовы поделиться',
} as const

const expectSynchronizedStep = (currentStep: 1 | 2 | 3, totalSteps: number) => {
  const stepperTitle = screen.getByRole('heading', {
    level: 2,
    name: `Шаг ${currentStep} из ${totalSteps}`,
  })
  const stepper = stepperTitle.parentElement
  expect(stepper).not.toBeNull()

  const lines = within(stepper as HTMLElement).getAllByTestId('stepper-line')
  expect(lines).toHaveLength(totalSteps)
  expect(lines.filter((line) => line.className.includes('_active_'))).toHaveLength(currentStep)

  const widgetFields = [
    screen.queryByLabelText('Email'),
    screen.queryByLabelText('Имя'),
    screen.queryByLabelText('Название навыка'),
  ]
  expect(widgetFields[currentStep - 1]).toBeInTheDocument()
  expect(widgetFields.filter(Boolean)).toHaveLength(1)

  const decoration = screen.getByRole('region', { name: 'Информация о регистрации' })
  expect(
    within(decoration).getByRole('heading', { name: stepTitles[currentStep] }),
  ).toBeInTheDocument()
}

const renderPage = (props: { currentStep: RegistrationStep; totalSteps: number }) =>
  render(<RegisterPage {...props} />, { wrapper: MemoryRouter })

describe('RegisterPage', () => {
  it('показывает текущий шаг регистрации и общее количество шагов', () => {
    renderPage({ currentStep: 2, totalSteps: 3 })

    expect(screen.getByRole('heading', { name: 'Шаг 2 из 3' })).toBeInTheDocument()
  })

  it('отображает подсказку, соответствующую текущему шагу', () => {
    const steps = [
      [1, stepTitles[1]],
      [2, stepTitles[2]],
      [3, stepTitles[3]],
    ] as const

    for (const [currentStep, title] of steps) {
      const { unmount } = render(<RegisterPage currentStep={currentStep} totalSteps={3} />, {
        wrapper: MemoryRouter,
      })

      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
      unmount()
    }
  })

  it('отображает индикатор для каждого шага регистрации', () => {
    renderPage({ currentStep: 1, totalSteps: 4 })

    const stepper = screen.getByRole('heading', { name: 'Шаг 1 из 4' }).parentElement
    expect(stepper).not.toBeNull()
    expect(within(stepper as HTMLElement).getAllByTestId('stepper-line')).toHaveLength(4)
  })

  it.each([
    [-1, 1],
    [5, 3],
    [Number.NaN, 1],
    [2.8, 2],
  ])('ограничивает текущий шаг допустимым диапазоном (%i → %i)', (currentStep, expectedStep) => {
    renderPage({ currentStep: currentStep as RegistrationStep, totalSteps: 3 })

    expectSynchronizedStep(expectedStep as 1 | 2 | 3, 3)
  })

  it.each([1, 2, 3] as const)(
    'синхронно обновляет компоненты при изменении шага на %i в допустимом диапазоне',
    (currentStep) => {
      const { rerender } = renderPage({ currentStep: 1, totalSteps: 3 })

      rerender(<RegisterPage currentStep={currentStep as RegistrationStep} totalSteps={3} />)
      expectSynchronizedStep(currentStep, 3)
    },
  )

  it('переходит на следующий шаг после валидного заполнения текущего', async () => {
    renderPage({ currentStep: 1, totalSteps: 3 })

    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'secure-pass-123')
    await user.click(screen.getByRole('button', { name: 'Далее' }))
    await waitFor(() => expectSynchronizedStep(2, 3))
  })

  it('возвращается к предыдущему шагу', () => {
    renderPage({ currentStep: 3, totalSteps: 3 })

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }))
    expectSynchronizedStep(2, 3)

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }))
    expectSynchronizedStep(1, 3)
  })

  it.each([
    [-1, 1],
    [4, 3],
    [Number.NaN, 1],
    [2.8, 2],
  ])(
    'синхронно обновляет компоненты, ограничивая шаг вне диапазона (%i → %i)',
    (currentStep, expectedStep) => {
      const { rerender } = renderPage({ currentStep: 2, totalSteps: 3 })

      rerender(<RegisterPage currentStep={currentStep as RegistrationStep} totalSteps={3} />)
      expectSynchronizedStep(expectedStep as 1 | 2 | 3, 3)
    },
  )

  it.each([0, -2, Number.NaN, 2.5])(
    'использует один согласованный шаг, когда общее количество шагов недопустимо (%s)',
    (totalSteps) => {
      renderPage({ currentStep: 3, totalSteps })

      expectSynchronizedStep(1, 1)
    },
  )
})
