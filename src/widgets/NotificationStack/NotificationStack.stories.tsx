import type { Meta, StoryObj } from '@storybook/react-vite'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { useNotify } from '@/features/notifications'
import notificationsReducer from '@/features/notifications/model/notificationsSlice'
import { NotificationStack } from './NotificationStack'

function NotificationExample() {
  const notify = useNotify()

  return (
    <div>
      <button type="button" onClick={() => notify.success('Изменения сохранены')}>
        Показать уведомление
      </button>

      <NotificationStack />
    </div>
  )
}

const meta = {
  title: 'widgets/NotificationStack',
  component: NotificationStack,
  decorators: [
    (Story) => {
      const store = configureStore({
        reducer: {
          notifications: notificationsReducer,
        },
      })

      return (
        <Provider store={store}>
          <Story />
        </Provider>
      )
    },
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof NotificationStack>

export default meta

type Story = StoryObj<typeof meta>

export const Example: Story = {
  render: () => <NotificationExample />,
}
