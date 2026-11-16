import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { Select } from './index'

const options = [
  { value: 'one', label: 'Первый вариант', key: 'one' },
  { value: 'two', label: 'Второй вариант', key: 'two' },
]

describe('Select', () => {
  it('связывает label с полем выбора', () => {
    render(<Select label="Выберите вариант" options={options} onChange={vi.fn()} />)

    expect(screen.getByLabelText('Выберите вариант')).toBe(screen.getByRole('combobox'))
  })

  it('передаёт выбранное значение в onChange как массив', () => {
    const onChange = vi.fn()
    render(<Select options={options} onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' })
    fireEvent.click(screen.getByRole('option', { name: 'Первый вариант' }))

    expect(onChange).toHaveBeenCalledWith(['one'])
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('открывает список и выбирает пункт мышью', () => {
    const onChange = vi.fn()
    render(<Select options={options} onChange={onChange} />)

    const input = screen.getByRole('combobox')
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    expect(input).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('option', { name: 'Первый вариант' }))

    expect(onChange).toHaveBeenCalledWith(['one'])
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('рендерит раскрытый список вне контейнера селекта', () => {
    const { container } = render(<Select options={options} onChange={vi.fn()} />)

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' })

    const menu = screen.getByRole('listbox')
    expect(container).not.toContainElement(menu)
    expect(document.body).toContainElement(menu)
  })

  it('фильтрует варианты по введённому label', () => {
    render(<Select options={options} onChange={vi.fn()} />)

    const input = screen.getByRole('combobox')
    fireEvent.change(input, {
      target: { value: 'ВТОРОЙ' },
    })

    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('option', { name: 'Второй вариант' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Первый вариант' })).not.toBeInTheDocument()
  })

  it('показывает стандартное сообщение, если вариантов нет', () => {
    render(<Select options={options} onChange={vi.fn()} />)

    const input = screen.getByRole('combobox')
    fireEvent.change(input, {
      target: { value: 'неизвестный вариант' },
    })

    expect(screen.getByText('No options')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('выбирает найденный вариант и очищает поиск', () => {
    const onChange = vi.fn()
    render(<Select options={options} onChange={onChange} />)

    const input = screen.getByRole('combobox')
    fireEvent.change(input, {
      target: { value: 'Второй' },
    })
    fireEvent.click(screen.getByRole('option', { name: 'Второй вариант' }))

    expect(onChange).toHaveBeenCalledWith(['two'])
    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('не показывает кнопку очистки, когда clearable равен false', () => {
    render(<Select options={options} onChange={vi.fn()} value="one" clearable={false} />)

    expect(screen.getByText('Первый вариант')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Очистить выбор' })).not.toBeInTheDocument()
  })

  it('показывает кнопку очистки и передаёт пустой массив после очистки', () => {
    const onChange = vi.fn()
    render(<Select options={options} onChange={onChange} />)

    const input = screen.getByRole('combobox')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.click(screen.getByRole('option', { name: 'Первый вариант' }))

    fireEvent.click(screen.getByRole('button', { name: 'Очистить выбор' }))

    expect(onChange).toHaveBeenNthCalledWith(1, ['one'])
    expect(onChange).toHaveBeenNthCalledWith(2, [])
  })

  it('отключает поле выбора, когда disabled равен true', () => {
    const { container } = render(<Select options={options} onChange={vi.fn()} disabled />)

    expect(container.querySelector('input')).toBeDisabled()
  })

  it('рисует контурный шеврон без вертикального разделителя', () => {
    const { container } = render(
      <Select label="Пол" options={options} onChange={vi.fn()} chevron="outline" />,
    )

    expect(container.querySelector('[class*="indicatorSeparator"]')).toBeNull()
    expect(container.querySelector('svg path')).toHaveAttribute('stroke', 'currentColor')
  })

  it('показывает переданное value', () => {
    render(<Select label="Пол" options={options} value="two" onChange={vi.fn()} />)

    expect(screen.getByText('Второй вариант')).toBeInTheDocument()
  })

  it('прокидывает ref на поле выбора', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Select ref={ref} options={options} onChange={vi.fn()} />)

    expect(ref.current).toBe(screen.getByRole('combobox'))
  })
})
