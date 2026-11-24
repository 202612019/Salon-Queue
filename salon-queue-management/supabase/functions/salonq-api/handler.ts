export type GatewayClient = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string; code?: string } | null }>
  auth: { getUser: (jwt: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }> }
}
export type HandlerConfig = { allowedOrigins: string[]; backendKey: string; publicKey?: string }

const actions = new Set(['public_snapshot', 'admit', 'receipt', 'status', 'cancel'])
const conflicts = new Set(['CATALOG_CHANGED', 'IDEMPOTENCY_CONFLICT', 'ACTIVE_ENTRY_EXISTS', 'INVALID_TRANSITION', 'ONLINE_CLOSED', 'SALON_CLOSED', 'NO_BARBERS', 'SERVICE_UNAVAILABLE', 'BARBER_UNAVAILABLE'])
const safeErrors = new Set([...conflicts, 'FORBIDDEN', 'STATUS_UNAVAILABLE', 'INVALID_INPUT', 'INVALID_NAME', 'INVALID_PHONE', 'INVALID_SERVICES', 'RATE_LIMITED'])

async function keyedHash(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('')
}

export function createHandler(client: GatewayClient, config: HandlerConfig) {
  return async function handle(request: Request): Promise<Response> {
    const origin = request.headers.get('origin')
    const allowed = !!origin && config.allowedOrigins.includes(origin)
    const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'vary': 'Origin', 'x-content-type-options': 'nosniff' })
    if (allowed) {
      headers.set('access-control-allow-origin', origin!)
      headers.set('access-control-allow-headers', 'authorization, apikey, content-type, x-client-info')
      headers.set('access-control-allow-methods', 'POST, OPTIONS')
    }
    const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers })
    if (!config.backendKey || !config.allowedOrigins.length) return respond(503, { error: 'BACKEND_NOT_CONFIGURED' })
    // No-Origin clients still need capability/role checks. CORS is not authentication.
    if (origin && !allowed) return respond(403, { error: 'ORIGIN_NOT_ALLOWED' })
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'POST') return respond(405, { error: 'METHOD_NOT_ALLOWED' })
    if (!request.headers.get('content-type')?.includes('application/json')) return respond(415, { error: 'INVALID_CONTENT_TYPE' })
    if (Number(request.headers.get('content-length') ?? 0) > 16384) return respond(413, { error: 'REQUEST_TOO_LARGE' })
    try {
      // Bound the actual stream as well as Content-Length, before decoding/parsing PII.
      const reader = request.body?.getReader()
      if (!reader) return respond(400, { error: 'INVALID_INPUT' })
      const chunks: Uint8Array[] = []; let size = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 16384) { await reader.cancel(); return respond(413, { error: 'REQUEST_TOO_LARGE' }) }
        chunks.push(value)
      }
      const bytes = new Uint8Array(size); let offset = 0
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
      let body: { action?: unknown; payload?: unknown }
      try { body = JSON.parse(new TextDecoder().decode(bytes)) } catch { return respond(400, { error: 'INVALID_INPUT' }) }
      if (!body || typeof body.action !== 'string' || !actions.has(body.action) || !body.payload || typeof body.payload !== 'object' || Array.isArray(body.payload)) return respond(400, { error: 'INVALID_INPUT' })
      const payload = body.payload as Record<string, unknown>
      let actor: string | null = null
      if (body.action === 'admit' && payload.source === 'walk_in') {
        const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
        if (!token || token === config.publicKey) return respond(401, { error: 'AUTH_REQUIRED' })
        const identity = await client.auth.getUser(token)
        if (identity.error || !identity.data.user) return respond(401, { error: 'AUTH_REQUIRED' })
        actor = identity.data.user.id
        let sessionId: unknown
        try { sessionId = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).session_id }
        catch { return respond(401, { error: 'AUTH_REQUIRED' }) }
        if (typeof sessionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) return respond(401, { error: 'AUTH_REQUIRED' })
        const session = await client.rpc('salonq_staff_session_active', { actor, session_id: sessionId })
        if (session.error) return respond(503, { error: 'BACKEND_UNAVAILABLE' })
        if (session.data !== true) return respond(401, { error: 'AUTH_REQUIRED' })
      }
      // The deployed gateway supplies client IP headers. Never accept a rate bucket from the body.
      const ip = request.headers.get('x-real-ip') ?? request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
      const bucket = await keyedHash(`${body.action === 'admit' ? 'admission' : 'read'}:${ip}`, config.backendKey)
      const limit = await client.rpc('salonq_rate_limit', { bucket_hash: bucket, max_attempts: body.action === 'admit' ? 10 : 120 })
      if (limit.error) return respond(503, { error: 'BACKEND_UNAVAILABLE' })
      if (limit.data !== true) return respond(429, { error: 'RATE_LIMITED' })
      if (body.action !== 'public_snapshot' && body.action !== 'admit') {
        const capability = typeof payload.capability === 'string' ? payload.capability : ''
        if (!/^[0-9a-f]{64}$/.test(capability)) return respond(404, { error: 'STATUS_UNAVAILABLE' })
        const capBucket = await keyedHash(`capability:${capability}`, config.backendKey)
        const capLimit = await client.rpc('salonq_rate_limit', { bucket_hash: capBucket, max_attempts: 60 })
        if (capLimit.error) return respond(503, { error: 'BACKEND_UNAVAILABLE' })
        if (capLimit.data !== true) return respond(429, { error: 'RATE_LIMITED' })
      }
      const result = await client.rpc('salonq_gateway', { action: body.action, payload, actor })
      if (result.error) {
        const code = result.error.message && safeErrors.has(result.error.message) ? result.error.message : 'INVALID_INPUT'
        return respond(code === 'STATUS_UNAVAILABLE' ? 404 : code === 'FORBIDDEN' ? 403 : conflicts.has(code) ? 409 : 400, { error: code })
      }
      return respond(200, { data: result.data })
    } catch {
      // No body, credential, URL, capability, phone, database error or exception logging.
      return respond(503, { error: 'BACKEND_UNAVAILABLE' })
    }
  }
}
