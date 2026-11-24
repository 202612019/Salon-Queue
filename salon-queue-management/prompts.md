# SalonQ — Actual development prompts

This log records the Phase 1 prompts available in this conversation, in order. Formatting whitespace is normalized; wording below is transcribed from actual user messages. Earlier planning and design prompts have not yet been transcribed here; this is not a claim of complete project prompt history. No invented prompts or test results are included. The full conversation retains the implementation attempts, dependency failures and browser-verification failures.

## Phase 1 implementation approval

> # Phase 1 — Frontend Implementation Approval
>
> All four planning documents, the proposed architecture, SalonQ branding, and the premium UI/UX design specifications are approved.
>
> You are now authorized to begin Phase 1 implementation.
>
> Act as a senior frontend developer, UI/UX designer and software engineer.
>
> ## Instructions
>
> 1. Read the latest AGENTS.md and all three canonical documentation files.
> 2. Use the existing canonical project directory: `Salon-Queue/salon-queue-management/`
> 3. Verify that the four approved planning documents are staged correctly and create the documentation-only commit: `docs: establish salon queue project requirements and development rules`
> 4. Initialize the application using React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React and npm.
> 5. Implement the previously approved Phase 1 frontend foundation according to the latest documentation.
>
> ## Design requirements
>
> - Application name: SalonQ — Smart Salon Queue Management
> - Tagline: Your Time. Your Turn.
> - Premium charcoal and champagne-gold theme.
> - Inter, Playfair Display and Noto Sans Gujarati typography.
> - Original, commercially credible visual identity.
> - Consistent reusable UI components.
> - Mobile-first responsive design.
> - Accessible controls and readable typography.
> - Restrained, polished micro-interactions.
> - Centralized English and Gujarati translations.
>
> Do not create a generic admin template or leave the default Vite interface.
>
> ## Implementation requirements
>
> Create the modular frontend architecture, shared layouts, reusable components, design tokens, environment configuration and route shells for:
>
> - `/`
> - `/join`
> - `/status/:id`
> - `/reception`
> - `/barber/:name`
> - `/display`
> - `/admin`
>
> Also provide the staff login route, Not Found page and error handling.
>
> The seven route shells should look polished and visually representative of the final product, not merely blank pages with screen names.
>
> Clearly identify fictional preview data. Do not represent sample data as live information.
>
> Do not implement fake authentication, fake successful queue operations or client-side authorization bypasses.
>
> ## Visual quality
>
> Inspect the actual rendered application using available browser tools.
>
> Verify layouts at:
>
> - 390 × 844 mobile
> - 768 × 1024 tablet
> - 1440 × 900 desktop
> - 1920 × 1080 TV display
>
> Check typography, spacing, alignment, visual hierarchy, Gujarati text rendering, responsive behavior, accessibility and consistency.
>
> Where possible, capture screenshots of all seven screens.
>
> Fix reproducible visual issues before completing this phase.
>
> ## Testing
>
> Run the applicable development, build, lint and test commands.
>
> Report actual PASS, FAIL or NOT RUN results.
>
> Do not mark any of the 91 acceptance scenarios as passed unless the corresponding functionality has been implemented and tested.
>
> ## Git
>
> After successful Phase 1 verification, create a separate implementation commit:
>
> `feat: initialize SalonQ frontend and premium design system`
>
> Preserve existing Git history.
>
> Do not commit credentials, local environment files, node_modules or generated build output.
>
> Do not push without approval.
>
> ## Final report
>
> Provide:
>
> 1. Implementation summary.
> 2. Created folder structure.
> 3. Installed dependencies.
> 4. Implemented routes and components.
> 5. UI design decisions.
> 6. Responsive verification results.
> 7. Screenshots, where available.
> 8. Actual test results.
> 9. Production build results.
> 10. Local development command and URL.
> 11. Git commit details.
> 12. Remaining limitations.
> 13. Requirements

## Continuation messages

The next user instructions were, in order:

> continue task

> continue

## Desktop design review and Phase 1 closure

> # SalonQ — Frontend Design Review and Approval
>
> I have manually opened and reviewed the rendered SalonQ application at [http://127.0.0.1:5174/](http://127.0.0.1:5174/).
>
> The desktop Home, Join Queue and My Status designs are visually approved as the foundation for further development.
>
> Preserve the existing implementation, branding, typography, charcoal/champagne-gold palette, navigation, digital queue pass and reusable components.
>
> Do not redesign the entire application.
>
> Record the following targeted UI improvements for implementation during the respective feature-development phases:
>
> ## Home
>
> - Reduce excessive hero whitespace.
> - Bring salon availability and live queue statistics closer to the top.
> - Consider a tasteful, optimized, appropriately licensed salon photograph.
> - Improve barber cards with consistent fictional avatars.
> - Add featured services with prices and durations from the authoritative catalog.
> - Improve the visual presentation of the three-step customer journey.
>
> ## Join Queue
>
> - Add a clear three-step progress indicator without unnecessarily replacing the existing desktop layout.
> - Display the selected-services count out of the maximum of three.
> - Preserve the existing service cards and sticky summary.
> - Add accessible selection feedback when functionality is connected.
> - Show barber-specific warnings only when relevant.
> - Optimize the mobile confirmation experience.
>
> ## My Status
>
> - Preserve the existing digital queue pass.
> - Add an elegant circular estimated waiting-time visualization without implying a guaranteed countdown.
> - Improve the visual status progression.
> - Provide a secure Copy Status Link action.
> - Implement a prominent gold Called notification showing the assigned barber.
> - Support accessible status announcements and reduced motion.
>
> ## General
>
> - Preserve all approved requirements and security controls.
> - Maintain English and Gujarati translations.
> - Use centralized design tokens.
> - Avoid unnecessary dependencies and excessive animation.
> - Keep fictional previews clearly identified until actual functionality is available.
> - Never display fabricated live statistics.
> - Do not use unlicensed images.
>
> ## Close Phase 1
>
> Inspect the current implementation and Git status.
>
> Record that the user manually reviewed the desktop Home, Join Queue and My Status screenshots. Do not claim that other screens, viewport sizes or Gujarati layouts were visually verified.
>
> Run the existing build, lint and automated frontend tests.
>
> If the automated checks pass, create the Phase 1 implementation commit if it does not already exist.
>
> Commit message:
>
> `feat: initialize SalonQ frontend and premium design system`
>
> Defer nonessential cosmetic improvements to the relevant feature phases.
>
> Do not repeat the entire frontend implementation or conduct lengthy additional planning.
>
> Report the commit hash, actual test results, remaining limitations and readiness for Phase 2.
>
> Stop after closing Phase 1.

## Phase 2 authorization — 24 November 2026

> I have successfully created the Supabase project and configured VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the .env.local file inside the canonical application directory.
>
> Verify the environment configuration without printing credentials. Ensure .env.local is ignored by Git and .env.example contains only placeholders.
>
> Proceed with the approved Phase 2 implementation. If database migrations or Edge Function deployment require additional authorization or manual configuration, provide exact instructions.
>
> Do not expose privileged credentials or modify the existing frontend design unnecessarily.
>
> Start implementation now.

Continuation message received during this task:

> continue

## Phase 2.5 authorization — 24 November 2026

> # Phase 2.5 — Hosted Supabase Activation and Integration Verification
>
> The Phase 2 local backend implementation is approved.
>
> Existing commits:
>
> - d969aad — Project planning documentation
> - 45e0c7c — SalonQ frontend foundation
> - 8463614 — Secure Supabase backend foundation
>
> Reported verification:
>
> - Production build: PASS
> - Lint: PASS
> - Edge type-check: PASS
> - Automated tests: 38/38 PASS
> - SQL assertions: 63 PASS
> - Database integration checks: 37 PASS, including six concurrency cases
>
> Our submission deadline is tonight. Prioritize hosted backend activation and working functionality.
>
> ## 1. Review existing implementation
>
> Read:
>
> - AGENTS.md
> - docs/01-brief.md
> - docs/02-screens.md
> - docs/03-flows-rules.md
> - supabase/README.md
> - All existing Supabase migrations
> - Existing Edge Functions
> - Existing backend service adapters
>
> Do not regenerate the backend, rewrite migrations unnecessarily, repeat repository research or redesign the frontend.
>
> ## 2. Verify hosted project configuration
>
> Inspect the existing .env.local without displaying its values.
>
> Verify:
>
> - Supabase project URL
> - Publishable key format
> - Git protection
> - Correct target project
> - Hosted project connectivity
>
> Determine whether an authorized Supabase CLI session or other supported management connection is available.
>
> The frontend publishable key does not authorize database migration or administrative operations.
>
> If additional authentication is required, provide the exact commands or dashboard actions I must complete locally.
>
> Do not ask me to send passwords, secret keys or access tokens into the conversation.
>
> ## 3. Activate hosted Supabase
>
> Follow the existing supabase/README.md instructions.
>
> Complete all authorized and feasible setup tasks:
>
> 1. Disable public staff signup while preserving provisioned staff sign-in.
> 2. Apply existing database migrations in their correct order.
> 3. Verify that all required tables, indexes, constraints and functions exist.
> 4. Verify Row Level Security and database execution permissions.
> 5. Apply reproducible fictional salon seed data.
> 6. Configure sanitized Realtime publication.
> 7. Configure the Edge Function's required environment variables and allowed origins.
> 8. Include the current local development origin, http://127.0.0.1:5174, where appropriate.
> 9. Deploy the existing Edge Function.
> 10. Verify the deployed function responds correctly.
>
> Do not disable RLS or weaken authorization to resolve setup errors.
>
> Do not execute destructive database resets.
>
> If hosted setup requires actions that I must perform manually, pause only those dependent operations and give me exact instructions, including the relevant file paths and commands.
>
> Continue any independent verification that remains possible.
>
> ## 4. Provision fictional demonstration accounts
>
> Provision role-limited demo accounts for:
>
> - Receptionist
> - Owner
> - Ravi — Barber
> - Amit — Barber
> - Imran — Barber
>
> Use Supabase Auth and protected staff_profiles records.
>
> Ensure each barber is associated with the correct barber record.
>
> Use fictional identities.
>
> Do not enable public staff registration.
>
> Do not grant administrator or service-role privileges to demonstration users.
>
> Provide a secure local procedure for assigning and managing demonstration passwords.
>
> Do not commit passwords or privileged keys.
>
> ## 5. Hosted backend smoke tests
>
> Actually verify the following wherever hosted access permits:
>
> - Public salon overview is accessible.
> - Enabled services are available.
> - Safe barber availability is available.
> - Anonymous requests cannot read private queue records.
> - Customer admission generates a unique token.
> - Duplicate active phone numbers are rejected safely.
> - Admission retries do not create duplicate entries.
> - Private customer tracking works.
> - Invalid tracking capabilities are rejected.
> - Receptionist authentication works.
> - Owner authentication works.
> - Barber authentication and role isolation work.
> - Call Next respects barber preferences.
> - Start and Done enforce valid transitions.
> - Sanitized realtime signals arrive after successful mutations.
> - Public TV payloads do not expose personal information.
>
> Use fictional test records only.
>
> Respect operating-hour and other business rules during testing. Use the existing isolated test mechanisms for timing-boundary scenarios rather than weakening hosted business rules.
>
> Distinguish local test results from hosted test results.
>
> Do not mark unexecuted checks as passed.
>
> ## 6. Prepare frontend integration
>
> Confirm that existing typed services and hooks can communicate with the deployed backend.
>
> Report whether the following operations are ready for Phase 3:
>
> - Public salon overview
> - Service catalog
> - Barber availability
> - Customer admission
> - Private status tracking
> - Customer cancellation
> - Staff authentication
> - Reception operations
> - Barber operations
> - Owner operations
> - Realtime subscriptions
>
> Do not redesign or regenerate existing frontend pages.
>
> ## 7. Security and Git requirements
>
> - Keep .env.local ignored and untracked.
> - Keep .env.example limited to placeholders.
> - Never expose privileged credentials in frontend code.
> - Preserve existing commits.
> - Commit only necessary setup corrections or documentation changes.
> - Do not push without approval.
> - Do not deploy the frontend to Vercel yet.
>
> ## 8. Final report
>
> Provide:
>
> 1. Hosted Supabase setup status.
> 2. Applied migration status.
> 3. Database tables and function verification.
> 4. Seed data status.
> 5. Staff account provisioning status.
> 6. Edge Function deployment status.
> 7. Realtime verification.
> 8. Hosted smoke-test results.
> 9. Remaining manual actions, if any.
> 10. Changed files and Git status.
> 11. Readiness for functional frontend integration.
>
> IMPORTANT:
>
> Do not spend time rebuilding the existing backend.
>
> If you require my intervention, give me the exact next command or dashboard action instead of another lengthy planning report.
>
> Complete hosted backend activation and verification before declaring readiness for Phase 3.
>
> Stop after Phase 2.5.

Additional user instruction:

> remember we have complete project before today night so work fast

## Phase 3 authorization — 24 November 2026

> # Phase 3 — Functional Customer Experience and Live Queue Tracking
>
> Phase 2.5 is approved and complete.
>
> Latest commit: d3c3b2f.
>
> Hosted Supabase has been activated, migrations applied, fictional salon data seeded, five staff accounts provisioned, and salonq-api deployed.
>
> Reported verification:
>
> - Hosted smoke tests: 27/27 PASS
> - Database metadata checks: 14/14 PASS
> - Automated tests: 41/41 PASS
> - Build, lint and Edge type-check: PASS
> - Sanitized realtime delivery: observed 1.94 seconds
>
> You are authorized to begin Phase 3 immediately.
>
> Act as a Senior Full-Stack React Developer, Supabase Integration Specialist, UI/UX Engineer and QA Engineer.
>
> ## 1. Review existing implementation
>
> Read:
>
> - AGENTS.md
> - docs/01-brief.md
> - docs/02-screens.md
> - docs/03-flows-rules.md
> - supabase/README.md
>
> Inspect the existing frontend components, domain types, Supabase services, Edge Function contracts, authentication infrastructure and realtime hooks.
>
> Reuse the implemented backend operations.
>
> Do not rebuild the database, repeat migrations, regenerate the React application or redesign the existing UI.
>
> ## 2. Scope
>
> Implement functional versions of only these three customer-facing screens:
>
> 1. Home — /
> 2. Join Queue — /join
> 3. My Status — /status/:id
>
> Preserve the SalonQ brand, premium charcoal/champagne-gold design, typography, digital queue pass and reusable components.
>
> Reception, Barber, TV and Owner screens will be connected in subsequent phases.
>
> ## 3. Home screen integration
>
> Replace fictional homepage statistics with authorized public Supabase data.
>
> Implement:
>
> - Actual salon name.
> - Current opening and closing hours in IST.
> - Open, closed and online-admission status.
> - Actual waiting customer count.
> - Estimated waiting time.
> - Number of working or on-duty barbers, clearly labeled.
> - Actual barber availability.
> - Enabled service catalog with prices and durations.
> - Functional Join Queue navigation.
> - Existing customer status resume when a valid saved capability exists.
> - Automatic data refresh through sanitized realtime signals.
>
> Disable online joining when admission is closed and explain the reason.
>
> Handle loading, empty, disconnected, unavailable-estimate and error states.
>
> Remove fictional preview labels from successfully connected sections.
>
> Never display mock statistics as live information.
>
> ### Targeted UI improvements
>
> - Reduce excessive hero whitespace.
> - Bring actual salon availability and queue statistics closer to the top.
> - Preserve the existing layered queue pass concept.
> - Add a compact featured-services section using real catalog data.
> - Improve information hierarchy without replacing the approved design.
>
> Any homepage example token must remain clearly marked as illustrative and must not link to another customer's private entry.
>
> ## 4. Join Queue integration
>
> Activate the existing customer form and service-selection components.
>
> Implement:
>
> - Customer name input.
> - Indian mobile-number input and normalization.
> - Optional +91 prefix.
> - One to three distinct enabled services.
> - Preferred barber selection.
> - Any Barber option.
> - Actual prices and service durations.
> - Dynamic selection summary.
> - Selected-services counter.
> - Authoritative estimated waiting time.
> - Clear confirmation action.
> - Validation errors.
> - Submission loading state.
> - Duplicate-submission protection.
> - Queue-closed handling.
> - Disabled-service handling.
> - Barber availability warnings.
>
> Preserve the existing two-column desktop layout and optimize the mobile experience.
>
> Use a clear three-step visual structure:
>
> 1. Your details.
> 2. Select services.
> 3. Choose barber and confirm.
>
> Do not unnecessarily rebuild the existing form into a complex wizard.
>
> Display warnings about barber breaks only when relevant.
>
> ## 5. Actual customer admission
>
> Connect the Confirm and Join Queue action to the existing secure admission operation.
>
> The backend must remain authoritative for:
>
> - Validation.
> - Phone normalization.
> - Service availability.
> - Price and duration.
> - Admission restrictions.
> - Duplicate active entries.
> - Token generation.
> - Queue ordering.
> - Tracking capability generation.
>
> Reuse the approved payload-bound idempotency and retry mechanism.
>
> Prevent duplicate entries caused by rapid clicks, network timeouts or uncertain submission responses.
>
> If service prices or durations change during submission, require the customer to review and reconfirm the updated selection.
>
> Do not expose another customer's status capability through duplicate-phone handling.
>
> After successful admission:
>
> - Display the actual generated token.
> - Securely preserve the authorized customer tracking capability using the approved resume mechanism.
> - Navigate to the actual private status route.
> - Show appropriate success feedback.
>
> Do not include names or phone numbers in URLs.
>
> ## 6. My Status integration
>
> Replace the fictional status page with capability-authorized backend data.
>
> Display:
>
> - Actual queue token.
> - Current status.
> - Global or barber-eligible queue position.
> - Estimated waiting time.
> - Selected service snapshots.
> - Total price.
> - Total service duration.
> - Preferred barber.
> - Assigned barber when called.
> - Realtime connection status.
>
> Support all documented states:
>
> - Waiting.
> - Called.
> - In Chair.
> - Done.
> - Cancelled.
> - No-show.
>
> Handle invalid, expired or unavailable tracking capabilities without revealing private records.
>
> Restore authorized status after page refresh.
>
> Do not use a public queue token or phone number as authorization.
>
> ## 7. Premium tracking experience
>
> Preserve and enhance the existing digital queue pass.
>
> Implement:
>
> - Prominent gold token number.
> - Elegant circular waiting-time visualization.
> - Clearly labeled approximate estimate.
> - Visual status progression.
> - Arrival reminder when the customer reaches the documented position.
> - Prominent Called notification displaying the assigned barber.
> - Accessible live status announcements.
> - Reduced-motion support.
> - Copy Private Status Link action with an explanation that the link should remain private.
>
> Do not imply the estimated waiting time is a guaranteed countdown.
>
> Use an explicit unavailable or uncertain state when appropriate.
>
> Avoid sending tracking capabilities to analytics, logs, third-party services or referrer headers.
>
> ## 8. Customer cancellation
>
> Connect the existing cancellation action to the trusted backend operation.
>
> Requirements:
>
> - Only permit cancellation while Waiting.
> - Show a confirmation dialog.
> - Prevent repeated cancellation requests.
> - Handle cancellation-versus-calling races correctly.
> - Refetch authoritative status after a mutation.
> - Display an appropriate terminal Cancelled state.
> - Allow customers to return to Home.
>
> Do not merely change the status in React without persisting it through the backend.
>
> ## 9. Realtime synchronization
>
> Reuse the existing sanitized realtime infrastructure.
>
> Home and My Status must automatically refresh relevant data after backend changes.
>
> Handle:
>
> - Subscription initialization.
> - Connection loss.
> - Stale snapshots.
> - Reconnection.
> - Foregrounding.
> - Duplicate events.
> - Subscription cleanup.
>
> Do not subscribe anonymous clients to private queue records.
>
> Target synchronization within five seconds under normal connected conditions.
>
> Disable unsafe actions when necessary while authoritative state cannot be verified.
>
> Do not display a Live indicator unless the connection and data freshness justify it.
>
> ## 10. English and Gujarati
>
> Ensure every new customer-facing label and backend error message supports English and Gujarati.
>
> Verify:
>
> - Navigation.
> - Service names.
> - Input labels.
> - Validation messages.
> - Price and duration summaries.
> - Queue status.
> - Admission messages.
> - Cancellation.
> - Connection warnings.
> - Empty and error states.
>
> Preserve centralized translations and the existing language preference mechanism.
>
> ## 11. Security requirements
>
> Maintain all approved Phase 2 security controls.
>
> Do not:
>
> - Disable RLS.
> - Expose privileged credentials.
> - Add unauthorized direct database writes.
> - Allow phone-only private status retrieval.
> - Use client-side logic as authoritative queue validation.
> - Log customer tracking capabilities.
> - Introduce fake success responses.
> - Weaken operating-hour restrictions for testing.
>
> Keep .env.local ignored by Git.
>
> Use fictional test customers only.
>
> The public preview route may remain as an explicitly labeled sample, but it must be isolated from actual private tracking behavior.
>
> ## 12. Functional and visual verification
>
> Run applicable existing tests and add focused tests for the new customer integration.
>
> Actually verify:
>
> 1. Home loads live salon information.
> 2. Enabled services load correctly.
> 3. Barber availability loads correctly.
> 4. Customer name and mobile validation work.
> 5. Service selection supports one to three services.
> 6. Price and duration summaries are correct.
> 7. A valid customer receives a real unique token.
> 8. Duplicate submissions do not create duplicate entries.
> 9. Duplicate phone handling preserves privacy.
> 10. Successful admission opens the correct private status page.
> 11. Refresh preserves authorized customer tracking.
> 12. Invalid tracking capabilities are rejected.
> 13. Cancellation works while Waiting.
> 14. Cancellation is rejected in invalid states.
> 15. Queue-closed restrictions are enforced.
> 16. Backend changes automatically refresh the customer screen.
> 17. Called, In Chair and Done states render correctly.
> 18. Realtime reconnection restores accurate data.
> 19. English/Gujarati switching works.
> 20. Mobile and desktop layouts remain usable.
> 21. No privileged credentials or private customer information appear in public payloads.
>
> Use existing authorized backend test mechanisms to exercise status transitions before staff screens are connected.
>
> Respect previous browser-tool restrictions. If rendered checks are unavailable, report NOT RUN and provide manual test instructions rather than repeatedly attempting blocked tools.
>
> Run:
>
> - npm run build
> - npm run lint
> - npm run test
>
> Run relevant existing backend and hosted checks where appropriate.
>
> Report actual PASS, FAIL and NOT RUN results.
>
> Update acceptance scenario results only where corresponding behavior has actually been verified.
>
> ## 13. Git requirements
>
> Preserve existing commits and working functionality.
>
> Record this actual prompt in prompts.md if available.
>
> Commit the completed Phase 3 implementation with:
>
> feat: connect SalonQ customer experience to live Supabase queue
>
> Do not commit credentials, test capabilities or private artifacts.
>
> Do not push or deploy the frontend during this task.
>
> ## 14. Final report
>
> Provide:
>
> 1. Implemented customer functionality.
> 2. Connected backend operations.
> 3. UI improvements.
> 4. Actual admission and tracking verification.
> 5. Realtime verification.
> 6. Security verification.
> 7. Automated test results.
> 8. Acceptance scenario results.
> 9. Build and lint results.
> 10. Changed files.
> 11. Exact local testing instructions.
> 12. Git commit hash.
> 13. Remaining limitations.
> 14. Readiness for staff dashboard integration.
>
> IMPORTANT:
>
> Start implementation immediately.
>
> Do not produce another lengthy planning-only response.
>
> Reuse the existing backend and frontend foundation.
>
> Prioritize successful customer admission, persistent private tracking and realtime updates over optional cosmetic changes.
>
> Complete Phase 3 and stop before implementing the staff dashboard screens.

Continuation message:

> continue

## Phase 4 authorization — 24 November 2026

> # Phase 4 — Functional Staff Authentication, Reception Dashboard and Barber Workspace
>
> Phase 3 is approved and complete.
>
> Latest commit: f415d36.
>
> The customer-facing Home, Join Queue and private My Status screens are connected to hosted Supabase.
>
> Reported verification:
>
> - Automated tests: 72 PASS
> - SQL assertions: 64 PASS
> - Local database checks: 37 PASS
> - Hosted React checkpoints: 14 PASS
> - Build, lint and Edge type-check: PASS
>
> You are authorized to begin Phase 4 immediately.
>
> Act as a Senior Full-Stack Developer, Supabase Integration Specialist, UI/UX Engineer, Application Security Engineer and QA Engineer.
>
> Our college submission deadline is 24 November 2026 at 11:59 PM IST. Prioritize completing working functionality efficiently.
>
> ## 1. Review the existing implementation
>
> Read:
>
> - AGENTS.md
> - docs/01-brief.md
> - docs/02-screens.md
> - docs/03-flows-rules.md
> - docs/phase-3-verification.md
> - supabase/README.md
>
> Inspect the existing authentication infrastructure, service adapters, realtime hooks, staff screen components and transactional backend operations.
>
> Reuse the existing implementation.
>
> Do not regenerate the frontend, repeat database setup, recreate staff accounts, or unnecessarily rewrite the backend.
>
> Preserve the approved SalonQ branding, charcoal/champagne-gold design, typography and reusable components.
>
> ## 2. Implementation scope
>
> Activate:
>
> 1. Staff Login — /login
> 2. Reception Dashboard — /reception
> 3. Barber View — /barber/:name
>
> Also update shared authentication, route protection, navigation and realtime infrastructure where necessary.
>
> The existing customer-facing functionality must remain operational.
>
> Do not implement the complete Owner Settings or Waiting Area TV functionality during this phase.
>
> ## 3. Staff authentication
>
> Connect the existing premium staff login page to Supabase Auth.
>
> Implement:
>
> - Email and password inputs.
> - Input validation.
> - Password visibility toggle.
> - Sign-in loading state.
> - Friendly authentication errors.
> - Session restoration after refresh.
> - Sign-out.
> - Session expiry handling.
> - Protected staff routes.
> - Role-based navigation.
> - Unauthorized-access handling.
>
> Retrieve roles and barber associations from the authoritative protected staff profile records.
>
> Do not trust user-editable metadata, URL parameters or localStorage values for authorization.
>
> Use the five previously provisioned demonstration accounts.
>
> Do not create duplicate accounts.
>
> ### Role-based navigation
>
> - Receptionist: navigate to /reception after successful login.
> - Barber: navigate to their authorized /barber/:name route.
> - Owner: navigate to /admin, clearly indicating any functionality still pending Phase 5.
>
> Enforce the approved role-permission matrix from the documentation.
>
> A barber must not access another barber's private workspace by changing the URL.
>
> An authenticated user must not gain additional privileges merely by navigating to another route.
>
> Do not implement public staff registration or insecure demo-login bypasses.
>
> ## 4. Reception Dashboard
>
> Replace all fictional reception fixtures with authorized live backend snapshots.
>
> Preserve the existing premium dashboard layout.
>
> Implement:
>
> - Salon operating and online-admission status.
> - Live connection status.
> - Number of waiting customers.
> - Number of active assignments.
> - Number of available barbers.
> - Barber availability cards.
> - Current customer assignments.
> - Current queue status.
> - Elapsed service time.
> - Approximate remaining service duration.
> - Ordered waiting queue.
> - Customer token, name and selected services.
> - Preferred barber.
> - Waiting duration.
> - Highlight customers waiting longer than 60 minutes.
> - Contextual action buttons.
> - Loading, empty, disconnected and error states.
>
> Provide useful search and filters if they can be implemented without delaying core functionality.
>
> Do not permanently display hard-coded operational statistics.
>
> ## 5. Call Next functionality
>
> Connect each barber's Call Next button to the existing transactional backend operation.
>
> Enforce:
>
> - Correct staff authorization.
> - Barber must be on duty.
> - Barber must not be on break.
> - Barber must not have an active assignment.
> - Earliest eligible waiting customer is selected.
> - Explicit barber preferences are respected.
> - Any Barber customers can be assigned to eligible barbers.
> - One active assignment per barber.
> - One assignment per queue entry.
>
> After successful calling:
>
> - Update the Reception Dashboard.
> - Update the assigned barber's workspace.
> - Update the customer's private My Status page.
> - Show the appropriate Called notification.
> - Refetch authoritative data.
> - Display success feedback.
>
> Prevent duplicate requests and handle simultaneous Call Next operations safely.
>
> If no eligible customer exists, provide a clear, friendly message.
>
> Never perform assignment solely in client-side React state.
>
> ## 6. Add Walk-in functionality
>
> Connect the Add Walk-in action to the existing trusted walk-in admission operation.
>
> Create an accessible dialog or form using the current design system.
>
> Include:
>
> - Customer name.
> - Indian mobile number.
> - One to three enabled services.
> - Preferred barber or Any Barber.
> - Actual service prices.
> - Total duration.
> - Total price.
> - Validation and confirmation.
>
> Walk-ins must join the same queue as remote customers.
>
> Respect duplicate-phone, service-selection, operating-hour and barber-duty rules.
>
> Walk-ins may join during the final thirty minutes of salon operating hours, when online admission is closed.
>
> After successful registration, display the generated token.
>
> Provide the private tracking link to the intended customer through the approved secure mechanism, if available in the existing backend contract.
>
> Do not expose private tracking capabilities in the general waiting queue.
>
> ## 7. Cancellation and No-show
>
> Connect the existing cancellation and No-show actions.
>
> ### Cancellation
>
> - Allowed only while Waiting.
> - Require confirmation.
> - Use the trusted backend operation.
> - Handle cancellation-versus-calling races.
>
> ### No-show
>
> - Allowed only while Called.
> - Enforce the ten-minute threshold using authoritative server timestamps.
> - Clearly explain when the action becomes available.
> - Require confirmation.
> - Update all relevant views after success.
>
> Returning No-show customers must be registered as new entries at the end of the queue with new tokens.
>
> Do not restore their previous queue positions.
>
> ## 8. Barber workspace
>
> Replace fictional Barber View data with the authenticated barber's authorized live snapshot.
>
> Implement:
>
> - Barber identity.
> - Duty and availability status.
> - Current assigned customer.
> - Customer token.
> - Selected service snapshots.
> - Total expected service duration.
> - Current queue status.
> - Persisted service timer.
> - Start Service button.
> - Complete Service button.
> - Next eligible waiting customer preview.
> - Available and On Break controls.
> - Loading, empty, disconnected and error states.
>
> Maintain a focused mobile-first interface with large, accessible touch targets.
>
> Do not expose unnecessary customer information.
>
> ## 9. Start Service
>
> Connect Start Service to the existing trusted backend operation.
>
> Requirements:
>
> - Only the authorized assigned barber can start the service.
> - Current customer must be in Called status.
> - Transition from Called to In Chair.
> - Record the server-generated service start timestamp.
> - Update reception and customer tracking automatically.
> - Start the displayed elapsed timer from the persisted timestamp.
>
> Prevent invalid transitions and repeated submissions.
>
> ## 10. Complete Service
>
> Connect Complete Service to the existing trusted backend operation.
>
> Requirements:
>
> - Only authorized operations may complete the assigned service.
> - Current status must be In Chair.
> - Transition to Done.
> - Persist completion timestamp.
> - Release barber capacity.
> - Update customer tracking.
> - Update reception.
> - Refresh the next eligible customer preview.
> - Show clear completion feedback.
>
> Do not automatically call the next customer unless explicitly permitted by the existing approved business rules.
>
> ## 11. Service timer
>
> Display elapsed service time using persisted server timestamps.
>
> The timer must:
>
> - Survive refresh.
> - Restore after reconnecting.
> - Avoid reliance on an independently stored client-side start time.
> - Use tabular numerals.
> - Distinguish expected duration from actual elapsed time.
> - Clearly indicate service overruns.
>
> Do not show misleading guaranteed completion times.
>
> ## 12. Barber break management
>
> Implement functional Available and On Break controls.
>
> Enforce:
>
> - Busy barbers cannot begin a break.
> - Barbers on break cannot receive new assignments.
> - Only authorized users can change the relevant barber's availability.
> - Returning from break restores eligible availability.
> - Existing customer estimates and availability information refresh appropriately.
>
> Keep Off Duty management within the approved owner permissions.
>
> ## 13. Realtime synchronization
>
> Reuse the sanitized change-signal infrastructure.
>
> Ensure that changes automatically propagate between:
>
> - Customer Home.
> - Customer My Status.
> - Reception Dashboard.
> - Barber View.
>
> Use authoritative snapshot refetching after change signals and successful mutations.
>
> Handle subscription readiness, connection loss, reconnection, foregrounding, session changes and cleanup.
>
> Target cross-screen synchronization within five seconds under normal connected conditions.
>
> Display accurate connection indicators.
>
> Do not expose raw private customer records through public realtime subscriptions.
>
> ## 14. Premium UI and translations
>
> Preserve existing SalonQ screen layouts.
>
> Improve only where necessary for functionality and usability.
>
> Reception should provide:
>
> - Clear operational statistics.
> - Visually distinct barber states.
> - Readable queue information.
> - Contextual action buttons.
> - Professional confirmation dialogs.
> - Clear success and error feedback.
>
> Barber View should provide:
>
> - A prominent customer token.
> - Large service timer.
> - Clear Start and Complete actions.
> - Minimal visual distractions.
>
> Translate all new labels, validation messages, status indicators and backend errors into English and Gujarati.
>
> Maintain centralized translation dictionaries, accessibility, keyboard navigation and responsive behavior.
>
> Avoid unnecessary cosmetic redesign.
>
> ## 15. Security requirements
>
> Preserve existing RLS, RPC permissions, Edge Function authorization and private tracking security.
>
> Never:
>
> - Disable RLS.
> - Expose privileged credentials.
> - Allow staff to modify their own role.
> - Trust client-side authorization alone.
> - Expose private tracking capabilities in dashboards.
> - Permit unauthorized barber access.
> - Introduce direct database mutations that bypass the queue engine.
> - Fabricate successful operations.
>
> Keep all existing demo passwords and private test artifacts outside Git.
>
> Use fictional customers and role-limited demo accounts for hosted verification.
>
> ## 16. End-to-end testing
>
> Actually exercise this primary workflow:
>
> 1. Customer joins using the customer-facing form.
> 2. A real unique token is generated.
> 3. Customer appears in the Reception Dashboard.
> 4. Receptionist clicks Call Next for an eligible barber.
> 5. Customer My Status changes to Called.
> 6. The assigned barber sees the customer.
> 7. Barber clicks Start Service.
> 8. Customer My Status changes to In Chair.
> 9. Reception reflects the service in progress.
> 10. Barber clicks Complete Service.
> 11. Customer My Status changes to Done.
> 12. Barber becomes available again.
>
> Verify additional scenarios:
>
> - Correct staff authentication and logout.
> - Session restoration and expiry.
> - Unauthorized route access.
> - Barber role isolation.
> - Walk-in registration.
> - Duplicate admission.
> - Explicit barber preference enforcement.
> - Simultaneous Call Next requests.
> - Cancellation races.
> - Invalid status transitions.
> - No-show before and after the allowed threshold.
> - Barber break restrictions.
> - Timer persistence.
> - Realtime updates and reconnection.
> - English/Gujarati behavior.
> - Responsive layouts where authorized browser tools are available.
>
> Use existing isolated database tests for timing boundaries. Do not weaken hosted business rules to make tests pass.
>
> Verify existing customer functionality has not regressed.
>
> Run:
>
> - npm run build
> - npm run lint
> - npm run test
> - Relevant database and hosted integration tests
>
> Report actual PASS, FAIL or NOT RUN results.
>
> Update the 91 documented acceptance scenarios only when corresponding behavior has genuinely been verified.
>
> If rendered browser verification remains unavailable, provide concise manual testing instructions. Do not spend excessive time repeatedly attempting blocked browser workflows.
>
> ## 17. Git and documentation
>
> Preserve existing commits and working functionality.
>
> Record the actual prompt in prompts.md where available.
>
> Create:
>
> docs/phase-4-verification.md
>
> Include test evidence, local URLs, remaining limitations and manual testing instructions.
>
> Commit the completed implementation using:
>
> feat: connect staff authentication reception and barber operations
>
> Do not commit secrets, passwords, private capabilities or generated artifacts.
>
> Do not push or deploy during this phase.
>
> ## 18. Final report
>
> Provide:
>
> 1. Implemented staff functionality.
> 2. Connected backend operations.
> 3. Authentication and authorization verification.
> 4. End-to-end queue lifecycle results.
> 5. Realtime synchronization results.
> 6. Automated test results.
> 7. Updated acceptance scenario results.
> 8. Build and lint results.
> 9. Exact local testing URLs.
> 10. Demo account access instructions without displaying passwords.
> 11. Changed files.
> 12. Git commit hash.
> 13. Remaining limitations.
> 14. Readiness for Phase 5.
>
> IMPORTANT:
>
> Start actual implementation immediately.
>
> Do not perform another planning-only phase.
>
> Prioritize a working customer-to-reception-to-barber lifecycle.
>
> Reuse existing backend functions and preserve the approved premium frontend.
>
> Complete Phase 4 and stop before implementing the Waiting Area TV and Owner Settings functionality.

## Phase 5 Waiting Area TV and Owner Settings implementation (Google Antigravity)

> # Phase 5 — Functional Waiting Area TV and Owner Settings
>
> Phase 4 is approved, subject to the verification requirements below.
>
> Latest implementation commit: 39de923.
>
> We are developing SalonQ — Smart Salon Queue Management for a college Vibe Coding assignment.
>
> The submission deadline is today, 24 November 2026, at 11:59 PM IST.
>
> Act as a Senior Full-Stack Developer, Supabase Integration Specialist, UI/UX Engineer, Application Security Engineer and QA Engineer.
>
> Start implementation immediately. Do not produce another lengthy planning-only response.
>
> ## 1. Project continuity
>
> Read:
> - AGENTS.md
> - docs/01-brief.md
> - docs/02-screens.md
> - docs/03-flows-rules.md
> - docs/phase-3-verification.md
> - docs/phase-4-verification.md
> - supabase/README.md
>
> Use the existing canonical project directory:
> Salon-Queue/salon-queue-management/
>
> Inspect the existing Git status, backend functions, service adapters, realtime infrastructure, authentication implementation and screen components.
>
> Preserve all existing working functionality and Git history.
>
> The project was previously developed using Codex and is now being continued using Google Antigravity.
>
> Follow the existing AGENTS.md instructions. Do not create a separate application or replace the approved architecture.
>
> ## 2. Resolve Phase 4 verification issues
>
> Before implementing new functionality:
> - Verify that migration 20261124000400_staff_retry_authorization.sql has been applied to hosted Supabase.
> - If it has not been applied, follow the existing authorized migration procedure.
> - Verify the current staff retry authorization security controls.
> - Confirm the canonical TV route is /display, as required by the college guide.
> - If /tv exists, it may remain an alias redirecting to /display.
> - Do not introduce duplicate TV implementations.
> - Preserve the nine verified acceptance scenarios.
> - Do not mark the remaining 82 scenarios as passed without actual corresponding verification.
>
> ## 3. Phase 5 scope
>
> Implement functional versions of:
> 1. Waiting Area TV — /display
> 2. Owner Settings — /admin
>
> Reuse the existing backend operations, Supabase infrastructure and premium UI components.
>
> Do not rebuild the database or redesign the application.
>
> All customer, receptionist and barber functionality must remain operational.
>
> ## 4. Waiting Area TV integration
>
> Replace fictional TV fixtures with the existing authorized public display snapshot.
>
> Implement:
> - SalonQ branding.
> - Actual salon name.
> - Current date and time in IST.
> - Accurate realtime connection indicator.
> - Full-screen display layout.
> - Barber name and availability.
> - Current assigned token for each barber.
> - Called and In Chair status.
> - Available, On Break and Off Duty states.
> - Next five waiting tokens according to the approved display ordering rules.
> - Estimated waiting times.
> - Empty queue state.
> - Connection-loss warning.
> - Loading and error states.
>
> Never display fake live statistics.
> Use authoritative backend data.
>
> ## 5. Newly called token experience
>
> When a customer is called:
> - Automatically update the TV display.
> - Highlight the newly called token with champagne gold.
> - Display a prominent instruction identifying the assigned barber.
> - Use a restrained animation lasting approximately five seconds.
> - Provide an optional short notification chime.
>
> Implement audio using an original lightweight tone or appropriately licensed local asset.
> Browser audio may require user interaction.
> Provide a visible Enable Sound control and handle denied audio permissions gracefully.
> The visual notification must work even when sound is unavailable.
> Do not repeatedly play the same call notification after refresh or reconnection.
> Support prefers-reduced-motion.
>
> ## 6. TV display design
>
> Preserve the existing premium charcoal/champagne-gold design.
> Optimize for 1920 × 1080 displays.
> Use:
> - Large readable queue tokens.
> - Clear Now Serving heading.
> - Prominent barber station cards.
> - High-contrast status labels.
> - Organized Up Next section.
> - Minimal unnecessary navigation.
> - Tabular numerals.
> - Adequate spacing.
> - Full-screen browser support where available.
> Ensure tokens are suitable for viewing from a distance.
> Provide a responsive fallback for smaller devices.
> Do not use unnecessary animation libraries or large visual dependencies.
>
> ## 7. Public display privacy
>
> The Waiting Area TV is publicly accessible.
> Use only explicitly authorized public fields.
> Never expose:
> - Customer names.
> - Customer phone numbers.
> - Staff credentials.
> - Private tracking capabilities.
> - Raw private queue records.
> - Internal security receipts.
> - Unnecessary database identifiers.
> Verify the actual network response and subscription payloads, not just the rendered DOM.
> Reuse sanitized realtime signals and authorized snapshot fetching.
> Never disable RLS or grant anonymous access to private queue tables.
>
> ## 8. Owner authentication and authorization
>
> Activate the existing protected /admin screen.
> Use the already provisioned owner demonstration account.
> Verify that:
> - Anonymous users cannot access owner operations.
> - Receptionists cannot execute owner operations.
> - Barbers cannot execute owner operations.
> - Owners can access the Owner Settings screen.
> - Owners can also access Reception operations.
> - Owners cannot perform unauthorized barber actions without assignment.
> Restrict owner operations to the authoritative owner role.
> Protect all owner backend operations.
>
> ## 9. Owner dashboard
>
> Connect the Owner Settings screen to the existing live owner snapshot.
> Implement:
> - Daily operational statistics computed strictly for the current day in Asia/Kolkata:
>   - Customers served today.
>   - Average waiting time from join to call.
>   - Number of no-shows today.
> - Accurate date and timezone handling.
> - Clear distinction between today's actual performance and lifetime metrics.
> - Loading, empty and error states.
> - Do not permanently display hard-coded statistics.
>
> ## 10. Service catalog management
>
> Implement functional catalog management:
> - Display existing services with English name, Gujarati name, duration, price and enabled state.
> - Enable or disable services without deleting past transaction history.
> - Add new services.
> - Edit existing service names, prices and durations.
> - Validate input.
> - Price stored as an integer number of paise.
> - Duration in whole minutes.
> - Confirmation dialogs for significant changes.
> - Disable services gracefully so active queue entries remain unaffected.
>
> ## 11. Barber duty management
>
> Implement barber duty controls for the owner:
> - View all barbers.
> - Change on-duty status.
> - Change on-break status.
> - Prevent taking a busy barber off duty.
> - Prevent taking a barber off duty when customers are waiting specifically for them.
> - Clear feedback when actions are blocked.
>
> ## 12. Salon operational controls
>
> Implement salon-level controls:
> - Open or close the online queue manually.
> - Clear confirmation dialog before closing the online queue.
> - Update daily opening and closing hours.
> - Automatic online admission cutoff 30 minutes before closing.
> - Automatic walk-in admission cutoff at closing time.
> - Enforce cutoff rules strictly on the backend.
> - Reflect changes immediately across all affected screens.
>
> ## 13. End-to-end multi-screen realtime synchronization
>
> Verify realtime synchronization across all seven application screens:
> 1. Home
> 2. Join Queue
> 3. My Status
> 4. Reception Dashboard
> 5. Barber Workspace
> 6. Waiting Area TV
> 7. Owner Settings
>
> Verify that when an event occurs:
> - Customer joins: Reception and TV update.
> - Barber is called: Customer status, Reception, Barber view and TV update.
> - Service starts: Reception, Barber view and TV update.
> - Service finishes: Reception, Barber view, Owner stats and TV update.
> - Customer cancels: Reception and TV update.
> - Customer marked no-show: Reception, Owner stats and TV update.
> - Service catalog updated: Join Queue and Owner Settings update.
> - Salon hours updated: Home, Join Queue and Owner Settings update.
> - Online queue closed: Home, Join Queue and Reception update.
>
> Use the single sanitized change signal table salonq_changes.
> No screen may subscribe directly to private queue tables.
>
> ## 14. Responsive and accessible implementation
>
> Ensure:
> - TV display is optimized for large screens with a responsive fallback for small devices.
> - Owner Settings works on desktop, tablet and mobile.
> - All forms and dialogs are keyboard accessible.
> - Tabular numbers are used for timers, prices and tokens.
> - High contrast and readable typography are maintained.
> - Bilingual support is preserved across all newly activated screens.
>
> ## 15. Security and privacy
>
> Verify:
> - Zero customer PII on /display.
> - Public display snapshot contains only authorized fields.
> - Owner operations are strictly protected by role.
> - Service and settings modifications validate permissions on the backend.
> - No secrets, passwords or service-role keys are exposed to the client.
> - Database RLS policies are strictly enforced.
>
> ## 16. Verification and test suite
>
> Run and report:
> - All automated unit and integration tests.
> - Hosted Supabase verification for Phase 5.
> - SQL offline test assertions.
> - Deno edge function type checks.
> - Build and lint checks.
> - Update docs/03-flows-rules.md acceptance scenarios verified during Phase 5.
>
> ## 17. Git and documentation
>
> Record the prompt in prompts.md identifying Google Antigravity as the coding agent.
> Create docs/phase-5-verification.md with full evidence and manual test instructions.
> Commit the completed implementation using:
> feat: connect live TV display and owner management
> Do not commit secrets, passwords or generated artifacts.
> Do not push or deploy.
>
> ## 18. Final report
> Provide the 18-point final report.

## Phase 6 Final Quality Assurance, Production Deployment and College Submission (Google Antigravity)

> # Phase 6 — Final Quality Assurance, Production Deployment and College Submission
>
> Phase 5 implementation is approved.
>
> Latest commit: a833fa1.
>
> All seven required SalonQ screens are implemented and connected to hosted Supabase.
>
> Reported results:
> - 108 automated tests passed.
> - 67 SQL assertions passed.
> - 10 hosted Phase 5 checkpoints passed.
> - 17 hosted Phase 4 regression checkpoints passed.
> - Production build and lint passed.
> - 14 of 91 complete acceptance scenarios passed.
> - 77 acceptance scenarios remain unchecked.
>
> Our college submission deadline is 24 November 2026 at 11:59 PM IST.
>
> Act as a Senior Full-Stack Developer, QA Engineer, Application Security Engineer, DevOps Engineer and Technical Documentation Specialist.
>
> Your objective is to prepare and deploy the existing application, verify the public production website and complete the required submission materials.
>
> Start execution immediately.
>
> 1. Preserve existing work (AGENTS.md, planning docs, Supabase architecture, business rules, translations)
> 2. Resolve inconsistencies (demo account emails, local origin http://127.0.0.1:5174, TV canonical /display, honest completion claims)
> 3. Perform final functional QA (review all 91 scenarios, record exact verification scope)
> 4. Verify the full application lifecycle (customer join -> reception call -> TV alert -> barber start/done -> owner stats)
> 5. Visual quality assurance (responsive viewports 390x844, 768x1024, 1440x900, 1920x1080)
> 6. Security and release audit (no credentials committed, untracked .env.local and .artifacts, RLS intact)
> 7. Performance optimization (bundle code splitting)
> 8. Production build verification (build, lint, test, test:sql, env:check, check:edge, backend:probe)
> 9. Prepare GitHub publication (origin https://github.com/202612019/Salon-Queue.git, branch main)
> 10. Deploy to Vercel (Root Directory: salon-queue-management, Vite preset, public environment variables, vercel.json SPA rewrites)
> 11. Configure production Supabase integration (CORS allowed origins, Edge function deployment)
> 12. Verify the deployed application
> 13. Update README.md at repository root and app subdirectory
> 14. Complete prompts.md
> 15. Prepare final submission documents (docs/final-verification.md, docs/demo-script.md, docs/reflection-draft.md)
> 16. Final Git commit and release (chore: complete SalonQ release verification and deployment preparation, docs: finalize SalonQ live demo and submission materials)
> 17. Final report covering all 17 items.




## 24 November 2026 — Independent production review (Codex)

User request: “I do phase 4, phase 5, phase 6 and do deployment please check all the things and verify correctly. All work do correctly and not I give which task and what do. I complete work still deployment on vercel so also verify that . verify UI and All nevigation, Also check if 4-5 customer add join queue and status will update or not.”

The accompanying Final Production Integration request named the existing Vercel domain and GitHub repository, required strict production/local CORS and Auth configuration verification, all seven routes plus Login and /tv, fictional lifecycle testing, accurate PASS/FAIL/NOT RUN records, updated READMEs/final verification, the final documentation commit and push to origin/main. Its included prior completion narrative was treated as claims to verify, not fresh evidence.

Execution: initial sandbox network inspection failed and was rerun with reviewed network permission. Browser access was unavailable; native Chrome input failed with unavailable geometry, so no rendered visual results/screenshots are claimed. Five live concurrent customers and independent status clients passed; separate real React/hosted route checks passed after correcting the harness to leave Access Denied through My workspace before sign-out. Found and corrected owner catalog bounds, old example labels, fractional statistics, name-based duty checks, lost hours edits, TV stale feedback and polling-cancelled notification timer. Obsolete preview tests and the field-error selector were corrected; final frontend suite 122 PASS. See docs/final-verification.md for exact environments and limitations. No application redesign, privileged key disclosure or backend security relaxation.
