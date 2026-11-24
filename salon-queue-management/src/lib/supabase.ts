import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../domain/database'
import { publicEnvironment } from './env'

export function validPublicConfiguration(url: string, key: string) {
  try {
    const parsed = new URL(url)
    const hosted = parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co')
    const local = parsed.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(parsed.hostname)
    return (hosted || local) && !parsed.username && !parsed.password && /^sb_publishable_[\w-]+$/.test(key)
  } catch { return false }
}

let singleton: SupabaseClient<Database> | undefined
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!validPublicConfiguration(publicEnvironment.supabaseUrl, publicEnvironment.supabasePublishableKey)) throw new Error('BACKEND_NOT_CONFIGURED')
  singleton ??= createClient<Database>(publicEnvironment.supabaseUrl, publicEnvironment.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'salonq.staff.session' },
  })
  return singleton
}
