# Phase 3 verification — 24 November 2026

This is an implementation/QA record, not a replacement planning specification. Only Home `/`, Join `/join` and private My Status `/status/:id` are connected. Reception, Barber, Display, Owner and staff Login remain explicitly fictional previews. No frontend deployment or push was performed.

## Delivered behavior

- Home uses the authorized public salon snapshot for name, IST hours, admission reason, actual Waiting count, on-duty/working barber counts, barber states, enabled bilingual services and estimates. Join is disabled without verified fresh state or permitted admission. Existing saved access is checked privately before offering resume. The layered example pass remains explicitly illustrative and opens only `/status/preview`.
- Join preserves the two-column layout and sticky summary. It validates name/mobile, normalizes optional `+91`/spaces/hyphens, selects one to three distinct services, shows count/totals/durations and on-duty/Any preferences, and submits reviewed catalog versions through the existing admission operation. Break warnings are conditional. Backend state/price/hours remain authoritative.
- Rapid clicks share a guarded request. The browser preallocates a cryptographic capability and request key per the approved lost-response contract; the server validates, hashes and binds the capability, controls locator/token generation and returns a bound receipt. Browser storage holds only opaque access/request identity, never name/phone/selection. An uncertain mutation retains its original identity and freezes changed submissions; receipt recovery returns the committed entry. Prices/durations/disabled services require explicit review before a new confirmation.
- Private Status displays the real token, Waiting position type, approximate/unavailable/uncertain estimate, immutable bilingual service snapshots, totals and barber information. All six lifecycle states render. It provides an accessible Called announcement, position-two reminder, gold notification, circular estimate decoration without a countdown, progression, private link copying and confirmed Waiting cancellation. Mutation results come from the backend and are followed by authoritative refetches.
- One shared sanitized-signal subscription serves independently authorized public/private loaders. It reconciles after socket and database-listener readiness, debounces invalidations, aborts/discards older reads, marks failed/offline data stale, reconciles foreground/reconnect events and polls visible screens every four seconds. Live is shown only with listener readiness and a successful read; mutation actions pause while freshness is unverified. Definitively expired private data is cleared and automatic retries stop.
- New user-facing labels/errors are centrally translated into English/Gujarati; existing local fonts, palette and reduced-motion support remain. Home whitespace is reduced, catalog cards added, Join gets three visible steps, and the digital pass is retained. No photographs or new dependencies were added.

## Required additive backend projection

The approved public snapshot had only the Any Barber estimate. It could not supply an authoritative named-barber estimate to Join. Migration `20261124000300_public_barber_estimates.sql` adds `estimate` to each already-public barber using the existing `salon_private.estimate` function. The original two migrations are unchanged and were not replayed. This extension was applied once through the authorized CLI after a dry run and 64 successful local SQL assertions. It changes no grants, private exposure, admission rules or queue mutations. Backend test runners now discover ordered migration files so this extension is included in repeatable verification.

## Actual checks

| Check | Result and scope |
|---|---|
| `npm run test` | PASS — 72 tests across five files; mocked component/transport cases plus actual local helpers and Edge handler. No unit test makes a hosted admission. |
| `npm run lint` | PASS — zero warnings. |
| `npm run build` | PASS — TypeScript and production Vite build. Vite reports a non-fatal >500 kB main-chunk warning after adding the real Supabase SDK; optimization is deferred. |
| `npm run test:sql` | PASS — 64 actual PostgreSQL assertions, including per-barber projection, using fictional isolated Auth/clock fixtures. |
| Disposable local `npm run test:db` | PASS — 37 checks including six independent-connection race cases, with all current migrations. PostgreSQL 18 local evidence, not hosted race testing. |
| Actual hosted React integration | PASS — one opt-in jsdom test with 14 reported checkpoints against deployed PostgreSQL/Auth/Edge/Realtime. No mocked admission or lifecycle success. |
| Final hosted state / environment / Edge | PASS — no pending migrations, all 14 database metadata checks true, public barber estimates present, signup disabled, signal readable, no active Phase 3 fixtures; environment safety and Edge type-check pass. |
| Temporary production-preview HTTP smoke | PASS — eight route shells returned successfully; this does not verify DOM rendering or layout. Preview stopped after the check. |
| Rendered browser/mobile/tablet/desktop/Gujarati layout review | NOT RUN. Previous browser tooling restrictions were respected; no screenshot or pixel/layout/accessibility audit is claimed. |
| Real browser hard reload, clipboard permissions, offline transport severing and cross-device timing | NOT RUN. Headless remount, mocked clipboard, simulated online/offline events and controlled synchronization tests are separate evidence. |

The final hosted React run completed in 27.36 seconds (24.802 seconds test execution including hooks). Checkpoints actually executed:

1. Home loaded actual salon/catalog/availability and reached verified live state.
2. Actual Join submitted two services with normalized `+91` phone, generated a unique token, and navigated to its private pass; double-clicks did not create a second active entry.
3. Another admission with that active phone was rejected generically.
4. Resume storage excluded the fictional name and phone.
5. Unmounting/recreating the actual app restored the same private entry from saved opaque access.
6. Real Reception Call Next assigned the requested Ravi; the mounted customer screen refreshed to Called and showed Ravi. A customer cancel request after Called was rejected by the hosted backend.
7. The real assigned barber's Start updated the mounted screen to In Chair.
8. Done updated it to the terminal completion message.
9. Simulated navigator offline/online events paused/resumed data checking; the underlying network was not severed.
10. Gujarati switching translated status and actual snapshotted service names.
11. The test deliberately consumed and dropped a successful admission response after a real commit. The actual form showed an uncertain outcome, retained opaque identity and recovered the existing entry through the secure receipt operation.
12. Its cancellation dialog sent a real Waiting cancellation; a private read confirmed Cancelled.
13. A wrong capability was rejected by the hosted boundary.
14. Public snapshots excluded names, phones, private locators and capabilities; all successful final-run fixtures were terminal.

Automatic mounted-screen updates were observed using the real sanitized channel plus reconciliation/four-second fallback. The test permitted up to eight seconds for those assertions; it does **not** establish a measured five-second browser/cross-device SLA. Phase 2.5's measured 1.942-second raw signal result remains separate evidence. Local synchronization tests cover listener readiness, shared cleanup, duplicate invalidations, stale/out-of-order reads, expiry, reconnect/foreground and polling.

## Failures found and resolved

- Initial checks found unused imports, a control-character regular expression lint violation and a ref accessed during render. These were corrected; no lint exception was introduced.
- The opt-in hosted test initially used an unsupported reporter and inherited the normal `.artifacts` exclusion. Its ignored test configuration was corrected.
- The first hosted UI attempt asserted the private token before the asynchronous private read completed. The test now waits for the actual token. Its stranded fictional Waiting fixture was cancelled through the authorized Reception operation.
- The next attempt dispatched an offline event while `navigator.onLine` was still true; the headless test now changes navigator state as well. This was a harness problem, not a claim that the network had been disconnected.
- Aborted, timed-out and 5xx cancellation responses now explicitly retain an uncertain outcome. API reads/mutations have a 15-second transport deadline. Timed-out admissions never create a fresh request automatically.

The ignored hosted harness and result artifacts contain no committed credentials/capabilities. Demo account passwords remain in the existing Windows-encrypted local vault. Temporary fictional test history is retained; tokens are never reset and no records are deleted.

## Acceptance accounting

Only T01, T04, T06, T16 and T17 are marked PASS, with the hosted React/jsdom scope explicitly stated in `03-flows-rules.md`. Remaining rows are NOT RUN as complete acceptance scenarios, even where isolated unit/SQL checks cover their rules. For example, remount recovery supports T08, simulated events support parts of T33, and EN/GU component tests support parts of T38, but no actual browser hard reload, network interruption or all-route rendered translation matrix is claimed. No staff screen acceptance is claimed.

## Exact local/manual verification

From `D:\My Folder\Salon Queue\Salon-Queue\salon-queue-management`:

```powershell
npm run env:check
npm run backend:probe
npm run dev -- --port 5174
```

Open `http://127.0.0.1:5174/` during actual permitted IST admission hours (default 10:00–20:30 for online joining). Outside those hours verify the real closed message; do not alter the hosted clock or rules.

1. At 390×844 and 1440×900, inspect Home availability/counts, service prices/durations, barber states and the clearly illustrative example pass. Also check 320px Gujarati wrapping, 768×1024 tablet and the existing 1920×1080 TV preview without claiming TV integration.
2. On Join, enter a fictional name and an unused fictional Indian mobile, optionally `+91` with spaces/hyphens. Submit invalid fields to inspect translated errors. Select one/two/three services, verify totals, and check Any/named barber selection. A break warning should appear only for a relevant break.
3. Confirm once, note the real token privately and refresh the status page. Confirm the same entry returns. Copy its private link, open it in another browser, confirm the fragment disappears and the same authorized entry loads. Keep the link private; never paste it into public docs/chat.
4. Cancel only a Waiting fixture through the confirmation dialog. Refresh and verify terminal Cancelled. Existing demo entries are fictional and retained in history.
5. Before staff UIs are connected, use the existing authorized test/backend operations to Call Next for the selected barber, then Start/Done as that linked barber. Observe the mounted customer status and Home updates on another device. Do not mark No-show early or weaken permissions.
6. Disconnect actual network, inspect stale indicators/disabled actions, reconnect and foreground the tab. Verify server state returns before unsafe actions resume. Check tab focus, keyboard service/radio selection, dialog focus/Escape, contrast and reduced motion. Switch EN/GU on all three customer pages.

No additional user activation step is needed. Future staff integration remains a separate approved phase. Important limitations: this deployment still uses fictional catalog/accounts; no customer identity/OTP verification exists. If an unresolved admission never reached the server and the page was reloaded, only opaque identity remains and the UI conservatively keeps recovery pending; it does not silently create a new request. Reception assistance may be needed for a persistently unresolved outcome. No production retention policy or real customer use is authorized.
