import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

// Real PostgreSQL single-user engine, without network or hosted credentials.
const data = resolve('.artifacts/phase2-postgres-offline')
const executable = process.env.SALONQ_POSTGRES_BIN ?? 'C:/Program Files/PostgreSQL/18/bin/postgres.exe'
const database = 'salonq_offline_' + Date.now()
const created = spawnSync(executable, ['--single', '-j', '-D', data, 'postgres'], { input: 'create database ' + database + ';\n\n', encoding: 'utf8', timeout: 30000 })
if (created.error || created.status !== 0 || /\b(ERROR|FATAL|PANIC):/.test((created.stdout ?? '') + (created.stderr ?? ''))) throw new Error('Cannot create isolated offline test database.')
const files = ['supabase/tests/bootstrap.sql', 'supabase/migrations/20261124000100_salonq_schema.sql', 'supabase/migrations/20261124000200_salonq_operations.sql', 'supabase/seed.sql', 'supabase/tests/offline.sql']
const sql = (await Promise.all(files.map(file => readFile(file, 'utf8')))).join('\n').replace(/\n[ \t]*\n/g, '\n') + '\n\n'
const result = spawnSync(executable, ['--single', '-j', '-D', data, database], { input: sql, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 60000 })
const output = (result.stdout ?? '') + '\n' + (result.stderr ?? '')
await mkdir('.artifacts', { recursive: true })
await writeFile('.artifacts/sql-offline-results.log', output)
const notices = [...output.matchAll(/(?:NOTICE|WARNING):\s+(PASS [^\r\n]+)/g)].map(match => match[1])
for (const line of notices) console.log(line)
if (result.error || result.status !== 0 || notices.length < 40 || /\b(ERROR|FATAL|PANIC):/.test(output)) {
  console.error('Offline PostgreSQL checks failed. Diagnostics: ignored .artifacts/sql-offline-results.log (fictional data only).')
  const lines = output.split(/\r?\n/); const index = lines.findIndex(line => /\b(ERROR|FATAL|PANIC):/.test(line))
  if (index >= 0) console.error(lines.slice(index, index + 7).join('\n'))
  process.exitCode = 1
} else console.log('Offline real-PostgreSQL assertions: ' + notices.length + ' passed. Concurrent connections and hosted Supabase NOT verified.')
