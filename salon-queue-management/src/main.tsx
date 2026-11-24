import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { LocaleProvider } from './i18n/LocaleProvider'
import { ErrorBoundary } from './app/ErrorBoundary'
import { App } from './app/App'
import './styles/theme.css'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><LocaleProvider><ErrorBoundary><BrowserRouter><App /></BrowserRouter></ErrorBoundary></LocaleProvider></StrictMode>,
)
