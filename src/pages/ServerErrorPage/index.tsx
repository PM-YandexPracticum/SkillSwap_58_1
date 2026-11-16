import { ErrorWidget } from '@/widgets/ErrorWidget'

export default function ServerErrorPage() {
  return <ErrorWidget type={500} />
}
