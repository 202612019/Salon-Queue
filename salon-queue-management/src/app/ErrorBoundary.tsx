import { Component, type ReactNode } from 'react'
import { Scissors } from 'lucide-react'
import { useLocale } from '../i18n/context'
import { Button } from '../components/ui'

function ErrorFallback() {
  const { t } = useLocale()
  return <main className="error-page"><Scissors size={42} aria-hidden="true" /><h1>{t('errorTitle')}</h1><p>{t('errorBody')}</p><Button onClick={() => window.location.reload()}>{t('reload')}</Button></main>
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <ErrorFallback /> : this.props.children }
}
