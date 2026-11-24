import { publicEnvironment } from '../lib/env'
import { getSupabaseClient, validPublicConfiguration } from '../lib/supabase'
import type { AdmissionReceipt, AdmissionRequest, Json } from '../domain/database'

export class BackendError extends Error {
  constructor(public readonly code: string, public readonly uncertain = false) { super(code); this.name = 'BackendError' }
}

// Capability/PII is carried in POST bodies only, never URL paths or query strings.
export async function customerOperation<T>(action: 'public_snapshot' | 'admit' | 'receipt' | 'status' | 'cancel', payload: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  if (!validPublicConfiguration(publicEnvironment.supabaseUrl, publicEnvironment.supabasePublishableKey)) throw new BackendError('BACKEND_NOT_CONFIGURED')
  let accessToken: string | undefined
  if (action === 'admit' && payload.source === 'walk_in') {
    const { data, error } = await getSupabaseClient().auth.getSession()
    if (error || !data.session) throw new BackendError('AUTH_REQUIRED')
    accessToken = data.session.access_token
  }
  let response: Response
  try {
    response = await fetch(`${publicEnvironment.supabaseUrl.replace(/\/$/, '')}/functions/v1/salonq-api`, {
      method: 'POST', mode: 'cors', cache: 'no-store', referrerPolicy: 'no-referrer', signal,
      headers: { 'content-type': 'application/json', apikey: publicEnvironment.supabasePublishableKey, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ action, payload }),
    })
  } catch { throw new BackendError('NETWORK_UNCERTAIN', action === 'admit' || action === 'cancel') }
  let result: { data?: T; error?: string }
  try { result = await response.json() } catch { throw new BackendError('NETWORK_UNCERTAIN', action === 'admit' || action === 'cancel') }
  if (!response.ok) throw new BackendError(result.error ?? 'BACKEND_UNAVAILABLE', response.status >= 500 && action === 'admit')
  if (result.data === undefined) throw new BackendError('BACKEND_UNAVAILABLE', action === 'admit')
  return result.data
}

export const admitCustomer = (request: AdmissionRequest, signal?: AbortSignal) => customerOperation<AdmissionReceipt>('admit', request, signal)
export const recoverAdmission = (request_key: string, capability: string) => customerOperation<AdmissionReceipt>('receipt', { request_key, capability })

export async function staffOperation(action: string, payload: Json = {}) {
  const { data, error } = await getSupabaseClient().rpc('salonq_staff_command', { action, payload })
  if (error) throw new BackendError(/^[A-Z_]+$/.test(error.message) ? error.message : 'BACKEND_UNAVAILABLE')
  return data
}
