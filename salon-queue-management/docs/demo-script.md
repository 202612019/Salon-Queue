# SalonQ — Three-Minute Demonstration Script

**Approved production audit:** 03997cd, 24 November 2026. **Target:** 3 minutes; rehearse and trim pauses to fit 180 seconds. This script is preparation, not evidence that a video has been recorded.

**Live application:** [SalonQ](https://salon-queue-snowy.vercel.app/)

**Repository:** [202612019/Salon-Queue](https://github.com/202612019/Salon-Queue)

## Before recording — not spoken

- Prepare customer, Reception, linked Barber, TV and Owner tabs in separate browser profiles so staff logins do not replace one another. Sign in before recording; keep passwords, authorization headers and private tracking capabilities out of the video.
- Use only your own fictional customer. Rehearse during permitted salon hours; do not bypass closing rules or modify an unrelated existing entry. If admissions are closed, explain the disabled controls and use a permitted prerecorded segment or an explicitly labelled preview. Never present a fictional preview as a successful live admission.
- Select a barber whose eligible queue you can safely demonstrate. Enable TV sound by user gesture; sound/fullscreen permission may be denied. Use the actual issued token and current catalog totals, not a promised token or fabricated statistics.
- The spoken sections below allow time for screen changes. Preserve the final verification limitations when trimming.

## 0:00–0:20 — Home and purpose

“This is SalonQ — Smart Salon Queue Management: Your Time. Your Turn. It connects customers, reception, barbers, the waiting-area display and the owner through one persistent queue. Customers can spend less time waiting at the salon and follow their turn privately.”

Show Home branding, current salon availability and authoritative queue information.

## 0:20–0:55 — Join and private Status

“On Join Queue, I enter fictional details, select one to three services and choose Any barber or a specific barber. The summary shows current prices and durations. Confirmation creates a unique token and opens my private queue pass. No customer account or SMS verification is required. This pass shows my position and approximate wait, with an arrival reminder at position two.”

Demonstrate selection/totals and your own pass. Hide private link credentials.

## 0:55–1:25 — Reception

“Reception sees the same ordered queue. Add Walk-in uses the same service and duplicate-phone rules, but remains available later than online admission, until salon closing. Call Next chooses the earliest eligible customer for this barber. It respects a named preference and reserves only one assignment. No-show is allowed only after ten server-measured minutes.”

Show Add Walk-in without creating an unnecessary extra record; call only your own eligible fixture.

## 1:25–2:00 — TV and linked Barber

“The public TV shows tokens and barber states, with no customer names or phone numbers. A new call produces a visual alert and an optional chime. The assigned barber starts service, then confirms Done. The elapsed timer uses persisted server timestamps. Other authorized screens refetch automatically; waiting times remain estimates, not guaranteed countdowns.”

Show Called, Start and confirmed Done only when your fixture is ready. Do not claim a measured latency from this recording unless you measure it.

## 2:00–2:20 — Owner and Gujarati

“The owner manages bilingual services, prices, durations, duty and online availability. Daily statistics use IST. I can switch the interface to Gujarati. Staff permissions are checked on the backend; changing a URL cannot grant another role.”

Show Owner and a language toggle. Do not save configuration changes merely to demonstrate a dialog.

## 2:20–3:00 — Verified results and honest limits

“The approved audit passed 140 frontend tests, 167 SQL assertions, 45 database and concurrency checks, 22 hosted integration checkpoints and 17 hosted security safeguards. Of 91 acceptance scenarios, 81 passed, none failed and 10 remain not run. Full responsive, Gujarati clipping, accessibility and physical-device verification is incomplete. The evidence and limitations are documented in the repository. SalonQ is deployed on Vercel with Supabase, and ready for this college demonstration.”

Leave the production URL and repository visible. Timing depends on speaking pace; rehearse the complete recording.

## Verification reference — not spoken

The remaining IDs are **T31, T32, T33, T38, T39, T52, T72, T81, T83 and T91**. See [final verification](final-verification.md), [individual acceptance evidence](acceptance-evidence.md) and [manual visual checks](visual-audit.md). Existing five-client timings are earlier audit evidence, not a guarantee for this video. A script or general manual approval does not complete these outstanding tests.
