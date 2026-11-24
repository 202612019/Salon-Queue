# SalonQ — Smart Salon Queue Management

**Phase 2: local Supabase backend foundation; hosted setup pending.** Your Time. Your Turn.

This application contains seven visually representative, read-only route previews, shared customer/staff layouts, a Lucide scissors wordmark, centralized charcoal/champagne-gold tokens, local typography, English/Gujarati dictionaries, a staff sign-in shell, Not Found handling and an application error boundary. Preview values are fictional. Staff preview pages are publicly viewable design fixtures, not authenticated staff sessions; no credentials are accepted and no queue or settings mutations occur through the UI. Phase 2 adds migrations, controlled database operations, the trusted Edge boundary and Auth/customer/synchronization service helpers. Hosted setup and screen integration remain pending. Follow [the backend setup guide](supabase/README.md) for exact operator steps.

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

`.env.example` contains blank public Supabase placeholders only. The frontend previews do not require credentials to run, and setting these variables does not activate their controls. Never put a secret/service-role key in `VITE_` variables. Local environment files, dependencies and generated output are ignored by Git. `npm run env:check` verifies the local configuration without printing values.

## Routes and structure

| Route | Foundation behavior |
|---|---|
| `/` | Home and fictional salon/queue overview |
| `/join` | Disabled sample form, selected service cards and summary |
| `/status/preview` | Fictional digital queue pass |
| `/status/:id` for any other ID | Generic private-status explanation, no customer lookup |
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

Stop at this foundation boundary. Complete hosted setup and verify it, then connect Home/Join, Status and staff features through separately approved feature tasks. Apply deferred targeted UI improvements during those tasks. Vercel deployment and push still require explicit approval.
