# Reflexia

A reflection app that **anybody can use easily, regardless of background**.
Not a healthcare app. Not a professional tool. The current priority is making
the general core genuinely good for a person who has never reflected formally
in their life.

Speciality modules for regulated professions are a later idea, deliberately
deferred. Do not design for them, optimise for them, or bring them up as a
near-term consideration.

Stack: React 19.2, Vite 7.2, TypeScript 5.9. Offline-first PWA, IndexedDB, no
backend, no accounts. Deploys to Cloudflare Pages.

Long-form reasoning, schemas and the deferred module design:
https://claude.ai/code/artifact/63c97b33-95d8-4e86-bf33-9b426bcdc4d5
That spec predates the general-core decision in places. This file wins.

Phase 1 scoping, the wiring trace and the dead-code inventory:
`docs/PHASE-1-SCOPE.md`.

## The core question for every change

**Could someone with no professional background use this and enjoy it?**
If something only makes sense to a member of a particular profession, it does
not belong in the core — however much work is already in it.

## Locked decisions

1. **Profession-independent core.** See the question above.
2. **The game-like feel is the point.** It is the mechanism that makes the app
   approachable to someone with no training in reflective practice.
3. **Spaces are the differentiator.** Twenty guided spaces, each a place you
   go with a specific situation — a difficult conversation, a decision, a
   loss (`src/frameworks/spaces.ts`, the hub in `components/holodeck/`) —
   plus the sketch pad (`CanvasBoard.tsx`). "A place you go", not "a form you
   fill in". *Reworded 22 Sep 2026* (`docs/PHASE-3-SCOPE.md` §4.1): the old
   wording named an `Interior3D.tsx` that never existed. A navigable 3D room
   is a question for after phase 3, once someone has been watched using the
   spaces — not a commitment. On screen they are called **Spaces**.
4. **XP and achievements attach to learning the app, never to reflecting.**
   Nothing rewards entry count. No streaks. Lessons complete by doing the real
   thing once, not by clicking through a tour. Progression is invisible while
   someone is writing. This replaces the `ACHIEVEMENTS` catalogue in
   `services/gamificationService.ts`; the points engine itself stays.
5. **Gibbs is not the core.** The six-stage cycle (Description, Feelings,
   Evaluation, Analysis, Conclusion, Action Plan) is a nursing and teacher-
   training framework. **Done (phase 2, 22 Sep 2026):** the composer opens
   in Three-Part (what happened / what stood out / what you carry forward),
   Open Entry is one tap away ("Just write"), and Gibbs is one of six in the
   catalogue behind "Use a framework". See "Frameworks" below.
6. **Nothing commercial yet.** No entitlement, no paid tiers, no key pools, no
   storefront. `setUserTier()` is a localStorage bypass and stays broken for
   now — just do not build on it.

## The professional layer

**Phase 1 is done (22 Sep 2026).** Everything profession-specific lives in
`src/modules/professional/` (see its `README.md`): seventeen components,
data files and services, the 32 profession presets (`data/professionConfig.ts`),
and the module's own types. It is off the router, the dashboard, the pack
registry and the tutorial. Nothing in the core imports from that folder; the
dependency arrow points one way. **Do not delete it** — it becomes a module
later.

What the core keeps, and why:

- `UserProfile.profession` (`types.ts`) — saved profiles carry values like
  `'NURSING'`; the core never reads it. New users get `'NONE'`.
- `ReflectionEntry.cpd` and `.nmcCodeThemes`, `UserStats.cpdMinutesTotal` —
  saved entries carry them; nothing in the core writes or reads them.
- The `profession?` parameter on the `AIProvider` interface — accepted and
  ignored; a later module can pass it.
- `DEFAULT_COACH_PREFIX` in `constants.ts` — the one coaching voice.

Quick Capture saves a **capture** — a note with optional photo or audio.
The stored `type` is still the literal `"INCIDENT"` (on devices; it stays),
but since phase 3A.3 nothing a person sees says "incident": the type is
`CaptureEntry`, `isCapture()` / `isReflection()` in `utils/entryKind.ts`
are the only way code tells kinds apart, and the clinical fields
(`IncidentCategory`, severity, location, people, outcome…) live in the
module's `types.ts` as `ProfessionalIncidentEntry`.

## Frameworks

A framework is a fixed list of questions the composer walks someone through.
One definition, `ReflectionFramework` in `src/frameworks/types.ts`; each stage
carries its own label, question, placeholder and offline coaching text.

- `src/frameworks/builtIn.ts` — **Three-Part** (id `SIMPLE`, the default) and
  **Open Entry** (id `FREE`, one field).
- `src/frameworks/catalogue.ts` — Gibbs, "What? So what? Now what?" (Rolfe),
  ERA, STAR, Morning Check-in, Evening Review. Each names its origin so the
  picker is honest about where it comes from.
- `src/frameworks/index.ts` — `ALL`, `getFramework(id, answerKeys)`,
  `frameworkName`, `stageLabel`, `stageCoaching`. Unknown ids (SBAR, SOAP,
  `CUSTOM_1..3` from older builds) resolve to a `legacy` framework built from
  the entry's own answer keys, so every saved entry still opens.
- `src/modules/professional/data/frameworks.ts` — SBAR and SOAP. Clinical
  structures, not reflection; out of the core.
- `src/frameworks/spaces.ts` — the twenty **spaces** (Holodeck), generated
  from `data/holodeckSpaces.ts` as frameworks of `kind: 'space'`
  (`SPACE_DIFFICULT_CONVERSATION`, stages `…_1`–`…_5`), each with its
  colour, its guide's role as the Coach line, and a "gentle" flag. A
  finished space is an ordinary encrypted entry (phase 3A.4); before that it
  went to plaintext `localStorage['holodeckEntries']` and nothing read it
  back. Those migrate on launch.

**Ids are stored data.** `entry.model` holds the framework id and
`entry.answers` is keyed by stage id, on users' devices, today.
`tests/unit/frameworks.test.ts` pins every id; if it fails because an id
changed, that change needs a migration, not a test edit. Display text can
change freely. Where the code talks to a person it says "framework"; `model`
survives only as the stored field name.

## Phases

| # | Phase | Estimate | Status |
| - | ----- | -------- | ------ |
| 0 | Test harness — entry create/save/recover, IndexedDB, export | 17–22h (`docs/PHASE-0-SCOPE.md`) | **Done**: 67 unit tests, 16 e2e specs, CI workflow. First CI run happens on push |
| 1A | Move the professional layer to `src/modules/professional/` | 8–11h | **Done** |
| 1B | De-profession the live core (`PROFESSION_CONFIG`, onboarding, NMC block, AI prefixes, bug B1) | 10–13h | **Done** |
| 2 | Demote Gibbs, framework interface, Open Entry + Three-Part | 15–20h (`docs/PHASE-2-SCOPE.md`) | **Done** |
| 3 | Make the core good for anyone — first-run experience, persistent storage, accessibility, XP rework to learning tracks, Quick Capture data model, the AI gate | 46–63h (`docs/PHASE-3-SCOPE.md`), in five parts: 3E AI boundary 5–7h, 3A data 11–15h, 3C accessibility 8–11h, 3B front door 12–16h, 3D learning tracks 10–14h | **3E, 3A and 3C done** (22 Sep 2026). All eight §4 decisions made the same day. 3B and 3D not started |

Deferred indefinitely: module runtime, manifests, entitlement, specialities.

## Current state

- Branch `phase-1a/professional-module`, on top of `refactor/context-layer`.
  Both need pushing.
- **Tests.** `npm test` — 14 vitest suites, 115 tests, ~3 s, in Node against
  the real services (fake-indexeddb, Node WebCrypto). `npm run test:e2e` —
  38 Playwright specs in Chromium, ~90 s, starts the dev server itself.
  One e2e spec and one unit test are declared expected failures: the
  empty-text CSV export (`docs/PHASE-0-SCOPE.md` §0.3). `npm run audit:a11y`
  runs axe on seventeen screens and **fails on any critical or serious
  violation** (3C.5); today it finds none. `.github/workflows/test.yml` runs
  build, unit, e2e and the audit on every push and PR; it has not run yet
  because nothing has been pushed since it was added. `node
  tests/audit/reachability.mjs` lists the files unreachable from `main.tsx`.
- **Three data-loss bugs fixed 22 Sep 2026**: backup restore emptied the
  store and the localStorage→IndexedDB migration failed on every launch
  (both from awaiting `crypto.subtle.encrypt()` inside an open IndexedDB
  transaction), and `getCryptoKey()` memoised the key rather than the
  promise, so concurrent first writes could encrypt under two different keys
  (3A.2). Regression tests in `tests/unit/entryStorage.test.ts`.
- **Encrypted at rest is true since 3A.2.** Entries live only in the
  encrypted IndexedDB store; the old plaintext `localStorage` copy is
  migrated once and removed. Only a browser with no IndexedDB falls back to
  plaintext, and Profile → Your data says so.
- **Persistence (3A.1):** the first save asks `navigator.storage.persist()`
  once per device; Profile → Your data reports the answer and usage, and
  offers Install when the browser fires `beforeinstallprompt`. The manifest
  used to name icon files that did not exist, so the app was never
  installable; `tests/unit/pwa.test.ts` guards it now.
- **Bug B1 fixed (1B):** a returning user lands on the dashboard; Skip
  never overwrites a name. `tests/e2e/first-run.spec.ts` guards it.
- **Accessibility (3C):** every control has a name, every screen sits in a
  landmark, nothing a person reads is under 12 px, keyboard focus is always
  visible and moves to the top of each new screen, and there are no native
  `alert()`/`confirm()`/`prompt()` calls — `services/noticeService.ts` +
  `components/Notices.tsx` are the in-app notice and confirm dialog, and
  `tests/unit/notices.test.ts` fails if a native dialog comes back.
- `src/packs/` is a compile-time feature-flag system. The `professional`
  pack is gone; the other four and the trial mechanism are untouched.
- Roughly a third of the source files are unreachable from `main.tsx`
  (inventory in `docs/PHASE-1-SCOPE.md` §4; four of them were deleted in
  phase 2). `services/subscriptionService.ts` still advertises "All
  reflection models (Gibbs, SBAR, ERA, etc.)" in a paywall nobody can reach —
  decision 6 territory, untouched. Of the six views the February refactor
  dropped from `App.tsx`, Library and RewardsStore are in the module;
  **decided 22 Sep 2026:** GamificationHub and CanvasBoardBasic are deleted in
  3D.5, DriveMode is parked (a rebuild on frameworks later, 6–8 h),
  MentalAtlas is kept for a later "Patterns" screen.
- Most files under `src/` still have CRLF endings in the working tree from
  before the `6bc0967` normalisation; the index holds LF. Cosmetic.

## Open questions

1. ~~The AI layer.~~ **Closed (phase 3E, 22 Sep 2026).** There is no
   build-time key any more: the person pastes their own Gemini key in
   Profile → AI, it lives in the `reflexia-keystore` IndexedDB (never in a
   backup, never in a bundle), and `services/aiService.ts` is the one gate —
   every call answers offline unless `aiEnabled` **and** a key are both
   present at that moment. Turning AI on shows what each feature sends
   (Coach: the current answer; Insight: the whole entry; Oracle: the last 40
   entries) and needs a second tap; the Oracle screen says which state it is
   in. `tests/unit/aiGate.test.ts` fails if a `VITE_GEMINI` path or an
   `import.meta.env` read comes back into `aiService.ts`; `tests/e2e/ai.spec.ts`
   covers the consent flow and asserts no request to `googleapis.com` with AI
   off. The model name is `GEMINI_MODEL` in `aiService.ts`.
2. ~~`data/learningResources.ts`~~ — moved with the module, dead code, no
   rework. If the core ever wants a library it gets general content, not a
   scrubbed nursing list.
3. What does a first-time user with no background actually do in their first
   90 seconds? Observed: three slides, a name field, then a dashboard with
   Capture / Reflect / Archive and the differentiator (Holodeck) hidden
   behind a pack toggle. The profession question is gone (1B); phase 3 owns
   the rest. Still the most important question in the project. Traced
   second by second in `docs/PHASE-3-SCOPE.md` §1.1.
4. ~~Decision 3 names a file that does not exist.~~ **Closed 22 Sep 2026:**
   decision 3 reworded to what exists (the spaces); a 3D room is a question
   for after phase 3.

## Working preferences

British English. Full file paths with extensions, complete file contents for
replacement — assume no prior knowledge of where things live. Honest hour
estimates, phase by phase. Show what's done versus what needs building. No
hand-waving about complexity, no oversimplification, no false reassurance.
