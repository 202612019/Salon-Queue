import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../app/App'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { en, gu } from '../i18n/dictionaries'
import { entryFixture, salonFixture } from './customer-fixtures'
import { BackendError } from '../services/backend'
import { saveCustomerAccess, createAdmissionIdentity, readCustomerAccess, readPendingIdentity, forgetCustomerAccess } from '../services/customer-access'
import { normalizeCustomerPhone, validCustomerName } from '../domain/customer'

const api = vi.hoisted(() => ({ public: vi.fn(), status: vi.fn(), admit: vi.fn(), receipt: vi.fn(), cancel: vi.fn(), refresh: new Set<() => Promise<void>>() }))
vi.mock('../services/backend', async importOriginal => ({ ...await importOriginal<typeof import('../services/backend')>(), getPublicSalon: api.public, getCustomerStatus: api.status, admitCustomer: api.admit, recoverAdmission: api.receipt, cancelCustomerEntry: api.cancel }))
vi.mock('../services/synchronization', () => ({ synchronizeSnapshot: (load: (signal: AbortSignal) => Promise<unknown>, onState: (state: unknown) => void) => {
  let stopped = false
  const update = async () => {
    try { const data = await load(new AbortController().signal); if (!stopped) onState({ data, connection: 'live', lastUpdated: Date.now(), error: null }) }
    catch (error) { if (!stopped) onState({ data: null, connection: 'stale', lastUpdated: null, error: error instanceof Error ? error.message : 'BACKEND_UNAVAILABLE' }) }
  }
  api.refresh.add(update); void update()
  return () => { stopped = true; api.refresh.delete(update) }
} }))
const locator = 'a'.repeat(32), capability = 'b'.repeat(64)
function open(path = '/join') { return render(<LocaleProvider><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></LocaleProvider>) }
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('checkbox', { name: salonFixture.services[0].name_en })
  await user.type(screen.getByLabelText(en.name), 'Fictional Person')
  await user.type(screen.getByLabelText(en.phone), '+91 98765-00001')
  await user.click(screen.getByRole('checkbox', { name: salonFixture.services[0].name_en }))
}
beforeEach(() => {
  forgetCustomerAccess(); api.refresh.clear(); vi.clearAllMocks()
  api.public.mockResolvedValue(structuredClone(salonFixture)); api.status.mockResolvedValue(structuredClone(entryFixture))
  api.admit.mockResolvedValue({ locator, token: entryFixture.token }); api.receipt.mockResolvedValue({ locator, token: entryFixture.token })
  api.cancel.mockResolvedValue({ ...entryFixture, status: 'cancelled', version: 2, estimate: null })
  window.history.replaceState(null, '', '/')
})

describe('functional customer integration with a mocked trusted transport', () => {
  it('renders authoritative public information without treating the example pass as live', async () => {
    open('/')
    expect(await screen.findByText(salonFixture.services[0].name_en)).toBeVisible()
    expect(screen.getAllByText(salonFixture.salon_name).length).toBeGreaterThan(0)
    expect(screen.getByText(en.illustrativePass)).toBeVisible()
    expect(screen.queryByText(en.previewDetail)).not.toBeInTheDocument()
    expect(screen.getByRole('main').querySelector('a[href="/join"]')).toBeTruthy()
    expect(screen.getByText(en.onDutyCount.replace('{count}', '3'))).toBeVisible()
  })
  it('validates name/mobile and service count without sending an invalid admission', async () => {
    const user = userEvent.setup(); open()
    await waitFor(() => expect(screen.getByRole('button', { name: en.confirmJoin })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: en.confirmJoin }))
    expect(screen.getByText(en.invalidName)).toBeVisible(); expect(screen.getByText(en.invalidPhone)).toBeVisible(); expect(screen.getByText(en.invalidServices)).toBeVisible()
    expect(api.admit).not.toHaveBeenCalled()
  })
  it('selects distinct services, computes exact totals, and enforces maximum three', async () => {
    api.public.mockResolvedValue({ ...salonFixture, services: [...salonFixture.services, { ...salonFixture.services[0], id: 'fourth', name_en: 'Fourth fictional service' }] })
    const user = userEvent.setup(); open(); await fill(user)
    await user.click(screen.getByRole('checkbox', { name: salonFixture.services[1].name_en }))
    expect(screen.getByText('₹230.00')).toBeVisible(); expect(screen.getAllByText('45 min').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('checkbox', { name: salonFixture.services[2].name_en }))
    expect(screen.getByRole('checkbox', { name: 'Fourth fictional service' })).toBeDisabled()
    expect(screen.getAllByRole('checkbox').filter(element => (element as HTMLInputElement).checked)).toHaveLength(3)
  })
  it('creates one real-operation request, saves only opaque access and opens the matching private pass', async () => {
    const user = userEvent.setup(); open(); await fill(user)
    await user.dblClick(screen.getByRole('button', { name: en.confirmJoin }))
    expect(await screen.findByText(entryFixture.token)).toBeVisible(); expect(api.admit).toHaveBeenCalledTimes(1)
    const request = api.admit.mock.calls[0][0]
    expect(request.phone).toBe('9876500001'); expect(request.services).toHaveLength(1)
    expect(request.capability).toMatch(/^[0-9a-f]{64}$/); expect(request.request_key).toMatch(/^[0-9a-f]{64}$/)
    expect(readCustomerAccess()).toEqual({ locator, capability: request.capability }); expect(readPendingIdentity()).toBeNull()
    expect(JSON.stringify(localStorage)).not.toContain('Fictional Person'); expect(JSON.stringify(localStorage)).not.toContain('9876500001')
    expect(screen.getByText(en.joinedSuccess)).toBeVisible()
  })
  it('retains the same pending credentials after an uncertain response and recovers instead of readmitting', async () => {
    api.admit.mockRejectedValue(new BackendError('NETWORK_UNCERTAIN', true))
    const user = userEvent.setup(); open(); await fill(user); await user.click(screen.getByRole('button', { name: en.confirmJoin }))
    expect(await screen.findByText(en.networkUncertain)).toBeVisible()
    const original = api.admit.mock.calls[0][0]; expect(readPendingIdentity()?.capability).toBe(original.capability)
    expect(screen.getByLabelText(en.phone)).toBeDisabled()
    await user.click(screen.getByRole('button', { name: en.checkPrevious }))
    expect(await screen.findByText(entryFixture.token)).toBeVisible()
    expect(api.receipt).toHaveBeenCalledWith(original.request_key, original.capability); expect(api.admit).toHaveBeenCalledTimes(1)
  })
  it('keeps an unresolved pending identity after refresh even when no receipt is available', async () => {
    const identity = createAdmissionIdentity(); api.receipt.mockRejectedValue(new BackendError('STATUS_UNAVAILABLE'))
    const user = userEvent.setup(); open(); await user.click(await screen.findByRole('button', { name: en.checkPrevious }))
    expect(await screen.findByText(en.receiptNotReady)).toBeVisible(); expect(readPendingIdentity()).toEqual(identity)
    expect(screen.getByRole('button', { name: en.confirmJoin })).toBeDisabled(); expect(api.admit).not.toHaveBeenCalled()
  })
  it('rejects duplicate phones generically without inventing a status link', async () => {
    api.admit.mockRejectedValue(new BackendError('ACTIVE_ENTRY_EXISTS'))
    const user = userEvent.setup(); open(); await fill(user); await user.click(screen.getByRole('button', { name: en.confirmJoin }))
    expect(await screen.findByText(en.duplicatePhone)).toBeVisible(); expect(readCustomerAccess()).toBeNull(); expect(readPendingIdentity()).toBeNull()
  })
  it('requires explicit price/duration review after the authoritative catalog changes', async () => {
    const user = userEvent.setup(); open(); await fill(user)
    api.public.mockResolvedValue({ ...salonFixture, services: [{ ...salonFixture.services[0], version: 2, price_paise: 20000, duration_minutes: 40 }, ...salonFixture.services.slice(1)] })
    await act(async () => { await Promise.all([...api.refresh].map(refresh => refresh())) })
    expect(screen.getByRole('button', { name: en.confirmJoin })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: en.reviewSelection }))
    expect(screen.getByRole('button', { name: en.confirmJoin })).toBeEnabled()
    expect(screen.getAllByText('₹200.00').length).toBeGreaterThan(0); expect(api.admit).not.toHaveBeenCalled()
  })
  it('blocks closed admission and only shows break warnings for relevant selections', async () => {
    api.public.mockResolvedValue({ ...salonFixture, admission: { online: false, walk_in: true, reason: 'ONLINE_CUTOFF' }, barbers: salonFixture.barbers.map((barber, index) => ({ ...barber, on_break: index === 0 })) })
    const user = userEvent.setup(); open(); await screen.findByRole('checkbox', { name: salonFixture.services[0].name_en })
    expect(screen.getByRole('button', { name: en.confirmJoin })).toBeDisabled(); expect(screen.getByText(en.cutoffReason)).toBeVisible()
    expect(screen.queryByText(en.relevantBreak)).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Ravi/ })); expect(screen.getByText(en.relevantBreak)).toBeVisible()
  })
  it('restores private access after remount and never fetches by phone/token alone', async () => {
    saveCustomerAccess({ locator, token: entryFixture.token }, capability)
    const view = open('/status/' + locator); expect(await screen.findByText(entryFixture.token)).toBeVisible(); view.unmount()
    open('/status/' + locator); expect(await screen.findByText(entryFixture.token)).toBeVisible()
    expect(api.status).toHaveBeenCalledWith({ locator, capability }, expect.any(AbortSignal))
  })
  it('renders invalid capability denial and forgets an expired resume credential', async () => {
    saveCustomerAccess({ locator, token: entryFixture.token }, capability); api.status.mockRejectedValue(new BackendError('STATUS_UNAVAILABLE'))
    open('/status/' + locator)
    expect(await screen.findByText(en.statusUnavailable)).toBeVisible(); expect(screen.queryByText(entryFixture.token)).not.toBeInTheDocument()
    await waitFor(() => expect(readCustomerAccess()).toBeNull())
  })
  it('renders Called, In Chair and Done from authoritative invalidation refetches', async () => {
    saveCustomerAccess({ locator, token: entryFixture.token }, capability); open('/status/' + locator)
    expect(await screen.findByText(en.arrivalReminder)).toBeVisible()
    for (const [status, text] of [['called', en.calledNotice], ['in_chair', en.inChairMessage], ['done', en.doneMessage]] as const) {
      api.status.mockResolvedValue({ ...entryFixture, status, version: 2, assigned_barber: { id: salonFixture.barbers[0].id, name: 'Ravi' } })
      await act(async () => { await Promise.all([...api.refresh].map(refresh => refresh())) })
      expect(screen.getByText(text, { exact: status !== 'called' })).toBeVisible()
      expect(screen.queryByRole('button', { name: en.cancel })).not.toBeInTheDocument()
    }
  })
  it('confirms cancellation, persists it through the backend, and displays its terminal response', async () => {
    saveCustomerAccess({ locator, token: entryFixture.token }, capability)
    const user = userEvent.setup(); open('/status/' + locator)
    await user.click(await screen.findByRole('button', { name: en.cancel }))
    const dialog = screen.getByRole('dialog', { name: en.cancelTitle }); expect(within(dialog).getByRole('button', { name: en.keepPlace })).toHaveFocus()
    api.status.mockResolvedValue({ ...entryFixture, status: 'cancelled', version: 2, estimate: null })
    await user.dblClick(within(dialog).getByRole('button', { name: en.confirmCancel }))
    expect(await screen.findByText(en.cancelledMessage)).toBeVisible(); expect(api.cancel).toHaveBeenCalledTimes(1); expect(api.cancel).toHaveBeenCalledWith({ locator, capability })
  })
  it('reconciles a cancellation versus Call Next race without fake cancellation', async () => {
    saveCustomerAccess({ locator, token: entryFixture.token }, capability)
    const user = userEvent.setup(); open('/status/' + locator)
    await user.click(await screen.findByRole('button', { name: en.cancel }))
    api.cancel.mockRejectedValue(new BackendError('INVALID_TRANSITION'))
    api.status.mockResolvedValue({ ...entryFixture, status: 'called', version: 2, assigned_barber: { id: salonFixture.barbers[0].id, name: 'Ravi' } })
    await user.click(screen.getByRole('button', { name: en.confirmCancel }))
    expect(await screen.findByText(en.stateChanged)).toBeVisible(); expect(await screen.findByRole('alert')).toHaveTextContent(en.calledNotice)
    expect(screen.queryByText(en.cancelledMessage)).not.toBeInTheDocument()
  })
  it('copies only a fragment-based private URL and explains its bearer access', async () => {
    saveCustomerAccess({ locator, token: entryFixture.token }, capability)
    const user = userEvent.setup(), clipboard = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } })
    open('/status/' + locator); await user.click(await screen.findByRole('button', { name: en.copyPrivateLink }))
    const copied = new URL(clipboard.mock.calls[0][0]); expect(copied.pathname).toBe('/status/' + locator); expect(copied.search).toBe(''); expect(copied.hash).toBe('#access=' + capability)
    expect(screen.getByText(en.privateLinkHint)).toBeVisible()
  })
  it('switches new form labels, validation and actual catalog names into Gujarati', async () => {
    const user = userEvent.setup(); open(); await screen.findByRole('checkbox', { name: salonFixture.services[0].name_en })
    await user.click(screen.getByRole('button', { name: en.language })); expect(screen.getByRole('checkbox', { name: salonFixture.services[0].name_gu })).toBeVisible()
    await user.click(screen.getByRole('button', { name: gu.confirmJoin })); expect(screen.getByText(gu.invalidPhone)).toBeVisible(); expect(screen.getByText(gu.invalidName)).toBeVisible()
  })
  it('requires review when a selected service is disabled and removes it only after acknowledgement', async () => {
    const user = userEvent.setup(); open(); await fill(user)
    api.public.mockResolvedValue({ ...salonFixture, services: salonFixture.services.slice(1) })
    await act(async () => { await Promise.all([...api.refresh].map(refresh => refresh())) })
    expect(screen.getByRole('button', { name: en.confirmJoin })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: en.reviewSelection }))
    expect(screen.getByText(en.selectionEmpty)).toBeVisible()
    expect(api.admit).not.toHaveBeenCalled()
  })
  it.each([['cancelled', en.cancelledMessage], ['no_show', en.noShowMessage]] as const)('renders the %s terminal state without cancellation controls', async (status, message) => {
    saveCustomerAccess({ locator, token: entryFixture.token }, capability)
    api.status.mockResolvedValue({ ...entryFixture, status, estimate: null, version: 4 })
    open('/status/' + locator)
    expect(await screen.findByText(message)).toBeVisible()
    expect(screen.queryByRole('button', { name: en.cancel })).not.toBeInTheDocument()
  })
})

describe('customer validation helpers are previews of the server rules', () => {
  it.each(['9876500001', '+91 98765-00001', '98765 00001'])('normalizes %s identically', phone => expect(normalizeCustomerPhone(phone)).toBe('9876500001'))
  it.each(['09876500001', '+44 9876500001', '98765abc01', '919876500001'])('rejects malformed phone %s', phone => expect(normalizeCustomerPhone(phone)).toBeNull())
  it('handles trimmed Unicode names and rejects control characters or invalid lengths', () => { expect(validCustomerName('  પૂજા  ')).toBe(true); expect(validCustomerName('A')).toBe(false); expect(validCustomerName('A\nB')).toBe(false) })
})
