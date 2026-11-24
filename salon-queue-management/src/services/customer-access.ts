import type { AdmissionReceipt } from '../domain/database'

const hex = (bytes: number) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), value => value.toString(16).padStart(2, '0')).join('')
const resumeKey = 'salonq.customer.resume'
const pendingKey = 'salonq.customer.pending'
const isCapability = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)
const isLocator = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{32}$/.test(value)
export type CustomerAccess = { locator: string; capability: string }
let fragmentAccess: CustomerAccess | null = null

export function createAdmissionIdentity() {
  const pending = readPendingIdentity()
  if (pending) return pending // An uncertain result must retain the original bound request.
  const identity = { request_key: hex(32), capability: hex(32) }
  // Never include name, phone, selections or a full request in browser storage.
  localStorage.setItem(pendingKey, JSON.stringify(identity))
  return identity
}
// Invoke only after a confirmed non-admission rejection or explicit resolved receipt.
// Never call this for a timeout, aborted fetch, reconnect or uncertain HTTP response.
export function clearRejectedAdmissionIdentity() { localStorage.removeItem(pendingKey) }
export function readPendingIdentity(): { request_key: string; capability: string } | null {
  try {
    const value = JSON.parse(localStorage.getItem(pendingKey) ?? 'null')
    return value && isCapability(value.request_key) && isCapability(value.capability) ? { request_key: value.request_key, capability: value.capability } : null
  } catch { return null }
}
export function saveCustomerAccess(receipt: AdmissionReceipt, capability: string) {
  if (!isLocator(receipt.locator) || !isCapability(capability)) throw new Error('STATUS_UNAVAILABLE')
  localStorage.setItem(resumeKey, JSON.stringify({ locator: receipt.locator, capability }))
  localStorage.removeItem(pendingKey)
}
export function readCustomerAccess(): CustomerAccess | null {
  try {
    const value = JSON.parse(localStorage.getItem(resumeKey) ?? 'null')
    return value && isLocator(value.locator) && isCapability(value.capability) ? { locator: value.locator, capability: value.capability } : value === null ? fragmentAccess : null
  } catch { return fragmentAccess }
}
export function forgetCustomerAccess() { fragmentAccess = null; try { localStorage.removeItem(resumeKey) } catch { /* Forget the in-memory access even when storage is blocked. */ } }
export function captureStatusFragment(locator: string) {
  const capability = new URLSearchParams(window.location.hash.slice(1)).get('access')
  // Remove the secret even when malformed; never forward it into telemetry or route changes.
  if (window.location.hash) window.history.replaceState(null, '', window.location.pathname)
  if (isLocator(locator) && isCapability(capability)) {
    fragmentAccess = { locator, capability }
    try { saveCustomerAccess({ locator, token: '' }, capability) } catch { /* The current tab can still use the supplied private link. */ }
    return { locator, capability }
  }
  const access = readCustomerAccess()
  return access?.locator === locator ? access : null
}
export function createPrivateStatusLink(access: CustomerAccess) {
  if (!isLocator(access.locator) || !isCapability(access.capability)) throw new Error('STATUS_UNAVAILABLE')
  return `${window.location.origin}/status/${access.locator}#access=${access.capability}`
}
