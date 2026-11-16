import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/lib/constants'
import { Button, Text, Title } from '@/shared/ui'
import styles from './ErrorWidget.module.css'

interface ErrorWidgetProps {
  type: 404 | 500
  onReportError?: () => void
}

const errorContent = {
  404: {
    image: '././images/errors/error404.svg',
    alt: 'Иллюстрация ошибки 404',
    title: 'Страница не найдена',
    description:
      'К сожалению, эта страница недоступна. Вернитесь на\u00A0главную страницу или попробуйте позже',
  },
  500: {
    image: '././images/errors/error500.svg',
    alt: 'Иллюстрация ошибки 500',
    title: 'На сервере произошла ошибка',
    description: 'Попробуйте позже или вернитесь на главную страницу',
  },
}

export function ErrorWidget({ type }: ErrorWidgetProps) {
  const navigate = useNavigate()
  const content = errorContent[type]

  return (
    <section className={styles.root} data-error-widget>
      <img className={styles.illustration} src={content.image} alt={content.alt} />

      <Title level={2} className={styles.title}>
        {content.title}
      </Title>

      <Text as="p" variant="base" color="text" className={styles.description}>
        {content.description}
      </Text>

      <div className={styles.actions}>
        <Button variant="secondary" size="md" onClick={() => navigate(ROUTES.CONTACTS)}>
          Сообщить об ошибке
        </Button>

        <Button variant="primary" size="md" onClick={() => navigate(ROUTES.HOME)}>
          На главную
        </Button>
      </div>
    </section>
  )
}
