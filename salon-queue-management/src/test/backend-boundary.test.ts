// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { createHandler, type GatewayClient } from '../../supabase/functions/salonq-api/handler'

function fixture() {
  const rpc = vi.fn(async (name: string) => name === 'salonq_rate_limit' ? { data: true, error: null } : { data: { token: 'S-1' }, error: null })
  const getUser = vi.fn(async () => ({ data: { user: { id: 'trusted-auth-user' } }, error: null }))
  const handler = createHandler({ rpc, auth: { getUser } } as GatewayClient, { allowedOrigins: ['http://localhost:5173'], backendKey: 'unit-test-key-only' })
  return { rpc, getUser, handler }
}
function request(action = 'public_snapshot', payload: Record<string, unknown> = {}, extra: Record<string, string> = {}) {
  return new Request('https://example.invalid/functions/v1/salonq-api', {
    method: 'POST', headers: { origin: 'http://localhost:5173', 'content-type': 'application/json', ...extra },
    body: JSON.stringify({ action, payload }),
  })
}

describe('trusted Edge boundary', () => {
  it('returns no-store/no-referrer and an explicit allowed origin', async () => {
    const { handler } = fixture()
    const result = await handler(request())
    expect(result.status).toBe(200)
    expect(result.headers.get('cache-control')).toBe('no-store')
    expect(result.headers.get('referrer-policy')).toBe('no-referrer')
    expect(result.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
  })
  it('rejects an unlisted origin before database work', async () => {
    const { handler, rpc } = fixture()
    expect((await handler(request('public_snapshot', {}, { origin: 'https://evil.invalid' }))).status).toBe(403)
    expect(rpc).not.toHaveBeenCalled()
  })
  it('does not trust a body actor or role to authorize walk-ins', async () => {
    const { handler, getUser, rpc } = fixture()
    const result = await handler(request('admit', { source: 'walk_in', actor: 'owner', role: 'owner' }))
    expect(result.status).toBe(401)
    expect(getUser).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled()
  })
  it('uses only the Supabase-verified identity for walk-ins', async () => {
    const { handler, rpc, getUser } = fixture()
    await handler(request('admit', { source: 'walk_in', actor: 'forged' }, { authorization: 'Bearer test-session' }))
    expect(getUser).toHaveBeenCalledWith('test-session')
    expect(rpc).toHaveBeenCalledWith('salonq_gateway', expect.objectContaining({ actor: 'trusted-auth-user' }))
  })
  it('denies revoked or invalid staff sessions before gateway writes', async () => {
    const { handler, getUser, rpc } = fixture()
    getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Expired') } as never)
    expect((await handler(request('admit', { source: 'walk_in' }, { authorization: 'Bearer invalid' }))).status).toBe(401)
    expect(rpc).not.toHaveBeenCalled()
  })
  it('requires the private capability for status and never logs it', async () => {
    const { handler, rpc } = fixture()
    const log = vi.spyOn(console, 'log')
    expect((await handler(request('status', { phone: 'fictional' }))).status).toBe(404)
    expect(rpc.mock.calls.some(([name]) => name === 'salonq_gateway')).toBe(false)
    expect(log).not.toHaveBeenCalled()
  })
  it('rejects actual oversized request bodies without trusting Content-Length', async () => {
    const { handler, rpc } = fixture()
    expect((await handler(request('admit', { name: 'x'.repeat(20000) }))).status).toBe(413)
    expect(rpc).not.toHaveBeenCalled()
  })
  it('returns rate limiting without a mutation', async () => {
    const { handler, rpc } = fixture()
    rpc.mockResolvedValueOnce({ data: false, error: null } as never)
    expect((await handler(request())).status).toBe(429)
    expect(rpc.mock.calls.some(([name]) => name === 'salonq_gateway')).toBe(false)
  })
  it('never forwards raw database exceptions or secret details', async () => {
    const { handler, rpc } = fixture()
    rpc.mockResolvedValueOnce({ data: true, error: null } as never)
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'private phone and secret exception' } } as never)
    const result = await handler(request())
    expect(await result.text()).not.toMatch(/private phone|secret exception/)
  })
  it('replays neither requests nor secrets through URL query parameters', async () => {
    const { handler, rpc } = fixture()
    const capability = 'a'.repeat(64)
    await handler(request('status', { locator: 'b'.repeat(32), capability }))
    expect(rpc).toHaveBeenCalledWith('salonq_gateway', expect.objectContaining({ action: 'status', actor: null }))
  })
})
