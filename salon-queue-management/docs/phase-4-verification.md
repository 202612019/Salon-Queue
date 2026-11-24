# Phase 4 verification — 24 November 2026

Phase 4 connects Staff Login, Reception and the linked Barber workspace. Customer screens remain functional. Owner redirects to protected `/admin` with an explicit Phase 5 pending notice and disabled fictional settings; Waiting Area TV remains the existing public fictional preview. No full Owner/TV implementation, new staff accounts, frontend deployment or Git push is included.

The actual pasted instruction ends with “Include” in its Walk-in section. The four canonical planning files supply the approved fields, queue rules, security and retry contract; no additional requirements were invented from missing text.

## Implementation

- Login uses actual Supabase email/password Auth, validates input, toggles password visibility, shows translated generic errors, restores sessions through server verification, and signs out through Auth. There is no role selector, public signup or demo-login bypass. Roles come from `salonq_staff_profile`; a barber's route slug is cross-checked against the protected own-barber snapshot, not metadata or a URL.
- Protected routes permit Owner/Receptionist to Reception, Owner to Admin, and only the linked Barber to their exact workspace. Role navigation hides unrelated staff links. Session changes immediately clear protected context, generation-keyed route content and snapshot loaders; delayed loads cannot restore an old profile. Cross-tab support uses the existing Supabase Auth events, not a local role field. Actual two-browser/tab delivery and refresh-token revocation remain separate manual checks.
- Reception uses authorized snapshots for Waiting/active/available counts, live barber cards, assignments, customer names/tokens/service snapshots, persisted elapsed/remaining times and ordered Waiting rows. A public projection supplies current operating/online status and catalog. Lightweight token/name search and barber-preference filtering are included. Long-wait highlighting is strictly above 60 minutes; overrun is uncertain rather than a fictitious remaining duration.
- Call Next uses the existing serialized eligible-FCFS operation, with current duty/break/capacity checked by PostgreSQL. Waiting cancellation and ten-minute Called No-show have accessible confirmations. Actions pause without verified freshness, including an open confirmation dialog. Every success is followed by a refetch; no assignment/lifecycle success is synthesized in React.
- A separate Walk-in dialog supports name, normalized Indian phone, one to three current services, Any/on-duty barber, bilingual names, exact totals and reconfirmation for changed catalog data. It uses actual staff-authenticated `source=walk_in` admission, preserving the shared queue/hours/duplicate constraints. Its opaque actor-bound pending identity is separate from customer resume and stores no name/phone/selection. The resulting token/private link can be handed only to that customer; it never overwrites the operator's customer pass.
- Staff mutations save an actor-bound opaque request key/target/version descriptor in session storage before sending. Uncertain results block new commands and offer only an explicit retry of the same payload/key. A different signed-in actor cannot reuse the pending UI record. Reauthentication never silently replays an action. Walk-in recovery likewise retains its original identity.
- Barber displays only own current work and the backend's minimal eligible-next preview. Start, confirmed Done and own idle/on-duty break changes use version-bound RPCs. Timers derive from persisted server timestamps with a display offset, so remount does not reset them. Browser clocks cannot authorize a transition; the backend rechecks permissions/timing.
- All new labels/errors support centralized EN/GU. Existing layouts, typography, palette and components are retained, with focus-trapped dialogs and mobile role navigation. No new dependencies or unlicensed assets were added.

## Necessary backend security correction

Final local security review reproduced a retry-receipt flaw: the original transaction function looked up a previously successful actor-bound receipt before checking the action's *current* role/barber linkage. A user whose role/linkage changed could therefore replay an old request to obtain its old result despite losing that action's permission. This was an actual failing isolated SQL test, not a hypothetical warning; no hosted demo role was changed to reproduce it.

Additive migration `20261124000400_staff_retry_authorization.sql` moves the existing transaction implementation into the already-private schema, revokes client execution there, and places a narrow current-role/linkage authorization facade at the existing public RPC name. The serialized transaction body, receipt binding, valid retry semantics, queue rules and existing migrations are preserved. Current Start/Done linkage is checked even for a completed original entry; valid same-role retries still return the original receipt rather than repeat an action. RLS and timing restrictions remain intact. The migration was dry-run and applied once to the matched hosted project after **67 SQL assertions** and **37 integration/race checks** passed. All **15 hosted metadata checks** returned true, including denial of direct client execution of the private implementation. PostgREST schema reload is notified by the migration. No setup reset, account recreation or Edge rewrite was performed.

## Actual test evidence

| Check | Result / scope |
|---|---|
| `npm run test` | PASS — 98 tests across seven files; includes customer regression, staff components, session generation/expiry, linkage rejection, retry identity, timers and translations. Transport/session boundaries are controlled mocks in these tests. |
| `npm run lint` | PASS — zero warnings. |
| `npm run build` | PASS — TypeScript/Vite production build. A non-fatal >500 kB bundle warning remains; no dependency was added in Phase 4. |
| `npm run test:sql` | PASS — 67 actual isolated PostgreSQL assertions, including three role/linkage-change receipt denial cases. The new regression first failed before the facade was added. |
| Disposable `npm run test:db` | PASS — 37 actual local integration checks with all four migrations, including six independent-connection race cases. |
| Hosted staff React/jsdom | PASS — one opt-in integration test, 17 reported checkpoints using actual UI/Auth/Edge/database/realtime and the existing five accounts; no success responses mocked. |
| Hosted customer regression | PASS — the existing actual customer React test passed again with 14 checkpoints, including deliberately lost admission-response recovery. |
| Environment / Edge type check | PASS — environment values not printed; `.env.local` ignored/untracked, examples blank; unchanged Edge entrypoint type-check passes. |
| Rendered browser layouts / screenshots | NOT RUN — earlier browser-tool restrictions respected. No new desktop/mobile/Gujarati visual approval is claimed. |

The hosted staff checks actually executed:

1. Anonymous Reception navigation redirects to Login without private rows.
2. Real Receptionist email/password sign-in restores the protected profile and live dashboard.
3. App unmount/remount restores that staff session only after verification.
4. A real remote named-Ravi admission appears automatically in Reception.
5. The actual Walk-in dialog creates a later token in the same queue with a staff-verified request.
6. Amit Call Next skips the earlier Ravi-only entry and calls the later Any walk-in exactly once.
7. Ravi calls his named entry; premature No-show is disabled and a direct trusted request is rejected by the hosted server.
8. Actual UI sign-out removes Reception private content.
9. Actual Owner login redirects to protected Admin with the Phase 5 pending notice.
10. Actual Ravi login sees only linked work, cannot break while occupied and cannot start Amit's entry.
11. Start persists; remount restores the same In Chair assignment and persisted timer basis.
12. Confirmed Done persists; idle Ravi can take and return from his own break through RPCs, reflected in the public projection.
13. Changing the current Ravi route to `/barber/amit` yields denial without Amit's private work.
14. Actual Amit login starts/completes only the assigned walk-in, with confirmation for Done.
15. Existing Imran login reaches his own empty workspace and translated Gujarati controls.
16. Actual Reception Waiting cancellation dialog persists cancellation and releases the spot.
17. Customer private terminal reads and public payload privacy remain correct after the staff operations.

The first hosted attempt needed a test-only wait for Reception's refetch before querying the new No-show button. Cleanup completed/cancelled only its own fictional records via legitimate restricted operations; no records/tokens were reset or deleted. A source path-case error and a foundation test still expecting public Admin preview were also corrected before final checks. `c9187d1` appeared in the workspace during implementation and is preserved without amendment; final security/verification changes are committed separately.

## Acceptance scope and remaining limits

The earlier five Phase 3 passes remain. Only T09 (walk-in tail), T10 (eligible Amit selection), T14 (persisted lifecycle) and T18 (premature No-show denial) are newly marked passed with hosted React/jsdom evidence. The other 82 scenarios remain unchecked as complete scenarios. Local checks at 599/600 seconds are not a claim that the hosted UI waited ten minutes; no hosted clock or rule was weakened. Actual two-device/TV synchronization, physical browser network interruption, cross-tab sign-out delivery, full token revocation and rendered accessibility/viewport matrices remain NOT RUN. Automatic mounted data updates were observed, but no new five-second browser SLA is claimed.

Staff/customer idempotency data are opaque and actor-scoped; private snapshots are held in memory and discarded on auth changes. Browser Auth session persistence is managed by Supabase. Backend credentials and demo passwords never enter frontend code; the existing Windows-encrypted vault stays ignored. A shared browser/session remains a trusted device: do not publish private links or use real customer data in this demonstration. Owner Settings and TV functionality, production retention and deployment remain outside Phase 4.

## Exact local review

From `D:\My Folder\Salon Queue\Salon-Queue\salon-queue-management`:

```powershell
npm run dev -- --port 5174
./scripts/Copy-DemoPassword.ps1 -Email reception-demo@salonq.example
```

Open `http://127.0.0.1:5174/login`, enter that email and paste the locally copied password within 30 seconds. Leave the copy-helper terminal open for clipboard cleanup. Other existing emails are `owner-demo@salonq.example`, `ravi-demo@salonq.example`, `amit-demo@salonq.example`, `imran-demo@salonq.example`; use the same helper with the selected email. Never paste passwords or private customer links into chat or Git.

Use fictional customers during actual salon hours. Check walk-in validation/totals and tail order, preference-aware calls, busy/break disabled actions, early No-show denial, Waiting cancellation and service Start/Done. Sign in as the linked barber in another browser to observe state updates; changing a barber slug must deny access. Refresh a Called/In Chair workspace and confirm its timer basis persists. Sign out in one staff tab and verify protected content disappears in another tab. Disconnect actual network and verify stale state/action disabling before reconnect/refetch. Review EN/GU, keyboard focus, modal Escape/focus return and 390×844 / 768×1024 / 1440×900 layouts manually; no agent screenshot verification is claimed.

Run `npm run test`, `npm run lint`, `npm run build`, `npm run env:check` and `npm run backend:probe` for normal repeatable checks. SQL/local network runners need the disposable prerequisites in `supabase/README.md`; never run test Auth/clock fixtures on hosted Supabase. No activation-related manual task remains. Stop at Phase 4 before implementing full Owner Settings or TV.
