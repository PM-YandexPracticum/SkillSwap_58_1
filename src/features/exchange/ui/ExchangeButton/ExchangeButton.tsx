import { Button, ClockIcon } from '@/shared/ui'
interface ExchangeButtonProps {
  isProposed: boolean
  isLoading?: boolean
  onClick: () => void
}

export function ExchangeButton({ isProposed, isLoading = false, onClick }: ExchangeButtonProps) {
  if (isProposed) {
    return (
      <Button variant="secondary" icon={<ClockIcon />} disabled>
        Обмен предложен
      </Button>
    )
  }

  return (
    <Button variant="primary" onClick={onClick} disabled={isLoading} aria-busy={isLoading}>
      Предложить обмен
    </Button>
  )
}
