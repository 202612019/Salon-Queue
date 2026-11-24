# Phase 5 verification — 24 November 2026

> Historical phase report. Current acceptance totals, session-revocation correction and coverage limitations are in [final-verification.md](final-verification.md). Earlier phase counts and scope below are retained as historical evidence.

Phase 5 completes the functional activation of **Waiting Area TV** (`/display`, with `/tv` as an alias redirect) and **Owner Settings** (`/admin`). All seven screens of SalonQ — Smart Salon Queue Management are now fully operational and connected to hosted Supabase with end-to-end realtime synchronization via the sanitized change signal table (`salonq_changes`).

All previous customer-facing features (Home, Join Queue, private My Status), staff authentication, Reception Dashboard, and Barber Workspaces remain 100% operational with verified regression safety.

---

## 1. Implementation Scope & Architecture

### Waiting Area TV (`/display` & `/tv`)
- **Canonical Route & Alias**: Canonical route is `/display`. An alias route `/tv` redirects automatically to `/display` via React Router's `<Navigate to="/display" replace />`.
- **Authoritative Public Snapshot**: Replaced all fictional fixtures with live data from `getPublicSalon()`. The TV displays:
  - SalonQ brand mark and actual salon name ("The Atelier").
  - Current salon date and time in IST (`Asia/Kolkata`) with live clock tick.
  - Accurate realtime connection status indicator (Live / Stale / Offline).
  - Barber station cards with initial avatar, barber name, current token, and status badge (`called`, `in_chair`, `available`, `on_break`, `off_duty`).
  - Coming Up Next section displaying the next five waiting tokens with estimated wait times, or a friendly empty state ("No customers currently waiting").
- **Newly Called Token Experience**:
  - When a barber calls a customer, the TV highlights the token with a champagne gold pulse animation and displays a prominent announcement banner: *"Token {token} — Please proceed to {barber}"*.
  - An announcement banner remains visible for 5 seconds before gently fading out.
  - Synthesized Web Audio API chime (two-tone harmonic arpeggio at 587.33 Hz and 880 Hz) plays when enabled.
  - Dedicated **Enable Sound** control handles browser autoplay restrictions gracefully; visual notifications remain complete when audio is muted or denied.
  - Call notifications and chimes are deduplicated across reconnects and reloads to avoid historical replays.
  - Full support for `prefers-reduced-motion`.
- **Public Display Privacy**:
  - Strictly zero customer names, phone numbers, tracking capabilities, or private database IDs are exposed in the DOM or network responses.
  - TV subscribes only to sanitized signal events from `salonq_changes`, triggering public projection snapshot refetches without accessing private queue tables.

### Owner Settings (`/admin`)
- **Role-Based Protection**: Authoritative route protection enforces `role: 'owner'`. Anonymous users are redirected to `/login`; receptionists and barbers receive an Access Denied screen.
- **Daily Operational Statistics**:
  - Computed strictly for the current day in `Asia/Kolkata` time:
    1. Customers served today (`statistics.served`).
    2. Average wait time from join to call (`statistics.average_wait_minutes`).
    3. No-shows recorded today (`statistics.no_shows`).
  - Clear dash representation when no customers have completed today.
- **Online Queue Operational Switch**:
  - Toggle online customer admission with a confirmation modal before closing to prevent accidental interruptions.
  - Displays dynamic admission status dot and shows cutoffs (online cutoff 30 minutes before closing; walk-ins until closing).
- **Daily Opening & Closing Hours**:
  - Editable opening and closing times with confirmation dialog on save.
  - Emits version-checked `save_settings` command via `salonq_staff_command`.
- **Service Catalog Management**:
  - Lists all catalog services with bilingual English and Gujarati names, duration in minutes, and price in INR (stored as integer paise).
  - Enable/disable switch for each service without deleting past transaction records.
  - Accessible modal dialogs for **Add Service** and **Edit Service** with validation (positive duration between 5–240 minutes, valid rupee price, non-empty names).
- **Barber Duty Management**:
  - View all barbers with avatar initials, name, and current duty/break status badge.
  - Toggles On Duty / Off Duty and Take Break / Return from Break.
  - Client and backend enforce restrictions: barbers with active assignments (`BARBER_BUSY`) or specifically awaited customers (`BARBER_HAS_WAITING`) cannot be taken off duty.

---

## 2. Verification of Phase 4 Backend Migration

Prior to Phase 5 implementation, migration `20261124000400_staff_retry_authorization.sql` was verified on hosted Supabase:
- Migration applied cleanly to hosted database.
- Private transaction logic moved into private schema with client execute revoked.
- Narrow authorization facade placed at public RPC `salonq_staff_command`.
- All 15 security assertions passed with zero bypass vulnerabilities.

---

## 3. Actual Test Evidence

| Verification Suite | Result | Scope / Notes |
|---|---|---|
| `npm test` | **PASS (108/108)** | 8 test files, 108 tests passed cleanly. Includes backend boundaries, customer access, customer integration, staff auth, staff integration, display tests, foundation tests, and synchronization. |
| `npm run lint` | **PASS** | ESLint passed with 0 errors and 0 warnings across all files. |
| `npm run build` | **PASS** | TypeScript type-check (`tsc -b`) and Vite production bundle generated cleanly. |
| `npm run test:sql` | **PASS (67/67)** | 67 offline real-PostgreSQL assertions passed, covering RLS, pricing, duration, retry receipts, transitions, IST statistics, catalog edit versions, and settings save versions. |
| `npm run check:edge` | **PASS** | Deno type-check of `supabase/functions/salonq-api/index.ts` passed cleanly. |
| `npm run env:check` | **PASS** | All public environment variables verified; no privileged secrets in client bundles; `.env.local` untracked. |
| `npm run backend:probe` | **PASS** | Hosted Supabase auth reachable, public signup disabled, signal table reachable, migrations accessible. |
| Hosted Phase 5 Test (`phase5-hosted.test.tsx`) | **PASS (10/10)** | 10 checkpoints verified against live Supabase: public TV render, zero PII, audio controls, `/tv` redirect, anonymous `/admin` redirect, receptionist `/admin` forbidden, owner login and dashboard, owner snapshot statistics, owner barber break toggle, and clean sign-out. |
| Hosted Phase 4 Regression (`phase4-hosted.test.tsx`) | **PASS (17/17)** | All 17 checkpoints verified against live Supabase: staff login, reception dashboard, walk-in admission, call next, barber start/done, timers, break controls, and role isolation. |

---

## 4. Documented Acceptance Scenarios

In accordance with project continuity rules, the 9 previously verified scenarios are preserved and 5 additional scenarios verified during Phase 5 are marked passed:

- **T01** [x] PASS — Join with name, valid phone, one service (Phase 3)
- **T04** [x] PASS — Select two services: combined price and duration (Phase 3)
- **T06** [x] PASS — Duplicate phone active rejection (Phase 3)
- **T09** [x] PASS — Add walk-in placed at tail of same queue (Phase 4)
- **T10** [x] PASS — Call Next selects earliest eligible customer respecting preferences (Phase 4)
- **T14** [x] PASS — Waiting → Called → In Chair → Done lifecycle persists (Phase 4)
- **T16** [x] PASS — Customer Waiting cancellation releases spot (Phase 3)
- **T17** [x] PASS — Cancellation blocked after Called (Phase 3)
- **T18** [x] PASS — No-show rejected before 10 minutes (Phase 4)
- **T36** [x] **PASS — Zero customer PII, phone numbers, or private locators on TV display or public network responses (Phase 5)**
- **T40** [x] **PASS — Owner daily statistics computed strictly for today in Asia/Kolkata with correct counts and mean wait (Phase 5)**
- **T84** [x] **PASS — TV display visual complete, audio toggle and duplicate call deduplication verified (Phase 5)**
- **T87** [x] **PASS — Version-checked owner settings save and stale version rejection verified (Phase 5)**
- **T88** [x] **PASS — Server-offset duration strictly highlights after 60 minutes verified (Phase 5)**

*Remaining 77 scenarios remain unchecked (NOT RUN as full end-to-end integration scenarios).*

---

## 5. Exact Local Testing URLs

Run `npm run dev` from `Salon-Queue/salon-queue-management/`:

- **Home**: `http://localhost:5173/`
- **Join Queue**: `http://localhost:5173/join`
- **Customer Status Resume**: `http://localhost:5173/status/resume`
- **Waiting Area TV (Canonical)**: `http://localhost:5173/display`
- **Waiting Area TV (Alias Redirect)**: `http://localhost:5173/tv`
- **Staff Sign In**: `http://localhost:5173/login`
- **Reception Dashboard**: `http://localhost:5173/reception`
- **Barber Workspace (Ravi)**: `http://localhost:5173/barber/ravi`
- **Barber Workspace (Amit)**: `http://localhost:5173/barber/amit`
- **Barber Workspace (Imran)**: `http://localhost:5173/barber/imran`
- **Owner Settings**: `http://localhost:5173/admin`

---

## 6. Demonstration Accounts Instructions

Five pre-provisioned demo accounts are available on hosted Supabase:
- **Owner**: `owner-demo@salonq.example` (access to `/admin` and `/reception`)
- **Receptionist**: `reception-demo@salonq.example` (access to `/reception`)
- **Barber Ravi**: `ravi-demo@salonq.example` (access to `/barber/ravi`)
- **Barber Amit**: `amit-demo@salonq.example` (access to `/barber/amit`)
- **Barber Imran**: `imran-demo@salonq.example` (access to `/barber/imran`)

*Note: Passwords are protected in the local DPAPI credential vault (`.artifacts/demo-accounts.dpapi.json`) and are never committed or exposed.*

---

## 7. Manual QA Testing Instructions

### A. Waiting Area TV Verification
1. Open `http://localhost:5173/display` in a browser window.
2. Verify salon name "The Atelier", IST clock, barber cards with avatars and tokens, and Up Next tokens.
3. Open `http://localhost:5173/tv` in another tab and verify it automatically redirects to `/display`.
4. Click the **Enable sound** button in the footer and confirm it toggles to "Sound on".
5. In another window, log in as receptionist or barber and call a customer.
6. Observe the TV display:
   - Newly called token highlights with a champagne gold pulse animation.
   - Announcement banner appears: *"Token {token} — Please proceed to {barber}"*.
   - Two-tone melodic chime plays.
   - Banner automatically dismisses after 5 seconds.
7. Open DevTools Network tab and verify that the `salonq-api` snapshot payload contains no customer names, phones, or locators.

### B. Owner Settings Verification
1. Navigate to `http://localhost:5173/admin` without signing in. Confirm redirect to `/login`.
2. Sign in as `reception-demo@salonq.example` and navigate to `/admin`. Confirm "Access denied" page appears.
3. Sign out and sign in as `owner-demo@salonq.example`. Confirm redirect to `/admin`.
4. Verify the three daily metric cards: Customers served, Average wait, No-shows.
5. In **Online queue**, toggle the switch off. Confirm a confirmation dialog opens with *"Close online queue?"*. Confirm action and observe status changes to "Salon closed".
6. In **Opening hours**, adjust opening time and click **Save hours**. Confirm confirmation dialog appears before saving.
7. In **Your service collection**, click **Add service**. Fill in English name, Gujarati name, duration (30 min), price (₹250), and save. Verify the new service appears in the catalog list.
8. In **Team on duty**, toggle a barber's duty or click **Take a break** / **Return from break** and observe real-time status update.

