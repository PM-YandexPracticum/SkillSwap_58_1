import type { Meta, StoryObj } from '@storybook/react-vite'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { userEvent, within } from 'storybook/test'
import { UserMenu } from './index'
import * as authUtils from '@/features/auth/model/authUtils'
import notificationHistoryReducer from '@/features/notifications/model/notificationHistorySlice'
import authReducer from '@/features/auth/model/authSlice'
import { LOCAL_STORAGE_KEYS } from '@/shared/lib/constants'

const meta = {
  title: 'widgets/UserMenu',
  component: UserMenu,
  decorators: [
    (Story) => {
      const store = configureStore({
        reducer: { auth: authReducer, notificationHistory: notificationHistoryReducer },
        preloadedState: { auth: { user: authUtils.getAuthUser(), profile: null } },
      })

      return (
        <div
          style={{
            padding: '20px',
            background: 'var(--color-bg-secondary)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Provider store={store}>
            <Story />
          </Provider>
        </div>
      )
    },
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UserMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Guest: Story = {
  beforeEach: () => {
    authUtils.clearAuthUser()
  },
}

export const Authorized: Story = {
  beforeEach: () => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.AUTH_USER,
      JSON.stringify({
        id: '1',
        name: 'Соня',
        email: 'sonya@example.com',
        token: 'mock_token',
      }),
    )
  },
}

export const DropdownOpen: Story = {
  beforeEach: () => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.AUTH_USER,
      JSON.stringify({
        id: '1',
        name: 'Соня',
        email: 's@t.com',
        token: 't',
      }),
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const menuBtn = canvas.getByLabelText('Меню пользователя')
    await userEvent.click(menuBtn)
  },
}
