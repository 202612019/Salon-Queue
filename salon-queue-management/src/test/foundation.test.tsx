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
vi.mock('../services/staff-auth', async importOriginal => ({ ...await importOriginal<typeof import('../services/staff-auth')>(), observeStaff: (onState: (state: unknown) => void) => { onState({ session: null, profile: null, error: null, checking: false }); return () => {} } }))
vi.mock('../services/backend', async importOriginal => ({ ...await importOriginal<typeof import('../services/backend')>(), getPublicSalon: vi.fn().mockRejectedValue(new Error('BACKEND_UNAVAILABLE')) }))
vi.mock('../services/synchronization', () => ({ synchronizeSnapshot: (load: (signal: AbortSignal) => Promise<unknown>, onState: (state: unknown) => void) => {
  let stopped = false
  void load(new AbortController().signal).then(data => { if (!stopped) onState({ data, connection: 'live', lastUpdated: Date.now(), error: null }) }).catch(() => { if (!stopped) onState({ data: null, connection: 'stale', lastUpdated: null, error: 'BACKEND_UNAVAILABLE' }) })
  return () => { stopped = true }
} }))

function openPage(path = '/') {
  return render(<LocaleProvider><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></LocaleProvider>)
}

describe('frontend route shells', () => {
  it.each([
    ['/', 'Your Time.Your Turn.'], ['/join', en.joinTitle], ['/status/preview', en.statusTitle],
    ['/reception', en.loginTitle], ['/barber/ravi', en.loginTitle], ['/display', en.nowServing],
    ['/admin', en.loginTitle], ['/login', en.loginTitle], ['/unknown-page', en.notFoundTitle],
  ])('renders %s with one main landmark and the appropriate preview boundary', (path, heading) => {
    openPage(path)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heading)
    if (['/status/preview', '/display', '/unknown-page'].includes(path)) expect(screen.getByText(en.previewDetail)).toBeVisible()
    else expect(screen.queryByText(en.previewDetail)).not.toBeInTheDocument()
  })

  it('uses real router navigation for customer exploration', async () => {
    const user = userEvent.setup()
    openPage()
    await user.click(screen.getAllByRole('link', { name: en.join })[0])
    expect(screen.getByRole('heading', { level: 1, name: en.joinTitle })).toBeVisible()
  })

  it('exposes only fictional status for the explicit preview locator', () => {
    openPage('/status/customer-token-or-secret')
    expect(screen.getByRole('heading', { name: en.privateTitle })).toBeVisible()
    expect(screen.queryByText('S-014')).not.toBeInTheDocument()
  })

  it('renders the actual staff form without any demo authentication bypass', () => {
    openPage('/login')
    expect(screen.getByLabelText(en.email)).toBeEnabled()
    expect(screen.getByLabelText(en.password)).toBeEnabled()
    expect(screen.getByRole('button', { name: en.signIn })).toBeEnabled()
    expect(screen.getByText(en.secureStaffHint)).toBeVisible()
  })

  it('protects reception data and operations before an authorized sign-in', () => {
    openPage('/reception')
    expect(within(screen.getByRole('main')).getByRole('heading', { name: en.loginTitle })).toBeVisible()
    expect(screen.queryByText('Kunal')).not.toBeInTheDocument()
  })

  it('keeps join form and submission unavailable without a backend', () => {
    openPage('/join')
    expect(screen.getByLabelText(en.name)).toBeEnabled()
    expect(screen.getByLabelText(en.phone)).toBeEnabled()
    expect(screen.getByRole('button', { name: en.confirmJoin })).toBeDisabled()
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
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
    expect(screen.getByText(en.offline)).toBeVisible()
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
    expect(screen.getByRole('heading', { name: gu.loginTitle })).toBeVisible()
    expect(document.documentElement.lang).toBe('gu')
  })

  it('formats paise and uses salon-local dates even when UTC date differs', () => {
    expect(formatPrice(23000, 'en')).toContain('230')
    const date = new Date('2026-11-23T19:00:00Z')
    expect(formatSalonDate(date, 'en')).toBe('24 November 2026')
    expect(formatSalonClock(date, 'en')).toMatch(/12:30/)
  })

  it('records the authorized customer integration phase without enabling staff screens', () => {
    expect(publicEnvironment.backendOperationsEnabled).toBe(true)
    expect(publicEnvironment.phase).toBe('customer-integration')
  })
})
