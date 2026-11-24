# SalonQ — Flows & Rules

**Stage:** Phase 5 Waiting Area TV and Owner Settings connected; 14 acceptance scenarios below passed in hosted React/jsdom and isolated PostgreSQL. All seven screens connected. Phase 5's 108 automated tests, 67 SQL assertions, and 10 hosted Phase 5 checkpoints (alongside 17 hosted Phase 4 regression checkpoints) are documented in phase-5-verification.md. Browser layout, hard reload and actual cross-device/network verification remain pending. The college salon guide and approved decisions below remain authoritative.

## 1. Main workflows
**Remote customer:** Home → Join → enter name/phone → select 1–3 services and barber/Any → confirm → receive unique token and private tracking access → watch position and estimated wait → arrival reminder at position 2 → reception calls → assigned barber starts service → barber completes → terminal status.

**Walk-in:** Reception signs in → Add Walk-in → enter same details → submit → join end of same queue. Provide token and private status link directly to that customer if requested.

**Reception and barber:** Reception selects an available barber and calls earliest eligible waiting entry. Barber sees Called entry and starts when customer arrives, then finishes. TV and customer status reflect each transition. A Called customer who has not arrived after ten minutes may be marked No-show. If they return, create a new entry at the tail.

**Owner:** Sign in → change catalog, roster or opening settings → validate and save → public UI and server-side eligibility reflect changes. Existing bookings retain original service details.

### Complete operational journeys

| Journey | Steps and required outcome |
|---|---|
| Remote admission | Home → Join → validate phone/name → choose 1–3 enabled services and Any/on-duty barber → review authoritative totals/warning → submit with bound request identity → one Waiting entry/token → private status. |
| Walk-in admission | Receptionist/Owner signs in → Add Walk-in → same validated selection and retry handling → tail of the same queue. During the online cutoff/manual pause, walk-ins remain allowed only within operating hours. Hand the private link directly to that customer if requested. |
| Track progress | Open private link or local resume → capability-authorized snapshot → labeled position and approximate/uncertain/unavailable wait → arrival reminder at displayed position two → persistent Called instruction with assigned barber. |
| Call next | Receptionist/Owner selects an idle on-duty, off-break barber → trusted transaction selects earliest eligible Waiting entry → reserves that barber and records Called → all affected screens refetch. Empty eligibility is a safe no-op. |
| Start | Assigned Barber confirms customer presence → Called becomes In Chair atomically with server `started_at` → timer uses persisted timestamp. |
| Finish | Assigned Barber confirms Done → In Chair becomes Done with server completion timestamp → barber becomes idle → queue/TV/status/statistics update; no automatic call of another customer. |
| Customer cancellation | Waiting customer opens confirmation → capability-verified conditional transition → Cancelled. If calling won the race, cancellation fails and current Called state is shown. |
| No-show | Receptionist/Owner reviews Called age → at least ten server-measured minutes → confirms → conditional No-show transition releases barber. Never automatic. |
| No-show return | Receptionist/Owner selects Add again or uses walk-in form → reviews current services/prices and admission eligibility → new entry, new token and new admission order at the end; old entry remains terminal. |
| Break and return | Idle on-duty Barber, or Owner, requests break → On Break blocks assignment and updates preference warnings. Returning Available enables assignment again. Busy requests fail. Off Duty remains owner-managed and cannot override pending specific customers. |
| Online opening/closing | Owner changes manual switch → effective online eligibility is recalculated using server hours/cutoff and on-duty roster → Home/Join explain reason. Existing entries and walk-in clock rules do not change. |
| Catalog and duty | Owner validates bilingual catalog or duty change → transactional save/version check → new admission uses new data; historical snapshots persist. Reject taking a barber Off Duty while occupied or specifically awaited. |
| TV synchronization | Public TV loads safe snapshot → listens for sanitized changes → refetches current/next tokens → highlights a newly Called token and optionally chimes once. No staff session or customer PII is required. |

## 2. Status model
| Current | Allowed next | Authorized actor and condition |
|---|---|---|
| Waiting | Called | Reception/owner; eligible available barber; atomic assignment |
| Waiting | Cancelled | Customer with private access or reception/owner |
| Called | In Chair | Assigned barber; customer present |
| Called | No-show | Reception/owner; at least 10 minutes since call |
| In Chair | Done | Assigned barber |
| Done, Cancelled, No-show | None | Terminal; a returning customer creates a new entry |

Statuses never move backwards. Use persisted server timestamps for join, call, start and completion. Active statuses are Waiting, Called and In Chair. A barber is occupied by a Called or In Chair entry; the chair is released only on Done or No-show. No-show is a manual staff decision, not an automatic timeout.

Persist cancellation, No-show and terminal timestamps as applicable, plus a version for conditional updates. Waiting has no assigned barber; Called/In Chair must have one. Done/No-show retain historical assignment but do not occupy the barber. Terminal states have no outgoing transitions. Repeated delivery of a previously successful operation returns the original outcome rather than making a backward or second transition. An action with the wrong expected current state is rejected and the client reconciles.

## 3. Queue rules
| ID | Mandatory rule |
|---|---|
| R01 | FCFS applies among eligible Waiting customers. Use a monotonically increasing admission sequence allocated at the serialized admission point as the stable order; preserve server creation time for duration/audit. Client clocks and request-start time never determine priority. |
| R02 | Call Next for barber X selects the earliest Waiting entry whose preference is X or Any. No eligible entry means a no-op with clear feedback. |
| R03 | Never assign an explicitly preferred customer to another barber. There is no silent preference reset or automatic transfer. |
| R04 | A barber can have at most one active assignment: either Called or In Chair. Called reserves capacity before service starts. |
| R05 | A normalized phone can have at most one active entry (Waiting, Called, In Chair) across all dates and both admission sources. Phone knowledge never authorizes private access. |
| R06 | Walk-ins and remote registrations share the same ordered queue and authoritative admission logic; source is metadata, not priority. |
| R07 | Generate atomic, unique, readable, continuously increasing tokens such as S-14 without daily resets. Sequence gaps after rolled-back attempts are acceptable; numbers are not secrets and gaps do not create missing customers. |
| R08 | Require one to three distinct enabled services. Reject zero, four, duplicates, nonexistent IDs and disabled IDs at the trusted boundary. |
| R09 | Derive prices and durations from current authoritative catalog data, store integer paise, and preserve admission-time bilingual names/prices/durations. Reject stale price/duration changes and require explicit reconfirmation. |
| R10 | Payload-bound idempotency prevents repeated admission. Same request returns its original result; a reused key with different content fails. A timeout is an uncertain result, not permission to create another entry. |
| R11 | Customer capability holders and Receptionist/Owner may cancel only Waiting entries, with confirmation. Cancel after Called is invalid. |
| R12 | Only Receptionist/Owner may mark Called as No-show, at or after ten minutes from server `called_at`, and only while it remains Called. |
| R13 | A returning No-show customer receives a newly validated entry/token/admission order at the tail; the old entry is immutable. New admission must still be permitted. |
| R14 | Assignment requires on-duty, off-break and unoccupied. Break changes are blocked while Called/In Chair; Off Duty is also blocked while any specific Waiting customer remains. |
| R15 | Show a named barber's break/unavailability clearly, with unavailable wait. On-duty barbers on break may be selected with a warning; joining may continue when all on-duty barbers are on break. No on-duty barber blocks either admission source. |
| R16 | Effective online admission requires opening <= server-local time < closing minus 30 minutes, manual online switch enabled, enabled services, an on-duty barber, and a valid selected preference. |
| R17 | Walk-ins ignore the online switch and online cutoff, but require opening <= server-local time < closing plus the same catalog/duty validations. Neither source admits outside operating hours. |
| R18 | Disabled services cannot be newly booked; existing service snapshots survive disabling, editing and date changes. |
| R19 | Under normal connectivity committed changes reach authorized connected foreground screens within five seconds through safe signals and refetching. |
| R20 | Queue data persists across refresh, closing and midnight. Never reset tokens, delete active entries, advance statuses or cancel outstanding work automatically at a date boundary. |

### Validation and exact clock boundaries

- Name: trim, 2–60 Unicode characters, reject control characters; support Gujarati. Mobile: trim, remove spaces/hyphens, strip one optional leading `+91`, then require exactly ten ASCII digits beginning 6–9. Store the ten-digit result identically for every admission source; reject other country codes, arbitrary letters, a leading zero, and extra digits. Plain twelve-digit input without `+` is not accepted as a second format in this MVP.
- Service names: both EN/GU required, trimmed 2–80 characters, no control characters. Price: ₹0–100,000 inclusive, at most two decimal places, convert exactly to integer paise. Duration: integer 1–480 minutes. Selected service IDs must be distinct. Do not trust browser totals.
- Opening/closing: fixed Asia/Kolkata, one same-day interval, opening before closing with at least 30 minutes between them. Default demo interval 10:00–21:00. No overnight interval, weekly roster or holiday engine is included.
- At 09:59:59 neither source admits; at 10:00:00 both may admit. Online permits 20:29:59 but rejects 20:30:00. Walk-ins permit 20:30:00 and 20:59:59 but reject 21:00:00. All examples assume the other admission conditions hold and server time is authoritative.
- The clock check occurs at the serialized server admission decision immediately before the admission writes. Request-start time and response-delivery time are not admission time. A response delivered after cutoff may still report an admission validly accepted before cutoff; retrying its receipt is not a new admission.
- No-show: `server_now - called_at` must be at least 600 seconds. At 599 seconds reject; at 600 seconds permit only an authorized conditional transition. Client clock changes cannot unlock the backend action. Start and No-show racing for the same Called entry cannot both succeed.
- Settings changes apply to new admissions immediately. Existing entries remain active even when hours, the manual switch, or the date changes. Serialize admission against changes to relevant settings/catalog/duty, or recheck before commit, so stale eligibility cannot slip through a race.
- Highlight Waiting duration only when strictly greater than 60 minutes. No automatic status transitions occur when an estimate or reminder reaches zero.

## 4. Position and estimated wait
Guide baseline: approximate wait = sum of service minutes of customers ahead divided by number of working barbers. The estimate is not a guaranteed start time. The following clarifications are project decisions to handle preferences and active work:
- For Any: **global waiting position** = all earlier Waiting entries + 1. Working barbers = on-duty, off-break barbers, including occupied ones. Workload = full booked minutes of earlier Waiting entries + remaining workload of occupied working barbers; divide by working barber count and round up. Label it approximate: this pooled formula may overestimate work blocked by preferences and does not guarantee actual start order.
- For a named barber: **position for [barber]** = earlier Waiting entries preferring that barber or Any + 1. Estimate = their combined minutes + that barber's remaining workload, with divisor one. This is conservative because earlier Any entries might be served elsewhere. Never divide a named barber's workload by unrelated barbers.
- Each entry's booked minutes is the sum of its service snapshots. Count Called workload at full booked duration, noting that arrival delay is not predictable. For In Chair before planned duration, remaining = planned minutes minus server-measured elapsed minutes. Do not count that same active entry again as Waiting work.
- Return an **unavailable** result without a numeric estimate when the applicable working pool is empty or the named barber is on break/off duty. An empty Waiting queue alone does not mean zero: ongoing work still counts.
- At or beyond planned duration while still In Chair, the relevant workload is an **uncertain / service-overrun** result. Display no fake numeric countdown and never repeatedly add a five-minute allowance. If an eligible idle barber can call this entry immediately, “Ready soon” takes precedence over unrelated barbers' overruns; this is the only immediate-capacity correction to the pooled approximation.
- Return approximately zero / “Ready soon” only when an eligible idle barber can call the entry next without displacing an earlier eligible Waiting entry. If the formula produces zero while all eligible barbers are occupied, return uncertain instead. An estimate never automatically calls a customer.
- Exclude terminal entries. Recompute after join, assignment, start, finish, cancellation, break or reconnect and periodically for elapsed time. Position is meaningful while Waiting only; show assigned status afterward. Arrival reminder appears at position 2; if a new customer is already first, show that their turn is near. Do not imply exact scheduling.

Example: S-01 requests Ravi, S-02 requests Any, S-03 requests Amit. If Amit becomes available he calls S-02, not S-01 or S-03. With 90 minutes of waiting work and three working barbers, the baseline estimate is about 30 minutes before accounting for ongoing services.

Additional examples: two booked services of 30 and 15 minutes contribute 45 minutes; a 30-minute service started ten minutes ago contributes 20 remaining minutes; a still-active service at 30 elapsed minutes is uncertain, not zero. Named-barber position two prompts arrival alongside any break warning. Any Barber position two refers to the global queue, not a promised second chair assignment. Cancelled/No-show/Done contribute no current workload or Waiting position; Called/In Chair no longer have a Waiting position.

## 5. Shared data and architecture (implementation proposal)
React UI communicates with Supabase PostgreSQL through restricted reads, minimal Supabase Edge Functions for public/customer operations, and controlled transactional RPCs. Supabase Auth protects staff operations; Realtime distributes sanitized invalidations. Vercel hosts the frontend. One PostgreSQL database is authoritative. Local storage may hold language and opaque resume/pending credentials only, never customer name/phone, private queue snapshots or authoritative queue state. Use the approved modular structure in `01-brief.md`; no Express, Prisma, Next.js, Java, MySQL or Redux.

| Entity | Essential information |
|---|---|
| Services | ID, EN/GU names, duration, price in integer paise, enabled |
| Barbers | ID, stable slug, display name, on-duty and break flags, staff mapping |
| Queue entries | Internal ID, continuous token/admission sequence, customer name/normalized phone, preference, assigned barber, status, source, server transition timestamps, version, random status locator and tracking credential hash |
| Entry services | Entry ID, service ID, booked names, price and duration snapshots |
| Salon settings | Name, local operating hours, manual online switch |
| Staff profiles | Auth user ID, role, optional assigned barber ID |

Keep this a conceptual model: no SQL migrations or detailed API implementation in Phase 0. Small technical records for idempotency receipts and a sanitized change/version signal support the six product entities; they are not new user features. Use foreign keys, constrained statuses/values and partial unique constraints on active phone and active assignment.

### Transaction and authorization boundaries

- Admission atomically checks hours, switch/source, on-duty preference and enabled/current catalog; claims active-phone uniqueness; allocates token/order; inserts entry/snapshots/receipt; and advances the safe signal. A rejected admission creates no partial entry or snapshots. An atomic PostgreSQL sequence may leave gaps after rollback but cannot issue duplicate tokens.
- Serialize queue-affecting operations using a short salon-level lock for this single-salon MVP, then lock/recheck affected rows. This deliberately simple design preserves eligible FCFS under concurrent calls for different barbers; do not skip a locked earlier eligible entry to silently assign a later one. Token allocation and authoritative admission order occur inside the serialized admission path.
- Call Next checks current staff role, target barber duty/capacity and earliest eligibility, then changes Waiting to Called and assigns exactly once. Unique constraints are a final backstop, not a substitute for selecting the right customer. No client or multi-request read-then-write assignment is permitted.
- Conditional transitions check current state/version and authorized actor at commit. Concurrent Cancel/Call, Start/No-show, or duplicate Done requests have one valid outcome. Failed or stale requests refetch; they do not continue onto another customer.
- All privileged RPCs have restricted execution grants and explicit actor/capability checks. If a definer function is needed, fix its search path and limit its privileges. Do not assume a safe view automatically inherits table RLS; use an appropriately authorized projection/invoker configuration. No arbitrary direct writes to status, prices, snapshots, roles, tokens or timestamps.
- Backend roles come from protected staff profiles linked to validated Supabase Auth identity, never a submitted role or editable user field. A Barber must match both their profile linkage and the entry's assignment. Only Owner changes configuration; Receptionist/Owner operate reception; only the assigned Barber starts/completes.

### Admission idempotency and uncertain responses

1. Before the first request, the browser uses cryptographic Web Crypto randomness for a request key of at least 128 bits and a separate 256-bit tracking capability. Retain these opaque pending credentials through uncertain responses; backend validates lengths/format and stores only the capability hash. The same helper serves reception walk-ins. Do not use timestamps, token numbers, phone-derived values or `Math.random` as secrets.
2. Bind the request key on the server to the normalized name/phone, distinct service selections with reviewed catalog versions/prices/durations, preference, source and capability hash. Bind staff-originated admission to the authorized actor too. Fingerprints are recomputed by the trusted backend; a client hash is not authority.
3. The successful receipt stores the original entry/locator/token and fingerprint in the same transaction. Concurrent identical requests wait/reconcile and return that result once. A different payload or capability with the same key is rejected, including attempts to change source from remote to walk-in.
4. Check a matching successful receipt before re-evaluating current cutoff/catalog, so a valid retry after a lost success response returns the existing entry rather than fails or creates another. This does not admit a new customer after cutoff. Require the matching capability for private response replay; a request key or phone alone is insufficient.
5. If a response times out, show “Checking whether your spot was created”; query the protected receipt or retry exactly the same request. Never automatically generate a new key. The browser already holds the capability, so no raw secret needs to be stored in a replay receipt. If a pending entry committed before refresh, the matching receipt recovers its locator and status.
6. A confirmed validation/stale-catalog rejection creates no entry. Show current data and obtain reconfirmation; changed input is a new payload with a new key/capability only after the earlier outcome is known. Do not persist customer PII locally just to support retries.
7. Retain successful receipts while the entry is active and for at least 24 hours after its terminal transition. Call Next and staff lifecycle operations also use actor/payload-bound request identities: a retried Call Next returns the originally called customer even if that customer subsequently finished, never calls a second customer.

### Private customer capability and expiry

- The backend generates a random status locator with at least 128 bits of entropy. The separate 256-bit capability is hashed at rest and is required for private read/cancel/receipt operations; locator knowledge alone grants no access. Failed capability attempts return generic errors and are rate-limited.
- Share `/status/:id#access=<capability>`. `:id` is the random locator, not the token, phone or raw internal row ID. The fragment keeps the secret out of the initial hosting request and HTTP referrer. React captures it, stores the opaque resume record locally and removes the fragment from the address bar. Explicit Copy private link reconstructs it for that customer.
- Send secrets only in a redacted private request body/header, never query strings. Disable secret/body logging, third-party analytics and error-reporting capture on private flows; set no-referrer and private-response no-store policies. Escape user content and avoid unsafe HTML to protect local credentials from injection. A shared full link grants bearer access: explain this to the customer.
- Waiting/Called/In Chair capabilities remain valid regardless of age, closing or midnight. Done/Cancelled/No-show capability access expires at `terminal_at + 24 hours`, checked using server time on every private request; at that instant access is denied. Owner/statistical records remain; no cleanup job is necessary to enforce access expiry.
- Local resume stores only locator/capability and opaque pending request identity, not name/phone. Clear an expired or explicitly forgotten resume record; never use the public token or phone to reconstruct access. A valid terminal receipt cannot extend expiry.
- No phone-only public recovery exists. Reception can assist in person through its authorized operational view; credential reissue is not an MVP workflow. Never create a second active entry to work around a lost link. All public demo records are fictional, with no claim of verified customer identity.

### Safe reads, sessions and abuse controls

| Audience | Permitted response | Prohibited exposure |
|---|---|---|
| Public Home/Join | Branding/hours/effective admission, enabled bilingual services/prices/durations, public barber duty/busy state, counts and approximate estimates | Customer names/phones, internal queue IDs, tracking locators/secrets, staff profiles |
| Public TV | Public barber name/avatar/state, active public token/state/call timestamp, next five Waiting tokens and approximate estimates | Customer names/phones, service selections, private identifiers, capabilities |
| Customer capability | Own token, services/totals, preference/assignment, state, labeled position/estimate and appropriate timestamps | Other customers' records, staff credentials, role data |
| Receptionist/Owner reception | Operational queue details needed for calling, walk-ins, cancellation and No-show; phone only where operationally necessary | Raw tracking capabilities/hashes, privileged keys, unrestricted role editing |
| Barber | Own assignment, persisted timer, minimal earliest eligible next preview (token/name/services) | Customer phones, other barbers' private assignments, tracking secrets, owner settings writes |
| Owner settings | Bilingual catalog/settings/duty, authorized aggregate statistics | Secret keys, arbitrary staff-role writes through the UI |

RLS is enabled on private tables, with no anonymous raw queue reads and no self-editable roles. Staff accounts are provisioned by a trusted operator through Supabase administration; no public staff signup. Session refresh may continue a valid session; failed refresh/revocation returns to sign-in, clears protected caches and prevents mutations. Sign-out clears protected data immediately; another browser tab must respond to session changes. Reauthentication does not silently replay an old action.

Keep Supabase URL/publishable key as public frontend configuration; secret/service-role keys remain in trusted backend environment variables and never enter Vite output, Git or public docs. Verify authorization inside privileged operations because a privileged key bypasses ordinary RLS. Limit CORS to configured clients, but do not treat CORS as authentication. Use bounded server-enforced rate limits for public operations; initial demo defaults may allow 10 admission attempts/minute/IP and 60 status reads/minute/capability, with a shared backend counter rather than per-instance memory. Return translated generic validation/conflict/rate-limit errors without private database details. No paid anti-abuse integration is required.

## 6. Synchronization and failure handling
Subscribe to safe realtime signals and refetch authorized projections; never publish raw private queue records publicly. Target updates within five seconds in normal connectivity; a periodic refetch fallback can help. On disconnect show stale timestamp, disable unsafe mutations until connection is restored, then refetch. On reload, restore tracking access and fetch current state. On a rejected concurrent action, refetch and explain the result. Do not optimistically report a completed action without server confirmation.

For the MVP, expose one minimal signal table with only a version and server change time; anonymous clients may read/subscribe but cannot insert/update it. Private queue tables are not a public replication feed. Admission, status, duty, service and settings changes advance the signal in the same committed transaction. Signal contents carry no customer or staff identity. A signal is an invalidation hint, not a trusted instruction to change a local status.

| Interface | Refetched snapshot after a relevant change |
|---|---|
| Home | Public Waiting count, estimate, admission and barber summary |
| Join | Current catalog/duty/hours and estimates; preserve valid input and request reconfirmation for changed totals |
| My Status | Capability-authorized own entry and server-derived position/wait |
| Reception | Role-authorized queue, assignments and barber state |
| Barber | Linked barber's current/next work, duty and persisted timestamps |
| TV | Sanitized public current/next-token projection |
| Owner | Owner-authorized configuration and daily aggregate statistics |

Fetch on entry, then subscribe and perform a reconciliation fetch when the subscription becomes ready to close the initial read/subscribe race. Debounce burst invalidations, discard older in-flight read results, and retain at most one active subscription per client context with proper cleanup. A bounded foreground refetch fallback (approximately every five seconds if needed) handles missed events; browser background suspension and offline conditions are outside the normal-connectivity latency target. Reconnect/foreground/session change always triggers a full authorized snapshot. Timers use server timestamps and a server-time offset and do not reset on refresh.

Deduplicate Called notification/chime by token and called timestamp. Initial loads and reconnects show current Called state without replaying historical audio. Sound requires a user gesture and is supplementary; denied audio leaves a complete visual experience. English/Gujarati messages include connection loss, retry, conflict, expired access, service overrun and all terminal states.

## 7. Statistics
Owner dashboard uses salon-local date. Served = entries completed today. No-shows = entries marked today. Average wait = mean of call time minus join time for entries completed today; show dash if none. Preserve historical entries and snapshots; do not count cancelled entries as served.

Use Asia/Kolkata event-date boundaries `[local midnight, next local midnight)`, independent of browser timezone. Filter served/average by completion timestamp, and No-show by No-show timestamp. A customer admitted yesterday and completed today counts today, with their actual cross-midnight join-to-call interval. Compute the mean from timestamp differences in minutes and display to one decimal place; do not average rounded per-row values. No completed entries means served 0 and mean “—”, not fabricated zero wait. At local midnight refresh owner statistics and admission status without altering any active queue entry or token counter.

## 8. Acceptance test checklist
All items initially unchecked. During QA record actual PASS, FAIL or NOT RUN with evidence; do not fabricate results.

| ID | Scenario | Expected outcome | Result |
|---|---|---|---|
| T01 | Join with name, valid phone, one service | Token and private tracking created | [x] PASS — hosted React/jsdom, Phase 3 |
| T02 | Invalid phone or missing name | Rejected with clear validation | [ ] |
| T03 | Select zero or four services | Confirm blocked and backend rejects | [ ] |
| T04 | Select two services | Correct combined price and duration | [x] PASS — hosted React/jsdom, Phase 3 |
| T05 | Tamper with client price | Trusted service price used or rejected | [ ] |
| T06 | Same phone joins twice | One active entry; no private data leak | [x] PASS — actual hosted rejection + component message, Phase 3 |
| T07 | Concurrent joins/repeated confirm | Unique tokens; no duplicate entry for same phone | [ ] |
| T08 | Refresh active status | Same entry and current state | [ ] |
| T09 | Add walk-in after remote join | Walk-in goes to tail of same queue | [x] PASS — hosted React/jsdom walk-in tail, Phase 4 |
| T10 | Amit calls with Ravi-only entry first | Earliest Amit/Any entry selected | [x] PASS — hosted React/jsdom eligible Amit selection, Phase 4 |
| T11 | No eligible entry | No assignment; clear feedback | [ ] |
| T12 | Concurrent calls for same barber | Only one active assignment | [ ] |
| T13 | Two barbers call one Any entry | Entry assigned at most once | [ ] |
| T14 | Waiting → Called → In Chair → Done | All allowed transitions persist | [x] PASS — hosted React/jsdom persisted staff lifecycle, Phase 4 |
| T15 | Attempt invalid/backward transition | Backend rejects | [ ] |
| T16 | Cancel while Waiting | Terminal; queue recalculates | [x] PASS — hosted React/jsdom cancellation and public zero-Waiting read, Phase 3 |
| T17 | Cancel after Called | Rejected | [x] PASS — hosted request rejected; mounted Called screen has no cancel action, Phase 3 |
| T18 | No-show before ten minutes | Rejected | [x] PASS — hosted React/jsdom early No-show disabled and server rejected, Phase 4 |
| T19 | No-show at/after ten minutes | Terminal; barber released | [ ] |
| T20 | Re-add no-show | New token at end | [ ] |
| T21 | Barber on break | No assignment; preference warning | [ ] |
| T22 | Break/off-duty while occupied | Rejected | [ ] |
| T23 | 90 min ahead, 3 working barbers, no active workload | Approx. 30 min | [ ] |
| T24 | No working barbers | Wait unavailable, not zero | [ ] |
| T25 | Earlier customer finishes | Estimate/position recompute | [ ] |
| T26 | At 20:30 with 21:00 closing | Online join blocked | [ ] |
| T27 | Walk-in during online cutoff | Accepted during open hours if on-duty barber exists | [ ] |
| T28 | Owner manually closes online queue | Home/Join and backend block online join | [ ] |
| T29 | Service disabled during selection | Rejected or asked to revise; old booking unchanged | [ ] |
| T30 | Customer becomes second then Called | Arrival banner then turn alert | [ ] |
| T31 | Start/Done in barber view | Reception, TV and customer update within target | [ ] |
| T32 | Two devices with deployed app | Shared persistent state, no manual refresh | [ ] |
| T33 | Disconnect/reconnect | Stale warning then resync | [ ] |
| T34 | Anonymous/incorrect-role staff request | Backend denies restricted data/actions | [ ] |
| T35 | Wrong barber attempts Start/Done | Denied | [ ] |
| T36 | Inspect TV/public requests | No phone, customer name or private credential exposed | [x] PASS — zero customer PII in public TV display, DOM and network verified in unit and hosted Supabase, Phase 5 |
| T37 | Invalid tracking link | Generic error; no customer details | [ ] |
| T38 | Toggle Gujarati on every route | All labels/messages translate without clipping | [ ] |
| T39 | Phone/tablet/TV layouts | Readable, no overflow, usable controls | [ ] |
| T40 | Owner stats with known sample data | Correct counts and mean wait | [x] PASS — owner statistics computed strictly today in IST with mean wait verified in unit and hosted snapshot, Phase 5 |
| T41 | Production build and direct nested route refresh | Build succeeds; deployed route opens | [ ] |
| T42 | Attempt remote and walk-in admission at 09:59:59 for 10:00 opening | Both rejected using server time; no entry created | [ ] |
| T43 | Admit at exactly 10:00:00 with all other conditions valid | Both sources permitted; server timestamps and order recorded | [ ] |
| T44 | Remote admission at 20:29:59 versus 20:30:00 for 21:00 closing | Serialized server decision permits first and rejects second; delayed response does not change admission time | [ ] |
| T45 | Remote and walk-in admission at exactly 21:00:00 | Both rejected; existing active entries remain valid | [ ] |
| T46 | Walk-in at 20:59:59 while manual online switch is off | Accepted if server admission decision precedes closing and other conditions hold | [ ] |
| T47 | Authorized No-show request at 599 seconds Called | Rejected, remains Called and barber occupied | [ ] |
| T48 | Authorized No-show request at exactly 600 seconds Called | Accepted once if still Called; barber released | [ ] |
| T49 | Customer or wrong-role staff requests No-show after 600 seconds | Denied regardless of elapsed time | [ ] |
| T50 | Staff access token expires but refresh succeeds | Valid session continues without exposing data or repeating mutations | [ ] |
| T51 | Session refresh fails or staff session is revoked | Protected cache cleared, mutations blocked, same route presents sign-in | [ ] |
| T52 | Sign out with another staff tab open | Protected data disappears in both tabs; stale requests cannot mutate | [ ] |
| T53 | Attempt public staff signup or self-update role/barber linkage | No public provisioning; privilege escalation denied by backend | [ ] |
| T54 | Anonymous request reads private tables or arbitrary queue fields | RLS/grants deny raw access; only explicit safe projections are available | [ ] |
| T55 | Public client reads/subscribes or writes the realtime signal | Signal contains only version/time; unauthorized writes denied; no PII event | [ ] |
| T56 | Admission commits but response is lost, then identical retry | Original token/locator returned with matching capability; one entry only | [ ] |
| T57 | Reuse admission key with different phone, selection, preference, source or capability | Payload-binding conflict; no second entry and no private result leaked | [ ] |
| T58 | Two simultaneous identical admissions with one key | One receipt, one entry, one token; both matching requests reconcile to it | [ ] |
| T59 | Retry a successful admission after cutoff or a catalog edit | Original receipt returned; no new admission or reinterpretation of payload | [ ] |
| T60 | Refresh after an uncertain admission with saved opaque pending credentials | Protected receipt resolves committed entry; no phone/name cache or duplicate | [ ] |
| T61 | Owner changes selected service price before admission commit | Stale request rejected without entry; new total needs explicit reconfirmation | [ ] |
| T62 | Owner changes selected service duration before admission commit | Stale request rejected; reviewed new duration requires a new bound request | [ ] |
| T63 | All on-duty barbers are on break during otherwise valid admission | Remote/walk-in allowed; wait unavailable and break warnings shown | [ ] |
| T64 | Choose a named on-duty barber on break, then try Call Next | Join allowed with warning; no assignment until that barber returns Available | [ ] |
| T65 | No barber is on duty, even with empty queue and online switch on | Both admission sources blocked; estimate unavailable, never zero | [ ] |
| T66 | Ongoing service reaches or exceeds booked duration without Done | Relevant wait becomes uncertain/overrun; no rolling five-minute promise | [ ] |
| T67 | Waiting queue is empty but every eligible barber is occupied | Estimate includes current work or uncertainty; does not falsely show zero | [ ] |
| T68 | Named barber has earlier Any and named entries while other barbers work | Filtered position and single-barber estimate follow documented rules | [ ] |
| T69 | Cancellation and Call Next race on one Waiting entry | Exactly one valid transition wins; losing client reconciles current state | [ ] |
| T70 | Start and eligible No-show race on one Called entry | Exactly one succeeds; no simultaneous In Chair and No-show or lost capacity | [ ] |
| T71 | Retry successful Call Next after its customer has completed | Original result returned; retry never calls a second customer | [ ] |
| T72 | Edit/disable a booked service after admission and refresh all views | Historical EN/GU names, price and duration unchanged; new joins use new catalog | [ ] |
| T73 | Same mobile entered with spaces, hyphens, +91 or ten-digit form | All normalize identically and share active-phone uniqueness | [ ] |
| T74 | Submit another country code, letters, leading zero or malformed length | Rejected consistently by client/backend with translated errors | [ ] |
| T75 | Active entry crosses closing and midnight, then same phone joins again | Existing entry/link/order survive; duplicate active admission rejected | [ ] |
| T76 | New admission after midnight on the next open day | Token sequence continues without reset; unresolved earlier eligible entries retain priority | [ ] |
| T77 | Customer joins yesterday and completes today; compare IST/browser dates | Counts and mean use today's IST completion date and actual join-to-call interval | [ ] |
| T78 | Terminal link used just before and exactly 24 hours after terminal_at | Before expiry permitted; at expiry denied generically; records/stats retained | [ ] |
| T79 | Active link is older than 24 hours or crosses multiple midnights | Remains valid while active; no age-based interruption | [ ] |
| T80 | Supply locator/token/phone without the matching private capability | No private response or cancellation; generic denial and bounded attempts | [ ] |
| T81 | Inspect hosting/API logs, referrers, errors, storage and browser requests | Capability absent from path/query/logs/referrers; only opaque resume data stored; private responses no-store | [ ] |
| T82 | Attempt direct edits of status, totals, snapshots, tokens or timestamps | Restricted grants/RPC checks deny bypasses; no client-authoritative values | [ ] |
| T83 | Keyboard-only forms/dialogs and 320px Gujarati layouts | Labels, focus, 44px targets, contrast and wrapping remain usable | [ ] |
| T84 | TV receives duplicate Called events, reconnects or audio permission is denied | Visual remains complete; one new-call chime at most; no historical replay | [x] PASS — TV display visual complete, audio toggle and duplicate call deduplication verified, Phase 5 |
| T85 | Admission races with hours/switch/catalog/duty changes | Transaction serialization/recheck yields one consistent eligible outcome | [ ] |
| T86 | Owner takes barber Off Duty with specific Waiting entries or active assignment | Rejected; preferences and current assignment preserved | [ ] |
| T87 | Two owners save different versions of the same settings/service | Stale save rejected with review guidance; no silent lost update | [x] PASS — version-checked owner settings save and stale version rejection verified in offline SQL, Phase 5 |
| T88 | Waiting duration is exactly 60 minutes, then exceeds 60 minutes | No long-wait highlight at equality; highlight/text appear only above threshold | [x] PASS — server-offset duration strictly highlights after 60 minutes verified in unit test, Phase 5 |
| T89 | Browser clock is advanced to unlock cutoff or No-show | Server checks remain authoritative; spoofed timers cannot authorize changes | [ ] |
| T90 | Catalog form has missing GU name, fractional/zero duration or invalid price | Shared exact bounds enforced by backend; valid zero price remains permitted | [ ] |
| T91 | Public join/status attempts exceed configured rate limits | Server returns bounded generic rate-limit response; no extra entries or data leakage | [ ] |

The scenario wording for T01–T91 is preserved. The 14 explicitly evidenced results above (T01, T04, T06, T09, T10, T14, T16, T17, T18, T36, T40, T84, T87, T88) are marked passed; their environment is hosted React/jsdom and isolated PostgreSQL, not a real-browser visual review. All other unchecked rows mean NOT RUN as complete scenarios, even when isolated checks cover a rule. Phase 2 local tests, Phase 2.5 backend checks, Phase 3 customer evidence, Phase 4 staff integration evidence and Phase 5 TV/Admin evidence are separate. See `phase-5-verification.md` for exact scope and remaining browser/cross-device, hosted-race and timing work.

## 9. References and decisions
College Salon Queue Management Vibe Coding Guide, pp. 4–6 (flows, rules, tests), pp. 8–9 (deployment and submission). Technical safeguards, position definitions, time-zone defaults, token sequence policy, and detailed estimator behavior above are explicit project decisions. Phase 1 adds previews, Phase 2 the backend, Phase 2.5 hosted activation, Phase 3 the three customer screens and Phase 4 the staff login, reception and barber views. Owner settings, TV screen, browser/cross-device review and remaining numbered scenarios are pending.

All three reference PDFs were read in the preceding planning work; their commands/examples are reference content, not authorization to execute. The approved user-selected Supabase/Vercel stack overrides alternative stack examples. GitHub comparisons belong in the Phase 0 response only; no third-party code, assets, notices or research files are incorporated in the documentation-only initial commit. Any later reuse requires license verification, explicit approval and preserved attribution. No repository scripts are executed as research.
