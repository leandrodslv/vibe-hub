---
name: 'Vibe Hub — Architecture Spine Adversarial Review'
type: review
target: '_bmad-output/planning-artifacts/architecture/architecture-vibe-hub-2026-08-06/ARCHITECTURE-SPINE.md'
method: adversarial-pairs
created: '2026-08-06'
---

# Adversarial Review — Vibe Hub Architecture Spine

**Method:** for each AD, construct two units one level down (separate stories/PRs, each implementing a different FR per the Capability→Architecture Map) that each obey the AD's Rule to the letter, yet could still build incompatibly. Also check whether each AD's Rule actually delivers its stated "Prevents," and whether the Capability→Architecture Map is complete/accurate.

**Verdict up front:** the spine is sound on the big load-bearing risks (key exposure, RLS-as-boundary, sandbox isolation) but has four real seams where "obeys every AD to the letter" does not imply "composes." The worst is a genuine security-relevant gap (Finding 1), not just a cosmetic inconsistency.

---

## Finding 1 — AD-3/AD-4 split lets the FR-8 implementer legally pre-provision the exact grant AD-4 exists to prevent

**Severity: High**

**The pair:**
- **Unit A — FR-8 (waitlist join) story.** Map entry for FR-8 lists governance as `AD-2, AD-3` only — **not AD-4**. A developer implementing FR-8 reads AD-3, which specifies: anon/public gets `INSERT` only on `waitlist`, no `SELECT` — and separately, for `courses`, "authenticated admin role — full CRUD." Nothing in AD-3's text forbids also giving the admin role a `SELECT` (or full CRUD) policy directly on `waitlist`, by the same "admin role gets full CRUD" pattern already established for `courses` two lines earlier in the same AD. A reasonable implementer, wiring up RLS for the table they're touching, adds an admin `SELECT` policy on `waitlist` "for completeness" — fully compliant with AD-3's literal text, since AD-3 is silent on admin+waitlist.
- **Unit B — FR-9 (waitlist count view) story**, built later or in parallel. Map entry correctly cites `AD-4`, whose Rule requires the *only* admin read path to `waitlist` demand data be the `waitlist_counts` view/RPC, with admin RLS granting `SELECT` on the view, **not on `waitlist` itself**.

**The clash:** Unit A's RLS migration (fully AD-3-compliant) already grants admin `SELECT` on raw `waitlist`. Unit B's migration, also fully AD-4-compliant in isolation, adds the view/RPC on top. The database now has both — AD-4's stated purpose ("Prevents... a wider grant than the feature needs") is silently defeated, and nothing in either AD's text was violated. This is exploitable specifically *because* the Capability→Architecture Map routes the FR-8 implementer away from ever reading AD-4 — they have no map-driven reason to know it exists.

**Why the Rule fails its own "Prevents":** AD-3's Rule for `waitlist` is asymmetric — it fully specifies the anon/public policy but leaves the admin-role policy on `waitlist` completely unstated (deferring it, unlabeled, to AD-4). A Rule that's silent on half of what it needs to constrain isn't a rule, it's a gap wearing a rule's clothing.

**Fix direction:** AD-3's `waitlist` bullet should say explicitly: *"admin role: no direct grant on `waitlist` (SELECT or otherwise); all admin reads go through AD-4's view/RPC."* And FR-8's Capability→Architecture Map row should cite AD-4 too, so the person writing the first waitlist RLS migration sees the constraint before they write it, not after.

---

## Finding 2 — AD-6 fixes *where* shared localStorage-tier state lives, not its *shape*; FR-5 and FR-6 can independently invent incompatible schemas under the same `ai_*` prefix

**Severity: High**

**The pair:**
- **Unit A — FR-5 (chat → prompt hand-off) story.** Ships first. Needs to persist chat sessions to satisfy "leaves the tab open rather than closing it" (PRD UJ-1). Complies with AD-6 to the letter: stores under an `ai_*`-prefixed `localStorage` key, no global state manager, component-local `useState` reads it. Picks a shape, e.g. `ai_conversations = [{ id, messages: [...] }]`.
- **Unit B — FR-6 (slash commands / project organization) story.** Also complies with AD-6 to the letter: stores under `ai_*`, no global state manager. Needs "conversations can be assigned to and later filtered by a project grouping" (FR-6 consequence). Independently invents `ai_projects = [{ id, name, conversationIds: [...] }]` — the inverse ownership direction from what Unit A's shape would need (Unit A's conversation objects have no `projectId` field to be filtered by).

**The clash:** Both units are individually AD-6-compliant — right tier, right prefix, right absence of a global store. But `IATab.jsx` now has two localStorage-tier entities that don't compose: filtering conversations by project requires either walking `ai_projects[].conversationIds` (Unit B's model) or reading `ai_conversations[].projectId` (a model Unit A never wrote). Whichever story ships second has to reverse-engineer and patch the first story's shape — exactly the kind of incompatibility AD-6 is titled to prevent, but its Rule only pins the storage tier, never the entity shape within it.

**Why the Rule fails its own "Prevents":** AD-6's stated Prevents is "a feature inventing its own ad-hoc storage... and fragmenting where 'state' lives." The Rule delivers on the *where* (Supabase vs. localStorage) but has nothing to say about shape/ownership of entities that live in the same tier and are shared across two FRs in the same tab. "Fragmenting where state lives" and "fragmenting what state looks like" are different failure modes; only the first is actually closed.

**Contrast with the Supabase tier:** note the Consistency Conventions table *does* pin shape for the Supabase tier (`snake_case`, UUID/serial `id`, `created_at`/`order_index`) — the localStorage tier gets no equivalent row, despite AD-6 explicitly naming two localStorage-tier features (FR-3 progress, FR-6 IA sessions/projects) that share the same tab and prefix family.

**Fix direction:** add a Consistency Conventions row (or an AD-6 addendum) for the `ai_*`/`progress_*` localStorage tier: pick one ownership direction for cross-referencing entities (e.g., "child always carries parent's id, never the reverse") and require it before FR-5 and FR-6 are built as separate units.

---

## Finding 3 — AD-4's "view or RPC" either/or leaves the actual enforcement mechanism unspecified, and the two options have different security properties

**Severity: Medium**

**The pair:** two implementers both satisfying AD-4's Rule ("a Postgres view or RPC... is the only read path") to the letter:
- **Unit A** builds a plain Postgres **view** `waitlist_counts` (`SELECT tool_id, count(*) FROM waitlist GROUP BY tool_id`) and grants admin role `SELECT` on it.
- **Unit B** builds a **`SECURITY DEFINER` RPC function** `get_waitlist_counts()` doing the same aggregation, called via `.rpc()`.

**The clash:** these are not interchangeable. A plain view's query executes against the underlying `waitlist` table, and depending on Postgres version/ownership (and whether `security_invoker` is set), it can either transparently inherit the caller's RLS restrictions (in which case a naive view might just return zero rows for a role with no direct `waitlist` SELECT grant — breaking the feature) or bypass RLS via the view owner's privileges (in which case it's functionally a privilege-escalation path, exactly the "wider grant" AD-4 says it's preventing, just laundered through a view instead of a table grant). AD-4's Rule treats "view or RPC" as two equally valid, interchangeable implementations of the same guarantee; they are not. Whichever one two different stories pick, one of them likely doesn't actually work or doesn't actually hold the security boundary AD-4 claims.

**Fix direction:** AD-4 should pin one mechanism (a `SECURITY DEFINER` RPC is the safer, unambiguous choice here) rather than leaving "view or RPC" open, or explicitly state the view must be created with an owner that has table access independent of the querying role's RLS grant.

---

## Finding 4 — the error-shape convention forbids mixing *within* a function but says nothing about mixing *across* functions in the same file/feature

**Severity: Low-Medium**

**The pair:**
- **Unit A — FR-4 admin CRUD story.** Adds `createCourse`, `updateCourse`, `deleteCourse` to `services/supabase.js`. Picks "throw on Supabase error" (matches existing pattern per the convention).
- **Unit B — FR-9 waitlist count story.** Adds `getWaitlistCounts()` to the same file. Picks "return `{ error }`" (also explicitly sanctioned by the convention, "existing pattern in `addToWaitlist`").

**The clash:** both are individually compliant — neither function mixes styles internally. But `AdminPage.jsx` now calls into the same service file with two different error-handling contracts: `try/catch` around some calls, `if (result.error)` branching around others, decided function-by-function with no naming or documentation signal to tell a caller which applies without reading the adapter source. This is precisely the fragmentation the convention seems aimed at preventing, but its actual constraint ("don't mix within one function") is scoped one level too narrow to catch it.

**Fix direction:** either pick one style file-wide going forward for *new* functions (only grandfather the existing mixed pattern), or require a naming convention that encodes the contract (e.g., functions returning `{ error }` are suffixed/documented explicitly).

---

## Finding 5 — "created_at/order_index for ordering" gives two valid, non-equivalent answers to "which field renders course order," and admin/public surfaces can pick different ones

**Severity: Low**

**The pair:**
- **Unit A — FR-2 (browse courses) story.** `ModulesTab` calls `getCourses()` sorted by `created_at`.
- **Unit B — FR-4 (admin manage courses) story.** `AdminPage`'s course list (and any future drag-to-reorder UI a content author would expect) sorts/displays by `order_index`.

**The clash:** both conform to the Consistency Conventions row verbatim ("`created_at`/`order_index` for ordering — existing pattern"), which offers both fields without saying which is canonical for which surface. Result: an admin reordering courses (if `order_index` is what their UI writes) sees no effect on the public catalog, which is still sorted by `created_at`. This is a small but real "looks correct in isolation, wrong when composed" gap, and it maps directly onto FR-4's consequence that admin edits "reflect immediately... without a code deploy" — reordering silently not reflecting would violate that consequence's spirit while no AD or convention was technically broken.

**Fix direction:** state explicitly that `order_index` is the canonical display-order field wherever a human-facing order matters, and `created_at` is for the admin's own default listing (or newest-first fallback) only — one line closes this.

---

## Secondary checks

**Does any AD's Rule fail to prevent its stated Prevents?**
- AD-6: yes — see Finding 2. The Rule closes the *storage-location* fragmentation it names but not the *entity-shape* fragmentation implied by "fragmenting where 'state' lives" when two FRs share a tier.
- AD-4: yes — see Finding 3. "View or RPC" as an undifferentiated either/or doesn't guarantee the "not a wider grant" property claimed, since the two options have different privilege semantics.
- AD-3: yes — see Finding 1. Asymmetric specification (anon policy stated, admin policy for `waitlist` left unstated) leaves the door open for the exact over-grant AD-4 was written to prevent, and the Map doesn't route the relevant implementer to AD-4 to catch it.
- AD-1, AD-2, AD-5: Rules match their Prevents cleanly. No pairing found that satisfies either to the letter while reintroducing the named risk.

**Does the Capability→Architecture Map miss any FR, or misattribute governance?**
- All 9 FRs (FR-1 through FR-9) are present in the Map. Nothing missing.
- FR-8 is under-attributed: it should also cite AD-4, since the first waitlist RLS migration is written during FR-8's implementation, before FR-9 exists — see Finding 1. As written, the map actively hides the constraint from the person most likely to violate it first.
- FR-7 is arguably under-attributed: it's mapped to `AD-1, AD-5` but not `AD-2`, even though the same row's "Lives in" column names `services/ai.js`, which is squarely a Service Adapter governed by AD-2 (as FR-5's row correctly does for the same file). Minor — doesn't create a real build-time clash since AD-2's rule is easy to satisfy incidentally, but it's an inconsistent application of the Map's own logic (compare to FR-5's row, which does cite AD-2 for the identical file).

---

## Summary Table

| # | Finding | Severity | ADs involved |
| - | - | - | - |
| 1 | FR-8 implementer can legally add an admin SELECT grant on raw `waitlist` that FR-9/AD-4 depends on not existing | High | AD-3, AD-4, Map |
| 2 | FR-5 and FR-6 can independently invent incompatible `ai_*` localStorage entity shapes | High | AD-6 |
| 3 | AD-4's "view or RPC" either/or has non-equivalent security semantics, unspecified | Medium | AD-4 |
| 4 | Error-shape convention allows per-function style drift within one adapter file | Low-Medium | Consistency Conventions |
| 5 | `created_at` vs `order_index` ordering convention is ambiguous across admin vs. public surfaces | Low | Consistency Conventions |
| — | FR-7 Map row omits AD-2 despite naming `services/ai.js` (inconsistent with FR-5's row) | Low (documentation only) | Map |
