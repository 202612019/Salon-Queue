import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { LocaleProvider } from './i18n/LocaleProvider'
import { ErrorBoundary } from './app/ErrorBoundary'
import { App } from './app/App'
import { captureStatusFragment } from './services/customer-access'
import './styles/theme.css'
import './styles/app.css'

// Scrub access fragments before routing, rendering, or loading customer data.
if (window.location.hash) captureStatusFragment(window.location.pathname.match(/^\/status\/([0-9a-f]{32})$/)?.[1] ?? '')
createRoot(document.getElementById('root')!).render(
  <StrictMode><LocaleProvider><ErrorBoundary><BrowserRouter><App /></BrowserRouter></ErrorBoundary></LocaleProvider></StrictMode>,
)
