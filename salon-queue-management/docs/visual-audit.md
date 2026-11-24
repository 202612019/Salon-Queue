# SalonQ — Rendered UI audit and manual completion sheet

24 November 2026, IST. Production: [SalonQ](https://salon-queue-snowy.vercel.app/).

The user approved audit **03997cd** for project closure. Its acceptance totals remain **81 PASS / 0 FAIL / 10 NOT RUN**. Closure approval does not convert the partial observations or the NOT RUN viewport matrix below into completed visual tests. Full approved test statistics are in [final-verification.md](final-verification.md).

## Observed in this audit

The browser provider inventory returned **“Local browser access is unavailable for this chat.”** A permitted native Windows Chrome workflow subsequently worked using screenshots and coordinates; the previous input-geometry blocker was not assumed permanent. No alternative browser-control library, injected script, remote debugging connection or access-control bypass was used.

Observed screen captures:

- **Home, English, existing desktop Chrome window:** charcoal/gold brand, typography, service catalog, disabled Join, explicit closed-hours explanation, clear illustrative pass and verified connection label were visible. The desktop viewport was not set to 1440 × 900, and only the visible region was reviewed.
- **Join, English, responsive emulation 390 × 844:** Chrome's Width and Height controls confirmed these dimensions. Header collapsed to mobile controls; details fields stacked; progress labels wrapped; the summary/confirmation was visible in a subsequent bottom-region capture. No obvious clipping appeared in the inspected regions. This does not certify every service card, every scroll position, validation state, or horizontal-overflow measurement.
- **Reception, English, existing desktop window:** a partial lower-region capture showed barber assignment cards, waiting-list search/preference controls, an empty filtered list, a Called row and a disabled early No-show action. This was an existing customer record; the agent did not change it. Window dimensions were not the specified desktop dimensions.

Captures were displayed through the native tool in this conversation. **No standalone screenshot files were saved or committed.** Private customer links, passwords and tracking capabilities were not copied into this document. No browser-console capture or automated layout metrics were obtained.

The user then interacted with the browser; the tool reported **“user input was detected in this window.”** Control was left with the user rather than repeatedly clicking against a changing page. The requested separate Owner sign-in was not observed as a ready audit session. The user reported “yes work properly, I checked that” and reported Add Walk-in not working. That is retained as user feedback, not extended to unobserved screen sizes or Gujarati layouts.

**Add Walk-in diagnosis:** production public snapshot at 21:22 IST returned `online=false`, `walk_in=false`, `reason=SALON_CLOSED` under the configured 10:00–21:00 interval. The existing Reception UI disables the button from that authoritative flag and displays hours/closing guidance. Local tests now explicitly verify disabled-with-explanation after closing and enabled/openable during the online cutoff while walk-ins remain allowed. No production opening hours were changed by the agent to force a test. Later the live configuration returned OPEN/walk_in=true; a separate real-hosted React/jsdom check verified the enabled button opens/closes its actual dialog without submitting. This is functional DOM evidence, not a new rendered viewport approval.

## Required viewport matrix

“PARTIAL” below is an observation, not an acceptance PASS. All unchecked full-screen viewport combinations remain NOT RUN.

| Screen | 390 × 844 | 768 × 1024 | 1440 × 900 | 1920 × 1080 |
|---|---|---|---|---|
| Home `/` | NOT RUN | NOT RUN | NOT RUN — unsized desktop partial only | NOT RUN |
| Join `/join` | PARTIAL — English top/summary only | NOT RUN | NOT RUN | NOT RUN |
| Private Status `/status/:id` | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Reception `/reception` | NOT RUN | NOT RUN | NOT RUN — unsized desktop partial only | NOT RUN |
| Linked Barber `/barber/:name` | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| TV `/display` | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Owner `/admin` | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Staff Login `/login` | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

Gujarati rendered glyph shaping, all-route clipping, 320px/200% zoom, keyboard/focus, actual contrast, physical-TV distance and audible chime checks remain NOT RUN. Prior English/Gujarati React/jsdom toggles verify translated DOM content, not pixel layout.

## Exact manual procedure for the student

1. Open the production site in Chrome. Press F12, then Ctrl+Shift+M. Select **Responsive**, enter the exact Width and Height above, and keep browser zoom at 100%. Device scaling “Fit to window” is acceptable, but record that the emulated CSS dimensions are the listed numbers. Repeat for all four viewports.
2. Inspect all eight rows in the matrix in English and Gujarati. Scroll from top to bottom. Look for page-wide horizontal scrolling, clipped text, overlapping controls, truncated dialog actions, unreadable labels, missing Gujarati glyphs and content hidden beneath sticky elements. Record each combination as PASS/FAIL with date and actual viewport; leave anything untested as NOT RUN.
3. On mobile, open and close the menu, follow Home/Join/My Status links and verify route changes. Use only the explicit `/status/preview` for layout-only checks; label its screenshot fictional. A real private Status check needs **your own newly created fictional entry**, and its full private URL must never appear in screenshots, public recordings or submissions.
4. Test Join validation with blank/invalid details during permitted opening hours, one/two/three services, prices/durations, relevant break warning and summary. During closing, verify the reason and disabled confirmation; do not change production hours just for this audit. Local isolated tests cover exact clock boundaries.
5. Sign in with the existing demo identities using privately supplied passwords. Reception: inspect normal/filtered/empty table, Add Walk-in modal when admission is permitted, and Called/No-show controls. Barber: inspect linked current/empty work and Start/Done confirmations. Owner: open Add/Edit Service and hours confirmation dialogs and close them **without saving changes** merely to inspect layout.
6. Use Tab, Shift+Tab, Space/Enter and Escape. Confirm visible focus, logical ordering, field labels/errors, dialog focus trapping and return to the triggering control. Repeat at 320px Gujarati and 200% text zoom. Check actual target dimensions (at least 44px) and contrast in DevTools; appearance alone is not a contrast measurement.
7. On TV at 1920 × 1080, inspect all barber stations, the next-five layout, clock, public privacy, large token readability and Fullscreen. Check from the intended viewing distance. Enable sound by user gesture, then test a new call for **your own** fixture during normal operating conditions; denied sound/fullscreen must leave usable visual guidance.
8. In DevTools Console, clear messages, navigate all routes and record errors without copying private payloads/tokens. In Network, inspect status codes and failed assets; redact all authorization headers and private POST bodies. Refresh nested routes directly and confirm they do not return 404.
9. For actual network recovery (T33), keep your own active status open, switch DevTools Network to Offline, verify stale warning/actions disabled, restore connectivity and wait for fresh verified state. Do not interpret a background tab suspended by the browser as a failed foreground five-second test.
10. For T31/T32/T52, use separate real devices/tabs as described in [the acceptance ledger](acceptance-evidence.md): observe customer, Reception, linked Barber and TV together; note request/visible-update times; sign out in one shared-session staff tab and verify protected content clears in the other. Never call, cancel or complete a pre-existing customer's record. Resolve only the fixtures you just created through allowed transitions.

Suggested screenshot filenames: `home-en-390x844.png`, `join-gu-768x1024.png`, `reception-en-1440x900.png`, `display-gu-1920x1080.png`. Include route, language, viewport and state in a private test log. Do not publish screenshots containing customer names, staff passwords, developer-tool authorization headers or private tracking links.

No complete visual approval is claimed by this document. Follow the matrix to finish T38, T39 and T83 and record actual evidence before marking them passed.
