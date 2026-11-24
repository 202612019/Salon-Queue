import { describe, it, expect } from 'vitest'
import { createAdmissionIdentity, clearRejectedAdmissionIdentity, readPendingIdentity, saveCustomerAccess, readCustomerAccess, createPrivateStatusLink, captureStatusFragment, forgetCustomerAccess } from '../services/customer-access'
import { validPublicConfiguration } from '../lib/supabase'

describe('private access foundation', () => {
  it('creates independent 256-bit keys and stores only opaque pending credentials', () => {
    const first = createAdmissionIdentity()
    expect(createAdmissionIdentity()).toEqual(first)
    clearRejectedAdmissionIdentity()
    const second = createAdmissionIdentity()
    expect(first.request_key).toMatch(/^[0-9a-f]{64}$/)
    expect(first.capability).toMatch(/^[0-9a-f]{64}$/)
    expect(first.request_key).not.toBe(first.capability)
    expect(first.capability).not.toBe(second.capability)
    expect(readPendingIdentity()).toEqual(second)
    expect(Object.keys(JSON.parse(localStorage.getItem('salonq.customer.pending')!)).sort()).toEqual(['capability', 'request_key'])
  })
  it('saves only locator/capability and reconstructs the secret in a fragment', () => {
    const identity = createAdmissionIdentity(); const locator = '1'.repeat(32)
    saveCustomerAccess({ locator, token: 'S-999' }, identity.capability)
    const access = readCustomerAccess()!
    const link = new URL(createPrivateStatusLink(access))
    expect(link.pathname).toBe(`/status/${locator}`)
    expect(link.search).toBe('')
    expect(link.hash).toBe(`#access=${identity.capability}`)
    expect(JSON.stringify(access)).not.toContain('S-999')
    expect(readPendingIdentity()).toBeNull()
  })
  it('captures and removes a fragment and refuses a different locator', () => {
    const locator = '2'.repeat(32); const capability = '3'.repeat(64)
    window.history.replaceState(null, '', `/status/${locator}#access=${capability}`)
    expect(captureStatusFragment(locator)).toEqual({ locator, capability })
    expect(window.location.hash).toBe('')
    expect(captureStatusFragment('4'.repeat(32))).toBeNull()
    forgetCustomerAccess(); expect(readCustomerAccess()).toBeNull()
  })
  it('does not interpret a phone or public token as private credentials', () => {
    expect(() => saveCustomerAccess({ locator: 'S-014', token: 'S-014' }, '9876500001')).toThrow('STATUS_UNAVAILABLE')
    localStorage.setItem('salonq.customer.resume', JSON.stringify({ locator: '9876500001', capability: 'wrong' }))
    expect(readCustomerAccess()).toBeNull()
  })
  it('rejects privileged keys and non-HTTPS hosted configuration', () => {
    expect(validPublicConfiguration('https://example.supabase.co', 'sb_secret_example')).toBe(false)
    expect(validPublicConfiguration('http://example.supabase.co', 'sb_publishable_example')).toBe(false)
    expect(validPublicConfiguration('https://example.supabase.co', 'sb_publishable_example')).toBe(true)
  })
})
