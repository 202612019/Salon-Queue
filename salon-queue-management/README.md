# SalonQ — Smart Salon Queue Management

**Phase 1: frontend foundation.** Your Time. Your Turn.

This application contains seven visually representative, read-only route previews, shared customer/staff layouts, a Lucide scissors wordmark, centralized charcoal/champagne-gold tokens, local typography, English/Gujarati dictionaries, a staff sign-in shell, Not Found handling and an application error boundary. Preview values are fictional. Staff preview pages are publicly viewable design fixtures, not authenticated staff sessions; no credentials are accepted and no queue or settings mutations occur. No Supabase project, schema, migrations, live authentication or realtime integration has been implemented.

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

`.env.example` documents public future Supabase configuration only. The frontend does not require credentials to run, and setting these variables does not activate backend operations. Never put a secret/service-role key in `VITE_` variables. Local environment files, dependencies and generated output are ignored by Git.

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
  domain/              typed preview models
  services/            fictional fixtures only
  lib/                 formatting, environment contract, class helpers
  i18n/                typed EN/GU dictionaries and language preference
  styles/              centralized Tailwind/CSS tokens and responsive presentation
  test/                setup and frontend foundation tests
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

## Next phase

Ready for a separately approved Phase 2 Supabase foundation task: schema/constraints/RLS, trusted staff provisioning, controlled transactions/RPCs, minimal Edge Functions, private capabilities/idempotency and safe realtime invalidations. Preserve the approved visual foundation and implement the deferred targeted UI improvements only in the relevant feature phases. Do not enable client-only authentication or simulated successful queue operations. Deployment and push require explicit approval.
