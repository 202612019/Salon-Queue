import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../app/App'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { en } from '../i18n/dictionaries'
import { salonFixture } from './customer-fixtures'

const mock = vi.hoisted(() => ({
  public: vi.fn(),
  refresh: new Set<() => Promise<void>>(),
}))

vi.mock('../services/backend', async original => ({
  ...await original<typeof import('../services/backend')>(),
  getPublicSalon: mock.public,
}))

vi.mock('../services/synchronization', () => ({
  synchronizeSnapshot: (load: (signal: AbortSignal) => Promise<unknown>, state: (value: unknown) => void) => {
    let stopped = false
    const refresh = async () => {
      try {
        const data = await load(new AbortController().signal)
        if (!stopped) state({ data, connection: 'live', lastUpdated: Date.now(), error: null })
      } catch (error) {
        if (!stopped) state({ data: null, connection: 'stale', lastUpdated: null, error: error instanceof Error ? error.message : 'BACKEND_UNAVAILABLE' })
      }
    }
    mock.refresh.add(refresh)
    void refresh()
    return () => {
      stopped = true
      mock.refresh.delete(refresh)
    }
  },
}))

function open(path = '/display') {
  return render(
    <LocaleProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </LocaleProvider>
  )
}

describe('Waiting Area TV Display (/display)', () => {
  beforeEach(() => {
    mock.refresh.clear()
    vi.clearAllMocks()
    mock.public.mockResolvedValue(structuredClone(salonFixture))
  })

  it('renders salon name, IST clock, barber stations, and up next queue', async () => {
    open('/display')
    expect(await screen.findByText(salonFixture.salon_name)).toBeVisible()
    expect(screen.getByText(/IST/)).toBeVisible()
    expect(screen.getByText(en.nowServing)).toBeVisible()
    expect(screen.getByText(en.upNext)).toBeVisible()

    // Barbers rendered
    for (const b of salonFixture.barbers) {
      expect(screen.getByText(b.display_name)).toBeVisible()
    }
  })

  it('preserves public privacy: zero customer names, phone numbers, or private locators in DOM', async () => {
    open('/display')
    await screen.findByText(salonFixture.salon_name)

    // Verify customer names and phones never leak
    expect(screen.queryByText('Aarav Patel')).not.toBeInTheDocument()
    expect(screen.queryByText(/98765/)).not.toBeInTheDocument()
  })

  it('redirects /tv alias to canonical /display route', async () => {
    open('/tv')
    expect(await screen.findByText(salonFixture.salon_name)).toBeVisible()
    expect(screen.getByText(en.nowServing)).toBeVisible()
  })

  it('allows toggling sound on and off', async () => {
    const user = userEvent.setup()
    open('/display')
    const soundBtn = await screen.findByRole('button', { name: en.enableSound })
    expect(soundBtn).toBeVisible()
    await user.click(soundBtn)
    expect(await screen.findByRole('button', { name: en.soundOn })).toBeVisible()
  })

  it('announces newly called token banner with barber assignment', async () => {
    open('/display')
    await screen.findByText(salonFixture.salon_name)

    // Simulate realtime update when customer is called
    const fixtureWithCalled = structuredClone(salonFixture)
    fixtureWithCalled.barbers[0].token = 'S-042'
    fixtureWithCalled.barbers[0].status = 'called'
    mock.public.mockResolvedValue(fixtureWithCalled)

    const { act } = await import('@testing-library/react')
    await act(async () => {
      await Promise.all([...mock.refresh].map(refresh => refresh()))
    })

    expect(await screen.findByText('S-042')).toBeVisible()
    expect(screen.getByText(en.proceedTo.replace('{token}', 'S-042').replace('{barber}', fixtureWithCalled.barbers[0].display_name))).toBeVisible()
  })
})
