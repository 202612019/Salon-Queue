import { loadEnv } from 'vite'
const env = loadEnv('development', process.cwd(), 'VITE_')
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key || !/^sb_publishable_[\w-]+$/.test(key)) throw new Error('Public environment configuration is missing or invalid.')
// Read-only health checks. Never print URL, key, responses, headers or exception text.
const report = { authReachable: false, publicSignupDisabled: null, signalTableReachable: false, migrationsMissingOrNotAccessible: false }
try {
  const response = await fetch(url + '/auth/v1/settings', { headers: { apikey: key }, signal: AbortSignal.timeout(6000) })
  report.authReachable = response.ok
  if (response.ok) {
    const settings = await response.json()
    report.publicSignupDisabled = typeof settings.disable_signup === 'boolean' ? settings.disable_signup : null
  }
  const signal = await fetch(url + '/rest/v1/salonq_changes?select=version&limit=1', { headers: { apikey: key }, signal: AbortSignal.timeout(6000) })
  report.signalTableReachable = signal.ok
  report.migrationsMissingOrNotAccessible = !signal.ok
} catch { /* Network failures remain booleans; no sensitive exception output. */ }
console.log(JSON.stringify(report, null, 2))
if (!report.authReachable) process.exitCode = 1
