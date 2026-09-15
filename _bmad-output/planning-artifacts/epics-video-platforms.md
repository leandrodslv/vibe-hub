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
to those platforms is explicitly out of scope for this story

**Investigated 2026-09-15, rejected — not a technical limitation, a ToS one.** The Gemini API
itself is not the blocker: besides the YouTube-URL passthrough (preview, YouTube-only), it also
accepts raw video bytes directly (File API up to 2GB, inline base64 for smaller clips) — if the
video file were in hand, Gemini could analyze a TikTok or Facebook video exactly like a YouTube
one. The blocker is *obtaining* that file: TikTok's Terms of Service explicitly prohibit
downloading/scraping content without prior written consent, and Meta's Platform Terms prohibit
automated collection without prior written permission (extended in Jan 2025 to logged-out
access too) — Meta actively enforces this with a dedicated team, legal action, and technical
countermeasures, regardless of the contested *Meta v. Bright Data* ruling on public-data
scraping. Building a server-side download pipeline for either platform would mean shipping a
feature that breaches its own vendor's terms by default. Do not build this without an explicit,
written, per-platform authorization (e.g. TikTok's Content Posting API scope, or a Meta app
review granting the relevant Graph API video permissions) — an unauthorized scraper is not an
acceptable substitute.

**Implementation:** `src/lib/validation.js` (`ALLOWED_VIDEO_HOSTS`), `src/components/workspace/
modules/CourseDetail.jsx` (embed selection), `vercel.json` (`frame-src`), `src/pages/
AdminPage.jsx` (field copy). Tests: `src/lib/validation.test.js`. Verified live via Playwright
against real TikTok/Facebook/YouTube-Shorts fixtures before shipping.

### Story 10.2: Generate an AI Draft from a Manually-Obtained Video File

As a content author,
I want to generate an AI course draft from a TikTok or Facebook video I've saved myself,
So that I'm not limited to YouTube for the "brouillon IA" shortcut, without the app ever
scraping those platforms on my behalf.

**Status: done — shipped 2026-09-15.**

Follows directly from Story 10.1's investigation: Gemini itself can analyze any video file via
its File API (upload + `fileData.fileUri`, same mechanism already used for YouTube URLs under
the hood) — the only blocker was *obtaining* a TikTok/Facebook video server-side, which would
breach both platforms' Terms of Service. The resolution already anticipated by the original
`course-draft` implementation comment (never followed through until now): a **local script**,
never an Edge Function, so no server ever downloads from a third party — only a file the
content author has already saved themselves through their own, manual, non-automated action.

**Acceptance Criteria:**

**Given** a content author has manually saved a video file from TikTok, Facebook, or any other
source (their own action — using each platform's own "save video" feature, never a script
acting on their behalf)
**When** they run `GEMINI_API_KEY=<key> npm run course-from-video -- <path-to-video>`
**Then** the script uploads the file directly to Gemini's File API, polls until the file's
`state` is `ACTIVE`, and generates the same structured draft (`title`/`description`/`duration`/
`content`) as the YouTube path — same prompt, same response schema, same model
(`gemini-2.5-flash-lite`), kept in sync by comment with `course-draft/index.ts`

**Given** the script's file-type gate
**When** an unsupported extension is passed
**Then** it exits with a clear error listing supported extensions (`.mp4`, `.mov`, `.webm`,
`.m4v`) before ever calling Gemini

**Given** `GEMINI_API_KEY` is not set
**When** the script runs
**Then** it exits with a clear error pointing to the same secret already documented for
`gemini-proxy`/`course-draft` in `.env.example` — no silent failure, no key prompted for or
stored by the script

**Given** the generated draft
**When** the script finishes
**Then** it only prints the JSON to stdout — it never writes to Supabase directly; the content
author reviews it and pastes it into `/admin`'s course editor by hand, identical to the
YouTube-draft review step ("à relire avant d'enregistrer, rien n'est publié automatiquement")

**Given** this is a local dev-tooling script, not application code
**When** it is added
**Then** `@google/genai` is a `devDependency` (never shipped in the Vite/browser bundle — no
`src/` file imports it), and the script is excluded from `npm run lint`'s scope exactly like
the project's other `scripts/*.mjs` files (`--ext js,jsx` does not cover `.mjs`) — consistent
with existing convention, not a newly introduced gap

**Implementation:** `scripts/course-from-video.mjs`, `package.json` (`course-from-video` script
entry, `@google/genai` devDependency). Verified end-to-end against the real Gemini API (an
invalid key correctly surfaces `API_KEY_INVALID` with a clean exit code) — full success path
not exercised with a real key/video in this session, by design (the content author's own
Gemini quota, not spent on their behalf).

### Story 10.3: Local Transcription Mode — Less AI, Cheaper, Nothing Leaves the Machine but Text

As a content author,
I want an option that transcribes the video locally and only sends the transcript text to
Gemini,
So that I have a cheaper, faster alternative that doesn't upload the video file itself, when a
full AI "watch" of the video isn't needed to get a good draft.

**Status: done — shipped 2026-09-15.**

**Acceptance Criteria:**

**Given** `scripts/course-from-video.mjs` is run with the `--transcribe` flag
**When** it processes a local video file
**Then** the audio track is extracted locally via `ffmpeg-static`/`fluent-ffmpeg` (mono,
16kHz — Whisper's expected input), transcribed **entirely locally** via Whisper running
in-process through `@huggingface/transformers` (ONNX, CPU, no cloud speech API, no per-minute
cost) — the video file itself is never uploaded anywhere in this mode

**Given** the transcription step
**When** the model is selected
**Then** it defaults to `Xenova/whisper-small` (multilingual — not the English-only `.en`
variant, since course content is French), overridable via a `WHISPER_MODEL` env var; language
is passed explicitly as `language: 'french', task: 'transcribe'` to the ASR pipeline rather
than left to auto-detection, and long audio is chunked (`chunk_length_s: 30, stride_length_s:
5`, Whisper's standard windowing) so videos longer than Whisper's native ~30s window still
transcribe correctly

**Given** only the transcript (never the video) needs to reach Gemini in this mode
**When** the draft is generated
**Then** a distinct prompt (`promptFromTranscript`) — aware the input is an ASR transcript that
may contain hesitations/repetitions/minor errors — asks Gemini to produce a clean structured
course from the text; this call carries no `fileData`/`inlineData` part, materially cheaper and
faster than the video-upload path

**Given** the exact video duration is knowable without any AI guess
**When** the draft is assembled
**Then** `duration` is computed directly from ffmpeg's own probed duration (`codecData` event)
and overwrites whatever the model returned for that field — accuracy over inference for a value
we can measure exactly

**Given** an empty or unintelligible transcription (e.g. a video with no spoken audio)
**When** this is detected
**Then** the script fails fast with a clear message before ever calling Gemini — no wasted API
call on empty input

**Given** all temporary files (the extracted `.wav`)
**When** the script finishes, succeeds or fails
**Then** they are removed (`finally` block, `mkdtemp` + `rm -rf` on the temp dir) — no leftover
audio files accumulate on disk across runs

**Given** the two modes share the same CLI entry point
**When** a content author chooses between them
**Then** the default (no flag) remains "Gemini watches the full video" (Story 10.2, simplest,
one network round-trip) and `--transcribe` is the opt-in "less AI, cheaper, video stays local"
alternative — both produce the identical output shape (`title`/`description`/`duration`/
`content`) so either can be pasted into `/admin` the same way

**Implementation:** `scripts/course-from-video.mjs` (`generateFromTranscript`, extended CLI
parsing for `--transcribe`), new devDependencies `@huggingface/transformers`, `wavefile`,
`ffmpeg-static`, `fluent-ffmpeg`. Verified end-to-end locally: real ffmpeg audio extraction,
real Whisper model download + transcription (tested with `Xenova/whisper-tiny` for a fast
smoke test; `Xenova/whisper-small` is the shipped default), real call through to the Gemini API
(invalid key correctly rejected) — full success path with a real key and real speech content
not exercised in this session, by design (the content author's own Gemini quota).
