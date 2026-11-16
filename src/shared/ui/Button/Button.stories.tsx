import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './index'

const SortIcon = () => (
  <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.56362 4.82219C7.38809 4.82219 7.21255 4.75755 7.07398 4.61898L4.12706 1.67207L1.18015 4.61898C0.912247 4.88688 0.468827 4.88688 0.200926 4.61898C-0.0669753 4.35108 -0.0669753 3.90766 0.200926 3.63976L3.63748 0.203208C3.76681 0.0738767 3.9423 0 4.12706 0C4.31182 0 4.48737 0.0738767 4.6167 0.203208L8.0532 3.63976C8.3211 3.90766 8.3211 4.35108 8.0532 4.61898C7.91463 4.75755 7.73914 4.82219 7.56362 4.82219Z"
      fill="currentColor"
    />
    <path
      d="M4.12644 18.014C3.74768 18.014 3.43359 17.6999 3.43359 17.3212V0.692848C3.43359 0.314091 3.74768 0 4.12644 0C4.5052 0 4.81929 0.314091 4.81929 0.692848V17.3212C4.81929 17.6999 4.5052 18.014 4.12644 18.014Z"
      fill="currentColor"
    />
    <path
      d="M13.8732 18.014C13.6884 18.014 13.5128 17.9401 13.3835 17.8108L9.94702 14.3742C9.67912 14.1063 9.67912 13.6629 9.94702 13.395C10.2149 13.1271 10.6583 13.1271 10.9262 13.395L13.8732 16.3419L16.82 13.395C17.0879 13.1271 17.5314 13.1271 17.7993 13.395C18.0672 13.6629 18.0672 14.1063 17.7993 14.3742L14.3627 17.8108C14.2334 17.9401 14.0487 18.014 13.8732 18.014Z"
      fill="currentColor"
    />
    <path
      d="M13.8637 18.014C13.485 18.014 13.1709 17.6999 13.1709 17.3212V0.692848C13.1709 0.314091 13.485 0 13.8637 0C14.2425 0 14.5566 0.314091 14.5566 0.692848V17.3212C14.5566 17.6999 14.2517 18.014 13.8637 18.014Z"
      fill="currentColor"
    />
  </svg>
)

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.7438 8.28753L8.25847 16.7728C7.96856 17.0627 7.48772 17.0627 7.19781 16.7728C6.9079 16.4829 6.9079 16.0021 7.19781 15.7122L15.6831 7.22687C15.973 6.93696 16.4538 6.93696 16.7438 7.22687C17.0337 7.51679 17.0337 7.99762 16.7438 8.28753Z"
      fill="currentColor"
    />
    <path
      d="M16.7438 16.7728C16.4538 17.0627 15.973 17.0627 15.6831 16.7728L7.19781 8.28754C6.9079 7.99762 6.9079 7.51679 7.19781 7.22688C7.48772 6.93696 7.96856 6.93696 8.25847 7.22688L16.7438 15.7122C17.0337 16.0021 17.0337 16.4829 16.7438 16.7728Z"
      fill="currentColor"
    />
  </svg>
)

const ArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.68983 20C8.51449 20 8.33915 19.9354 8.20072 19.797C7.93309 19.5293 7.93309 19.0864 8.20072 18.8187L14.2177 12.8017C14.6607 12.3588 14.6607 11.6389 14.2177 11.196L8.20072 5.17895C7.93309 4.91132 7.93309 4.46835 8.20072 4.20072C8.46835 3.93309 8.91132 3.93309 9.17895 4.20072L15.196 10.2177C15.6666 10.6884 15.9342 11.3252 15.9342 11.9988C15.9342 12.6725 15.6758 13.3093 15.196 13.78L9.17895 19.797C9.04052 19.9262 8.86518 20 8.68983 20Z"
      fill="currentColor"
    />
  </svg>
)

const meta: Meta<typeof Button> = {
  component: Button,
  args: {
    size: 'md',
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const ContinuePrimary: Story = {
  args: { variant: 'primary' },
  render: () => <Button variant="primary">Продолжить</Button>,
}

export const BackSecondary: Story = {
  args: { variant: 'secondary' },
  render: () => <Button variant="secondary">Назад</Button>,
}

export const CloseTertiaryWithIconRight: Story = {
  args: { variant: 'tertiary' },
  render: () => (
    <Button variant="tertiary" trailingIcon={<CloseIcon />}>
      Закрыть
    </Button>
  ),
}

export const ViewAllTertiaryWithIconRight: Story = {
  args: { variant: 'tertiary' },
  render: () => (
    <Button variant="tertiary" trailingIcon={<ArrowIcon />}>
      Смотреть все
    </Button>
  ),
}

export const FirstNewTertiaryWithIconLeft: Story = {
  args: { variant: 'tertiary' },
  render: () => (
    <Button variant="tertiary" icon={<SortIcon />}>
      Сначала новые
    </Button>
  ),
}

export const LongTextWithIconRight: Story = {
  args: { variant: 'tertiary', size: 'md' },
  render: () => (
    <Button variant="tertiary" size="md" trailingIcon={<ArrowIcon />}>
      lorem ipsum dolor sit amet consectetur adipiscing elit
    </Button>
  ),
}

export const Loading: Story = {
  args: { variant: 'primary' },
  render: () => (
    <div style={{ width: 436 }}>
      <Button variant="primary" isLoading style={{ width: '100%' }}>
        Войти
      </Button>
    </div>
  ),
}
