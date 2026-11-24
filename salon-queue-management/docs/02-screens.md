# SalonQ — Screens & Features

**Stage:** Phase 3 makes Home, Join and private My Status functional against the hosted backend while retaining the approved identity/layouts. Home uses real public data, Join has three visible steps and a sticky summary, and private Status retains/enhances the digital pass with circular estimates, progress, Called/arrival notices, private copying and confirmed cancellation. Explicit `/status/preview` and staff/Login/TV/Owner remain clearly fictional previews. No new rendered mobile/desktop/Gujarati verification is claimed. All seven screens remain required; remaining feature targets below still apply. Business rules in `03-flows-rules.md` govern operations.

## Phase 1 desktop design approval and deferred refinements

The user reports manually opening the rendered application at `http://127.0.0.1:5174/`, reviewing the desktop Home, Join Queue and My Status screenshots, and approving their designs as the foundation for further development. This is user-reported manual visual approval, not an agent browser verification. Exact viewport dimensions were not supplied. No approval or visual verification is recorded for Reception, Barber, TV, Owner Settings, login/error pages, mobile/tablet/TV viewport sizes, or Gujarati layouts. Automated component checks do not establish rendered layout quality. No screenshot artifacts are claimed as captured or archived by the agent.

Preserve the existing branding, typography, charcoal/champagne-gold palette, navigation, digital queue pass, reusable components and desktop layouts. Do not redesign the whole application. The following work is recorded for the corresponding feature phase; it is not implemented as part of Phase 1 closure.

| Feature phase | Targeted UI work |
|---|---|
| Home | Reduce excessive hero whitespace and bring salon availability and authoritative live queue statistics closer to the top. Consider an optional tasteful, optimized salon photograph only after verifying its license and retaining required attribution. Give barber cards consistent fictional avatars. Add featured services with authoritative catalog prices/durations. Refine the three-step customer journey presentation. |
| Join Queue | Add a clear three-step progress indicator without replacing the approved desktop layout. Show selected-service count out of three. Preserve service cards and the sticky summary. Connect accessible selection feedback, show barber warnings only when relevant, and optimize the mobile confirmation experience. |
| My Status | Preserve the digital queue pass. Add an elegant circular approximate-wait visualization that never promises a guaranteed countdown and represents unavailable/overrun states honestly. Refine status progression. Add secure Copy Status Link following the approved capability/fragment contract. Show a prominent gold Called notification with the assigned barber, accessible status announcements and reduced-motion behavior. |
| All affected features | Maintain EN/GU text and shared tokens; avoid unnecessary dependencies and excessive animation. Keep previews explicitly fictional until real functionality exists. Never fabricate live statistics or use unlicensed imagery. Preserve all business rules, architecture, security controls and remaining visual QA obligations. |

Any photo is optional, not an MVP dependency; none was introduced. Phase 3 uses consistent initial avatars for actual barber records, conditional break warnings, tighter Home hero spacing and real featured services. Join's existing desktop layout and service cards remain, with a three-step indicator, count out of three and accessible selection. Status retains its pass with approximate circular wait, progress and private-link/cancellation controls. These are functional implementation changes, not a new rendered visual approval. Five numbered acceptance scenarios passed with the precise hosted React/jsdom scope in `phase-3-verification.md`; 86 remain unchecked.

## SalonQ brand identity

| Element | Approved direction |
|---|---|
| Application name | **SalonQ**; preserve this spelling in both languages |
| Full name | **SalonQ — Smart Salon Queue Management** |
| Tagline | **Your Time. Your Turn.** |
| Personality | Premium, elegant, modern, professional, trustworthy, minimal and efficient |
| Logo concept | A restrained Lucide `Scissors` mark beside a refined SalonQ wordmark; original composition rather than copied salon branding |

**Logo treatment:** use a 24px Lucide Scissors icon with approximately 1.75–2px stroke inside a 40px elevated-surface tile with 10px corners. Use primary gold for the scissors. Set the wordmark in Inter Semibold, approximately 22–24px, with restrained negative tracking; the final Q may carry the same gold accent while Salon uses primary text. Keep a 12px icon-to-wordmark gap and at least 12px clear space around the lockup. Do not add ornamental flourishes, gradients, glow or a gold frame. A compact header may use the mark and 20px wordmark; keep the full name as accessible text or page metadata where appropriate.

The mark and wordmark form one home link with at least a 44px hit area. Hide the decorative scissors from assistive technology when adjacent text already names SalonQ; provide a translated Home link label. Do not substitute emoji or generate raster logo artwork. Implement the reusable Lucide logo component only in an approved frontend phase; no logo component or asset is created by this planning update.

The tagline belongs on Home and selected customer-facing introductions, not repeated above every management panel. English/Gujarati copy uses the shared dictionary: English “Your Time. Your Turn.” and Gujarati “તમારો સમય. તમારો વારો.”, subject to human Gujarati review. SalonQ remains unchanged; its descriptive full-name text can be localized without altering the brand spelling.

## Shared design system

### Visual principles

- Use Linear's general hierarchy/spacing discipline, Stripe Dashboard's organization, Apple's typographic restraint and purposeful motion, and luxury salon/SaaS principles of confidence and clear actions. Create original layouts and branding; do not copy proprietary assets, distinctive layouts or product interfaces.
- Customer pages feel welcoming and calm: concise copy, generous whitespace, a visible next step and honest queue information. Staff pages feel efficient: aligned columns, restrained density, consistent actions and clear status. TV prioritizes distance readability over decoration.
- Gold is reserved for primary actions, important queue tokens, selected states and branding. Default cards/navigation use neutral surfaces and borders. Avoid excessive gold borders, gradients, shadows and glow; no decorative charts, fake statistics or new navigation destinations.
- The visual enhancement does not change the seven routes, four roles, queue rules, security, stack or Phase 0 boundary. Shared design tokens and the future logo/font implementation belong to frontend initialization, not this documentation task.

### Semantic color tokens

One future theme stylesheet owns these CSS custom properties. Tailwind color names map to the same values, so components consume semantic utilities rather than page-specific hex values or duplicate palettes. This table is the implementation contract, not a CSS/config file created in Phase 0. Use solid surfaces and restrained state fills; verify final opacity/composited colors as well as the base palette.

| Role | CSS variable | Tailwind color name | Value |
|---|---|---|---|
| Main background | `--color-background` | `background` | `#101113` |
| Secondary background | `--color-background-secondary` | `background-secondary` | `#151719` |
| Card surface | `--color-surface` | `surface` | `#1B1D20` |
| Elevated surface | `--color-surface-elevated` | `surface-elevated` | `#242629` |
| Primary gold | `--color-accent` | `accent` | `#D4AF37` |
| Gold hover | `--color-accent-hover` | `accent-hover` | `#E7C766` |
| Primary text | `--color-foreground` | `foreground` | `#FAF7F0` |
| Secondary text | `--color-foreground-secondary` | `foreground-secondary` | `#A5A5A5` |
| Muted text on main/secondary/card | `--color-foreground-muted` | `foreground-muted` | `#8B8B8B` |
| Decorative border | `--color-border` | `border` | `#33363A` |
| Success accent | `--color-success` | `success` | `#22C55E` |
| Warning accent | `--color-warning` | `warning` | `#F59E0B` |
| Error accent | `--color-error` | `error` | `#EF4444` |
| Information accent | `--color-info` | `info` | `#60A5FA` |
| Muted text on elevated surfaces | `--color-foreground-muted-raised` | `foreground-muted-raised` | `#989898` |
| Essential control boundary | `--color-border-control` | `border-control` | `#787B80` |
| Readable error copy | `--color-foreground-error` | `foreground-error` | `#FCA5A5` |
| Destructive button fill | `--color-destructive` | `destructive` | `#991B1B` |

Maintain WCAG AA text contrast: at least 4.5:1 for normal text and 3:1 for large text; essential control boundaries and focus indicators need at least 3:1 against adjacent colors. Color never communicates a state alone. The following opaque sRGB contrast calculations were checked during planning; they do not certify an unimplemented app or replace rendered accessibility testing.

| Combination | Contrast / required treatment |
|---|---|
| Muted `#8B8B8B` on elevated `#242629` | About 4.45:1; use raised-muted `#989898` instead, about 5.26:1 |
| Decorative border `#33363A` on elevated surface | About 1.25:1; never use as the sole input/control boundary; control border `#787B80` gives about 3.57:1 |
| Error accent `#EF4444` on card `#1B1D20` | About 4.49:1; use error-copy `#FCA5A5` for normal error text, about 8.90:1 |
| Primary text `#FAF7F0` on gold `#D4AF37` | About 1.97:1; use dark `#101113` text, about 8.98:1 |

Gold-hover buttons retain dark text. Destructive buttons use primary text on the dark red fill. Muted text must not be made less readable with additional opacity. In-page Called panels use restrained gold emphasis or gold fill with dark text; they never expose additional customer information. Success/warning/error/info chips include readable labels and icons, with color as supporting emphasis.

### Typography and font delivery

- **Inter** is the default for navigation, dashboards, forms, statistics, queue tokens, buttons and general content. Use weights 400/500/600/700 as needed; avoid loading redundant weights.
- **Playfair Display** is limited to selected English customer-facing hero headings, such as the Home tagline. It is not used for dense dashboards, forms, timers or long token identifiers. The wordmark remains Inter.
- **Noto Sans Gujarati** renders Gujarati UI and hero text with sufficient line height and natural shaping. In Gujarati mode, use this face rather than attempting Gujarati in Playfair Display. Set document language and localized accessible labels.
- Prefer locally bundled WOFF2 files from official distributions with verified redistribution licenses. Preserve the actual license/notice files and record source/version when fonts are added in a later approved frontend task. Do not download fonts, add a font package or claim license verification in Phase 0. Avoid a runtime dependency on third-party font CDNs.
- Use Inter → Noto Sans Gujarati → system sans-serif fallbacks for UI, Playfair Display → Georgia → serif for English heroes, and Noto Sans Gujarati → Shruti → system sans-serif for Gujarati. Keep text usable if font loading fails. Use swap-style loading and reserve line height to limit layout shifts.
- Apply tabular numerals to tokens, timers, prices and statistics. Preserve identifiers and phone digits across locales. Do not crop Gujarati marks, force uppercase Gujarati, use excessive letter spacing on Gujarati, or shrink required text to make it fit.

| Role | Mobile size / line height | Larger-screen size / line height | Weight / face |
|---|---|---|---|
| Customer hero | 36/44px | 48/56px, up to 64/72px when space allows | 500–600 Playfair Display; Noto Sans Gujarati in GU |
| Page title | 28/36px | 32/40px | 600 Inter / Gujarati face |
| Section heading | 22/30px | 24/32px | 600 |
| Card title | 18/26px | 18/26px | 600 |
| Body content | 16/24px | 16/24px | 400; GU typically 16/28px |
| Form label / button | 14–16/22–24px | 14–16/22–24px | 500–600; inputs always at least 16px |
| Supporting text | 14/22px | 14/22px | 400–500; never low-contrast essential text |
| Statistics | 32/40px | 40/48px | 600, tabular numerals |
| Customer queue token | 48/56px | 64/72px | 600–700, tabular numerals |
| TV token / supporting text | Stacked preview: 48/56px token | 88–112px token; supporting text at least 32px at 1080p | 600–700 token; readable sans-serif throughout |

Gujarati headings may need approximately 1.4 line height; allow the component to grow rather than clip. Use normal zoom and 200% text zoom during later QA, with no loss of essential controls or information.

### Layout and spacing

- Use a 4px base scale with recurring 8px rhythm: 4, 8, 12, 16, 24, 32, 48 and 64px. Mobile page padding is 16px, tablet 24px and desktop 32px; section gaps 24–48px; card padding 16–24px. Keep labels close to their inputs and larger gaps between unrelated tasks.
- Start at 320px; verify 390px mobile. Use 640/768/1024/1280/1536px layout breakpoints when content requires them, not device-specific assumptions. Avoid page-level horizontal scrolling. Do not hide essential operations behind hover.
- Customer Home can use a 1120px centered canvas with a focused hero and live summary; Join/Status use a comfortable 640–720px reading/form column, widening to approximately 960px for a useful two-column summary. Preserve obvious reading order when columns stack.
- Reception uses a bounded 1440px workspace with barber cards alongside the queue at 1024px and above; tablet may put barber cards above the list. Owner sections use aligned cards and consistent table columns. Small-screen management turns rows into labeled cards rather than compressing every field.
- Barber View stays focused on the current assignment and one primary lifecycle action in an approximately 640px column. Next-customer information remains secondary. TV uses its own full-viewport 1920×1080 shell and a 1280×720 fallback, with a stacked mobile preview. Check five-metre readability on an actual suitable display before claiming it.
- Use restrained 12px card corners, 8px control corners and a soft single shadow only for elevated dialogs/popovers where useful. Separate ordinary cards through spacing and surface contrast, not glow or multiple shadows.
- Public navigation remains Home, Join and local My Status where available. Staff navigation contains only authorized existing routes; no decorative dead links or extra dashboard modules. Present login within the requested staff route, not an additional primary screen.

### Components, states and purposeful motion

| Component | SalonQ treatment |
|---|---|
| Primary button | Gold fill, dark text, clear verb, minimum 44px height; gold-hover state; normally one dominant action per task area |
| Secondary / quiet action | Neutral surface or text with clear affordance; essential borders use control token; never compete with primary action |
| Destructive action | Dark red fill with primary text and explicit outcome; confirmation for terminal/destructive operations |
| Input / selector | Persistent label, 16px input text, readable control boundary, generous hit area, distinct focus/error/disabled state; placeholders never replace labels |
| Service / barber selection | Neutral default card; selected check/radio and restrained gold accent; preserve checkbox/radio semantics and unavailable explanation |
| Card / statistics | Clear title-value-support hierarchy, aligned baselines, real operational data; gold only for meaningful emphasis |
| Queue status | Label + icon + accent: Waiting neutral, Called gold, In Chair information blue, Done success, Cancelled neutral, No-show error; do not recolor unrelated content |
| Dialog / toast | Elevated surface, clear title/body/action order, accessible focus/live regions; success appears only after confirmation from the backend |
| Skeleton / empty / error | Stable skeleton geometry; concise welcoming empty copy and relevant next action; actionable errors without blame or raw database details |
| Focus / disabled / pending | Visible 2px gold focus ring with a 2px dark offset; preserve readable labels; pending text explains the action and suppresses repeat submission |

Use short CSS transitions of approximately 120–180ms for hover/focus and 180–240ms for dialogs or section changes. Motion explains interaction, not decoration: no parallax, animated gradients, bouncing cards, auto-scrolling counters or extra animation dependency. Reduced-motion mode removes nonessential transforms/pulses and keeps an immediate clear state. Routine realtime changes do not move focus or reanimate the whole page. TV's existing approximately five-second Called highlight and deduplicated optional chime remain the functional rule; no rapid flashing.

### Shared validation and feedback
- Central EN/GU translation dictionaries cover labels, messages, validation, statuses and date/time formatting; remember language locally. Service names have both translations. Do not translate personal names or tokens.
- Every screen has loading, empty, error, success and stale/offline states. Disable mutation buttons while pending or reconciling; never pretend a failed operation succeeded. Use text with status colors. Never place customer names, phone numbers or tracking secrets in URL paths/query strings, public TV payloads, logs or analytics. The private-link fragment contract below avoids sending the tracking secret in the initial page request.
- Inputs have persistent labels, hints and associated translated errors. Service cards are checkboxes; barber choices are radios. Status chips combine text, icon and color. Dialogs have labels, trapped focus, safe Escape behavior and restored trigger focus. Confirm cancellation, No-show and impactful online closure; a busy duty change is rejected rather than confirmed.
- Toasts announce confirmed success politely; errors needing action stay inline. Skeletons preserve layout. Empty states distinguish no records from failed loading. Routine realtime updates preserve focus and never announce every timer tick.
- Customer name: trim, 2–60 Unicode characters, no control characters. Phone: normalize spaces/hyphens and optional +91; then ten ASCII digits starting 6–9. Service names: EN and GU both required, 2–80 characters. Price: ₹0–100,000 with at most two decimal places, stored as integer paise. Duration: integer 1–480 minutes. Revalidate every field on the trusted backend.
- All user-facing labels, error codes, aria labels, dialogs, toasts and plural forms use centralized EN/GU translations. Format INR and dates with `en-IN`/`gu-IN`, always Asia/Kolkata; identifiers/phone digits remain stable. Personal names are not translation keys.

### Shared security, session and synchronization behavior
- Staff login uses email/password Supabase Auth inside the requested staff route, with no role selector, public signup or client-editable staff roles. Route protection is a UX layer; backend authorization is mandatory. Owner may navigate to Reception and Owner Settings; Receptionist to Reception; Barber to their own Barber View.
- If an access token refresh succeeds, continue normally. If session refresh fails or the session is revoked, clear protected cached data, disable mutations and show sign-in on the same route. Never automatically replay a staff mutation after login. Successful sign-out removes protected data immediately.
- Use only sanitized realtime signals, then refetch permitted snapshots within the normal five-second target. Home/Join follow catalog, hours, admission and duty changes; My Status follows its own entry and queue-derived metrics; Reception and Barber follow authorized operations; TV follows public tokens; Owner follows configuration and daily statistics.
- On disconnect retain a visibly stale snapshot with last successful synchronization time, disable unsafe actions and attempt bounded reconnect. On reconnect/foreground/refresh, obtain authoritative data before enabling actions. Server timestamps determine all thresholds; local timers only present elapsed time.
- Registration retries retain the same idempotency key, capability and payload. Timeouts show an uncertain-result state with Check status/retry; they must not generate a new request. A confirmed stale-price response requires explicit review and a new request identity for the revised payload. See `03-flows-rules.md` for exact behavior.
- Private status URLs use `/status/:id#access=<capability>`: `:id` is a random locator and the secret is in the fragment, not path/query. Capture and remove the fragment after safe local resume storage. Refetch status with the secret in a redacted request body/header. Set no-referrer policy and no-store for private responses. Copy private link reconstructs the full private URL only on explicit customer action. No public phone lookup or phone-only link recovery exists.
- Active status access survives closing/midnight and does not expire while Waiting/Called/In Chair. Done/Cancelled/No-show access expires exactly 24 hours after the terminal transition. On expiry clear the saved capability and show a generic unavailable-link message; staff records and statistics persist.

## 1. Home — `/`
**User and goal:** Customer; decide whether to join today.
- Header: SalonQ scissors/wordmark, configured fictional salon name/logo as salon context, English/Gujarati toggle, opening status and closing time. Use a welcoming Home hero with the tagline in selected display typography and a focused live summary; avoid stock-photo dependency or decorative feature sections.
- Main live card: waiting count and approximate wait for an any-barber customer. Mark unavailable if no barber is working. Show when joining ends.
- Distinguish the salon's Open/Closed state from online admission's Open/Paused/Cutoff state. At 20:30 for a 21:00 closing, online joining closes even though the salon remains open. All-on-duty-barbers-on-break allows Join with an unavailable-estimate warning; no on-duty barber blocks admission.
- Barber cards: name, optional photo/initials, available/busy/on break/off duty. Never show private customer details.
- Primary action: Join Queue opens `/join`; disabled with a reason when online joining is closed. Resume status link appears if a private tracking session is present.
- Empty queue: welcoming message; fetch failure: retry and no stale claim of being open. Mobile stacked; desktop cards in a grid.
- Acceptance: count, barber status and queue availability change automatically; navigation and both languages work.

## 2. Join Queue — `/join`
**User and goal:** Customer; reserve a queue position.
- Visual hierarchy: short reassuring introduction, clearly grouped customer details/service/barber controls, then a readable live summary and one dominant Confirm action. Use neutral selection cards and restrained gold selection cues; preserve a calm single-column mobile reading order.
- Fields: name, Indian mobile phone, service cards (1–3 distinct enabled services), preferred barber (default Any; only on-duty barbers). Apply the shared exact validation. An on-duty barber on break may be chosen with an explicit warning and unavailable estimate; Off Duty is not selectable. Never silently replace a selected barber.
- Each service card shows EN/GU name, minutes and rupee price. Sample data: Haircut ₹150 / 30 min; Beard trim ₹80 / 15 min; Hair spa ₹400 / 45 min. A sticky summary shows total price, service duration and estimated wait, updated on selection.
- Confirm submits once to the trusted public boundary; validate again against current settings, roster and catalog. Create a continuous non-resetting token and navigate to private status only after confirmed admission. A fourth service is prevented with an accessible limit message. Back returns to Home without joining; browser back after success must not resubmit.
- Duplicate: resume existing entry only if customer has its private tracking credential; otherwise show generic active-entry notice and contact reception. Never reveal another person's details from phone number alone. If service becomes unavailable, retain valid selections and ask for review. Closed queue blocks confirm.
- If price or duration changed after selection, reject admission, show updated totals and require explicit reconfirmation; never accept stale values or silently change the agreed summary. Same-request retries after successful admission return the original result even if the catalog or cutoff changed afterward.
- Empty catalog/no on-duty barber: explain unavailability. Loading skeleton, inline validation, retry on failure; preserve form input. Stack on phones; optional two-column layout on desktop.
- Acceptance: correct 1–3 selection, totals, preference and validation; one confirmed entry per active phone.

## 3. My Status — `/status/:id`
**User and goal:** Customer; know when to arrive and whom to approach.
- Visual hierarchy: token first, truthful current state and wait second, selected details below. Use Inter/tabular numerals for the token and timer; reserve gold for the token/Called emphasis. Keep cancellation visually secondary and the break/connection warnings easy to find.
- Large token, current status, selected services with booked totals, preferred/assigned barber and last update. Label Any Barber's number “Global waiting position”; label named-barber position “Position for [barber]”. Explain that barber preferences can affect actual order. Position exists only while Waiting.
- Waiting: show position and approximate wait; when position is 2, show arrival reminder. When Called, show a prominent gold turn alert with assigned barber and optional vibration where supported. In Chair: show service underway. Done: thank-you message. Cancelled/No-show: terminal explanation and link to Home, with rejoining subject to rules.
- Cancel spot is enabled only while Waiting and requires confirmation; server checks state. Preserve tracking credential on refresh; invalid/expired credential yields a generic message, not data leakage.
- If preferred barber is on break, show a warning and unavailable estimate. No working barbers: explain uncertainty. Offline: show last known state with timestamp, retry on reconnection. Mobile-first token-centric layout.
- A relevant ongoing service at or beyond planned duration shows “Service taking longer than estimated — wait uncertain”, never a rolling five-minute promise or misleading zero. Arrival reminders use the documented displayed position; if it reaches two while the selected barber is on break, retain the break/uncertainty warning rather than implying immediate service.
- Cancel must recheck Waiting atomically. If Call Next won the race, show Called and the assigned barber instead of a false cancellation success. Done, Cancelled and No-show show terminal guidance without position/countdown/cancel controls. An expired terminal link has the generic unavailable state.
- Acceptance: status and wait update without refresh; a call reaches the customer within the normal five-second target; cancellation and terminal states are correct.

## 4. Reception Dashboard — `/reception`
**User and goal:** Authenticated receptionist or owner; manage the queue.
- Header: compact SalonQ identity, salon status, connection state, sign-out and Add Walk-in. Use an original organized workspace with aligned barber cards/queue columns, stable action placement and restrained density; avoid ornamental dashboard cards.
- Barber cards: duty/break status, current token/name, remaining service estimate, Call Next button (only available barber with eligible customer). No reassignment while occupied.
- Waiting list ordered by arrival: token, name, services, preference, wait duration and Cancel. Called entries shown in a separate section with elapsed time since call and No-show enabled at ten minutes. Highlight waits over 60 minutes with text and amber styling.
- Add Walk-in opens a form with the same customer/service validation; bypass online cutoff only while salon is operating. Confirm adds to the same queue. Do not show full phone numbers unnecessarily.
- Walk-ins bypass the manual online switch as well as the online cutoff, but require open hours, enabled services and an on-duty barber; all barbers on break is allowed with a warning. After No-show, Add again must reconfirm current enabled services and admission eligibility and allocate a fresh token/order at the tail.
- Use server-based Called elapsed time. At 9m59s No-show is disabled; at 10m00s it becomes eligible but still requires staff confirmation and backend validation. Highlight Waiting durations strictly above 60 minutes, not at exactly 60 minutes.
- No eligible customer: explain and keep Call Next disabled. If a competing action wins, refresh and report conflict. Tablet landscape uses barber cards beside/above list; mobile stacks.
- Acceptance: walk-ins share arrival ordering; staff can call, cancel and record eligible no-shows; all other views reflect actions.

## 5. Barber View — `/barber/:name`
**User and goal:** Authenticated barber; manage their assigned customer. Route name is a stable slug, not authorization.
- Visual hierarchy: compact SalonQ header, current assignment, large Start/Done action, then next preview and duty controls. Use clean neutral cards and generous touch spacing rather than a miniature desktop dashboard.
- Header: barber name, duty and availability; sign-out. Assigned customer card: token, name, services, expected duration and timer based on persisted start timestamp.
- Called: Start moves to In Chair. In Chair: Done completes service. No assignment: show available/break/off-duty state and next eligible customer preview (read-only). Do not let a barber call or assign customers independently.
- Break toggle only when no active assignment; available resumes eligibility when on duty. Confirm completion if necessary; failed action retains previous state. Timer survives refresh.
- Called reserves the barber before Start. Confirm Done to reduce accidental terminal transitions. Keep available/on-break separate from occupied state. On Break cannot be enabled while Called or In Chair; Off Duty remains owner-managed. Start/Done timestamps and the elapsed timer are server-derived, including across midnight.
- Mobile layout with large action buttons. Reject attempts to access another barber's record.
- Acceptance: authorized Start/Done only, accurate timer, correct break behavior, updates propagate to reception, customer and TV.

## 6. Waiting Area TV — `/display`
**User and goal:** Public read-only display; show queue progress without personal information.
- Dedicated full-screen layout; configured salon branding with a restrained SalonQ identity, clock and connection status. Keep sans-serif distance-readable typography, generous token spacing, neutral current-service panels and selective gold for the newly Called token.
- Large row/card for each barber: name, state and active token (Called or In Chair). List the next five Waiting tokens in arrival order with approximate waits; this is informational, not a guarantee of assignment order.
- Newly called token pulses briefly; optional chime after a user enables browser audio. Honor reduced motion, no rapid flashing. Display no customer names, phone numbers or private tracking IDs.
- Highlight a newly observed Called transition for about five seconds and deduplicate sound by token/call timestamp. Initial load or reconnect displays current state without replaying old chimes. Provide user-triggered full-screen and Enable sound/Mute controls; denied audio/fullscreen permission does not block the visual display.
- No waiting customers: clear empty message; closed queue: note that existing customers may still be served. Offline: prominently label stale state and reconnect.
- Acceptance: readable from approximately five metres on a suitable TV, no navigation required, automatic updates and safe public payload.

## 7. Owner Settings — `/admin`
**User and goal:** Authenticated owner; manage configuration and inspect today's activity.
- Visual hierarchy: compact SalonQ identity, aligned operational statistics, then clearly separated catalog/duty/admission sections. Use Inter throughout, consistent label-value alignment, neutral table rows and selective gold Add/Save actions; no decorative charts or unrelated modules.
- Stats: Done count, average time from join to call for Done customers, No-show count, using salon-local date. Display dash for average if no completed customer exists.
- Services table/cards: EN/GU name, positive duration, nonnegative price, enabled status. Add/edit/toggle forms, validation and confirmation where appropriate. Existing entries retain their booked service snapshots.
- Apply the shared exact catalog bounds. Use enable/disable rather than hard deletion. No staff signup, role editor, barber-account CRUD or destructive queue reset is included. Existing barber profiles/accounts are provisioned through trusted administration.
- Barber roster: mark on duty/off duty; reject off-duty changes for occupied barbers. If waiting customers explicitly selected a barber, warn and reject taking that barber off duty until their entries are resolved (break remains possible).
- Salon settings: opening/closing time and manual online queue switch. Show computed cutoff and actual eligibility, distinguish manual closure from closing-hour restriction.
- Validate a same-day opening interval of at least 30 minutes with opening before closing. Defaults: 10:00–21:00 IST. Changes apply to new admission immediately; they never expire existing entries. Opening the manual switch cannot admit before opening, at/after the online cutoff, or without the other eligibility conditions. Reject stale concurrent settings saves and require review instead of silently overwriting another owner's changes.
- Layout: desktop management sections; mobile stacked cards/forms. Empty lists, errors and successful save feedback. No destructive reset in public demo.
- Acceptance: enabled changes affect Join, settings affect actual server eligibility, stats reflect persisted transitions and access is owner-only.

## Design acceptance gate for later implementation

These are future visual QA checks, not executed application tests. All existing numbered business/security scenarios in `03-flows-rules.md` remain required and unchanged.

- [ ] SalonQ name, full name, tagline and reusable Lucide scissors/Inter lockup follow the brand treatment; salon-specific branding remains visible where required.
- [ ] One CSS-variable/Tailwind token source supplies the refined palette; no conflicting old palette or arbitrary per-screen gold styling remains.
- [ ] Normal text, input boundaries, focus states, error copy, hover and selected states meet their contrast targets on their actual composited backgrounds, including elevated surfaces.
- [ ] Inter, selected English Playfair heroes and Noto Sans Gujarati follow the hierarchy; real distribution licenses/notices are verified and retained when local font files are added.
- [ ] Missing fonts and slow font loads keep content readable; Gujarati shaping, diacritics, wrapping and 200% text zoom do not clip essential information.
- [ ] 320px/390px mobile, tablet, laptop/desktop and 1920×1080 TV layouts preserve hierarchy and actions; the 1280×720 TV fallback remains usable.
- [ ] All actions work by keyboard, visible focus is preserved, dialogs manage focus, and interactive targets are at least 44px.
- [ ] Loading, empty, error, success, pending, unavailable, overrun and disconnected presentations use consistent components and truthful copy in EN/GU.
- [ ] Reduced motion, audio denial and realtime bursts keep the interface calm; no rapid flashing, layout jumping or focus stealing occurs.
- [ ] Original visual composition uses no copied proprietary assets, distinctive reference layouts, unlicensed fonts or extra product scope; phase boundaries and backend security remain intact.
