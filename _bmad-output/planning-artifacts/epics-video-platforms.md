---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/epics.md
  - src/lib/validation.js
  - src/components/workspace/modules/CourseDetail.jsx
supersedes: none
extends: _bmad-output/planning-artifacts/epics.md
---

# Vibe Hub — Multi-Platform Video Embeds Epic Breakdown

## Overview

This document extends the v1 epic breakdown (`epics.md`, FR-1…FR-9) with the epic and story
needed to embed course videos hosted on TikTok, Facebook, and YouTube Shorts — in addition to
the Teams/SharePoint/Stream/YouTube/direct-link sources Epic 3 already supported. Written
retroactively: the story below documents work implemented and shipped to production on
2026-09-15, not a forward-looking spec.

## Requirements Inventory

### Functional Requirements

FR-18: Multi-platform course video embeds — a course's `video_url` (Epic 3, admin course
editor) can point to a TikTok video, a Facebook video/Reel/`fb.watch` short link, or a YouTube
Short, in addition to the already-supported Teams/SharePoint/Stream/YouTube/direct `.mp4`
sources; the Course Detail video player renders the correct official embed for whichever
platform the URL belongs to, with no dead/broken player for a supported host.

### Additional Requirements (Architecture — extends AD-1…AD-10)

- AD-11 (Architecture, extends AD-5): Any new embeddable video host must be added to **both**
  the client-side allowlist (`ALLOWED_VIDEO_HOSTS` in `lib/validation.js`, matched via
  `matchesHost()` on the parsed hostname — never a substring/`.includes()` check on the raw
  URL) **and** the `frame-src` CSP directive in `vercel.json`, in the same change. A host
  present in only one of the two either silently fails to embed in production (CSP blocks the
  iframe even though the JS allowlist permits it) or, worse, would allow an arbitrary-origin
  iframe if the allowlist were ever loosened without a matching CSP entry. `isAllowedVideoUrl()`
  remains the single gate before any `<iframe src>` is built from `course.video_url` — same
  posture as the existing YouTube/SharePoint embeds (admin-provided trusted URLs, not
  AI-generated code, so AD-5's `srcdoc` sandbox does not apply here).

### FR Coverage Map

FR-18: Epic 10 — Multi-platform video embeds in Course Detail

## Epic List

### Epic 10: Multi-Platform Video Embeds
A designer viewing a course sees its video play inline regardless of whether the content author
hosted it on Teams/SharePoint/Stream, YouTube (including Shorts), TikTok, or Facebook (including
Reels and `fb.watch` links) — the admin video-URL field and the Course Detail player support all
of them through each platform's official embed.
**FRs covered:** FR-18
**Implementation notes:** No new Supabase schema — `courses.video_url` already existed (Epic 3).
Extends the existing embed-selection logic in `CourseDetail.jsx` rather than introducing a new
mechanism; adds AD-11 (allowlist + CSP move together).

---

## Epic 10: Multi-Platform Video Embeds

A designer viewing a course sees its video play inline regardless of source platform.

### Story 10.1: Embed TikTok, Facebook, and YouTube Shorts Videos in Course Detail

As a designer,
I want a course's video to play inline no matter which platform (Teams, YouTube, YouTube
Shorts, TikTok, or Facebook) it was shared from,
So that I don't leave the app or hit a broken player depending on where the content author
found the source video.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** a course's `video_url` is a standard YouTube link (`youtube.com/watch?v=`,
`youtu.be/`) or a YouTube Short (`youtube.com/shorts/<id>`)
**When** I open the course in Course Detail
**Then** the correct video ID is extracted for either shape and the YouTube embed player
renders — a Shorts link previously produced a broken embed (`/embed/` with no id) because only
the `?v=` and `youtu.be/` shapes were parsed

**Given** a course's `video_url` is a TikTok video URL containing a numeric video id
(`tiktok.com/@user/video/<id>`)
**When** I open the course
**Then** TikTok's official embed (`tiktok.com/embed/v2/<id>`) renders inline

**Given** a course's `video_url` is a TikTok short link (`vm.tiktok.com/...`) with no numeric id
visible client-side
**When** I open the course
**Then** the player degrades to the existing direct-link fallback rather than rendering a
broken iframe — no crash, no blank `<iframe src>`

**Given** a course's `video_url` is any Facebook video, Reel, or `fb.watch` short link
**When** I open the course
**Then** Facebook's official video plugin
(`facebook.com/plugins/video.php?href=<url-encoded original URL>`) renders inline — the
original URL is passed through url-encoded, no client-side ID parsing is attempted (Facebook
resolves it server-side)

**Given** any `video_url` host
**When** the player decides whether to build an `<iframe src>` at all
**Then** it only does so for a host present in `ALLOWED_VIDEO_HOSTS` (`lib/validation.js`),
matched on the parsed hostname via `matchesHost()` — never a substring check (AD-11, same
invariant as the existing YouTube/SharePoint embeds)

**Given** the new embeddable hosts
**When** the CSP is evaluated in production
**Then** `vercel.json`'s `frame-src` directive includes `https://www.tiktok.com` and
`https://www.facebook.com` — without this, the browser blocks the iframe even though the
client-side allowlist permits it (AD-11)

**Given** the admin course editor's video-URL field (Epic 3, `AdminPage.jsx`)
**When** a content author reads its label and helper text
**Then** they reflect all supported sources, including the new ones — not just the original
Teams/SharePoint/Stream/YouTube/.mp4 list

**Given** the "Générer un brouillon IA depuis la vidéo" action (Epic 3, `AdminPage.jsx`)
**When** a content author pastes a TikTok or Facebook URL
**Then** the AI-draft button still only appears for YouTube URLs — Gemini's native video
ingestion supports YouTube URLs directly but not TikTok/Facebook; extending AI-draft generation
to those platforms is explicitly out of scope for this story (would require a separate
download/transcode pipeline, its own AD, and likely ToS review per platform)

**Implementation:** `src/lib/validation.js` (`ALLOWED_VIDEO_HOSTS`), `src/components/workspace/
modules/CourseDetail.jsx` (embed selection), `vercel.json` (`frame-src`), `src/pages/
AdminPage.jsx` (field copy). Tests: `src/lib/validation.test.js`. Verified live via Playwright
against real TikTok/Facebook/YouTube-Shorts fixtures before shipping.
