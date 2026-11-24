import { readFile, readdir } from 'node:fs/promises'
import { strict as assert } from 'node:assert'
import pg from 'pg'
import { randomBytes } from 'node:crypto'

// Intentionally cannot accept a hosted URL. This runner only contacts the disposable
// cluster initialized under .artifacts/phase2-postgres by the documented local steps.
const config = { host: '127.0.0.1', port: 55432, user: 'salonq_test', database: 'salonq_phase2_test', connectionTimeoutMillis: 5000 }
const admin = new pg.Client({ ...config, database: 'postgres' })
await admin.connect()
const marker = await admin.query('show data_directory')
assert.match(marker.rows[0].data_directory.replaceAll('\\', '/'), /\/\.artifacts\/phase2-postgres$/)
// A fresh unique database makes reruns independent without deleting any existing data.
config.database = `salonq_test_${Date.now()}`
await admin.query(`create database "${config.database}"`)
await admin.end()
const db = new pg.Client(config)
await db.connect()
let passed = 0
const key = () => randomBytes(32).toString('hex')
const owner = '30000000-0000-4000-8000-000000000001'
const reception = '30000000-0000-4000-8000-000000000002'
const barberUser = '30000000-0000-4000-8000-000000000003'
const stranger = '30000000-0000-4000-8000-000000000004'
const ravi = '20000000-0000-4000-8000-000000000001'
const amit = '20000000-0000-4000-8000-000000000002'
const haircut = '10000000-0000-4000-8000-000000000001'
const beard = '10000000-0000-4000-8000-000000000002'
const firstDate = '2026-11-24T10:00:00+05:30'
async function clock(value) {
  // Replace the PRIVATE clock only in this disposable test database. No HTTP/test clock exists.
  assert.match(value, /^[\dT:+.-]+$/)
  await db.query(`create or replace function salon_private.now() returns timestamptz language sql volatile set search_path='' as $$select '${value}'::timestamptz$$`)
}
async function check(name, run) { await run(); passed++; console.log(`PASS ${name}`) }
async function fails(run, code) { await assert.rejects(run, error => error.message === code || error.code === code) }
async function asRole(client, role, actor, run) {
  await client.query('begin')
  try {
    await client.query(`set local role ${role}`)
    await client.query("select set_config('request.jwt.claim.sub',$1,true)", [actor ?? ''])
    const result = await run(client)
    await client.query('commit'); return result
  } catch (error) { await client.query('rollback'); throw error }
}
const gateway = async (action, payload = {}, client = db) => (await client.query('select public.salonq_gateway($1,$2::jsonb) as result', [action, JSON.stringify(payload)])).rows[0].result
const staff = async (action, payload = {}, actor = reception, client = db) => asRole(client, 'authenticated', actor, async connection => (await connection.query('select public.salonq_staff_command($1,$2::jsonb) as result', [action, JSON.stringify(payload)])).rows[0].result)
async function request(phone = '9876500001', extra = {}) {
  const services = (await db.query('select id,version,price_paise,duration_minutes from salon_private.services where id=any($1) order by id', [[haircut, beard]])).rows
  return { name: 'Fictional Customer', phone, services, preferred_barber_id: null, source: 'remote', capability: key(), request_key: key(), ...extra }
}
const current = async receipt => (await db.query('select id,version,status,assigned_barber_id from salon_private.queue_entries where locator=$1', [receipt.locator])).rows[0]

try {
  // Roles are cluster-wide; bootstrap conditionally creates them. Auth is per database.
  const bootstrap = await readFile(new URL('../supabase/tests/bootstrap.sql', import.meta.url), 'utf8')
  await db.query(bootstrap)
  for (const file of (await readdir('supabase/migrations')).filter(file => file.endsWith('.sql')).sort()) await db.query(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'))
  await db.query(await readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8'))
  await clock(firstDate)
  await db.query('insert into auth.users(id) values ($1),($2),($3),($4)', [owner, reception, barberUser, stranger])
  await db.query("insert into salon_private.staff_profiles(user_id,role,barber_id) values ($1,'owner',null),($2,'receptionist',null),($3,'barber',$4)", [owner, reception, barberUser, ravi])
  await db.query('update salon_private.barbers set on_duty=true; update salon_private.settings set online_enabled=true')

  await check('migrations create RLS on all private tables', async () => {
    const rows = await db.query("select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='salon_private' and c.relkind='r'")
    assert.equal(rows.rows.length, 8); assert.ok(rows.rows.every(row => row.relrowsecurity))
  })
  await check('anonymous private reads and gateway execution denied', async () => {
    await fails(() => asRole(db, 'anon', null, c => c.query('select * from salon_private.queue_entries')), '42501')
    await fails(() => asRole(db, 'anon', null, c => gateway('public_snapshot', {}, c)), '42501')
  })
  await check('anonymous signal read allowed; signal write denied', async () => {
    const read = await asRole(db, 'anon', null, c => c.query('select version from public.salonq_changes'))
    assert.equal(read.rowCount, 1)
    await fails(() => asRole(db, 'anon', null, c => c.query('update public.salonq_changes set version=999')), '42501')
  })
  await check('unprovisioned authenticated user denied', () => fails(() => staff('snapshot', {}, stranger), 'FORBIDDEN'))
  await check('role escalation and direct status writes denied', async () => {
    await fails(() => asRole(db, 'authenticated', barberUser, c => c.query("update salon_private.staff_profiles set role='owner'")), '42501')
    await fails(() => asRole(db, 'authenticated', reception, c => c.query("update salon_private.queue_entries set status='done'")), '42501')
  })
  const first = await request()
  let firstReceipt
  await check('valid two-service admission snapshots authoritative totals', async () => {
    firstReceipt = await gateway('admit',first)
    const status = await gateway('status', { ...firstReceipt, capability:first.capability })
    assert.equal(status.total_paise,23000); assert.equal(status.total_minutes,45); assert.equal(status.services.length,2)
    assert.equal(status.status,'waiting'); assert.equal(status.estimate.position,1)
  })
  await check('identical request returns one receipt and token', async () => {
    assert.deepEqual(await gateway('admit',first),firstReceipt)
    assert.equal((await db.query('select count(*)::int n from salon_private.queue_entries')).rows[0].n,1)
  })
  await check('bound request rejects changed payload and capability', async () => {
    await fails(() => gateway('admit',{...first,name:'Different Name'}),'IDEMPOTENCY_CONFLICT')
    await fails(() => gateway('admit',{...first,capability:key()}),'IDEMPOTENCY_CONFLICT')
  })
  await check('normalized +91/spaces/hyphens share active phone uniqueness', () => fails(async () => gateway('admit',await request('+91 98765-00001')),'ACTIVE_ENTRY_EXISTS'))
  await check('invalid phones and empty names rejected', async () => {
    for (const phone of ['123','0987654321','+44 9876500002','919876500002','98765abc01']) await fails(async () => gateway('admit',await request(phone)),'INVALID_PHONE')
    await fails(async () => gateway('admit',await request('9876500002',{name:' '})),'INVALID_NAME')
  })
  await check('zero, duplicate and four-service selections rejected', async () => {
    await fails(async () => gateway('admit',await request('9876500002',{services:[]})),'INVALID_SERVICES')
    await fails(async () => gateway('admit',await request('9876500002',{services:[first.services[0],first.services[0]]})),'INVALID_SERVICES')
    await fails(async () => gateway('admit',await request('9876500002',{services:[...first.services,...first.services]})),'INVALID_SERVICES')
  })
  await check('stale price/duration rejected without an entry', async () => {
    await fails(async () => gateway('admit',await request('9876500002',{services:[{...first.services[0],price_paise:1}]})),'CATALOG_CHANGED')
    await fails(async () => gateway('admit',await request('9876500002',{services:[{...first.services[0],duration_minutes:1}]})),'CATALOG_CHANGED')
  })
  await check('phone, locator and wrong capability cannot read private status', async () => {
    await fails(() => gateway('status',{locator:firstReceipt.locator,capability:key()}),'STATUS_UNAVAILABLE')
    await fails(() => gateway('status',{phone:first.phone}),'STATUS_UNAVAILABLE')
  })
  await check('public snapshots contain no customer names phones locators capabilities', async () => {
    const serialized=JSON.stringify(await gateway('public_snapshot'))
    for (const value of [first.name,first.phone,first.capability,firstReceipt.locator,'capability_hash','customer_name']) assert.ok(!serialized.includes(value))
  })
  let namedReceipt; let anyReceipt
  const named = await request('9876500002',{preferred_barber_id:ravi})
  const any = await request('9876500003')
  namedReceipt=await gateway('admit',named); anyReceipt=await gateway('admit',any)
  await check('Call Next skips incompatible preference and respects eligible FCFS', async () => {
    const result=await staff('call_next',{request_key:key(),barber_id:amit})
    assert.equal(result.token,firstReceipt.token)
    const next=await staff('call_next',{request_key:key(),barber_id:ravi})
    assert.equal(next.token,namedReceipt.token)
  })
  await check('Called reserves capacity and prevents second assignment/break', async () => {
    await fails(() => staff('call_next',{request_key:key(),barber_id:ravi}),'BARBER_BUSY')
    await fails(() => staff('set_duty',{request_key:key(),barber_id:ravi,on_duty:true,on_break:true,version:1},owner),'BARBER_BUSY')
  })
  await check('customer cannot cancel after Called', () => fails(() => gateway('cancel',{locator:firstReceipt.locator,capability:first.capability}),'INVALID_TRANSITION'))
  await check('wrong barber and receptionist cannot Start', async () => {
    const entry=await current(firstReceipt)
    await fails(() => staff('start',{request_key:key(),entry_id:entry.id,version:entry.version},barberUser),'FORBIDDEN')
    await fails(() => staff('start',{request_key:key(),entry_id:entry.id,version:entry.version}),'FORBIDDEN')
  })
  await check('assigned barber Start and Done follow forward lifecycle', async () => {
    const entry=await current(namedReceipt)
    const started=await staff('start',{request_key:key(),entry_id:entry.id,version:entry.version},barberUser)
    assert.equal(started.status,'in_chair')
    const done=await staff('done',{request_key:key(),entry_id:entry.id,version:started.version},barberUser)
    assert.equal(done.status,'done')
    assert.ok(done.started_at && done.terminal_at)
    await fails(() => staff('start',{request_key:key(),entry_id:entry.id,version:done.version},barberUser),'INVALID_TRANSITION')
  })
  await check('No-show rejects 599 seconds and accepts exactly 600', async () => {
    const entry=await current(firstReceipt)
    await clock('2026-11-24T10:09:59+05:30')
    await fails(() => staff('no_show',{request_key:key(),entry_id:entry.id,version:entry.version}),'NO_SHOW_TOO_EARLY')
    await clock('2026-11-24T10:10:00+05:30')
    const result=await staff('no_show',{request_key:key(),entry_id:entry.id,version:entry.version})
    assert.equal(result.status,'no_show')
  })
  await check('returning no-show gets a new larger token at tail', async () => {
    const result=await gateway('admit',await request(first.phone))
    assert.notEqual(result.token,firstReceipt.token)
    assert.ok(Number(result.token.slice(2))>Number(anyReceipt.token.slice(2)))
  })
  await check('Waiting cancellation is safe to retry; expired terminal denies', async () => {
    const payload={locator:anyReceipt.locator,capability:any.capability}
    assert.equal((await gateway('cancel',payload)).status,'cancelled')
    assert.equal((await gateway('cancel',payload)).status,'cancelled')
    await clock('2026-11-25T10:10:00+05:30')
    await fails(() => gateway('status',payload),'STATUS_UNAVAILABLE')
    await clock('2026-11-24T10:10:00+05:30')
  })
  await check('catalog edits preserve admitted snapshots', async () => {
    const before=await gateway('status',{locator:namedReceipt.locator,capability:named.capability})
    await staff('save_service',{request_key:key(),id:haircut,version:1,name_en:'Changed Haircut',name_gu:'બદલાયેલ સેવા',price_paise:25000,duration_minutes:40,enabled:true},owner)
    const after=await gateway('status',{locator:namedReceipt.locator,capability:named.capability})
    assert.deepEqual(after.services,before.services)
  })
  await check('opening and online cutoff boundaries use server IST time', async () => {
    for (const [time,code] of [['09:59:59','SALON_CLOSED'],['20:30:00','ONLINE_CLOSED'],['21:00:00','SALON_CLOSED']]) {
      await clock(`2026-11-24T${time}+05:30`)
      await fails(async () => gateway('admit',await request('9876500004')),code)
    }
    await clock('2026-11-24T20:29:59+05:30')
    await gateway('admit',await request('9876500004'))
    await clock('2026-11-24T20:30:00+05:30')
    await staff('admit',await request('9876500005',{source:'walk_in'}))
    await clock('2026-11-24T21:00:00+05:30')
    await fails(async () => staff('admit',await request('9876500006',{source:'walk_in'})),'SALON_CLOSED')
  })
  await check('same successful admission retries after cutoff without a second entry', async () => {
    assert.deepEqual(await gateway('admit',first),firstReceipt)
  })
  await clock('2026-11-25T10:00:00+05:30')
  await check('active entries and capability survive midnight; no token reset', async () => {
    const result=await gateway('admit',await request('9876500006'))
    assert.ok(Number(result.token.slice(2))>Number(firstReceipt.token.slice(2)))
    const active=(await db.query("select locator,capability_hash from salon_private.queue_entries where status='waiting' limit 1")).rows[0]
    assert.ok(active)
    const receipt=await gateway('receipt',{request_key:first.request_key,capability:first.capability})
    assert.equal(receipt.token,firstReceipt.token)
  })
  await check('owner statistics use IST terminal event dates and mean join-to-call', async () => {
    const result=await staff('snapshot',{},owner)
    assert.equal(result.statistics.served,0); assert.equal(result.statistics.average_wait_minutes,null)
    await clock('2026-11-24T23:59:59+05:30')
    const previous=await staff('snapshot',{},owner)
    assert.equal(previous.statistics.served,1); assert.equal(previous.statistics.no_shows,1)
  })
  await clock('2026-11-25T10:00:00+05:30')
  await check('all on-duty barbers on break allow admission with unavailable estimate', async () => {
    await db.query('update salon_private.barbers set on_break=true')
    const req=await request('9876500007',{preferred_barber_id:ravi})
    const receipt=await gateway('admit',req)
    const result=await gateway('status',{locator:receipt.locator,capability:req.capability})
    assert.equal(result.estimate.state,'unavailable'); assert.equal(result.estimate.minutes,null)
    await fails(() => staff('call_next',{request_key:key(),barber_id:ravi}),'BARBER_UNAVAILABLE')
    await db.query('update salon_private.barbers set on_break=false')
  })
  await check('Off Duty blocked while specifically awaited; unprivileged settings blocked', async () => {
    await fails(() => staff('set_duty',{request_key:key(),barber_id:ravi,version:1,on_duty:false,on_break:false},owner),'BARBER_HAS_WAITING')
    await fails(() => staff('save_settings',{request_key:key()},reception),'FORBIDDEN')
  })
  await check('rate limit counters persist server-side', async () => {
    const hash=key()
    const query=()=>db.query('select public.salonq_rate_limit($1,2) as allowed',[hash])
    assert.equal((await query()).rows[0].allowed,true); assert.equal((await query()).rows[0].allowed,true); assert.equal((await query()).rows[0].allowed,false)
  })
  await check('only sanitized signal is in the Realtime publication', async () => {
    const tables=await db.query("select schemaname,tablename from pg_publication_tables where pubname='supabase_realtime'")
    assert.deepEqual(tables.rows,[{schemaname:'public',tablename:'salonq_changes'}])
  })

  // Actual independent connections, not Promise.all on one PostgreSQL socket.
  const a=new pg.Client(config); const b=new pg.Client(config); await a.connect(); await b.connect()
  try {
    await check('concurrent Call Next for same barber assigns at most one customer',async () => {
      const outcomes=await Promise.allSettled([staff('call_next',{request_key:key(),barber_id:ravi},reception,a),staff('call_next',{request_key:key(),barber_id:ravi},reception,b)])
      assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1)
      assert.equal(outcomes.filter(x=>x.status==='rejected' && x.reason.message==='BARBER_BUSY').length,1)
    })
    await check('simultaneous duplicate-phone admissions create exactly one row',async () => {
      const ra=await request('9876500008'); const rb=await request('9876500008')
      const outcomes=await Promise.allSettled([gateway('admit',ra,a),gateway('admit',rb,b)])
      assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1)
      assert.equal((await db.query("select count(*)::int n from salon_private.queue_entries where phone='9876500008'")).rows[0].n,1)
    })
    async function settleActive(time) {
      await clock(time)
      const active = await db.query("select id,version,status from salon_private.queue_entries where status in ('waiting','called')")
      for (const entry of active.rows) await staff(entry.status === 'waiting' ? 'cancel' : 'no_show', { request_key: key(), entry_id: entry.id, version: entry.version })
    }
    await settleActive('2026-11-25T12:00:00+05:30')
    await check('simultaneous identical admissions replay one bound receipt', async () => {
      const req = await request('9876500009')
      const outcomes = await Promise.all([gateway('admit', req, a), gateway('admit', req, b)])
      assert.deepEqual(outcomes[0], outcomes[1])
      assert.equal((await db.query("select count(*)::int n from salon_private.queue_entries where phone='9876500009'")).rows[0].n, 1)
    })
    await check('two barbers racing for one Any customer cannot double-assign', async () => {
      const outcomes = await Promise.all([
        staff('call_next', { request_key: key(), barber_id: amit }, reception, a),
        staff('call_next', { request_key: key(), barber_id: '20000000-0000-4000-8000-000000000003' }, reception, b),
      ])
      assert.equal(outcomes.filter(result => result.entry_id).length, 1)
      assert.equal(outcomes.filter(result => result.reason === 'NO_ELIGIBLE_CUSTOMER').length, 1)
    })
    await settleActive('2026-11-25T12:10:00+05:30')
    await check('customer cancellation racing Call Next has one consistent terminal or assignment outcome', async () => {
      const req = await request('9876500010')
      const receipt = await gateway('admit', req)
      const outcomes = await Promise.allSettled([
        gateway('cancel', { locator: receipt.locator, capability: req.capability }, a),
        staff('call_next', { request_key: key(), barber_id: ravi }, reception, b),
      ])
      const entry = await current(receipt)
      if (entry.status === 'called') {
        assert.equal(outcomes[0].status, 'rejected')
        assert.equal(outcomes[0].reason.message, 'INVALID_TRANSITION')
        assert.equal(outcomes[1].status, 'fulfilled')
      } else {
        assert.equal(entry.status, 'cancelled')
        assert.equal(outcomes[0].status, 'fulfilled')
        assert.equal(outcomes[1].status, 'fulfilled')
        assert.equal(outcomes[1].value.reason, 'NO_ELIGIBLE_CUSTOMER')
        assert.equal(entry.assigned_barber_id, null)
      }
    })
    await settleActive('2026-11-25T12:20:00+05:30')
    await check('Start racing eligible No-show permits exactly one forward transition', async () => {
      const receipt = await gateway('admit', await request('9876500011'))
      const called = await staff('call_next', { request_key: key(), barber_id: ravi })
      await clock('2026-11-25T12:30:00+05:30')
      const payload = { entry_id: called.entry_id, version: called.version }
      const outcomes = await Promise.allSettled([
        staff('start', { ...payload, request_key: key() }, barberUser, a),
        staff('no_show', { ...payload, request_key: key() }, reception, b),
      ])
      assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 1)
      assert.equal(outcomes.filter(result => result.status === 'rejected' && result.reason.message === 'STALE_VERSION').length, 1)
      assert.ok(['in_chair', 'no_show'].includes((await current(receipt)).status))
    })
    async function waitBlocked(client) {
      const deadline=Date.now()+5000
      while(Date.now()<deadline){
        const result=await db.query('select cardinality(pg_blocking_pids($1))>0 as blocked',[client.processID])
        if(result.rows[0].blocked)return
        await new Promise(resolve=>setTimeout(resolve,10))
      }
      throw new Error('Expected independent transaction to wait for the salon lock')
    }
    for(const kind of ['hours','switch','catalog','duty']) {
      for(const first of ['configuration','admission']) {
        await check(`T85 ${kind} race with ${first} committed first remains consistent`, async()=>{
          // This runner has already verified its disposable local cluster marker.
          await db.query('truncate salon_private.operation_receipts, salon_private.queue_entries cascade')
          await clock('2026-11-25T12:30:00+05:30')
          await db.query("update salon_private.settings set opening_time='10:00',closing_time='21:00',online_enabled=true; update salon_private.barbers set on_duty=true,on_break=false; update salon_private.services set enabled=true")
          const imran='20000000-0000-4000-8000-000000000003'
          const req=await request('9876500099',{preferred_barber_id:imran})
          const settings=(await db.query('select * from salon_private.settings')).rows[0]
          const service=(await db.query('select * from salon_private.services where id=$1',[haircut])).rows[0]
          const barber=(await db.query('select * from salon_private.barbers where id=$1',[imran])).rows[0]
          const operation=kind==='catalog'?'save_service':kind==='duty'?'set_duty':'save_settings'
          const payload=kind==='catalog'?{...service,price_paise:service.price_paise+100}:kind==='duty'?{barber_id:imran,version:barber.version,on_duty:false,on_break:false}:{...settings,opening_time:kind==='hours'?'13:00':settings.opening_time,online_enabled:kind!=='switch'}
          const configure=()=>staff(operation,{...payload,request_key:key()},owner,b)
          if(first==='configuration'){
            await a.query('begin')
            try{
              await a.query("set local role authenticated; select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true); select pg_advisory_xact_lock(7350141)")
              const pending=gateway('admit',req,b).then(value=>({value}),error=>({error}))
              await waitBlocked(b)
              await a.query('select public.salonq_staff_command($1,$2::jsonb)',[operation,JSON.stringify({...payload,request_key:key()})])
              await a.query('commit')
              const result=await pending
              assert.equal(result.error?.message,{hours:'SALON_CLOSED',switch:'ONLINE_CLOSED',catalog:'CATALOG_CHANGED',duty:'BARBER_UNAVAILABLE'}[kind])
              assert.equal((await db.query('select count(*)::int n from salon_private.queue_entries')).rows[0].n,0)
            }catch(error){await a.query('rollback');throw error}
          }else{
            await a.query('begin')
            try{
              const receipt=await gateway('admit',req,a)
              const pending=configure().then(value=>({value}),error=>({error}))
              await waitBlocked(b)
              await a.query('commit')
              const result=await pending
              if(kind==='duty')assert.equal(result.error?.message,'BARBER_HAS_WAITING')
              else assert.ok(result.value&&!result.error)
              const entry=await gateway('status',{locator:receipt.locator,capability:req.capability})
              assert.equal(entry.status,'waiting')
              assert.equal((await db.query('select count(*)::int n from salon_private.queue_entries')).rows[0].n,1)
            }catch(error){await a.query('rollback');throw error}
          }
        })
      }
    }
  } finally { await a.end(); await b.end() }
  console.log(`Database integration checks: ${passed} passed. Local PostgreSQL with test-only Auth identities; hosted Auth/Edge/Realtime delivery NOT verified.`)
} finally { await db.end() }
