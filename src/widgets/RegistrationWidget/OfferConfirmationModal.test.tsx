import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OfferConfirmationModal } from './OfferConfirmationModal'

describe('OfferConfirmationModal', () => {
  const onClose = vi.fn()
  const onConfirm = vi.fn()

  beforeEach(() => {
    onClose.mockClear()
    onConfirm.mockClear()
  })

  const renderModal = (props: Partial<Parameters<typeof OfferConfirmationModal>[0]> = {}) =>
    render(
      <OfferConfirmationModal isOpen onClose={onClose} onConfirm={onConfirm} {...props}>
        <div>Контент навыка</div>
      </OfferConfirmationModal>,
    )

  it('не рендерится, когда закрыта', () => {
    renderModal({ isOpen: false })
    expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument()
  })

  it('отображает заголовок и подзаголовок', () => {
    renderModal()
    expect(screen.getByRole('heading', { name: 'Ваше предложение' })).toBeInTheDocument()
    expect(
      screen.getByText('Пожалуйста, проверьте и подтвердите правильность данных'),
    ).toBeInTheDocument()
  })

  it('рендерит переданный контент', () => {
    renderModal()
    expect(screen.getByText('Контент навыка')).toBeInTheDocument()
  })

  it('вызывает onClose при клике на «Редактировать»', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: 'Редактировать' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('вызывает onConfirm при клике на «Готово»', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: 'Готово' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('вызывает onClose по Escape', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('вызывает onClose по клику на оверлей, но не по клику внутри модалки', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByTestId('modal-overlay'))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByText('Контент навыка'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  // ─── новые тесты: состояние загрузки и ошибки ───────────

  it('при isLoading показывается индикатор и обе кнопки заблокированы', () => {
    renderModal({ isLoading: true, error: null })

    expect(screen.getByText('Отправляем данные…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Готово' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Редактировать' })).toBeDisabled()
  })

  it('при isLoading Escape не закрывает модалку', async () => {
    const user = userEvent.setup()
    renderModal({ isLoading: true })

    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })
  it('ошибка выводится в модалке', () => {
    renderModal({ error: 'Email уже зарегистрирован' })

    expect(screen.getByRole('alert')).toHaveTextContent('Email уже зарегистрирован')
  })
})
