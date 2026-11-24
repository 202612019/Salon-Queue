import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

function readEnv(file) {
  const result = {}
  if (!existsSync(file)) return result
  for (const line of readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][\w]*)\s*=\s*(.*?)\s*$/)
    if (match) result[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return result
}
const local = readEnv('.env.local'); const example = readEnv('.env.example')
let validUrl = false
try {
  const parsed = new URL(local.VITE_SUPABASE_URL)
  validUrl = parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co') && !parsed.username && !parsed.password && parsed.pathname === '/'
} catch { /* Output is intentionally limited to booleans. */ }
let ignored = false; let tracked
const gitBase = ['-c', `safe.directory=${fileURLToPath(new URL('../../', import.meta.url)).replaceAll('\\', '/').replace(/\/$/, '')}`]
try {
  ignored = execFileSync('git', [...gitBase, 'check-ignore', '.env.local'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().length > 0
} catch { /* Report failure without paths, values or Git error output. */ }
try { tracked = execFileSync('git', [...gitBase, 'ls-files', '--', '.env.local'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().length > 0 } catch { tracked = true }
const checks = {
  localFileExists: existsSync('.env.local'), validHostedHttpsUrl: validUrl,
  validPublishableKey: /^sb_publishable_[\w-]+$/.test(local.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''),
  noPrivilegedFrontendVariables: !Object.entries(local).some(([key, value]) => key.startsWith('VITE_') && /SECRET|SERVICE_ROLE|PASSWORD/.test(key) && value),
  localFileIgnored: ignored, localFileNotTracked: !tracked,
  examplePlaceholdersOnly: Object.keys(example).length === 2 && Object.values(example).every(value => value === ''),
}
console.log(JSON.stringify(checks, null, 2))
if (!Object.values(checks).every(Boolean)) process.exitCode = 1
