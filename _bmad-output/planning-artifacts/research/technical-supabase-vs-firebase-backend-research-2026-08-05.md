---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 6
research_type: 'technical'
research_topic: 'Supabase vs Firebase for authentication and course-progress persistence in the Vibe Hub React/Vite learning platform'
research_goals: 'Choose a backend-as-a-service to implement user authentication and persist course progression for Vibe Hub, replacing local React state, per the README next-steps.'
user_name: 'Léandro'
date: '2026-08-05'
web_research_enabled: true
source_verification: true
---

# Research Report: technical

**Date:** 2026-08-05
**Author:** Léandro
**Research Type:** technical

---

## Research Overview

Vibe Hub's README explicitly flags two unmet needs — a real backend for course-progress persistence and user authentication — as the next technical milestone. This report compares Supabase and Firebase as backend-as-a-service options for Vibe Hub, a React 18 + Vite platform teaching AI/UX skills to designers, across technology stack, integration patterns, architecture, and implementation practicality, using current (2026) sources on pricing, data modeling, auth, and real-time behavior.

The core finding is that Vibe Hub's domain data is inherently relational (`courses → modules → user_progress`), which maps cleanly onto Supabase's PostgreSQL foundation with Row-Level Security for per-user isolation, while Firebase's Firestore would require denormalizing that same relational data into documents. Combined with Supabase's more predictable flat/tiered pricing, its native SQL migration workflow (which pairs naturally with the README's separate "Ajouter TypeScript" goal via auto-generated types), and a self-host escape hatch that avoids Firebase's one-way Google Cloud lock-in, **Supabase is the recommended backend for Vibe Hub**. The full rationale, trade-offs, and a step-by-step implementation roadmap follow below, with the executive summary and final recommendation in the Research Synthesis section at the end of this document.

---

## Technical Research Scope Confirmation

**Research Topic:** Supabase vs Firebase for authentication and course-progress persistence in the Vibe Hub React/Vite learning platform
**Research Goals:** Choose a backend-as-a-service to implement user authentication and persist course progression for Vibe Hub, replacing local React state, per the README next-steps.

**Technical Research Scope:**

- Architecture Analysis - design patterns, frameworks, system architecture
- Implementation Approaches - development methodologies, coding patterns
- Technology Stack - languages, frameworks, tools, platforms
- Integration Patterns - APIs, protocols, interoperability
- Performance Considerations - scalability, optimization, patterns

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-08-05 (auto mode, per user instruction)

## Technology Stack Analysis

### Programming Languages

Both platforms are backend-as-a-service (BaaS) offerings consumed from the existing Vibe Hub JavaScript/JSX codebase — no new primary language is required. Supabase additionally exposes native SQL (PostgreSQL) for schema, functions, and Row-Level Security (RLS) policies, while Firebase's access-control layer uses its own JSON-like "Security Rules" DSL rather than a general-purpose query language.
_Popular Languages: JavaScript/TypeScript client SDKs for both; Supabase also supports SQL for schema/policies; Firebase Security Rules use a proprietary rules language._
_Emerging Languages: Supabase Edge Functions run Deno/TypeScript; Firebase Cloud Functions run Node.js/TypeScript — comparable for any future serverless logic (e.g. AI tab backend calls)._
_Language Evolution: n/a — both are stable, mature SDK ecosystems as of 2026._
_Performance Characteristics: SQL gives Supabase richer server-side query logic (joins, subqueries) versus Firestore's simpler, denormalized read model._
_Source: [Supabase vs Firebase: The Data Model Decides](https://swyftstack.com/blog/supabase-vs-firebase)_

### Development Frameworks and Libraries

_Major Frameworks: `@supabase/supabase-js` (client + auth + realtime) vs `firebase` JS SDK (Auth, Firestore, Realtime Database modules). Both have first-class React integration patterns via a client singleton + React Context for auth state._
_Micro-frameworks: Supabase ships a pre-built Auth UI component library; Firebase offers FirebaseUI for common auth flows._
_Evolution Trends: Both SDKs are actively maintained in 2026; Supabase's SQL-native approach is gaining traction for apps needing relational integrity (e.g., course → module → user-progress relationships)._
_Ecosystem Maturity: Firebase has a longer track record (Google-backed, mobile-first); Supabase has strong open-source momentum and self-host portability._
_Source: [How to add Supabase Auth to your React Vite app](https://www.parsatajik.com/posts/how-to-add-supabase-auth-to-your-react-vite-app), [Building Seamless Authentication in React with Supabase](https://medium.com/@sune.sorgenfrei/building-seamless-authentication-in-react-with-supabase-a-modern-approach-36e7c78b5631)_

### Database and Storage Technologies

_Relational Databases: Supabase is built directly on PostgreSQL — tables, foreign keys, joins, constraints, and RLS policies. A natural fit for Vibe Hub's structured data: `users`, `courses`, `modules`, `user_progress` with foreign-key relationships._
_NoSQL Databases: Firebase's Firestore is a document/collection NoSQL store — no joins or schema enforcement; data is modeled by read pattern, which typically means denormalizing course/progress data across documents._
_In-Memory / Realtime: Supabase realtime uses Postgres logical replication (LISTEN/NOTIFY over WebSockets), benchmarked under 50ms at 1,000 concurrent connections; Firebase Realtime Database averages ~80ms but has more mature offline persistence and conflict resolution._
_Data Warehousing: Not a near-term need for Vibe Hub; both platforms are equally out-of-scope here._
_Source: [Supabase vs Firebase (2026) — Pricing, Auth & Realtime](https://www.rocket.new/blog/firebase-vs-supabase-what-developers-should-know-before-deciding), [Supabase vs Firebase: The Data Model Decides](https://swyftstack.com/blog/supabase-vs-firebase)_

### Development Tools and Platforms

_IDE and Editors: No special tooling required beyond standard VS Code/JS tooling already in use for Vibe Hub._
_Version Control: Supabase supports SQL migration files that version cleanly in git (schema-as-code); Firebase Security Rules and Firestore indexes are also file-based and git-friendly, but there is no equivalent to SQL migrations for a NoSQL schema (since none is enforced)._
_Build Systems: Both integrate transparently with Vite — client init is just an `.env` + a small client module, no build plugin needed._
_Testing Frameworks: Supabase can be tested against a local Postgres instance (via Supabase CLI + Docker) for realistic integration tests; Firebase offers the Firebase Local Emulator Suite for Auth/Firestore emulation._
_Source: [How to authenticate React applications with Supabase Auth - LogRocket](https://blog.logrocket.com/authenticate-react-applications-supabase-auth/)_

### Cloud Infrastructure and Deployment

_Major Cloud Providers: Supabase runs on AWS infrastructure under the hood but is consumed as a managed PaaS; Firebase runs on Google Cloud Platform._
_Container Technologies: Not directly relevant — both are managed services; Supabase additionally supports local self-hosting via Docker if data portability/ownership becomes a concern later._
_Serverless Platforms: Supabase Edge Functions (Deno) vs Firebase Cloud Functions (Node.js) — either could host the "real AI backend" the README also flags as a future step (e.g., proxying Anthropic API calls securely, keeping API keys server-side)._
_CDN and Edge Computing: Both offer edge-deployed functions/global distribution for low-latency reads._
_Source: [Supabase vs Firebase in 2026: Best Backend for Web Apps](https://www.weweb.io/blog/supabase-vs-firebase-comparison-for-web-apps)_

### Technology Adoption Trends

_Migration Patterns: A visible trend of teams moving from Firebase to Supabase when relational integrity, predictable pricing, or Postgres tooling becomes important; the reverse (Supabase → Firebase) is less common in 2026 sources reviewed._
_Emerging Technologies: Supabase's RLS-based multi-tenant auth model is increasingly recommended for apps with per-user data isolation — directly applicable to Vibe Hub's per-user course progress._
_Legacy Technology: Firebase Realtime Database (the original, pre-Firestore product) is largely legacy; Firestore is the current default for new Firebase projects._
_Community Trends: Supabase is frequently described as "the open-source Firebase alternative" with strong developer sentiment around SQL familiarity and self-host optionality; Firebase remains preferred for mobile-first, offline-first apps._
_Source: [Supabase vs Firebase: a Complete Comparison in 2026 | Bytebase](https://www.bytebase.com/blog/supabase-vs-firebase/), [Supabase vs Firebase in 2026: The Honest Comparison After Using Both in Production](https://dev.to/pockit_tools/supabase-vs-firebase-in-2026-the-honest-comparison-after-using-both-in-production-3e5)_

### Pricing Snapshot (2026)

- **Supabase Free tier:** 500 MB database storage, 1 GB file storage, 50,000 monthly active auth users, unlimited API requests; capped at 2 free projects that pause after 1 week of inactivity. Pro plan starts at $25/month (8 GB DB storage, 100 GB file storage, 250 GB bandwidth, PITR).
- **Firebase Spark (free) plan:** 1 GB Firestore storage, 5 GB file storage, 50,000 daily reads, 20,000 daily writes; as of February 2026 Cloud Storage was removed from the free Spark plan — file storage now requires the pay-as-you-go Blaze plan (no hard spending cap).
- **Cost model:** Firebase bills primarily per read/write/bandwidth operation — cheap to start, but can become unpredictable at scale, especially read-heavy apps (a course catalog with many reads fits this pattern). Supabase bills a predictable flat/tiered fee based on resources, reported as 3–5x cheaper than Firebase for read/write-heavy workloads in independent 2025–2026 comparisons.
_Source: [Supabase vs Firebase Free Tier Comparison — 2026 Deep Dive](https://agentdeals.dev/supabase-vs-firebase), [Firebase vs Supabase 2026: Pricing, Real-Time & Verdict](https://designrevision.com/blog/supabase-vs-firebase)_

## Integration Patterns Analysis

### API Design Patterns

_RESTful APIs: Supabase auto-generates a full REST API from the Postgres schema via PostgREST (`https://<project_ref>.supabase.co/rest/v1/`), with built-in filtering, pagination, and nested-resource queries via foreign keys — ideal for reading course/module/progress relations in one call. Firebase exposes a Firestore REST API too, but querying is shallow (no joins); relations must be denormalized or fetched in multiple round-trips._
_GraphQL APIs: Supabase offers an optional `pg_graphql` extension for a GraphQL endpoint over the same schema; Firebase has no native GraphQL layer (third-party wrappers only)._
_RPC and gRPC: Supabase supports Postgres stored procedures callable via `rpc()` for server-side logic (e.g., "mark module complete" transactions); Firebase's equivalent is Cloud Functions callable functions._
_Webhook Patterns: Both support webhooks/triggers — Supabase via Database Webhooks (Postgres triggers → HTTP), Firebase via Cloud Functions triggers on Firestore/Auth events._
_Source: [Data REST API | Supabase Docs](https://supabase.com/docs/guides/api), [Architecture | Supabase Docs](https://supabase.com/docs/guides/getting-started/architecture)_

### Communication Protocols

_HTTP/HTTPS Protocols: Both platforms are consumed entirely over HTTPS from the browser client; no custom backend server is required for the CRUD/auth paths Vibe Hub needs._
_WebSocket Protocols: Supabase Realtime (built on Elixir/Phoenix) supports Broadcast, Presence, and Postgres Changes — streaming DB row changes straight to subscribed clients, directly useful for live-updating a course-progress UI. Firebase Realtime Database/Firestore offer comparable listener-based real-time sync, with Firestore additionally providing robust offline persistence._
_Message Queue Protocols: Not applicable at Vibe Hub's current scale — no AMQP/MQTT broker needed for either option._
_Protocol Buffers/gRPC: Not exposed to client apps by either platform; irrelevant for this integration._
_Source: [GitHub - supabase/realtime](https://github.com/supabase/realtime), [Supabase vs Firebase: The Data Model Decides](https://swyftstack.com/blog/supabase-vs-firebase)_

### Data Formats and Standards

_JSON and XML: Both APIs exchange JSON exclusively — no format decision to make; Postgres `jsonb` columns let Supabase also store semi-structured data (e.g., flexible course metadata) inside an otherwise relational schema._
_Protobuf/MessagePack, CSV/Flat Files, Custom Formats: Not relevant to Vibe Hub's integration surface — both platforms standardize on JSON over HTTPS/WebSocket._
_Source: [Data REST API | Supabase Docs](https://supabase.com/docs/guides/api)_

### System Interoperability & Security Patterns

_Point-to-Point Integration: The React/Vite frontend talks directly to the BaaS via its client SDK (`@supabase/supabase-js` or `firebase`) — no API gateway or service mesh needed at this scale; this whole "Microservices Integration Patterns" / "Event-Driven Integration" category is not applicable to Vibe Hub's single-frontend architecture and is omitted here._
_OAuth 2.0 and JWT: Supabase issues session JWTs on login that are verified by Postgres via Row-Level Security — the same token authorizes both API calls and Realtime subscriptions (Realtime passes the API key via a `?apikey=` query param on the WebSocket upgrade rather than a header). Firebase issues short-lived (1 hour) ID token JWTs, auto-refreshed by the SDK, verified against Firestore/Realtime Database Security Rules; custom tokens allow adding custom claims for role-based checks._
_API Key Management: Supabase separates a public `anon` key (safe for client use, restricted by RLS) from a `service_role` key (server-only, bypasses RLS — must never ship to the browser). Firebase's client config/API key is also safe for client exposure by design, with access actually governed by Security Rules, not the key itself._
_Data Encryption: Both enforce TLS in transit by default; at-rest encryption is handled transparently by each managed platform._
_Source: [New API Keys and Asymmetric Authentication | Supabase Docs](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys), [Demystifying Firebase Auth Tokens](https://medium.com/@jwngr/demystifying-firebase-auth-tokens-e0c533ed330c), [Verify ID Tokens | Firebase Authentication](https://firebase.google.com/docs/auth/admin/verify-id-tokens)_

## Architectural Patterns and Design

### System Architecture Patterns

For a single-page React/Vite app like Vibe Hub, both options fit a **serverless / BaaS architecture**: the browser talks directly to a managed backend, with no custom server to operate. Supabase's stack is JS client → PostgREST/Realtime (Elixir/Phoenix) → PostgreSQL; Firebase's is JS client → Firestore/Realtime Database → Google's managed infrastructure. Neither requires microservices, an API gateway, or event-driven messaging at Vibe Hub's current scale — those patterns become relevant only if Vibe Hub later grows a separate backend service (e.g., for the "real AI" tab integration).
_Source: [Architecture | Supabase Docs](https://supabase.com/docs/guides/getting-started/architecture), [Firebase vs Supabase: Choosing the Right Backend](https://uibakery.io/blog/firebase-vs-supabase)_

### Design Principles and Best Practices

_Multi-tenancy / data isolation: Vibe Hub is effectively a single-tenant-per-user "pooled" model — one shared database, with each user's course progress isolated by a `user_id` column. The 2026 best-practice consensus for this shape (pre-launch product, no compliance mandate) is exactly this "shared schema + row-level security + application-level scoping" pattern. Supabase implements this natively via Postgres RLS policies scoped to `auth.uid()`. Firebase achieves the equivalent via Security Rules keyed on `request.auth.uid`, but without a relational schema to enforce foreign-key integrity between `users`, `courses`, and `progress`._
_API design: Supabase's auto-generated REST/RPC API over a normalized schema aligns with Vibe Hub's existing `src/data/courses.js` structure (courses → modules), letting that static data migrate to real tables with minimal remodeling. Firebase would require denormalizing this relational data into documents._
_Source: [Multi-Tenant SaaS Architecture: Patterns and Diagrams (2026)](https://architecturediagram.ai/blog/multi-tenant-architecture), [Building a Multi-Tenant SaaS: The Database Design Nobody Talks About](https://navanathjadhav.medium.com/building-a-multi-tenant-saas-the-database-design-nobody-talks-about-7831b576655f)_

### Scalability and Performance Patterns

_Firestore is built for very high concurrency (reported up to ~1M concurrent connections; Realtime Database ~200,000 WebSocket connections), which is far beyond anything Vibe Hub needs at launch. Supabase is described as "performant and stable for most production workloads" with more evolving guidance on extreme concurrent-write edge cases — not a practical concern for a course-progress-tracking feature with modest write volume. For Vibe Hub's expected scale (an educational cohort product, not a global consumer app), both are comfortably sufficient; the differentiator is cost predictability (see pricing above), not raw scalability headroom._
_Source: [Supabase vs. Firebase for MVP Scaling](https://propelius.tech/blogs/supabase-vs-firebase-for-mvp-scaling/), [Building Scalable Web Applications with Supabase](https://dev.to/ekwoster/building-scalable-web-applications-with-supabase-a-complete-guide-2j48)_

### Security Architecture Patterns

_Both enforce authorization close to the data: Supabase via Postgres RLS policies (SQL, versionable, testable with standard Postgres tooling), Firebase via declarative Security Rules (a separate DSL, tested via the Firebase Emulator Suite). RLS's advantage for Vibe Hub is that access rules live in the same migration files as the schema, reducing the risk of drift between "what the schema allows" and "what the rules allow" as the course-progress model grows more complex (e.g., adding cohorts, mentors, or admin roles later)._
_Source: [Multi-Tenant SaaS Architecture Patterns 2026](https://zanisssoftwares.com/blog/multi-tenant-saas-architecture-patterns-2026)_

### Data Architecture Patterns

_Vibe Hub's domain is inherently relational: a user enrolls in courses, courses contain modules, and progress is a join between user and module. This maps directly onto Postgres tables with foreign keys (Supabase) versus a NoSQL document model requiring deliberate denormalization to avoid multi-read fan-out (Firebase). This is the single most decision-relevant architectural finding: the shape of Vibe Hub's actual data (from `src/data/courses.js`) favors a relational backend._
_Source: [Supabase vs Firebase: The Data Model Decides](https://swyftstack.com/blog/supabase-vs-firebase)_

### Deployment and Operations Architecture

_Both are fully managed — no infrastructure for Léandro to provision or patch. Supabase additionally offers a documented self-host path (Docker-based) if data portability or cost control at larger scale becomes a priority later; Firebase has no self-host option, which is a one-way lock-in to Google Cloud. Given Vibe Hub's "Prochaines étapes" also list adding auth and a real AI backend, Supabase Edge Functions or Firebase Cloud Functions would both serve as the natural home for a server-side proxy to the Anthropic/OpenAI API (keeping API keys off the client)._
_Source: [Exploring Supabase, the open source Firebase alternative - LogRocket](https://blog.logrocket.com/exploring-supabase-the-open-source-firebase-alternative/)_

## Implementation Approaches and Technology Adoption

### Technology Adoption Strategies

_Migration Pattern: The recommended path for either backend is incremental, not "big bang" — start with authentication (sign-up/sign-in/sign-out + session hook), ship that, then migrate course-progress persistence from local React state to the database once auth is stable. Vibe Hub's existing `src/data/courses.js` static data maps cleanly onto Supabase tables (courses, modules) with minimal remodeling, letting the UI keep reading roughly the same shape of data during the transition._
_Vendor Evaluation Criteria: For Vibe Hub specifically — a solo-maintained educational app with relational course/progress data and no current mobile/offline requirement — the evaluation tilts toward Supabase on data-model fit and pricing predictability, and toward Firebase only if mobile apps or offline-first sync become near-term goals._
_Source: [Use Supabase with React | Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs), [Build a User Management App with React | Supabase Docs](https://supabase.com/docs/guides/getting-started/tutorials/with-react)_

### Development Workflows and Tooling

_Setup: `npm install @supabase/supabase-js`, add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` to `.env`, and instantiate a single client module (e.g. `src/lib/supabaseClient.js`) imported wherever needed — a near-identical pattern to Firebase's `firebase.js` client init._
_Schema Migrations: The Supabase CLI runs the full stack locally (Docker-based), captures schema changes as versioned SQL migration files committable to the existing git repo, and supports `supabase db pull`/`push` to sync local ↔ remote — giving Vibe Hub the same "schema as code" discipline as any relational-database project. Firebase has no equivalent schema-migration concept since Firestore has no enforced schema._
_State Management: Recommended pattern for both is a thin `AuthContext` (React Context + `useEffect`) that subscribes to auth-state changes on mount and exposes `user`/`loading` to the rest of the app — this slots directly into Vibe Hub's existing `App.jsx` router between `LandingPage` and `WorkspacePage`._
_Source: [Supabase Local Dev: migrations, branching, and observability](https://supabase.com/blog/supabase-local-dev), [Database migrations | Supabase Docs](https://supabase.com/docs/guides/local-development/overview)_

### Testing and Quality Assurance

_Supabase: `supabase test db` runs pg_prove/TAP-based SQL tests against the local stack; RLS policies can be verified locally in Studio by switching roles or passing different JWTs — directly testable without touching the production project. Firebase's equivalent is the Firebase Local Emulator Suite for Auth/Firestore/Rules testing. Both are CI-friendly (GitHub Actions is the common target for either)._
_Source: [Supabase CLI | Supabase Docs](https://supabase.com/docs/guides/local-development/cli/getting-started)_

### Deployment and Operations Practices

_Neither option requires new deployment infrastructure for Vibe Hub — the React/Vite frontend keeps deploying exactly as today (e.g., static hosting), while the backend is a managed cloud service reached purely over HTTPS/WebSocket from the browser. The only new operational surface is environment-variable management (Supabase URL/anon key or Firebase config) per deploy environment, and — if adopted — a CI step to apply Supabase SQL migrations (`supabase db push`) or deploy Firebase Security Rules on merge to main._
_Source: [Managing Environments | Supabase Docs](https://supabase.com/docs/guides/deployment/managing-environments)_

### Team Organization and Skills

_Vibe Hub is a solo/small-team project; the practical skill delta is SQL (Supabase) vs a Security-Rules DSL + denormalized document modeling (Firebase). Since the README's roadmap also includes "Ajouter TypeScript," Supabase's ability to auto-generate TypeScript types directly from the Postgres schema (`supabase gen types typescript`) is a concrete synergy with that separately-planned step._

### Cost Optimization and Resource Management

_At Vibe Hub's expected pre-launch/early-traction scale, both fit comfortably in a free tier. The relevant long-term signal from the pricing research above is that Firebase's pay-per-operation model risks unpredictable bills if the course catalog or AI-tab usage becomes read-heavy, whereas Supabase's flat/tiered pricing is easier to forecast when budgeting a side project or small business toward paid usage._

### Risk Assessment and Mitigation

_Lock-in risk: Firebase has no self-host or export-to-standard-SQL path — migrating away later means rebuilding the data model from scratch. Supabase, being Postgres underneath, retains a standard-SQL export/self-host escape hatch, lowering long-term lock-in risk._
_Relational-integrity risk: If Firestore is chosen, the team must manually maintain consistency between denormalized copies of course/progress data (no foreign keys) — a real risk given Vibe Hub's `courses → modules → progress` relationships, and a likely source of subtle bugs as the schema evolves._
_Mitigated by: Whichever platform is chosen, starting with RLS-equivalent access control from day one (rather than retrofitting it) avoids the common failure mode of shipping open collections/tables during early development and forgetting to lock them down before real user data arrives._

## Technical Research Recommendations

### Implementation Roadmap

1. Adopt **Supabase** as the backend for Vibe Hub (rationale in Recommendation below).
2. Install `@supabase/supabase-js`, add `.env` credentials, create `src/lib/supabaseClient.js`.
3. Model `courses`, `modules`, and `user_progress` tables from the existing `src/data/courses.js` shape; enable RLS scoped to `auth.uid()`.
4. Build `AuthContext` (sign-up/sign-in/sign-out + session listener) and wire it into `App.jsx`'s landing ↔ workspace routing.
5. Migrate `ModulesTab`/`CourseDetail` progress state from local React state to Supabase reads/writes; keep UI props/shape stable to minimize component churn.
6. Version schema changes via `supabase db pull`/migrations committed to git; add a CI step to apply migrations on merge.
7. Defer Realtime subscriptions (live progress sync) until there's a concrete multi-device or collaborative use case — not needed for v1.

### Technology Stack Recommendations

- **Backend:** Supabase (PostgreSQL + Auth + PostgREST + Realtime, as needed later)
- **Client:** `@supabase/supabase-js` with a single client singleton + React Context for auth state
- **Schema/versioning:** Supabase CLI migrations, committed alongside the existing Vite/React codebase

### Skill Development Requirements

- Baseline SQL (schema design, foreign keys, basic RLS policy syntax) — the only genuinely new skill versus the current stack
- Supabase CLI basics (`init`, `link`, `db pull/push`, `test db`) for local development parity with production

### Success Metrics and KPIs

- Auth flow (sign-up/sign-in/sign-out) working end-to-end with session persistence across reloads
- Course progress persists across sessions/devices for a logged-in user (replacing any local-only state)
- RLS verified: a user cannot read/write another user's progress rows (tested locally before shipping)
- No secrets (service-role key) present in client bundle — only the public anon key ships to the browser

---

# Choosing a Backend for Vibe Hub: Supabase vs Firebase Technical Research

## Executive Summary

Vibe Hub currently has no backend: course progress lives only in local React state, and there is no authentication. The README names both as the next technical milestone, and the natural question — which backend-as-a-service to adopt — has a clear answer from this research: **Supabase**. The reason is not a marginal preference but a structural fit: Vibe Hub's data (users enrolling in courses made of modules, with per-user progress) is relational by nature, and Supabase is Postgres underneath, meaning that structure is expressed directly as tables, foreign keys, and Row-Level Security policies. Firebase's Firestore, being schemaless NoSQL, would force denormalizing that same relationship across documents — solvable, but working against the grain of the data rather than with it.

This isn't a niche, indie-only concern either: for a solo-maintained side project, the backend that removes the most incidental complexity — schema drift, manual relation-consistency bugs, unpredictable bills — wins, because the maintenance burden falls on one person. Supabase's SQL migrations (versioned in git, testable locally via the Supabase CLI), predictable tiered pricing, and TypeScript type generation directly from the schema are all concrete productivity wins that compound over time, especially given "Ajouter TypeScript" is already on Vibe Hub's own roadmap.

**Key Technical Findings:**

- Vibe Hub's `courses → modules → user_progress` relationships favor a relational schema (Supabase/Postgres) over document denormalization (Firebase/Firestore)
- Supabase's Row-Level Security enforces per-user data isolation at the database layer — a direct fit for course-progress privacy
- Firebase's pay-per-operation pricing risks unpredictable bills for read-heavy usage (e.g., a course catalog); Supabase's tiered pricing is more forecastable and reported 3–5x cheaper at scale
- Firebase's Cloud Storage was removed from its free Spark plan in February 2026, requiring a pay-as-you-go Blaze account for any file storage — a relevant cost/complexity shift for a course platform likely to host media
- Supabase carries a standard-SQL export/self-host path (lower lock-in); Firebase has none
- Both integrate into React/Vite with near-identical setup effort (env vars + client singleton + auth context) — implementation cost is not a differentiator

**Technical Recommendations:**

1. Adopt Supabase as Vibe Hub's backend for both authentication and course-progress persistence
2. Model `courses`, `modules`, and `user_progress` as Postgres tables with RLS scoped to `auth.uid()`
3. Build a single `AuthContext` wrapping `App.jsx`'s existing landing/workspace routing
4. Version schema via Supabase CLI migrations committed to the repo, tested locally before deploy
5. Defer Realtime subscriptions until a genuine multi-device/collaborative need exists — not required for v1

## Table of Contents

1. Introduction and Methodology
2. Technical Landscape and Architecture Analysis
3. Technology Stack Comparison
4. Integration Patterns
5. Performance, Scalability, and Cost
6. Security Considerations
7. Strategic Recommendation
8. Implementation Roadmap and Risk Assessment
9. Source Documentation

## 1. Introduction and Methodology

### Why This Decision Matters Now

For a solo-maintained product, backend choice determines how much incidental infrastructure work stands between Léandro and shipping features. Managed BaaS platforms like Supabase and Firebase exist precisely to remove that overhead — no server provisioning, backups, or SSL management — letting a solo developer get a production-grade backend running in minutes rather than weeks. What tends to matter more than the platform itself is having a clear data model — which Vibe Hub already has, informally, in `src/data/courses.js` — making this a good moment to formalize it in a real schema.
_Source: [How to Choose a Backend for Your App in 2026 | MindStudio](https://www.mindstudio.ai/blog/how-to-choose-a-backend-for-your-app), [Best Backend Platforms for Indie Hackers in 2026 | MindStudio](https://www.mindstudio.ai/blog/best-backend-platforms-indie-hackers)_

### Methodology

- **Scope:** Authentication and course-progress persistence for a React 18 + Vite single-page app, evaluated against Vibe Hub's actual existing data shape and README-stated roadmap
- **Sources:** Current (2026) vendor documentation, independent comparison articles, and production-experience write-ups, cross-checked across multiple independent sources for pricing and architecture claims
- **Depth:** Practical/decision-oriented rather than exhaustive — sized to a solo/small-team project, not an enterprise evaluation

### Research Goals Achieved

**Original Goal:** Choose a backend-as-a-service to implement user authentication and persist course progression for Vibe Hub, replacing local React state, per the README next-steps.

**Achieved:** A concrete recommendation (Supabase) with supporting rationale across data modeling, cost, security, and implementation effort, plus an actionable step-by-step roadmap (Section 8) ready to execute against the existing codebase structure.

## 2. Technical Landscape and Architecture Analysis

Both platforms implement the same high-level shape: a JS client SDK in the browser talks directly to a managed backend over HTTPS/WebSocket, with no custom server required. Supabase's stack is `supabase-js` → PostgREST + Realtime (Elixir/Phoenix) → PostgreSQL; Firebase's is `firebase` → Firestore/Realtime Database → Google's managed infrastructure. Neither needs microservices, an API gateway, or event-driven messaging at Vibe Hub's scale — those become relevant only if a separate backend service emerges later (e.g., proxying the "real AI" tab's API calls, also on Vibe Hub's roadmap).

The decisive architectural difference is the data model: Supabase's relational schema (tables, foreign keys, joins, RLS) versus Firebase's document/collection NoSQL model (denormalized by read pattern, no joins or enforced schema). Vibe Hub's actual domain — courses containing modules, users progressing through modules — is a textbook relational shape, and mapping it onto Firestore means manually keeping denormalized copies of that relationship consistent, a real long-term risk given no foreign-key safety net.
_Source: [Architecture | Supabase Docs](https://supabase.com/docs/guides/getting-started/architecture), [Supabase vs Firebase: The Data Model Decides](https://swyftstack.com/blog/supabase-vs-firebase)_

## 3. Technology Stack Comparison

| Dimension | Supabase | Firebase |
|---|---|---|
| Core database | PostgreSQL (relational) | Firestore (NoSQL document) |
| Client SDK | `@supabase/supabase-js` | `firebase` |
| Server-side logic | SQL functions / RPC, Edge Functions (Deno) | Cloud Functions (Node.js) |
| Schema versioning | Git-committed SQL migrations via Supabase CLI | None (schemaless) |
| TypeScript synergy | Auto-generates types from schema (`supabase gen types typescript`) | Manual typing of documents |
| Self-host option | Yes (Docker) | No |
| Auth model | Session JWT + Postgres RLS (`auth.uid()`) | Short-lived ID token JWT + Security Rules DSL |
| Realtime | Postgres logical replication via WebSockets (Broadcast/Presence/Postgres Changes) | Firestore/Realtime Database listeners, strong offline sync |

_Source: [Data REST API | Supabase Docs](https://supabase.com/docs/guides/api), [GitHub - supabase/realtime](https://github.com/supabase/realtime), [Demystifying Firebase Auth Tokens](https://medium.com/@jwngr/demystifying-firebase-auth-tokens-e0c533ed330c)_

## 4. Integration Patterns

Both integrate into Vibe Hub's existing React/Vite structure identically in shape: an `.env` file with `VITE_`-prefixed credentials, a single client-singleton module, and a React Context (`AuthContext`) that subscribes to auth-state changes and exposes `user`/`loading` throughout the app — slotting directly between `LandingPage` and `WorkspacePage` in the existing `App.jsx` router. Supabase additionally auto-generates a full REST API from the schema (via PostgREST) with filtering, pagination, and joined reads out of the box — directly useful for fetching a course with its modules and a user's progress in one call, something Firestore's shallow queries cannot do without extra round-trips.
_Source: [Use Supabase with React | Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs), [Data REST API | Supabase Docs](https://supabase.com/docs/guides/api)_

## 5. Performance, Scalability, and Cost

Neither platform's raw scalability ceiling is a practical constraint for Vibe Hub — Firestore is benchmarked to roughly 1M concurrent connections and Supabase Realtime under 50ms latency at 1,000 concurrent connections, both vastly beyond an early-stage educational product's needs. The real differentiator is **cost predictability**: Firebase bills per read/write/bandwidth operation, which is cheap to start but can become unpredictable for read-heavy usage (a course catalog browsed repeatedly is exactly this pattern), and as of February 2026 Firebase removed free-tier Cloud Storage entirely, pushing any file storage onto a pay-as-you-go Blaze plan with no spending cap. Supabase's tiered, resource-based pricing ($25/month Pro plan for 8GB DB / 100GB storage / 250GB bandwidth) is easier to forecast and reported 3–5x cheaper than Firebase for comparable read/write-heavy workloads in independent 2025–2026 comparisons.
_Source: [Supabase vs Firebase Free Tier Comparison — 2026 Deep Dive](https://agentdeals.dev/supabase-vs-firebase), [Firebase vs Supabase 2026: Pricing, Real-Time & Verdict](https://designrevision.com/blog/supabase-vs-firebase), [Supabase vs. Firebase for MVP Scaling](https://propelius.tech/blogs/supabase-vs-firebase-for-mvp-scaling/)_

## 6. Security Considerations

Both enforce access control close to the data rather than trusting client-side checks. Supabase uses Postgres Row-Level Security policies — plain SQL, versioned alongside the schema, testable locally by switching roles or JWTs in Supabase Studio or via `supabase test db`. Firebase uses declarative Security Rules (a separate DSL from the data itself), testable via the Firebase Local Emulator Suite. For Vibe Hub, the practical implication is per-user progress isolation: a `user_progress` table (Supabase) or collection (Firebase) must guarantee one user can never read or write another's rows/documents — RLS gives this as a database-enforced guarantee even if application code has a bug, which is the standard 2026 recommendation for pooled/shared-database multi-tenant designs at this scale. On API keys: Supabase's public `anon` key is safe for client exposure only because RLS restricts it — the separate `service_role` key must never reach the browser; Firebase's client config is likewise safe to expose because access is governed by Security Rules, not key secrecy.
_Source: [Multi-Tenant SaaS Architecture: Patterns and Diagrams (2026)](https://architecturediagram.ai/blog/multi-tenant-architecture), [New API Keys and Asymmetric Authentication | Supabase Docs](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys)_

## 7. Strategic Recommendation

**Adopt Supabase.** The decision rests on three compounding factors specific to Vibe Hub, not a generic platform preference:

1. **Data-model fit** — the course/module/progress relationship is relational; fighting that with Firestore's document model adds real, ongoing consistency risk for no offsetting benefit (Vibe Hub has no offline-first or extreme-concurrency requirement that would favor Firebase).
2. **Cost predictability** — a course platform's read pattern (users repeatedly browsing a catalog) is exactly the shape that makes Firebase's per-operation billing risky, while Supabase's flat tiers are easy to budget for a side project moving toward monetization.
3. **Roadmap synergy** — Supabase's SQL migrations and auto-generated TypeScript types directly support two other items already on Vibe Hub's own "next steps" list (schema discipline and adding TypeScript), reducing the total number of new tools/concepts introduced at once.

Firebase would be the better choice only if Vibe Hub pivoted toward a mobile-first or offline-first product — neither of which is indicated by the current README or architecture.

## 8. Implementation Roadmap and Risk Assessment

### Roadmap

1. Install `@supabase/supabase-js`; add `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` to `.env`; create `src/lib/supabaseClient.js`
2. Design `courses`, `modules`, `user_progress` tables mirroring `src/data/courses.js`; enable RLS scoped to `auth.uid()`
3. Build `AuthContext` (sign-up/sign-in/sign-out + session listener) and integrate into `App.jsx`
4. Migrate `ModulesTab`/`CourseDetail` from local state to Supabase reads/writes, keeping component prop shapes stable
5. Commit schema as Supabase CLI migrations; test RLS locally (`supabase test db`, role/JWT switching in Studio) before touching production data
6. Add a CI step to apply migrations on merge to main
7. Defer Realtime subscriptions until a concrete need (multi-device sync) arises

### Risks and Mitigations

- **Lock-in risk:** Firebase has no self-host or SQL export path; mitigated by choosing Supabase, which retains a standard-Postgres escape hatch.
- **Relational-integrity risk (if Firebase were chosen):** manually-maintained denormalized copies of course/progress data can silently drift; avoided by choosing Supabase's foreign-key-enforced schema.
- **Under-secured launch risk (either platform):** shipping open tables/collections during early development and forgetting to lock them down before real user data arrives; mitigated by enabling RLS/Security Rules from the first migration, not retrofitting them later.
- **Scope creep risk:** Realtime, Edge Functions, and self-hosting are all available but unnecessary for v1 — the roadmap above intentionally excludes them to keep the initial implementation minimal.

## 9. Source Documentation

**Primary sources consulted:**

- [Supabase vs Firebase in 2026: Best Backend for Web Apps](https://www.weweb.io/blog/supabase-vs-firebase-comparison-for-web-apps)
- [Supabase vs. Firebase: a Complete Comparison in 2026 | Bytebase](https://www.bytebase.com/blog/supabase-vs-firebase/)
- [Supabase vs Firebase Free Tier Comparison — 2026 Deep Dive](https://agentdeals.dev/supabase-vs-firebase)
- [Firebase vs Supabase 2026: Pricing, Real-Time & Verdict](https://designrevision.com/blog/supabase-vs-firebase)
- [Supabase vs Firebase: The Data Model Decides](https://swyftstack.com/blog/supabase-vs-firebase)
- [Architecture | Supabase Docs](https://supabase.com/docs/guides/getting-started/architecture)
- [Data REST API | Supabase Docs](https://supabase.com/docs/guides/api)
- [GitHub - supabase/realtime](https://github.com/supabase/realtime)
- [New API Keys and Asymmetric Authentication | Supabase Docs](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys)
- [Demystifying Firebase Auth Tokens](https://medium.com/@jwngr/demystifying-firebase-auth-tokens-e0c533ed330c)
- [Verify ID Tokens | Firebase Authentication](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Multi-Tenant SaaS Architecture: Patterns and Diagrams (2026)](https://architecturediagram.ai/blog/multi-tenant-architecture)
- [Building a Multi-Tenant SaaS: The Database Design Nobody Talks About](https://navanathjadhav.medium.com/building-a-multi-tenant-saas-the-database-design-nobody-talks-about-7831b576655f)
- [Supabase vs. Firebase for MVP Scaling](https://propelius.tech/blogs/supabase-vs-firebase-for-mvp-scaling/)
- [Use Supabase with React | Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [Supabase Local Dev: migrations, branching, and observability](https://supabase.com/blog/supabase-local-dev)
- [Supabase CLI | Supabase Docs](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [How to Choose a Backend for Your App in 2026 | MindStudio](https://www.mindstudio.ai/blog/how-to-choose-a-backend-for-your-app)

**Confidence level:** High for pricing/architecture claims (cross-verified across 3+ independent 2026 sources each); moderate for exact real-time latency benchmarks (single-source figures, directionally consistent across sources but not independently re-measured).

**Limitations:** This research did not benchmark either platform directly against Vibe Hub's actual data; recommendations are based on documented platform behavior and third-party comparisons current as of August 2026, not hands-on load testing.

---

## Technical Research Conclusion

Vibe Hub's next real technical milestone — authentication and persistent course progress — is best served by **Supabase**, because the shape of Vibe Hub's own data (relational course/module/progress relationships) matches Postgres far better than Firestore's document model, and because Supabase's pricing, migration tooling, and TypeScript synergy reduce ongoing maintenance burden for a solo-maintained project. The roadmap in Section 8 is ready to execute directly against the existing `src/` structure without architectural rework.

---

**Technical Research Completion Date:** 2026-08-05
**Source Verification:** All technical facts cited with current 2026 sources
**Technical Confidence Level:** High — based on multiple cross-verified authoritative sources

_This research document serves as the decision record for Vibe Hub's backend choice and as an implementation reference for the migration described in Section 8._

<!-- Content will be appended sequentially through research workflow steps -->
