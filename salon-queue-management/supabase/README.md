# SalonQ — Phase 2 backend foundation

Run commands from `Salon-Queue/salon-queue-management/`. The backend source is implemented locally. It has **not** been applied/deployed to the user's hosted project. The approved UI remains a fictional, disabled preview; setting environment variables or deploying this backend does not enable its controls. Screen integration belongs to subsequent feature tasks.

## What is included

- Two ordered, transactional migrations: private schema, constraints/indexes, immutable service snapshots, RLS/restrictive grants, server-side queue operations and protected staff profiles.
- Serialized admission, eligible FCFS assignment and lifecycle transitions; payload-bound retry receipts; normalized active-phone uniqueness; continuous tokens; IST hours/cutoff/statistics; approximate/unavailable/overrun estimates.
- Customer locator plus separate hashed 256-bit capability. Active access survives midnight; terminal access expires exactly 24 hours after the terminal transition. No phone-based recovery.
- `salonq-api`: bounded POST bodies, explicit origin allowlist, shared database rate buckets, capability checks and verified staff JWTs for walk-ins. No PII/body/error logging. Backend credentials stay in Edge runtime configuration.
- Real Supabase Auth client/service helpers, private-link/resume helpers, and sanitized signal subscription with authorized refetch, reconnect/foreground reconciliation and four-second foreground fallback. These are not yet connected to screen components.
- Optional fictional catalog/barbers in `seed.sql`; no Auth users, passwords or queue customers. Default barbers are Off Duty and online admission is closed.

Private tables are never a public Data API or Realtime feed. Public `salonq_changes` contains only a singleton ID, version and change time. All authorization is enforced in trusted operations, including operations reached using a privileged backend connection. CORS provides browser origin restrictions, not authentication.

## Environment verification

```powershell
npm run env:check
npm run backend:probe
```

`env:check` prints booleans only: URL/key format, absence of privileged frontend variable names, Git exclusion and blank example values. It does not print credentials or prove that the URL and key belong to the same project. `backend:probe` makes read-only requests to hosted Auth settings and the sanitized signal table; it never provisions users or changes hosted state. Its results are booleans only.

During Phase 2 the probe reached Auth, observed **public signup still enabled**, and could not read the signal table. Public URL/publishable credentials provide no project-management or migration authorization. `.env.local` was not changed. No privileged credential is required in the browser or this repository.

## Hosted setup — operator action required

Use a dedicated fictional-data project. The following are exact manual steps; none have been executed remotely by the agent.

### 1. Disable public signup

In Supabase Dashboard, open **Authentication → Sign In / Providers** (the general user-access configuration), turn **Allow new users to sign up** OFF and save. Keep email/password sign-in enabled for provisioned staff. Disable anonymous sign-ins and unused providers. `supabase/config.toml` disables signup for a local stack; it does not change an existing hosted project. See [Supabase Auth general configuration](https://supabase.com/docs/guides/auth/general-configuration).

For local development, set Auth Site URL to `http://127.0.0.1:5173` and allow `http://127.0.0.1:5174` if used. Add a real deployment origin only during the approved deployment task.

### 2. Apply migrations

Preferred CLI path (requires a Supabase account with access to the project, project reference and database password):

```powershell
npx supabase@3.3.0 login
npx supabase@3.3.0 link --project-ref YOUR_PROJECT_REF
npx supabase@3.3.0 db push --dry-run
npx supabase@3.3.0 db push
```

Replace `YOUR_PROJECT_REF` with the project reference from Dashboard. Use the CLI's secure prompt for the database password. Do not put the password in a command, Git, a Vite variable or chat. Inspect the dry run: it should list only `20261124000100_salonq_schema.sql` then `20261124000200_salonq_operations.sql`. Do not use reset against this hosted project. See [Supabase CLI migration commands](https://supabase.com/docs/reference/cli/introduction).

Alternative if CLI login is unavailable: open Dashboard **SQL Editor**, copy and run each complete migration file in that order. Each file has its own transaction. Run each only once. Do not subsequently run `db push` blindly: Dashboard execution does not populate the CLI migration history; reconcile that history before switching methods.

Keep `salon_private` out of **API/Data API → Exposed schemas**. The browser uses public RPCs, not direct private-table access. In **Database → Publications**, verify `supabase_realtime` includes `public.salonq_changes` and no SalonQ private tables. The migrations add only the signal table and do not alter unrelated existing publications.

**Never apply `supabase/tests/bootstrap.sql` or `supabase/tests/offline.sql` to a hosted project.** They emulate Auth and replace the private clock for disposable tests only.

### 3. Optional fictional demonstration catalog

In Dashboard SQL Editor, run the complete `supabase/seed.sql` file after migrations. It inserts three clearly fictional services and Ravi/Amit/Imran, leaving all barbers Off Duty and admission closed. It creates no staff credentials. Existing catalog rows are not overwritten. Replace demo catalog through trusted owner operations during the relevant feature task; do not treat preview fixtures as live catalog data.

### 4. Provision trusted staff

In **Authentication → Users → Add user**, create staff using email/password controlled by the operator; confirm the email through trusted administration. Do not enable public signup. Copy the created user's UUID, then run only the matching block below in SQL Editor after replacing the placeholder. The placeholders are intentionally invalid UUIDs until edited.

```sql
-- Owner (one trusted operator account):
insert into salon_private.staff_profiles(user_id, role)
values ('REPLACE_WITH_OWNER_AUTH_USER_UUID'::uuid, 'owner');

-- Receptionist (use a different Auth user):
insert into salon_private.staff_profiles(user_id, role)
values ('REPLACE_WITH_RECEPTION_AUTH_USER_UUID'::uuid, 'receptionist');

-- Ravi's barber account (requires the optional seed or your actual barber UUID):
insert into salon_private.staff_profiles(user_id, role, barber_id)
values ('REPLACE_WITH_BARBER_AUTH_USER_UUID'::uuid, 'barber',
        '20000000-0000-4000-8000-000000000001'::uuid);
```

Repeat the barber block for each distinct Auth user and actual barber UUID. One Auth user has one role; one barber has at most one linked account. A valid Auth account without an enabled staff profile cannot use protected operations. Provisioning is administrative SQL only; no role-edit endpoint exists in the app. Do not commit passwords or paste them into chat. The existing login screen stays disabled until its feature integration task.

### 5. Configure and deploy the Edge Function

In **Edge Functions → Secrets**, add:

```text
ALLOWED_ORIGINS=http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5173,http://localhost:5174
```

Use exact origins, no trailing slash, no wildcard. Add the approved production origin later. Hosted Edge Functions normally supply `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; the function reads those automatically. If using a modern server secret instead, add `SALONQ_BACKEND_KEY` in Dashboard Secrets only. This optional key overrides the runtime service-role key. Never put either backend key in `.env.local`, `.env.example`, frontend code or a `VITE_` variable. See [Supabase Edge environment variables](https://supabase.com/docs/guides/functions/secrets).

From the linked application directory:

```powershell
npx supabase@3.3.0 functions deploy salonq-api --no-verify-jwt
```

`verify_jwt=false` is intentional for public/capability requests. Staff walk-ins explicitly validate the actual session JWT using Auth `getUser`; the database independently checks the protected role. Direct staff RPCs require authenticated JWTs and derive their actor from `auth.uid()`. A publishable API key is not a staff identity. Do not replace these checks with browser roles. See [Supabase function deployment](https://supabase.com/docs/guides/functions/deploy) and [authorization headers](https://supabase.com/docs/guides/functions/auth-headers).

### 6. Verify hosted setup

Rerun `npm run backend:probe`: expected `authReachable: true`, `publicSignupDisabled: true`, `signalTableReachable: true`, `migrationsMissingOrNotAccessible: false`.

Use the Edge Function's Dashboard testing console with method POST, `Content-Type: application/json`, and body `{"action":"public_snapshot","payload":{}}`. It must return a safe snapshot without customer names, phones, locators or capabilities. An `Origin` header, if included, must match `ALLOWED_ORIGINS`.

In SQL Editor, verify the grants/publication without exposing credentials:

```sql
select has_function_privilege('anon', 'public.salonq_gateway(text,jsonb,uuid)', 'execute') as must_be_false;
select has_function_privilege('authenticated', 'public.salonq_staff_command(text,jsonb)', 'execute') as must_be_true;
select schemaname, tablename from pg_publication_tables where pubname='supabase_realtime';
```

Then test real sessions for Owner, Receptionist and linked Barber, generic denial for an unprovisioned account, and actual Realtime subscriptions. Confirm the gateway overwrites trusted client-IP headers before relying on per-IP abuse limits; do not treat caller-supplied forwarding headers as identity. Capability limits remain shared database counters. Hosted Auth revocation, browser reconnect behavior and five-second cross-device delivery require integrated QA, not only SQL inspection.

Online admission intentionally remains closed with Off Duty barbers until an owner configures them. If a fictional backend-only demo is needed before the owner UI exists, this trusted SQL block enables only the seeded Ravi and the online switch, while preserving versioning and invalidation:

```sql
begin;
select pg_advisory_xact_lock(7350141);
update salon_private.barbers set on_duty=true, on_break=false, version=version+1
where id='20000000-0000-4000-8000-000000000001' and not on_duty;
update salon_private.settings set online_enabled=true, version=version+1 where id;
select salon_private.signal();
commit;
```

Opening/cutoff rules still apply; do not replace the hosted clock for testing. Only fictional customers are authorized for demonstrations.

## Local verification and prerequisites

```powershell
npm run env:check
npm run lint
npm run test
npm run build
npm run check:edge
```

The Edge check uses the pinned Deno dev dependency and can require registry access on first run. Unit tests mock the gateway transport; they do not establish hosted behavior. Frontend tests preserve preview restrictions and EN/GU dictionary coverage. No additional browser visual review was performed during Phase 2.

`npm run test:sql` uses a real PostgreSQL **single-user engine**, independent of Docker/network/hosted credentials. This machine has PostgreSQL 18 under `C:\Program Files\PostgreSQL\18\bin`. Initialize the ignored test cluster once from the application directory:

```powershell
New-Item -ItemType Directory -Force .artifacts | Out-Null
& 'C:\Program Files\PostgreSQL\18\bin\initdb.exe' -D .artifacts/phase2-postgres-offline -U salonq_test -A trust --encoding=UTF8
npm run test:sql
```

Do not rerun `initdb` over an existing cluster. Set `SALONQ_POSTGRES_BIN` to your installed `postgres.exe` if different. This test creates a fresh database per run without deleting existing data, emulates only the required Supabase Auth interface, applies both actual migrations plus fictional seed, and executes 63 SQL assertions. Its ignored log contains fictional test values only. Native PostgreSQL 18 is not the complete configured Supabase PostgreSQL 17 stack. Sequential assertions do not prove race outcomes or Realtime delivery.

For the separate **concurrent-connection** runner, initialize a second disposable cluster once and run its server in a dedicated terminal:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\initdb.exe' -D .artifacts/phase2-postgres -U salonq_test -A trust --encoding=UTF8
& 'C:\Program Files\PostgreSQL\18\bin\postgres.exe' -D .artifacts/phase2-postgres -p 55432 -h 127.0.0.1
```

In another terminal, from the application directory, run `npm run test:db`. Stop only that dedicated test server with Ctrl+C when finished. The runner refuses hosted URLs and checks the server data directory before creating a unique test database. Trust authentication is only for these loopback disposable fictional test clusters. Do not use it for hosted or real customer data. Early connection-refused/timeout attempts in the execution environment were resolved by running the server and test runner in one execution with cleanup. The final run passed **37 integration checks**, including six independent-connection race cases: same-barber Call Next, duplicate-phone admissions, identical request retries, two barbers/one Any customer, cancellation/Call Next, and Start/eligible No-show. This is local PostgreSQL evidence only; hosted Auth/Edge/Realtime and the full numbered application scenarios remain unverified.

## Phase 2 limitations and next work

- Hosted migrations, Edge deployment, signup configuration and staff provisioning require the operator steps above; no remote configuration was changed.
- No functional screen/login integration, live statistics or successful queue action is presented by the frontend yet.
- All 91 numbered application acceptance scenarios remain unchecked. Local foundation tests are reported separately.
- Concurrent races, hosted RLS/Auth behavior, five-second Realtime delivery, refresh-token revocation and real browser accessibility/responsiveness remain unverified.
- No Vercel deployment, push, real customer data or staff passwords are included.
