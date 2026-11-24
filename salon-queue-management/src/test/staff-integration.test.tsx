import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import type { StaffState } from '../services/staff-auth'
import type { BarberSnapshot, OwnerSnapshot, ReceptionSnapshot, StaffProfile } from '../domain/database'
import { App } from '../app/App'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { en, gu } from '../i18n/dictionaries'
import { BackendError } from '../services/backend'
import { entryFixture, salonFixture } from './customer-fixtures'
import { readWalkInIdentity } from '../services/walk-in-access'
import { elapsedSeconds, formatElapsed, longWait } from '../domain/staff'

const mock = vi.hoisted(() => ({ auth: { session: null, profile: null, error: null, checking: false } as StaffState, listeners: new Set<(state: StaffState) => void>(), signIn: vi.fn(), signOut: vi.fn(), command: vi.fn(), admit: vi.fn(), receipt: vi.fn(), public: vi.fn(), refresh: new Set<() => Promise<void>>() }))
vi.mock('../services/staff-auth', async original => ({ ...await original<typeof import('../services/staff-auth')>(), observeStaff: (listener: (value: StaffState) => void) => { mock.listeners.add(listener); listener(mock.auth); return () => { mock.listeners.delete(listener) } }, signInStaff: mock.signIn, signOutStaff: mock.signOut }))
vi.mock('../services/backend', async original => ({ ...await original<typeof import('../services/backend')>(), staffOperation: mock.command, getPublicSalon: mock.public, admitCustomer: mock.admit, recoverAdmission: mock.receipt }))
vi.mock('../services/synchronization', () => ({ synchronizeSnapshot: (load: (signal: AbortSignal) => Promise<unknown>, state: (value: unknown) => void) => {
  let stopped = false
  const refresh = async () => { try { const data = await load(new AbortController().signal); if (!stopped) state({ data, connection: 'live', lastUpdated: Date.now(), error: null }) } catch (error) { if (!stopped) state({ data: null, connection: 'stale', lastUpdated: null, error: error instanceof Error ? error.message : 'BACKEND_UNAVAILABLE' }) } }
  mock.refresh.add(refresh); void refresh(); return () => { stopped = true; mock.refresh.delete(refresh) }
} }))
const userId = '30000000-0000-4000-8000-000000000099'
const sampleSession = { access_token: 'fictional-unit-session', user: { id: userId } } as Session
let reception: ReceptionSnapshot, barber: BarberSnapshot, owner: OwnerSnapshot
function signIn(role: StaffProfile['role'] = 'receptionist', slug = 'ravi') {
  mock.auth = { session: sampleSession, profile: { user_id: userId, role, barber_id: role === 'barber' ? salonFixture.barbers.find(b => b.slug === slug)!.id : null, barber_slug: role === 'barber' ? slug : null }, error: null, checking: false }
}
function emit(state: StaffState) { mock.auth = state; for (const listener of mock.listeners) listener(state) }
function open(path = '/reception') { return render(<LocaleProvider><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></LocaleProvider>) }
beforeEach(() => {
  sessionStorage.clear(); mock.listeners.clear(); mock.refresh.clear(); vi.clearAllMocks()
  mock.auth = { session: null, profile: null, error: null, checking: false }
  const barbers = salonFixture.barbers.map(({ id, slug, display_name, on_duty, on_break }) => ({ id, slug, display_name, on_duty, on_break, version: 1 }))
  reception = { server_time: salonFixture.server_time, barbers, entries: [{ ...structuredClone(entryFixture), entry_id: 'unit-entry-1' }] }
  barber = { server_time: salonFixture.server_time, barber: barbers[0], current: { ...structuredClone(entryFixture), entry_id: 'unit-entry-1', status: 'called', version: 2, called_at: salonFixture.server_time, assigned_barber: { id: barbers[0].id, name: 'Ravi' } }, next: null }
  owner = {
    server_time: salonFixture.server_time,
    barbers,
    entries: [{ ...structuredClone(entryFixture), entry_id: 'unit-entry-1' }],
    settings: {
      salon_name: 'The Atelier',
      opening_time: '10:00:00',
      closing_time: '21:00:00',
      online_enabled: true,
      version: 1,
    },
    services: salonFixture.services.map(s => ({ ...s, enabled: true, version: 1 })),
    statistics: { served: 5, average_wait_minutes: 24, no_shows: 1 },
  }
  mock.public.mockResolvedValue(structuredClone(salonFixture))
  mock.command.mockImplementation(async (action: string) => {
    if (action === 'snapshot') {
      return structuredClone(
        mock.auth.profile?.role === 'barber' ? barber :
        mock.auth.profile?.role === 'owner' ? owner :
        reception
      )
    }
    return { status: 'called', entry_id: 'unit-entry-1', version: 2 }
  })
  mock.admit.mockResolvedValue({ token: 'S-9002', locator: 'c'.repeat(32) }); mock.receipt.mockResolvedValue({ token: 'S-9002', locator: 'c'.repeat(32) })
  mock.signOut.mockImplementation(async () => { emit({ session: null, profile: null, error: null, checking: false }) })
  mock.signIn.mockImplementation(async () => { signIn(); emit(mock.auth); return mock.auth.profile })
})

describe('staff routes and credential form', () => {
  it.each(['/reception', '/barber/ravi', '/admin'])('protects %s before login', path => {
    open(path); expect(screen.getByRole('heading', { name: en.loginTitle })).toBeVisible(); expect(mock.command).not.toHaveBeenCalled()
  })
  it('validates credentials, toggles password visibility and delegates sign-in without storing the password', async () => {
    const user = userEvent.setup(); open('/login')
    await user.click(screen.getByRole('button', { name: en.signIn })); expect(screen.getByText(en.invalidEmail)).toBeVisible(); expect(mock.signIn).not.toHaveBeenCalled()
    await user.type(screen.getByLabelText(en.email), 'reception@salonq.example'); await user.type(screen.getByLabelText(en.password), 'Fictional-unit-password')
    await user.click(screen.getByRole('button', { name: en.showPassword })); expect(screen.getByLabelText(en.password)).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: en.signIn })); expect(await screen.findByRole('heading', { name: en.receptionTitle })).toBeVisible()
    expect(mock.signIn).toHaveBeenCalledWith('reception@salonq.example', 'Fictional-unit-password'); expect(JSON.stringify(localStorage)).not.toContain('Fictional-unit-password')
  })
  it('shows friendly credential failure without exposing backend text', async () => {
    mock.signIn.mockRejectedValue(new BackendError('AUTH_FAILED')); const user = userEvent.setup(); open('/login')
    await user.type(screen.getByLabelText(en.email), 'staff@salonq.example'); await user.type(screen.getByLabelText(en.password), 'unit-only'); await user.click(screen.getByRole('button', { name: en.signIn }))
    expect(await screen.findByText(en.authFailed)).toBeVisible()
  })
  it('redirects an owner to the protected admin screen with live metrics and controls', async () => {
    signIn('owner'); open('/login'); expect(await screen.findByRole('heading', { name: en.adminTitle })).toBeVisible(); expect(screen.getByText('05')).toBeVisible()
  })
  it('redirects a barber to the slug from their verified linkage and blocks another slug', async () => {
    signIn('barber'); const view = open('/login'); expect(await screen.findByRole('heading', { name: en.barberTitle })).toBeVisible(); view.unmount()
    open('/barber/amit'); expect(screen.getByRole('heading', { name: en.accessDenied })).toBeVisible(); expect(screen.queryByText(entryFixture.customer_name)).not.toBeInTheDocument()
  })
  it('clears protected customer content immediately on a session-loss event', async () => {
    signIn(); open(); expect(await screen.findByText(entryFixture.customer_name)).toBeVisible()
    act(() => emit({ session: null, profile: null, error: 'AUTH_REQUIRED', checking: false }))
    expect(screen.queryByText(entryFixture.customer_name)).not.toBeInTheDocument(); expect(screen.getByRole('heading', { name: en.loginTitle })).toBeVisible()
  })
  it('signs out through the actual session boundary and removes protected content', async () => {
    signIn(); const user = userEvent.setup(); open(); await screen.findByText(entryFixture.customer_name)
    await user.click(screen.getByRole('button', { name: en.signOut })); expect(mock.signOut).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('heading', { name: en.loginTitle })).toBeVisible(); expect(screen.queryByText(entryFixture.customer_name)).not.toBeInTheDocument()
  })
})
describe('Reception operational components', () => {
  it('loads authorized customer rows, counts and barber cards without fictional operational tokens', async () => {
    signIn(); open(); expect(await screen.findByText(entryFixture.token)).toBeVisible(); expect(screen.getByText(entryFixture.customer_name)).toBeVisible()
    expect(screen.queryByText('S-013')).not.toBeInTheDocument(); expect(screen.queryByText(en.staffPreviewHint)).not.toBeInTheDocument()
  })
  it('calls with a bound request key and refetches authoritative assignments', async () => {
    signIn(); const user = userEvent.setup()
    mock.command.mockImplementation(async (action: string) => {
      if (action === 'snapshot') return structuredClone(reception)
      reception.entries[0] = { ...reception.entries[0], status: 'called', assigned_barber: { id: reception.barbers[0].id, name: 'Ravi' }, called_at: reception.server_time, version: 2 }
      return reception.entries[0]
    })
    open(); await user.dblClick(await screen.findByRole('button', { name: en.callNext + ' · Ravi' }))
    await waitFor(() => expect(screen.getByRole('button', { name: en.callNext + ' · Ravi' })).toBeDisabled())
    const calls = mock.command.mock.calls.filter(call => call[0] === 'call_next'); expect(calls).toHaveLength(1); expect(calls[0][1].request_key).toMatch(/^[0-9a-f]{64}$/)
    expect(await screen.findByText(en.callSuccess)).toBeVisible()
  })
  it('retains an uncertain staff command and retries the same payload rather than generating another key', async () => {
    signIn(); let failed = false
    mock.command.mockImplementation(async (action: string) => { if (action === 'snapshot') return structuredClone(reception); if (!failed) { failed = true; throw new BackendError('NETWORK_UNCERTAIN', true) } return { reason: 'NO_ELIGIBLE_CUSTOMER', entry_id: null } })
    const user = userEvent.setup(); open(); await user.click(await screen.findByRole('button', { name: en.callNext + ' · Ravi' }))
    await waitFor(() => expect(screen.getByRole('button', { name: en.retryStaffAction })).toBeEnabled()); await user.click(screen.getByRole('button', { name: en.retryStaffAction }))
    const calls = mock.command.mock.calls.filter(call => call[0] === 'call_next'); expect(calls).toHaveLength(2); expect(calls[0][1]).toEqual(calls[1][1]); expect(await screen.findByText(en.noEligible)).toBeVisible()
  })
  it('only enables No-show after server-based ten-minute eligibility', async () => {
    signIn(); reception.entries[0] = { ...reception.entries[0], status: 'called', called_at: '2026-11-24T09:50:01+05:30', assigned_barber: { id: reception.barbers[0].id, name: 'Ravi' } }
    open(); expect(await screen.findByRole('button', { name: en.noShow + ' · ' + entryFixture.token })).toBeDisabled()
    reception.entries[0].called_at = '2026-11-24T09:50:00+05:30'
    await act(async () => { await Promise.all([...mock.refresh].map(refresh => refresh())) })
    expect(screen.getByRole('button', { name: en.noShow + ' · ' + entryFixture.token })).toBeEnabled()
  })
  it('confirms staff Waiting cancellation with the expected entry version', async () => {
    signIn(); const user = userEvent.setup(); open(); await user.click(await screen.findByRole('button', { name: en.cancel + ' · ' + entryFixture.token }))
    await user.click(screen.getByRole('button', { name: en.confirmAction }))
    expect(mock.command.mock.calls.find(call => call[0] === 'cancel')?.[1]).toEqual(expect.objectContaining({ entry_id: 'unit-entry-1', version: 1 }))
  })
  it('adds a walk-in through the existing source-specific operation without replacing personal resume', async () => {
    signIn(); localStorage.setItem('salonq.customer.resume', JSON.stringify({ locator: 'a'.repeat(32), capability: 'b'.repeat(64) }))
    const prior = localStorage.getItem('salonq.customer.resume'), user = userEvent.setup(); open()
    await waitFor(() => expect(screen.getByRole('button', { name: en.addWalkIn })).toBeEnabled()); await user.click(screen.getByRole('button', { name: en.addWalkIn }))
    const dialog = screen.getByRole('dialog', { name: en.walkInTitle })
    await user.type(within(dialog).getByLabelText(en.name), 'Fictional Walk-in'); await user.type(within(dialog).getByLabelText(en.phone), '+91 98765-00001')
    await user.click(within(dialog).getByRole('checkbox', { name: salonFixture.services[0].name_en })); await user.click(within(dialog).getByRole('button', { name: en.walkInConfirm }))
    expect(await screen.findByText('S-9002')).toBeVisible(); expect(mock.admit.mock.calls[0][0].source).toBe('walk_in'); expect(mock.admit.mock.calls[0][0].phone).toBe('9876500001')
    expect(localStorage.getItem('salonq.customer.resume')).toBe(prior); expect(readWalkInIdentity(userId)).toBeNull(); expect(JSON.stringify(sessionStorage)).not.toContain('Fictional Walk-in')
  })
})
describe('Barber operational components', () => {
  it('shows linked work, current persisted timer and a version-bound Start operation', async () => {
    signIn('barber'); const user = userEvent.setup(); open('/barber/ravi')
    await user.click(await screen.findByRole('button', { name: en.start })); expect(mock.command.mock.calls.find(call => call[0] === 'start')?.[1]).toEqual(expect.objectContaining({ entry_id: 'unit-entry-1', version: 2 }))
    expect(screen.getByText(en.elapsedFromServer)).toBeVisible()
  })
  it('disables break while assigned and exposes no other-barber customer list', async () => {
    signIn('barber'); open('/barber/ravi'); expect(await screen.findByRole('button', { name: en.takeBreak })).toBeDisabled(); expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
  it('lets an idle on-duty barber take and return from their own break', async () => {
    signIn('barber'); barber.current = null
    mock.command.mockImplementation(async (action: string) => { if (action === 'snapshot') return structuredClone(barber); barber.barber.on_break = !barber.barber.on_break; barber.barber.version++; return barber.barber })
    const user = userEvent.setup(); open('/barber/ravi'); await user.click(await screen.findByRole('button', { name: en.takeBreak }))
    await user.click(await screen.findByRole('button', { name: en.returnFromBreak })); const calls = mock.command.mock.calls.filter(call => call[0] === 'set_duty'); expect(calls).toHaveLength(2); expect(calls[0][1].barber_id).toBe(salonFixture.barbers[0].id); expect(calls[1][1].on_break).toBe(false)
  })
  it('requires confirmation before Done and renders the service overrun honestly', async () => {
    signIn('barber'); barber.current = { ...barber.current!, status: 'in_chair', version: 3, started_at: '2026-11-24T09:00:00+05:30' }
    const user = userEvent.setup(); open('/barber/ravi'); await user.click(await screen.findByRole('button', { name: en.done })); expect(screen.getByText(en.serviceOverrun)).toBeVisible()
    await user.click(within(screen.getByRole('dialog', { name: en.finishTitle })).getByRole('button', { name: en.done }))
    expect(mock.command.mock.calls.find(call => call[0] === 'done')?.[1]).toEqual(expect.objectContaining({ entry_id: 'unit-entry-1', version: 3 }))
  })
  it('translates the connected staff controls into Gujarati', async () => {
    signIn('barber'); const user = userEvent.setup(); open('/barber/ravi'); await screen.findByRole('button', { name: en.start }); await user.click(screen.getByRole('button', { name: en.language })); expect(screen.getByRole('button', { name: gu.start })).toBeVisible(); expect(screen.getByText(gu.elapsedFromServer)).toBeVisible()
  })
})
describe('server-offset timer display helpers', () => {
  it('highlights strictly after 60 minutes and preserves exact timer values', () => {
    const entry = { ...entryFixture, entry_id: 'unit' }, created = Date.parse(entry.created_at)
    expect(longWait(entry, created + 3600000)).toBe(false); expect(longWait(entry, created + 3600001)).toBe(true)
    expect(elapsedSeconds(entry.created_at, created + 75000)).toBe(75); expect(formatElapsed(75)).toBe('01:15')
  })
})
describe('Owner operational management', () => {
  it('loads live statistics, opening hours, services, and team duty', async () => {
    signIn('owner'); open('/admin')
    expect(await screen.findByRole('heading', { name: en.adminTitle })).toBeVisible()
    expect(screen.getByText('05')).toBeVisible()
    expect(screen.getByText('24 min')).toBeVisible()
    expect(screen.getByText('01')).toBeVisible()
    expect(screen.getByText(salonFixture.services[0].name_en)).toBeVisible()
    expect(screen.getByText(salonFixture.barbers[0].display_name)).toBeVisible()
  })
  it('prompts confirmation modal before turning off online queue', async () => {
    signIn('owner'); const user = userEvent.setup(); open('/admin')
    const queueSwitch = await screen.findByRole('switch', { name: en.onlineQueue })
    expect(queueSwitch).toBeChecked()
    await user.click(queueSwitch)
    expect(screen.getByRole('heading', { name: en.confirmCloseOnlineTitle })).toBeVisible()
    await user.click(screen.getByRole('button', { name: en.confirmAction }))
    expect(mock.command.mock.calls.find(call => call[0] === 'save_settings')?.[1]).toEqual(
      expect.objectContaining({ online_enabled: false, version: 1 })
    )
  })
  it('requires confirmation before updating opening hours', async () => {
    signIn('owner'); const user = userEvent.setup(); open('/admin')
    await screen.findByRole('heading', { name: en.adminTitle })
    const opensInput = screen.getByLabelText(en.opens)
    await user.clear(opensInput)
    await user.type(opensInput, '09:00')
    const saveBtn = screen.getByRole('button', { name: en.saveHours })
    expect(saveBtn).toBeEnabled()
    await user.click(saveBtn)
    expect(screen.getByRole('heading', { name: en.confirmSettingsTitle })).toBeVisible()
    await user.click(screen.getByRole('button', { name: en.confirmAction }))
    expect(mock.command.mock.calls.find(call => call[0] === 'save_settings')?.[1]).toEqual(
      expect.objectContaining({ opening_time: '09:00:00', closing_time: '21:00:00' })
    )
  })
  it('toggles service enablement', async () => {
    signIn('owner'); const user = userEvent.setup(); open('/admin')
    await screen.findByRole('heading', { name: en.adminTitle })
    const service = salonFixture.services[0]
    const toggle = screen.getByRole('switch', { name: `${service.name_en} · ${en.enabled}` })
    await user.click(toggle)
    expect(mock.command.mock.calls.find(call => call[0] === 'save_service')?.[1]).toEqual(
      expect.objectContaining({ id: service.id, enabled: false })
    )
  })
  it('toggles barber duty and break', async () => {
    signIn('owner'); const user = userEvent.setup(); open('/admin')
    await screen.findByRole('heading', { name: en.adminTitle })
    const barber0 = salonFixture.barbers[0]
    const dutySwitch = screen.getByRole('switch', { name: `${barber0.display_name} · ${en.barbersOnDuty}` })
    expect(dutySwitch).toBeChecked()
    const breakBtns = screen.getAllByRole('button', { name: en.takeBreak })
    await user.click(breakBtns[0])
    expect(mock.command.mock.calls.find(call => call[0] === 'set_duty')?.[1]).toEqual(
      expect.objectContaining({ barber_id: barber0.id, on_duty: true, on_break: true })
    )
  })
})
