import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ErrorWidget } from './ErrorWidget'

type ErrorType = 404 | 500

function ErrorWidgetPreview({ type }: { type: ErrorType }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <div
      data-theme={theme}
      style={{
        minHeight: '100vh',
        padding: '16px',
        boxSizing: 'border-box',
        backgroundColor: theme === 'light' ? '#e5e7eb' : '#020617',
        color: 'var(--color-text)',
        transition: 'background-color 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px',
        }}
      >
        <button
          type="button"
          onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
          style={{
            padding: '10px 16px',
            color: 'var(--color-text)',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        </button>
      </div>

      <ErrorWidget type={type} />
    </div>
  )
}

const meta = {
  title: 'Widgets/ErrorWidget',
  component: ErrorWidget,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ErrorWidget>

export default meta

type Story = StoryObj<typeof meta>

export const NotFound: Story = {
  args: {
    type: 404,
  },
  render: () => <ErrorWidgetPreview type={404} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Страница не найдена' })).toBeInTheDocument()

    await expect(canvas.getByRole('img', { name: 'Иллюстрация ошибки 404' })).toBeInTheDocument()
  },
}

export const ServerError: Story = {
  args: {
    type: 500,
  },
  render: () => <ErrorWidgetPreview type={500} />,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', {
        name: 'На сервере произошла ошибка',
      }),
    ).toBeInTheDocument()

    await expect(canvas.getByRole('img', { name: 'Иллюстрация ошибки 500' })).toBeInTheDocument()
  },
}
