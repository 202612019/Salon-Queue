# SalonQ — Smart Salon Queue Management

**Phase 3: live customer Home, Join and private Status.** Your Time. Your Turn.

Home, Join and private Status are connected to the activated Supabase backend. They support real catalog/availability, admission, secure receipt recovery, private resume, live status and confirmed Waiting cancellation in English/Gujarati. The approved charcoal/champagne-gold identity, local fonts and digital pass remain. Reception, Barber, Display, Owner and staff Login remain explicitly fictional read-only previews; they grant no staff session or mutations. `/status/preview` remains an isolated sample. See [Phase 3 verification](docs/phase-3-verification.md) and [the backend guide](supabase/README.md).

## Run locally

Requires Node 24 or a later compatible release and npm. Run inside `Salon-Queue/salon-queue-management/`:

```powershell
npm install
npm run dev
```

The default development URL is `http://127.0.0.1:5173/`. The script uses a strict port and fails if 5173 is occupied; use `npm run dev -- --port 5174` for the manually reviewed URL `http://127.0.0.1:5174/`. Bindings stay loopback-only. This is a local address, not a deployed application link.

```powershell
npm run build
npm run lint
npm run test
npm run preview
```

`build` checks TypeScript and generates ignored `dist/` output. `preview` serves that output on `http://127.0.0.1:4173/`. `test` runs Vitest and Testing Library in jsdom, not a real browser.

`.env.example` contains blank public Supabase placeholders only. Live customer screens require the configured hosted URL/publishable key in ignored `.env.local`; missing configuration shows a safe unavailable state. Staff previews remain disabled. Never put a secret/service-role key in `VITE_` variables. Local environment files, private test artifacts, dependencies and generated output are ignored. `npm run env:check` prints safety booleans only.

## Routes and structure

| Route | Foundation behavior |
|---|---|
| `/` | Actual public salon overview/catalog/barber availability with private resume |
| `/join` | Customer admission, validation, dynamic service summary and secure pending-request recovery |
| `/status/preview` | Fictional digital queue pass |
| `/status/:id` for actual locator | Capability-authorized own status, immutable services, live progression, private copying and confirmed Waiting cancellation; generic denial without valid access |
| `/reception` | Read-only fictional reception layout |
| `/barber/ravi` (also `/barber/amit`, `/barber/imran`) | Read-only fictional barber workspace |
| `/display` | Public token-only preview, local IST clock, fullscreen with error handling |
| `/admin` | Read-only fictional owner settings and statistics |
| `/login` | Disabled staff email/password form, no fake sign-in |
| Any unmatched route | Not Found page |

```text
src/
  app/                 router, customer/staff layouts, error boundary
  components/ui/       shared buttons, fields, cards, badges, metrics
  components/shared/   brand, language toggle, preview notices, service/barber cards
  features/            home, join, status, reception, barber, display, admin, auth, errors
  domain/              preview models and typed RPC/admission contracts
  services/            fixtures, backend transport, staff Auth, private access, synchronization
  hooks/               authorized snapshot lifecycle and cleanup
  lib/                 formatting, environment contract, lazy Supabase client, class helpers
  i18n/                typed EN/GU dictionaries and language preference
  styles/              centralized Tailwind/CSS tokens and responsive presentation
  test/                frontend, customer-access and Edge-boundary tests
scripts/               safe environment/probe and disposable database test runners
supabase/
  migrations/          private schema, RLS/constraints and transactional operations
  functions/salonq-api/ trusted public/customer boundary
  tests/               disposable Auth/clock fixtures and SQL assertions (never hosted)
  config.toml          local configuration and intentional function JWT setting
  seed.sql             optional fictional catalog/barbers; no credentials
public/licenses/       retained font license notices
```

## Phase 1 verification and approval

Closure date: 24 November 2026. The user's manual review approved the **desktop Home, Join Queue and My Status screenshots** rendered at `http://127.0.0.1:5174/`. That approval preserves the current design foundation and authorizes phase closure after successful automated checks. It does not verify any exact viewport size, other screen, Gujarati layout, responsive behavior or backend functionality. No agent-captured screenshots are archived.

Automated closure checks were rerun on Node 24.14.0 with the pinned npm dependencies. The component suite covers route rendering, real navigation, preview disclosures, disabled credential/queue actions, generic private-status handling, TV identity exclusion, denied fullscreen, offline/error fallbacks, translation-key/placeholder completeness, language persistence, IST formatting and the disabled backend flag. It does not validate actual browser layout, font shaping, RLS, authentication, transactions or realtime synchronization. All 91 numbered application acceptance scenarios remain unchecked.

| Check | Closure result |
|---|---|
| `npm run build` | PASS — TypeScript check and Vite production build; Vite build completed in 2.54s |
| `npm run lint` | PASS — exit 0, zero warnings |
| `npm run test` | PASS — 1 test file, 23/23 frontend tests; 14.94s |
| Desktop Home, Join Queue, My Status visuals | Approved by user after manual review; dimensions unspecified |
| Other screens and 390×844 / 768×1024 / 1440×900 / 1920×1080 visual matrix | NOT VERIFIED |
| Gujarati rendered layouts / accessibility audit | NOT VERIFIED; translation component tests are separate |
| Supabase/backend/end-to-end scenarios | NOT RUN; backend not implemented |

The agent's earlier browser attempts timed out and Windows Computer Use stopped because it could not determine the browser URL reliably. User manual approval closes the limited desktop design review; it does not turn those unsuccessful attempts into visual verification. Deferred improvements and the precise approval scope are recorded in `docs/02-screens.md`. No cosmetic redesign is included in phase closure.

## Fonts and licenses

Locally bundled WOFF2 sources are the pinned npm packages `@fontsource-variable/inter@5.3.0`, `@fontsource-variable/playfair-display@5.3.0` and `@fontsource-variable/noto-sans-gujarati@5.3.0`. The distributed font licenses were inspected and identify SIL Open Font License 1.1. Their complete notices are retained unchanged under `public/licenses/` and copied to production build output. The build has no font-CDN dependency. Playfair Display is used for the English Home hero, Inter for UI, and Noto Sans Gujarati for Gujarati glyph coverage. No third-party photographs are included.

## Phase 2 verification — 24 November 2026

The user supplied public Supabase configuration and authorized the backend foundation. `.env.local` was verified as ignored/untracked without printing its contents and was not modified. The read-only hosted probe reached Auth, found public signup enabled, and found the signal table unavailable. No hosted migration, account provisioning, function deployment or settings mutation was performed. Disable public signup and complete [the exact hosted setup steps](supabase/README.md) before live integration.

| Check | Phase 2 result |
|---|---|
| `npm run env:check` | PASS — all seven boolean safety/configuration checks |
| `npm run lint` | PASS — exit 0, zero warnings |
| `npm run test` | PASS — 3 files, 38/38 tests, including the original 23 frontend tests |
| `npm run build` | PASS — TypeScript and Vite; 3.52s Vite build, 329.73 kB JS / 50.88 kB CSS |
| `npm run check:edge` | PASS — Deno type-check of the actual Edge entrypoint |
| `npm run test:sql` | PASS — 63 real PostgreSQL single-user assertions |
| `npm run test:db` against disposable local PostgreSQL | PASS — 37 integration checks, including six concurrent-request cases using independent connections |
| Temporary production-preview HTTP smoke | PASS — application shell returned for all seven product routes and login at loopback port 4173; preview stopped afterwards |
| Hosted Auth/RLS/Edge/Realtime behavior and five-second cross-device updates | NOT RUN — hosted setup pending |
| New rendered visual/accessibility verification | NOT RUN — design and screen files unchanged |
| 91 numbered application acceptance scenarios | NOT RUN / unchecked — complete screens and deployed integration pending |

The native PostgreSQL tests use fictional identities and a test-only Auth interface/clock on PostgreSQL 18; they do not replace Supabase PostgreSQL 17/hosted Auth or browser QA. Early standalone socket attempts failed with connection-refused/timeouts; starting the disposable server and test runner within one execution resolved connectivity, after which all 37 integration checks passed. The initial SQL run also exposed a reserved variable name and ambiguous conflict target; both migrations were corrected and rerun successfully. Local SQL test fixtures were corrected for an explicit barber-preference overrun and same-actor retry scope. Failed attempts are not counted as passes.

New pinned dependencies: runtime `@supabase/supabase-js@2.119.2`; development `pg@8.23.1`, `@types/pg@8.23.1`, `deno@2.9.6`. The existing approved visual system, routes, translations and preview restrictions are preserved. Backend service helpers are intentionally not imported by the screen previews, so no secret configuration or simulated live data is introduced into their rendered output.

The Phase 2 table above is the historical closure record; Phase 2.5 below supersedes its pending hosted-setup status. Apply deferred targeted UI improvements during their feature tasks. Vercel deployment and push still require explicit approval.

## Phase 2.5 hosted verification — 24 November 2026

An authorized CLI 3.3.0 profile was available and matched the active PostgreSQL 17 project configured in `.env.local`, without printing configuration values. Both original migrations were applied in order through CLI migration history; the reproducible fictional seed was applied. No migration was rewritten, database reset performed, or hosted clock replaced. Four local origins on 127.0.0.1/localhost ports 5173/5174 are configured, with Auth Site URL `http://127.0.0.1:5174`.

| Area | Actual hosted result |
|---|---|
| Signup and email provider | PASS — global signup disabled; real signup rejected with `signup_disabled`; provisioned email/password sign-in works |
| Schema and authorization | PASS — all eight private tables have RLS and denied direct client grants; required functions, partial unique indexes and integrity triggers exist; service-only gateway and authenticated-only staff execution verified |
| Seed and demo availability | PASS — three enabled bilingual services and Ravi/Amit/Imran; demo barbers On Duty, online admission enabled within existing hours |
| Accounts | PASS — Owner, Receptionist, Ravi, Amit and Imran authenticate with protected profiles; each barber links to the correct record |
| Edge deployment | PASS — existing `salonq-api` deployed using API bundling; 200 overview, exact CORS origin and `no-store` verified |
| Queue and tracking | PASS — unique tokens, active-phone rejection, identical-request replay, receipt recovery, private tracking, generic invalid capability denial and retriable Waiting cancellation |
| Staff operations | PASS — preference-aware Call Next, wrong-role/wrong-barber denial, own-barber projection, Start/Done, rejected backward transition, owner statistics/settings reads |
| Realtime | PASS — actual anonymous Postgres Changes subscription and sanitized `{id,version,changed_at}` event; observed 1,942 ms from admission request start after listener readiness |
| Public privacy | PASS — anonymous raw private-table/staff requests denied; overview/TV projection excludes customer PII, private queue IDs and tracking access |
| Existing adapters | PASS — actual `customerOperation`, `signInStaff`, `staffOperation` and `signOutStaff` used against hosted services through Vite module loading |

The final hosted smoke run passed **27 checks**. `supabase/verify-hosted.sql` separately returned true for all **14 metadata/seed checks**. A supplied `x-real-ip` header did not produce the caller-selected rate bucket; this is a limited proxy check, not a full abuse audit. Three final smoke admissions ended as two Done and one Cancelled; one earlier stopped-run Waiting fixture was cancelled through the real receptionist RPC. Fictional history is retained, without deleting queue records or resetting tokens.

Necessary corrections discovered by real integration: the email-provider flag must stay enabled while global signup is disabled; and WebSocket `SUBSCRIBED` can precede the database listener. The first login and immediate-event checks failed for those reasons, then passed after correction. The synchronization helper now refetches on database-listener readiness as well as socket subscription, with three regression tests. The initial lint check rejected an unused test parameter; it was corrected before the successful final run. Supabase CLI cache exclusions were corrected for the nested canonical directory. No page/component/style/translation source was redesigned.

| Final local check | Result |
|---|---|
| Environment safety and hosted probe | PASS — `.env.local` ignored/untracked; example values blank; Auth reachable, signup disabled, signal available |
| `npm run build` | PASS — TypeScript/Vite, 1.73s Vite build |
| `npm run lint` | PASS — zero warnings |
| `npm run test` | PASS — 4 files, 41/41 tests |
| `npm run check:edge` | PASS |
| Password protection | PASS — Windows DPAPI encryption/decryption round trip; clipboard helper syntax checked; clipboard copying itself NOT RUN |

The five fictional account emails and local password-copy procedure are in [the backend guide](supabase/README.md). Passwords are encrypted only in ignored `.artifacts/demo-accounts.dpapi.json`; no password or backend credential is committed. No activation-related manual action remains. The backend operations requested for Phase 3 are verified and ready for screen integration, which is not implemented yet. Browser layout/accessibility, cross-device screen updates/reconnect, hosted concurrency/timing matrices and the 91 complete application acceptance scenarios remain unverified/unchecked. The original 63 local SQL and 37 local integration checks remain historical local evidence, not new hosted passes. Stop after Phase 2.5; no Vercel deployment or push is performed.

## Phase 3 customer integration — 24 November 2026

Earlier phase sections above are historical records. Phase 3 connects only Home, Join and private My Status. The final hosted React/jsdom run passed **14 checkpoints** using actual Supabase and restricted demo staff sessions: actual admission, totals, secure private resume, deliberately lost response recovery, mounted Called/In Chair/Done updates, Gujarati service/status switching and persisted Waiting cancellation. No admission or lifecycle success was mocked in that run. All final-run fictional entries are terminal.

| Verification | Actual result |
|---|---|
| Automated local tests | PASS — 72 / five files |
| Lint | PASS — zero warnings |
| Production build | PASS — TypeScript/Vite; non-fatal >500 kB bundle warning with the real Supabase SDK |
| Isolated PostgreSQL assertions | PASS — 64 |
| Local database/race checks | PASS — 37 with all current migrations |
| Hosted React integration | PASS — one opt-in jsdom test, 14 checkpoints; 27.36s run |
| Acceptance scenarios | T01, T04, T06, T16, T17 PASS with explicit hosted React/jsdom scope; 86 remain unchecked |
| Rendered browser layouts/screenshots | NOT RUN — prior tooling restrictions respected |

A necessary additive migration supplies named-barber public estimates from the existing trusted estimator; original migrations, authorization and queue rules are unchanged. The Edge Function was reused without rewrite/redeployment. Existing service cards, the sticky Join summary and digital queue pass remain. Enhancements include tighter Home spacing, real featured services, three visible Join steps/count, circular approximate wait, progression/Called/arrival announcements, private copying and a focused cancellation dialog. All new labels/errors have centralized EN/GU translations. No new dependencies or photographs were added.

One shared sanitized subscription serves independently authorized loaders, with readiness/reconnect/foreground reconciliation and a four-second fallback. Five-second cross-device browser timing remains unmeasured; the headless test allowed eight seconds per status assertion. Mutation timeouts preserve bound recovery identity. No private name/phone/selection is cached locally.

Run `npm run dev -- --port 5174` and open `http://127.0.0.1:5174/`. Follow [the complete verification record and exact manual steps](docs/phase-3-verification.md) for actual browser refresh, private-link sharing, offline transport, keyboard/accessibility and responsive Gujarati review. Staff dashboard integration is next. No frontend deployment or push was performed.
