import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../app/App'
import { ErrorBoundary } from '../app/ErrorBoundary'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { en, gu } from '../i18n/dictionaries'
import { formatPrice, formatSalonDate, formatSalonClock } from '../lib/format'
import { publicEnvironment } from '../lib/env'

function openPage(path = '/') {
  return render(<LocaleProvider><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></LocaleProvider>)
}

describe('frontend route shells', () => {
  it.each([
    ['/', 'Your Time.Your Turn.'], ['/join', en.joinTitle], ['/status/preview', en.statusTitle],
    ['/reception', en.receptionTitle], ['/barber/ravi', en.barberTitle], ['/display', en.nowServing],
    ['/admin', en.adminTitle], ['/login', en.loginTitle], ['/unknown-page', en.notFoundTitle],
  ])('renders %s with a single main landmark and preview disclosure', (path, heading) => {
    openPage(path)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heading)
    expect(screen.getByText(en.previewDetail)).toBeVisible()
  })

  it('uses real router navigation for customer exploration', async () => {
    const user = userEvent.setup()
    openPage()
    await user.click(screen.getByRole('main').querySelector('a[href="/join"]')!)
    expect(screen.getByRole('heading', { level: 1, name: en.joinTitle })).toBeVisible()
  })

  it('exposes only fictional status for the explicit preview locator', () => {
    openPage('/status/customer-token-or-secret')
    expect(screen.getByRole('heading', { name: en.privateTitle })).toBeVisible()
    expect(screen.queryByText('S-014')).not.toBeInTheDocument()
  })

  it('does not accept credentials or report an authenticated session', () => {
    openPage('/login')
    expect(screen.getByLabelText(en.email)).toBeDisabled()
    expect(screen.getByLabelText(en.password)).toBeDisabled()
    expect(screen.getByRole('button', { name: en.signIn })).toBeDisabled()
    expect(screen.getByText(en.authUnavailable)).toBeVisible()
  })

  it('keeps all queue-mutating actions unavailable on reception preview', () => {
    openPage('/reception')
    const main = screen.getByRole('main')
    for (const button of within(main).getAllByRole('button')) expect(button).toBeDisabled()
    expect(screen.getByText(en.staffPreviewHint)).toBeVisible()
  })

  it('keeps join form and submission unavailable without a backend', () => {
    openPage('/join')
    expect(screen.getByLabelText(en.name)).toBeDisabled()
    expect(screen.getByLabelText(en.phone)).toBeDisabled()
    expect(screen.getByRole('button', { name: en.confirmJoin })).toBeDisabled()
    expect(screen.getByText(en.joinUnavailable)).toBeVisible()
    expect(screen.getAllByRole('checkbox').filter(input => (input as HTMLInputElement).checked)).toHaveLength(2)
  })

  it('never includes customer identities on the public TV preview', () => {
    openPage('/display')
    expect(screen.getByText('S-012')).toBeVisible()
    for (const name of ['Kunal', 'Neel', 'Arjun', 'Dhruv', 'Mihir']) expect(screen.queryByText(name)).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('handles denied fullscreen without crashing', async () => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: vi.fn().mockRejectedValue(new Error('Denied')) })
    openPage('/display')
    fireEvent.click(screen.getByRole('button', { name: en.fullscreen }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(en.fullscreenUnavailable))
  })

  it('announces offline state and keeps the preview available', () => {
    openPage()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    fireEvent(window, new Event('offline'))
    expect(screen.getByRole('status')).toHaveTextContent(en.offline)
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
  })

  it('renders the error fallback without leaking exception details', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function Broken() { throw new Error('private exception content'); return null }
    render(<LocaleProvider><ErrorBoundary><Broken /></ErrorBoundary></LocaleProvider>)
    expect(screen.getByRole('heading', { name: en.errorTitle })).toBeVisible()
    expect(screen.queryByText('private exception content')).not.toBeInTheDocument()
  })
})

describe('language and formatting foundation', () => {
  it('has complete nonempty Gujarati translations for every English key', () => {
    expect(Object.keys(gu).sort()).toEqual(Object.keys(en).sort())
    expect(Object.values(gu).every(value => value.trim().length > 0)).toBe(true)
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(gu[key].match(/\{\w+\}/g) ?? []).toEqual(en[key].match(/\{\w+\}/g) ?? [])
    }
  })

  it('switches visible copy and persists only the language preference', async () => {
    const user = userEvent.setup()
    openPage('/join')
    await user.click(screen.getByRole('button', { name: en.language }))
    expect(document.documentElement.lang).toBe('gu')
    expect(screen.getByRole('heading', { name: gu.joinTitle })).toBeVisible()
    expect(localStorage.getItem('salonq.locale')).toBe('gu')
    expect(Object.keys(localStorage)).toEqual(['salonq.locale'])
  })

  it('restores Gujarati preference on a nested route', () => {
    localStorage.setItem('salonq.locale', 'gu')
    openPage('/admin')
    expect(screen.getByRole('heading', { name: gu.adminTitle })).toBeVisible()
    expect(document.documentElement.lang).toBe('gu')
  })

  it('formats paise and uses salon-local dates even when UTC date differs', () => {
    expect(formatPrice(23000, 'en')).toContain('230')
    const date = new Date('2026-11-23T19:00:00Z')
    expect(formatSalonDate(date, 'en')).toBe('24 November 2026')
    expect(formatSalonClock(date, 'en')).toMatch(/12:30/)
  })

  it('does not enable backend operations from public environment values', () => {
    expect(publicEnvironment.backendOperationsEnabled).toBe(false)
    expect(publicEnvironment.phase).toBe('frontend-foundation')
  })
})
