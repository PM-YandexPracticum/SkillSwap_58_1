import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { RegistrationWidget } from './RegistrationWidget'

vi.mock('@/features/registration/model/useRegistrationSubmit', () => ({
  useRegistrationSubmit: () => ({
    registerUser: vi.fn().mockResolvedValue(true),
    isSubmitting: false,
    error: null,
    clearError: vi.fn(),
  }),
}))

const renderWidget = (props: { step: number; onNext?: () => void; onBack?: () => void }) =>
  render(
    <MemoryRouter>
      <RegistrationWidget {...props} />
    </MemoryRouter>,
  )

describe('RegistrationWidget', () => {
  // ─────────────── ШАГ 1 ───────────────
  describe('шаг 1', () => {
    it('отображает поля первого шага', () => {
      renderWidget({ step: 1 })

      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Пароль')).toBeInTheDocument()
    })
    it('ссылка «Войти» ведёт на страницу входа', () => {
      render(<RegistrationWidget step={1} />, { wrapper: MemoryRouter })

      expect(screen.getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '/login')
    })

    it('вызывает onNext после заполнения валидных полей шага', async () => {
      const onNext = vi.fn()
      const user = userEvent.setup()
      renderWidget({ step: 1, onNext })

      await user.type(screen.getByLabelText('Email'), 'user@example.com')
      await user.type(screen.getByLabelText('Пароль'), 'secure-pass-123')
      await user.click(screen.getByRole('button', { name: 'Далее' }))

      await waitFor(() => expect(onNext).toHaveBeenCalledOnce())
    })

    it('не показывает кнопку «Назад»', () => {
      renderWidget({ step: 1 })
      expect(screen.queryByRole('button', { name: 'Назад' })).not.toBeInTheDocument()
    })
  })

  // ─────────────── ШАГ 2 ───────────────
  describe('шаг 2', () => {
    it('отображает поля второго шага', () => {
      renderWidget({ step: 2 })

      expect(screen.getByLabelText('Загрузить аватар')).toBeInTheDocument()
      expect(screen.getByLabelText('Имя')).toBeInTheDocument()
      expect(screen.getByText('Дата рождения')).toBeInTheDocument()
      expect(screen.getByText('Пол')).toBeInTheDocument()
      expect(screen.getByText('Город')).toBeInTheDocument()
      expect(screen.getByText('Категория навыка, которому хотите научиться')).toBeInTheDocument()
      expect(screen.getByText('Подкатегория навыка, которому хотите научиться')).toBeInTheDocument()
    })

    it('не вызывает onNext, пока обязательные поля шага не заполнены', async () => {
      const onNext = vi.fn()
      renderWidget({ step: 2, onNext })

      fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))

      expect(await screen.findByText('Введите имя')).toBeInTheDocument()
      expect(onNext).not.toHaveBeenCalled()
    })

    it('вызывает onBack по клику на «Назад»', () => {
      const onBack = vi.fn()
      renderWidget({ step: 2, onBack })

      fireEvent.click(screen.getByRole('button', { name: 'Назад' }))
      expect(onBack).toHaveBeenCalledTimes(1)
    })
  })

  // ─────────────── ШАГ 3 ───────────────
  describe('шаг 3', () => {
    it('отображает поля третьего шага', () => {
      renderWidget({ step: 3 })

      expect(screen.getByLabelText('Название навыка')).toBeInTheDocument()
      expect(screen.getByText('Категория навыка')).toBeInTheDocument()
      expect(screen.getByText('Подкатегория навыка')).toBeInTheDocument()
      expect(screen.getByLabelText('Описание')).toBeInTheDocument()
      expect(screen.getByText('Перетащите или выберите изображения навыка')).toBeInTheDocument()
    })

    it('не вызывает onNext при невалидной форме и не открывает модалку', async () => {
      const onNext = vi.fn()
      renderWidget({ step: 3, onNext })

      fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))

      expect(await screen.findByText('Введите название навыка')).toBeInTheDocument()
      expect(onNext).not.toHaveBeenCalled()

      expect(screen.queryByText('Ваше предложение')).not.toBeInTheDocument()
    })

    it('вызывает onBack по клику на «Назад»', () => {
      const onBack = vi.fn()
      renderWidget({ step: 3, onBack })

      fireEvent.click(screen.getByRole('button', { name: 'Назад' }))
      expect(onBack).toHaveBeenCalledTimes(1)
    })
  })

  //
  it('не падает при клике на кнопки, если onNext/onBack не переданы', async () => {
    const user = userEvent.setup()
    renderWidget({ step: 2 })

    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    await screen.findByText('Введите имя')
    await user.click(screen.getByRole('button', { name: 'Назад' }))
  })
})
