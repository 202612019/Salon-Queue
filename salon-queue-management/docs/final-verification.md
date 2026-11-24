# SalonQ — Final acceptance testing and visual audit

**Latest review: 24 November 2026, IST.** Production: [SalonQ](https://salon-queue-snowy.vercel.app/). Repository: [202612019/Salon-Queue](https://github.com/202612019/Salon-Queue). Profile: [202612019](https://github.com/202612019).

## Latest acceptance result

**81 PASS / 0 FAIL / 10 NOT RUN**, individually mapped in [acceptance-evidence.md](acceptance-evidence.md). “0 FAIL” is the final status after correcting and retesting the reproduced session-revocation defect; the initial failure is documented below. A PASS includes its verification environment and may combine isolated PostgreSQL and React/jsdom evidence. It is not a claim that every case ran in a rendered production browser.

The exact remaining cases are **T31, T32, T33, T38, T39, T52, T72, T81, T83 and T91**. Their reasons/procedures are listed below and in the ledger. T72 was changed from the old PASS to NOT RUN: testing immutable snapshots in SQL alone did not establish its complete “refresh all views” wording. The other original scenario text and expected outcomes are preserved; the new coverage is evidence-based, not sequentially filling checkboxes.

## Fresh executed checks

| Check | Actual result | Environment / scope |
|---|---|---|
| Frontend suite | **PASS — 140 tests, 9 files** | Final command: npm test -- --maxWorkers=2 --testTimeout=15000 --reporter=dot; 80.64 seconds. Controlled React/jsdom/SDK and Edge-handler boundaries |
| Expanded SQL suite | **PASS — 167 assertions** | npm run test:sql -- --acceptance; disposable real PostgreSQL, test-only Auth/clock; includes 74 baseline + 93 added assertions, not 167 acceptance scenarios |
| Independent database/concurrency suite | **PASS — 45 checks** | Original 37 plus eight lock-coordinated admission/configuration races on separate connections; disposable cluster only |
| Lint | **PASS** | Zero errors/warnings after final test changes |
| Production build | **PASS** | TypeScript/Vite; main JS 144.81 kB / 36.99 kB gzip, CSS 59.09 kB / 11.61 kB gzip in the final committed-tree rebuild; no chunk-size warning |
| Edge type check | **PASS** | Deno checked the current salonq-api handler |
| Environment | **PASS — 7 flags** | Local URL/key valid; no privileged frontend vars; local environment ignored/untracked; examples placeholders |
| Hosted security metadata | **PASS — 17 safeguards** | After additive session migration; RLS, grants, private transaction implementation, sanitized publication and session guard retained |
| Hosted actual refresh/revocation proof | **PASS** | Fresh demo session only; forced client-side expiry caused a real Auth refresh request; valid protected read succeeded; logout then denied saved signed JWT to profile/snapshot and Edge walk-in |
| Production HTTP/CORS | **PASS — 16 checks** | Home, nine direct nested/unknown routes, deployed public environment/Owner/TV markers, exact CORS/preflight, safe public snapshot; 21:53 IST after backend correction/publication |
| Fresh hosted React rerun | **PASS — 22 checkpoints** | Real Auth/Edge/RPC/Realtime with all five staff identities; EN/GU, role denial, logout/revoked JWT rejection and opening/closing Add Walk-in form; zero customer/configuration writes; final run 48.72 seconds |
| Earlier hosted lifecycle/navigation evidence | **REVIEWED, not freshly rerun** | 19 production-backed React checkpoints, five-client admission/status timings, 17 Phase 4 / 10 Phase 5 checkpoints retain their explicitly earlier scope |
| Rendered visual QA | **PARTIAL** | Actual native Chrome captures of Home, 390×844 Join, and partial Reception; complete matrix remains NOT RUN. See visual-audit.md |

The first enlarged frontend run encountered a 5-second test timeout on this machine. New catalog tests also exposed an ambiguous duplicate-text assertion and queued one-off mock responses leaking after that assertion failed. The assertion now queries all matching messages, each test resets mock queues, and the final 140-test run passed with two workers and a 15-second per-test budget. These were test-harness failures, not silently relabelled product successes. No application dependency or architecture was changed.

## Actual defect corrected: revoked staff JWT still read protected data

The initial hosted probe created a fresh Reception demo session, fetched no customer body into logs, signed out **only that session**, and tried its saved access token against the protected snapshot RPC. It returned **HTTP 200 and a protected snapshot** despite logout. This violated the project's current-session/revocation requirement. No customer record or other user's session was modified.

Supabase documents that signed access tokens remain valid until JWT expiry after logout and recommends checking the signed session_id against auth.sessions for immediate revocation-sensitive operations: [Auth sessions](https://supabase.com/docs/guides/auth/sessions), [sign-out behavior](https://supabase.com/docs/guides/auth/signout). This documentation explained the reproduced result; it was not used as a substitute for testing.

Additive migration **20261124000500_staff_session_revocation.sql**, tracked in fix commit **264d21d**, now checks that the verified JWT's session belongs to the current actor and remains present/not expired before profile or staff RPC access, including receipt retries. The existing role/linkage facade and transaction body are unchanged. A service-only boolean session checker supports the existing Edge walk-in flow after Auth verifies the JWT; the public body cannot select an actor/session. The helper is not executable by anon/authenticated roles. RLS/grants/hours/private tracking remain intact.

The migration passed local tests before application to the existing hosted project. The existing Edge Function was redeployed with the stricter session check; CORS allowlist and credentials were preserved. After correction:

- A real refresh-token endpoint request from the SDK succeeded and protected snapshot read was permitted.
- The newly signed-out JWT was denied by snapshot/profile RPCs (**AUTH_REQUIRED**, HTTP 400 from the existing RPC error convention).
- The signed-out JWT was denied by the Edge walk-in boundary (**AUTH_REQUIRED**, HTTP 401), before any admission.
- Local tests additionally deny cross-user session IDs, missing/revoked/expired sessions and unauthorized access to the service-only helper; valid restored test session still works.
- React tests verify failed refresh/session-loss clears protected caches and returns to sign-in; real two-rendered-tab propagation remains T52 NOT RUN.

An initial hosted metadata check also stopped on an obsolete “exactly three enabled services” assertion because the live catalog had legitimately changed to four. No service was re-enabled/deleted. The read-only audit now validates the authoritative catalog bounds instead of a mutable seed count, and all 17 safeguards passed. This was an audit assumption defect, not a catalog failure.

## Reported Add Walk-in issue

At 21:22 IST production returned **SALON_CLOSED**, online=false and walk_in=false, under the configured 10:00–21:00 salon hours. Reception intentionally disables Add Walk-in from that server flag and shows the hours/reason. This is expected behavior after closing, not a broken click handler. Local regression checks now establish both conditions: disabled with explanation after closing, and enabled/openable during the online cutoff while walk-ins are still allowed. No operating hours or customer records were changed to force success. Later, the production configuration reported OPEN/online=true/walk_in=true. The agent did not change those settings. The final hosted React test then verified Add Walk-in is enabled and actually opens/closes its dialog, without submitting a customer. The closing diagnosis is a timestamped observation, not an assumption that live hours never change. The student should demonstrate actual admission during permitted hours; there is no authorized exception to the closing rule.

## Original college requirements comparison

Read the original **Salon Queue Management Vibe Coding Guide**, pages 1–9, and compared the four canonical planning files, all three phase verification reports and current test sources. The seven-screen/four-role MVP, bilingual services, live private tracking, preference-aware shared queue, walk-ins, Call Next, no-show, Barber Start/Done/break, public TV and Owner catalog/duty/settings/statistics are implemented. No missing core college workflow was identified by this review. Approved decisions intentionally use Supabase Auth instead of a public test PIN, private capability tracking instead of phone-only recovery, initials avatars rather than unlicensed photos, and approximate wait visualization rather than a guaranteed countdown. No OTP/SMS is required or implemented.

Two **noncritical presentation gaps** remain against the expanded canonical screen descriptions: TV does not explicitly show a closed-hours/online-pause note alongside its valid existing queue, and Owner shows the manual online switch/cutoff times rather than a separate authoritative effective-admission reason. Home/Join/Reception correctly expose server eligibility, and backend restrictions are enforced. These are disclosed rather than redesigned during this critical-defect-only final task.

Submission evidence gaps: a three-minute **demo script is not the required recorded video**; no tracked video artifact was found or independently verified. The student must record/submit it, privately supply evaluator passwords and personalize/approve the reflection draft. The original README-only first commit history exception is already disclosed; history was not rewritten to conceal it.

## Rendered audit and exact remaining manual work

See [visual-audit.md](visual-audit.md) for the observed regions, viewport matrix and precise Chrome procedure. Native screenshot control became available, but the browser provider remained unavailable. The user interacted with the native window during inspection; control was left with the user. No screenshots were saved as standalone files. No complete Gujarati/layout/keyboard/contrast/console approval is claimed from partial captures or the user's general “checked” report.

| Scenario | Why final result remains NOT RUN | Completion procedure |
|---|---|---|
| T31 | No simultaneous measured Reception + TV + customer Start/Done rendered latency | Use your own new fictional entry during real hours; show all screens together and record each transition/time |
| T32 | Five independent clients are not two physical devices | Open deployed app on phone plus another device, operate only your own fixture and observe persistence without refresh |
| T33 | Event simulation did not sever real network transport | DevTools Offline → verify stale/disabled state → restore network → confirm fresh state before actions |
| T38 | DOM translations do not prove every rendered label/state is unclipped | Inspect all screens and dialogs in Gujarati at the requested sizes |
| T39 | Full eight-route/four-viewport matrix incomplete | Follow visual-audit.md and record each viewport individually |
| T52 | Backend revocation now passes, but two rendered shared-session tabs were not tested | Sign in one demo session in two tabs; sign out one; verify both remove protected content and old requests reject |
| T72 | SQL immutable snapshots pass; refresh of all views/new joins together not tested | In an isolated/staging fixture, edit/disable booked service, refresh all required views, compare historical snapshots and new catalog; restore via legitimate operations |
| T81 | Application transport/storage tests do not inspect all hosting/API logs/referrers | Authorized operator inspects redacted Vercel/Supabase logs, browser referrers/storage/network; never publish private bodies/headers |
| T83 | 320px Gujarati keyboard/focus/target/contrast audit incomplete | Keyboard-only forms/dialogs, 200% zoom, measured 44px targets and contrast at 320px Gujarati |
| T91 | Counters/429 branches pass separately; full public limit-exhaustion sequences were not executed | Use isolated staging gateway backed by real counters; exceed join/status budgets and verify generic 429 with no extra writes/data; do not flood production |

## Git, publication and current deployment status

The production Supabase session migration and existing Edge deployment completed successfully. Fix commit **264d21d** and main audit commit **c2fe950** were pushed to origin/main. A fresh post-publication HTTP/CORS smoke test passed, as did 17 hosted security checks, all five approved CORS origins, signup-disabled and email-provider checks. At 21:55 IST, all **six served JavaScript/CSS assets were byte-for-byte SHA-256 identical** to a fresh build of the published c2fe950 tree. The first comparison used the earlier pre-documentation local bundle and did not match; rebuilding the actual committed tree resolved that comparison. No application redesign or new dependency was introduced. The final documentation-only follow-up records these observed results; its exact commit/hash and remote synchronization are reported in the final response.

Automatic approval review initially failed before the new full hosted React run because the account usage limit was reached. The tool stated this was a review failure, not an unsafe-action determination, and prohibited bypassing it. No alternative tool/credential/transport was used to perform the denied action. Local work continued. Review later worked for the authorized push; the original hosted workflow was then approved and executed normally. The final result is **22 hosted checkpoints PASS**, including the targeted Add Walk-in check. This temporary blocker is resolved; it is not a remaining task.

The user's pre-existing whitespace-only repository-root vercel.json change remains untouched and excluded. Local environments, DPAPI vault, test artifacts, dependencies and dist output remain ignored/untracked. No staff passwords, privileged credentials or customer tracking capabilities are included in the report or commit. All test clock/Auth/concurrency/destructive operations ran only in marker-checked disposable local databases. This final task created **no production customers** and altered no pre-existing customer; test Auth sign-out affected only newly created probe sessions.

**Readiness:** the operational college demo has broad functional evidence and a corrected revocation boundary; it is not 100% verified. Complete the listed rendered/device/logging checks and student submission materials before claiming every requirement passed.

---

## Earlier production integration review — historical evidence only

The following report is retained as the 19:47 IST baseline. Its 34/57 totals and 122/67/37 counts describe that earlier review and are superseded by the latest results above. Its previous publication proof applies to the prior fix commit only.


Verified on **24 November 2026 (IST)**. Production: [SalonQ](https://salon-queue-snowy.vercel.app/). Repository: [202612019/Salon-Queue](https://github.com/202612019/Salon-Queue). Profile: [202612019](https://github.com/202612019).

This report supersedes unsupported visual/completion claims in the earlier Phase 6 report. Functional implementation is present for all seven screens. A successful HTTP route response proves SPA delivery; it does not prove a rendered screen or a staff authorization decision. React/jsdom checks below exercise the real components and hosted services separately from the deployed asset checks.

## Executed checks

| Check | Result | Evidence and limits |
|---|---|---|
| Frontend automated suite | PASS — 122 tests, 9 files | Existing 108 plus owner-boundary and TV failure/polling regression tests |
| ESLint | PASS | Zero errors/warnings |
| TypeScript + Vite production build | PASS | Main JS 144.81 kB / 36.99 kB gzip; no chunk-size warning |
| Deno Edge type check | PASS | Existing salonq-api |
| Environment audit | PASS — 7 checks | Credentials not printed; .env.local ignored/untracked; examples placeholders only |
| Offline PostgreSQL | PASS — 67 assertions | Real isolated PostgreSQL, including capability/auth/clock/idempotency rules |
| Multi-connection PostgreSQL | PASS — 37 checks | Includes duplicate admission and assignment/transition races; isolated test identities |
| Hosted backend probe | PASS | Auth reachable, public signup disabled, signal reachable |
| Hosted security metadata | PASS — 15 safeguards | Existing migrations/RLS/restrictive grants/private implementation/publication checks |
| Production HTTP and boundary inspection | PASS — 16 checks | Home, nine direct nested/unknown routes, deployed public environment, Owner/TV markers, CORS, public catalog and privacy |
| Hosted React functional navigation | PASS — 19 checkpoints | Canonical React in jsdom, actual Edge/Auth/RPC/WebSocket requests; no fabricated successful responses |
| Five-customer queue audit | PASS | Five concurrent joins and five independent Supabase realtime clients; detailed observations below |
| Rendered viewports / screenshots | NOT RUN | Browser inventory reported local browser access unavailable; native Chrome input failed with “coordinate input geometry is unavailable” |
| Physical cross-device / keyboard / contrast / Gujarati clipping / audible chime | NOT RUN | Neither jsdom nor HTTP checks establishes these results |

Initial reruns exposed obsolete TV-preview assertions and an overly broad test error selector; these were corrected to assert verified-data boundaries and accessible field errors. An initial hosted navigation harness attempted Sign out on Access Denied, which has no header; it now returns through My workspace first. The final suites pass. No failed run is counted as a pass.

## Production integration

- Deployed bundle contains the canonical public Supabase URL/publishable key (compared in memory, values omitted). No privileged frontend credentials are needed.
- Production CORS preflight returns 204 and exactly the requesting approved origin. Unapproved origin returns 403 without an allow-origin header. All four approved local origins also pass: 127.0.0.1 and localhost on 5173/5174. No wildcard was introduced.
- Supabase Auth declared production Site URL and redirects match the intended configuration: zero updates required by configuration diff; eight undeclared remote settings preserved. Public signup remains disabled and email/password provider enabled.
- Public snapshot returns three services, three barbers and server-derived admission/queue data. No customer name, phone, locator, capability or private entry ID occurs in that projection.
- Five independent subscriptions received postgres_changes readiness. Realtime and foreground refetch operate against the sanitized signal; raw private tables remain unpublished.
- Existing hosted configuration already worked during this review. No new Supabase project, backend redeploy, schema modification, clock override or RLS relaxation was necessary.

## Five concurrent customers and status synchronization

Used only fictional customer records, with fresh cryptographic request keys/capabilities held in memory. Production-origin Edge requests admitted tokens **S-35–S-39**, five unique tokens. Initial preferred-barber positions were **1, 2, 3, 4, 5**. Response arrival order differed from serialized queue order, which was correctly obtained from authoritative status snapshots.

| Mutation | Observed automatic private status reconciliation |
|---|---|
| Cancel position two | Cancelled status and all later positions updated in 3,216 ms |
| Reception Call Next | Own first customer became Called in 1,872 ms |
| Assigned Barber Start | In Chair in 1,584 ms |
| Assigned Barber Done | Done in 1,892 ms |

These are measured request-start-to-observation timings in this test, using live WebSockets plus the documented four-second foreground refetch fallback. They do not isolate WebSocket latency or guarantee every physical device/network will meet five seconds. All four observed changes were below the target. Owner snapshot subsequently reported 21 served today. Wrong-capability access returned generic 404.

One pre-existing active customer was present. The test chose an otherwise eligible idle barber and checked the first eligible token before calling, so the existing customer was never called, cancelled or modified. All five audit entries were left terminal (one Done, four Cancelled). The separate React Join/Status test also cancelled only its own fictional entry; its failed first harness run cleaned its fixture before rerun. Historical demo results remain in statistics by design; they are not real salon business results.

## Functional route/navigation results

All seven canonical screens and extra routes received HTTP 200 SPA documents on direct requests. Actual component navigation was separately exercised against hosted services:

- Home → Join through the real link; actual form admission → private Status; confirmed Waiting cancellation; private remount preserves terminal state; invalid link shows generic private-access guidance.
- Public /display and /tv alias render authoritative public data. Unknown route renders Not Found.
- Anonymous /reception, /barber/ravi and /admin redirect to Login without protected content.
- Actual receptionist, Ravi, Amit, Imran and Owner logins redirect to their respective verified workspaces. Receptionist → Owner and Ravi → Amit routes are denied. All five sign-outs clear protected content.
- English/Gujarati toggles change the headings and document language on Home, Join, private Status, public TV, Reception, all three Barber workspaces and Owner. This verifies translated DOM behavior, not font shaping or clipping.

## Corrections from this review

Fix commit: **a6a99f2** — fix: correct owner validation and TV synchronization feedback.

- Owner catalog now matches canonical names (2–80 Unicode characters, no controls), prices (₹0–100,000, at most two decimals including zero) and integer durations (1–480 minutes). Extra decimal prices are rejected rather than silently rounded; an open modal cannot submit stale/unverified data.
- Owner live labels replace old “example” copy in both languages; average wait displays one decimal; busy/preference checks use stable barber IDs. Failed hours saves preserve the user's edits.
- TV shows verified connection/stale feedback and no fictional fallback tokens. Clock uses a server offset. The five-second Called banner timeout survives the four-second polling refresh. Reconnect establishes a fresh notification baseline, avoiding historical call chimes.
- Not Found no longer carries a fictional-preview banner. Existing design tokens/layout/branding are preserved. No dependencies added.

## Acceptance checklist and submission limits

The 91 scenario rows are deliberately unchanged: **34 previously evidenced PASS, 57 NOT RUN as complete scenarios**. New partial or differently scoped checks do not automatically certify an entire numbered scenario. Previous 17 Phase 4 / 10 Phase 5 hosted checkpoint claims are historical records, not freshly rerun counts.

The project is suitable for a working college demo subject to the unresolved rendered-device checks. It is not certified for real-customer production use; retention policy, broader device/accessibility/security review and operational monitoring remain future work. No OTP/SMS verification exists or is claimed. The default 21:00 closing blocks remote joins at 20:30 IST; walk-ins end at 21:00. Existing active entries continue after closing.

## Evaluator access and publication

Open /login on the production site. Demonstration identities: owner-demo@salonq.example, reception-demo@salonq.example, ravi-demo@salonq.example, amit-demo@salonq.example and imran-demo@salonq.example. Supply passwords privately to the evaluator. The local Copy-DemoPassword.ps1 helper can copy an existing DPAPI-protected password on the provisioning Windows account; never paste it into Git or this report. No accounts/passwords were recreated.

Both README files retain the verified production URL immediately below the title. Planning requirements, prompts, demo script and reflection are retained. The review scans all tracked content for actual demo passwords/privileged keys and excludes local environments, artifacts, dependencies and generated output. A pre-existing whitespace-only change in repository-root vercel.json is left untouched and excluded from these commits.

Production release verification PASS at 19:47 IST: Vercel served all six expected JavaScript/CSS assets byte-for-byte identical (SHA-256 comparison) to the tested local build containing fix commit a6a99f2. This proves the verified corrections are deployed, rather than only committed locally. The final documentation commit uses the requested message `docs: finalize SalonQ live demo and submission materials`; its exact hash is reported by Git and the final response. No secret configuration was changed for deployment.
