import { createClient } from 'npm:@supabase/supabase-js@2.119.2'
import { createHandler, type GatewayClient } from './handler.ts'

const backendKey = Deno.env.get('SALONQ_BACKEND_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const url = Deno.env.get('SUPABASE_URL') ?? ''
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(value => value.trim()).filter(Boolean)

if (!backendKey || !url) {
  Deno.serve(() => new Response(JSON.stringify({ error: 'BACKEND_NOT_CONFIGURED' }), { status: 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }))
} else {
  const client = createClient(url, backendKey, { auth: { persistSession: false, autoRefreshToken: false } })
  Deno.serve(createHandler(client as unknown as GatewayClient, { backendKey, allowedOrigins }))
}
