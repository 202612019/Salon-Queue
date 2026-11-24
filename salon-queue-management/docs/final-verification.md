# SalonQ — Final production verification

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
