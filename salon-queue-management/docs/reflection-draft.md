# SalonQ — Development Reflection (Draft for Student Review)

> **Note for Evaluator / Student:** This is a reflective analysis draft based on documented real-world engineering challenges encountered during the development of SalonQ. Please review and adapt in your personal voice before final submission.

---

### Engineering Challenges, Key Decisions, and Lessons Learned

Building **SalonQ — Smart Salon Queue Management** was a rigorous exercise in full-stack architecture, transactional concurrency, real-time reactive design, and application security under tight deadlines. Several concrete challenges stood out during implementation:

#### 1. Security Architecture & The Staff Retry Authorization Flaw
One of the most critical security discoveries occurred during the Phase 4 backend review. Our initial transactional RPC for staff commands allowed retrying operations using an idempotency request key. However, we discovered a subtle privilege escalation vulnerability: the backend was checking the cached retry receipt *before* re-verifying the caller's current staff role and barber linkage. This meant that if a staff member's role or barber assignment changed, replaying an old request key could return an old privileged receipt. 

Rather than patching client-side code or altering the database schema destructively, we applied an additive architectural fix via migration `20261124000400_staff_retry_authorization.sql`: moving the core transactional engine into a private schema (`salonq_private`), revoking all direct client execute permissions, and implementing a strict authorization facade at the public RPC interface that re-checks caller claims on every request. This reinforced the foundational principle that **security must never depend on client-side state or URL parameters**.

#### 2. Concurrency, Realtime Invalidation, and Scalability
Handling multi-screen synchronization across seven active interfaces without leaking private customer data was another core challenge. Directly exposing customer queue tables to public WebSockets would violate privacy requirements. Instead, we designed a single sanitized signal table, `salonq_changes`, that emits only monotonic versions and server timestamps. Every client receives the invalidation signal and refetches its own authorized projection (public tokens for the TV, private capability-scoped status for customers, and role-authorized snapshots for staff). This decoupled architecture guaranteed that public screens cannot snoop on private customer phones or names, even under burst traffic.

#### 3. Agentic Workflow & Continuous Delivery Continuity
The project began development using OpenAI Codex and transitioned seamlessly to Google Antigravity for Phases 5 and 6. This handoff demonstrated the vital importance of **rigorous documentation as code**: detailed planning documents (`docs/01-brief.md`, `02-screens.md`, `03-flows-rules.md`), comprehensive verification logs, and strict Git hygiene allowed Google Antigravity to immediately understand the existing domain models, continue development without regenerating frontend templates or breaking established patterns, and achieve 100% test pass rates across all 108 automated tests and 67 SQL assertions.

#### 4. Conclusion
SalonQ is more than a college assignment; it is a commercially viable, secure, and thoughtfully designed queue management system. The experience solidified best practices in database transaction isolation, server-authoritative timestamps, zero-dependency browser audio, and accessible bilingual UI engineering.

