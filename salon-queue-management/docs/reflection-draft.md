# SalonQ — Development Reflection Draft

**Student review required:** adapt this draft to your own experience and voice before submission. The incidents below come from recorded engineering evidence; this draft does not claim that the student personally performed every test.

SalonQ taught me that an interface looking complete is different from proving its rules. The project connects seven screens through Supabase while preserving barber preferences, queue order and private customer tracking. Clear planning documents helped Codex and Antigravity continue the same project without rebuilding the approved design.

One concrete mistake in the AI-generated backend was assuming a signed staff access token was sufficient after logout. During final review, a newly created demo session was signed out, but its saved token still returned a protected snapshot. Checking the current staff role alone had not established that the session was still active. This was a reproduced failure, not a hypothetical concern.

The correction was narrow: an additive migration checks the signed session ID against the current Auth session before staff profile/RPC access. The existing Edge walk-in boundary applies the same check after verifying the JWT. The private salon_private transaction engine, queue rules and RLS remained intact. A fresh valid session and actual token refresh succeeded; the signed-out token was then denied. Existing customers were not changed.

My improved instruction would be: “Test a valid staff session, sign out only that test session, then prove the old token cannot read protected data or perform staff operations. Preserve current role checks, request-retry safety and existing customer records.” This is more useful than simply asking for “secure login.”

The approved results are 140 frontend tests, 167 SQL assertions, 45 database/concurrency checks, 22 hosted checkpoints and 17 security safeguards passed. Acceptance coverage is 81 PASS, 0 FAIL after correction and 10 NOT RUN. I should not describe this as 100% verification: full rendered, device and other listed checks remain incomplete. Recording the actual failure, correction and limits made the final submission more credible.

Evidence: [final verification](final-verification.md), [acceptance ledger](acceptance-evidence.md), [visual limitations](visual-audit.md). Approved audit commit: 03997cd.
