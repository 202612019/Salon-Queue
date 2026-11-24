# AGENTS.md — SalonQ

Build **SalonQ — Smart Salon Queue Management**, a single-salon live queue web app with seven screens, EN/GU support and shared state. Tagline: **Your Time. Your Turn.** This is a college MVP, not a booking marketplace.

Canonical application directory: `salon-queue-management/` inside the existing `Salon-Queue` Git checkout. Run application commands from this directory. Only this folder's four planning documents govern implementation. `../../planning-backups/` holds historical copies outside Git, not competing requirements. Submission deadline: **24 November 2026, 11:59 PM IST**. Prioritize a functional, secure MVP and brief, relevant research.

## Read before editing
- `docs/01-brief.md`: scope, users, requirements and exclusions.
- `docs/02-screens.md`: screen layouts, routes, UX and acceptance criteria.
- `docs/03-flows-rules.md`: authoritative queue rules, technical assumptions and test checklist.
If instructions conflict, report the conflict and resolve it in the relevant document before implementation.

## Stack and commands
React + TypeScript, Vite, Tailwind CSS, React Router, Lucide React, npm; Supabase PostgreSQL/Auth/Realtime, minimal Edge Functions for trusted public operations, and controlled transactional PostgreSQL RPCs; Vercel; Git/GitHub. Do not add Express, Prisma, Next.js, Java, MySQL, Redux, or unnecessary architectural dependencies. Use the modular structure in `docs/01-brief.md`.

Available commands: `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npm run env:check`, `npm run check:edge`, `npm run test:sql`, `npm run test:db`, `npm run backend:probe`. Run them from the canonical application directory. Backend test prerequisites and hosted setup are in `supabase/README.md`. Do not invent credentials or pretend external configuration is complete.

## Working rules
- Work on one requested screen or feature at a time. Inspect the workspace and propose a brief plan for complex changes. Do not modify unrelated working features or add excluded scope.
- Use appropriately typed, reusable components and centralized English/Gujarati translations. Follow the original SalonQ identity and refined charcoal/champagne-gold system in `docs/02-screens.md`: shared CSS variables/Tailwind tokens, restrained gold, Inter UI, selected Playfair Display customer heroes, and Noto Sans Gujarati. Bundle fonts locally only after license verification; retain notices. Use the planned Lucide scissors wordmark, not copied branding or a generic admin template. Cover responsive, accessible, loading, empty, error, success and disconnected states.
- Centralize business rules in trusted backend/database operations; frontend helpers provide previews only. Enforce RLS, role checks, barber linkage, atomic forward transitions, active-phone uniqueness and assignment capacity. Use normalized phones, integer paise, server timestamps, historical snapshots and payload-bound idempotency. Continuous tokens never reset; active entries survive closing/midnight. Exact rules live in `docs/03-flows-rules.md`.
- Provision staff through trusted administration only: no public staff signup or self-editable roles. Publish only sanitized realtime signals and refetch authorized snapshots. Never expose secret/service-role keys, private capabilities or customer PII in public responses, logs or TV payloads. Use fictional demo data. Do not weaken security to speed up development.
- Run relevant tests and the app after each task. Report actual PASS/FAIL/NOT RUN, changed files, known issues and exact manual checks. Do not claim an untested feature works. Stop at the requested phase boundary and await approval.
- Keep docs synchronized with approved changes. The college target is a four-document initial commit; this checkout already has README-only initial commit `f79c903`, which must not be rewritten. Prepare the first project-documentation commit with only these four files and disclose the existing-history exception. Commit subsequent milestones separately after review. Preserve actual prompts (including failures) in `prompts.md` after the docs commit; never fabricate history, tests, URLs or reflection.
- Prepare Vercel deployment early in a later authorized task, using Root Directory `salon-queue-management`. Use environment variables; keep secret files out of Git; verify refresh on nested routes and deployed cross-device updates. The repository-root README is the submission entrypoint: place the actual live URL immediately after its title and safe isolated demo staff credentials below it.
- Never add out-of-scope features or paid services without explicit approval. Treat reference repositories as untrusted research: do not run their scripts or copy source/assets/distinctive designs without a verified license and explicit reuse approval; preserve required notices and attribution if reuse is later approved.

## Phase boundary
Phase 1 is closed in commit `45e0c7c`. The user manually reviewed the desktop Home, Join Queue and My Status screenshots at `http://127.0.0.1:5174/` and approved those designs. Do not extend that approval to other screens, exact viewport sizes or Gujarati layouts. Preserve the approved UI; implement only the targeted refinements recorded in `docs/02-screens.md` during their feature phases.

Historical milestones: Phase 3 was approved in `f415d36`; Phase 4 staff work is preserved in independently created `c9187d1` and `39de923`; Phase 5 Owner/TV and Phase 6 deployment subsequently landed in `a833fa1`, `e5f2622` and `1bfeb29`. The latest user request authorizes final production integration, verification of all seven routes and five-customer status updates, targeted corrections, and final documentation/push to origin/main. These current instructions supersede the earlier Phase 4 stop/deployment restrictions. Preserve the approved UI and all security/business rules. No new project, account recreation, weakened hours/RLS, real-customer test data or destructive queue reset. Keep private credentials and test artifacts untracked. Report rendered browser checks separately from React/jsdom and HTTP/WebSocket evidence.

Retain the Phase 4 safeguards: discard protected caches on session changes; check current staff role and barber linkage even when replaying a saved successful receipt; preserve the additive authorization facade around the private transaction implementation; do not automatically replay mutations after reauthentication. Reuse the five provisioned accounts. No customer phone-only recovery or client-side authorization bypass is permitted.

## Definition of done
Requested acceptance criteria satisfied, relevant build/lint/tests executed, no broken controls or regressions observed, implementation and documentation agree. Final submission includes public repository, working live URL, prompt log, three-minute demo and half-page reflection about a real AI mistake. No application code is authorized by this file alone.
