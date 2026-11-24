// Separate opaque staff-admission identity: never overwrite a staff member's customer pass.
export type WalkInIdentity = { request_key: string; capability: string; actor: string }
const storageKey = 'salonq.staff.pending.walk-in'
const hex = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('')
export function readWalkInIdentity(actor: string): WalkInIdentity | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')
    return value?.actor === actor && /^[0-9a-f]{64}$/.test(value.request_key) && /^[0-9a-f]{64}$/.test(value.capability) ? { actor, request_key: value.request_key, capability: value.capability } : null
  } catch { return null }
}
export function createWalkInIdentity(actor: string) {
  const identity = readWalkInIdentity(actor) ?? { actor, request_key: hex(), capability: hex() }
  sessionStorage.setItem(storageKey, JSON.stringify(identity)); return identity
}
export function clearWalkInIdentity() { sessionStorage.removeItem(storageKey) }
