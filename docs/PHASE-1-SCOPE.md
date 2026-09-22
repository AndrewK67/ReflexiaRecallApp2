# Phase 1 scope — stripping the professional layer

**Branch:** `refactor/context-layer` · **Verified against:** commit `49e2aa1` (origin) — identical source to your local `d9195d9`, which only changes `CLAUDE.md` and is **not yet pushed**.
**Written:** 22 September 2026 · **Status:** scoping complete; **phases 1A and 1B both executed the same day** (branch `phase-1a/professional-module`, current state in `CLAUDE.md`). Line numbers below refer to the tree *before* 1A.

This document does three things: confirms the recovered branch actually runs, traces exactly how the professional layer is wired into the core, and re-costs phase 1 against the 35–45 hour figure in `CLAUDE.md`.

---

## 0. The verdict in five lines

1. ✅ **The branch runs.** Clean install, `npm run build` (15 s, exit 0), `npm run dev` boots in headless Chromium, a Quick Capture entry saves to IndexedDB encrypted, survives a reload and appears in Archive. Zero page errors.
2. ❌ **35–45 h is the wrong number for the job `CLAUDE.md` describes.** Eleven of the fifteen listed files are **dead code** — nothing imports them, so they never reach a user. The four live ones (plus two the list misses) are lazy-loaded, pack-gated and held on by roughly **60 lines** across `App.tsx`, `AppContext.tsx`, `SimplifiedDashboard.tsx`, `packs/` and `tutorialService.ts`. Moving all seventeen: **8–11 h.**
3. ⚠️ **But the list misses where the profession actually lives.** `PROFESSION_CONFIG` (75.8 KB — 93 % of `constants.ts`), the onboarding profession picker (which defaults every user to `NURSING`), the NMC Code block in `ReflectionFlow.tsx`, and the AI prompt prefixes. Do only the file move and you still have a nursing app with the CPD screen hidden. De-professioning the live core: **10–13 h.**
4. 🧭 **Recommended phase 1 = 1A (move, 8–11 h) + 1B (de-profession, 10–13 h) = 18–24 h**, with a clear line between them. 1A is safe without a test suite; 1B is where phase 0 earns its keep.
5. 🐛 **Three runtime bugs found that `tsc` cannot see** — none introduced by the recovery, all pre-existing. The worst: on every launch the onboarding replays, and tapping **Skip** overwrites a returning user's name with `User` and profession with `NURSING`.

---

## 1. Runtime verification

### 1.1 How it was run

Your local `node_modules` was installed on Windows and contains only `win32-x64` binaries for esbuild and rollup, so it cannot execute in a Linux shell. Rather than touch your machine, I cloned `origin/refactor/context-layer` into a clean Linux workspace (Node 22.22, npm 10.9) and ran `npm ci` from your `package-lock.json`. Your `dist/` folder is timestamped 21 Sep 16:15, after the recovery commit, which independently suggests the build also passes on Windows.

| Check | Result | Detail |
| --- | --- | --- |
| `npm ci` | ✅ 11 s | 685 packages, 3 deprecation warnings, no errors |
| `npm run build` (`tsc -b && vite build`) | ✅ 15 s, exit 0 | 1 773 modules, 47 precache entries (785 KB). Main chunk `index-*.js` 380 KB (110 KB gzip) |
| Build warning | ⚠️ 1 | `entryStorageService.ts` is imported both statically (`EntriesContext.tsx`) and dynamically (`storageService.ts`), so Vite cannot split it. Harmless; tidy in phase 0 |
| `npm run dev` | ✅ ready in 218 ms | HTTPS via `@vitejs/plugin-basic-ssl`, self-signed |
| Boot in headless Chromium | ✅ | React mounts, onboarding renders, **0 page errors**, 1 benign 404 (`/favicon.ico`) |
| IndexedDB on first load | ✅ | `reflexia-entries@v1`, `reflexia-keystore@v1` created; `reflexia.entries.idb_migrated` set |
| Complete onboarding (name + profession) | ✅ | `reflexia.profile.v1` written correctly |
| Quick Capture → Save | ✅ | Record `incident_<ts>` in IDB with shape `{ id, _encrypted: { iv, ct } }` — encrypted at rest |
| Reload | ✅ | Entry count still 1; Archive lists "1 of 1 entries" |
| Reflection flow first screen | ✅ | "SIMPLE MODE • STEP 1 OF 3 — What happened?" |
| `navigator.storage.persisted()` | ❌ `false` | As `CLAUDE.md` says: never requested, entries evictable |
| Service worker in dev | n/a | Not registered in dev (expected with `vite-plugin-pwa`) |
| `npm run lint` | ❌ 245 problems | 234 errors, mostly `no-explicit-any` and unused vars. Lint is not in the build so this doesn't block anything, but it is noise you'll want gone before phase 0 tests land |

The smoke script that produced these results is delivered alongside this document as `tests/smoke-runtime.mjs` (see §7). It is the seed of phase 0, not a substitute for it.

### 1.2 Runtime bugs found (all pre-existing)

| # | Bug | Where | Evidence | Fix cost |
| --- | --- | --- | --- | --- |
| B1 | **Onboarding replays on every launch, and Skip clobbers the profile.** `currentView` is hard-coded to `'ONBOARDING'` and nothing routes an onboarded user to the dashboard. `handleSkip` then calls `onComplete({ name: name \|\| 'User', profession })` with fresh state | `src/contexts/AppContext.tsx:40`, `src/components/SimplifiedOnboarding.tsx:29-33` | Set profile to `Andrew / ENGINEERING`, reloaded, tapped Skip → profile became `User / NURSING`. The old `App.tsx` (33ce412:297) did the same "login-first" thing deliberately, so this is not a recovery regression | 1 h (in 1B) |
| B2 | **Five tutorial steps navigate to views `App.tsx` no longer renders** (`DRIVE_MODE`, `MENTAL_ATLAS`, `GAMIFICATION`, `CANVAS`, `LIBRARY`). They fall through the `switch` to `DASHBOARD` | `src/services/tutorialService.ts:106,156,205,285,301` | The February refactor dropped six lazy views from `App.tsx` (see §4.2) but not their tutorial steps | 0.5 h (in 1A) |
| B3 | **Dashboard shows a `STREAK` tile and an AdSense placeholder** — contradicting locked decisions 4 (no streaks) and 6 (nothing commercial) | `src/components/SimplifiedDashboard.tsx:75-77` (streak tile), `:7` and `:204` (AdBanner) | Visible in the screenshot after the first save: "1 REFLECTIONS · 1d STREAK" | 0.5 h (optional 1C) |
| B4 | `shouldShowTutorial` imported, never called | `src/contexts/AppContext.tsx:7` | `noUnusedLocals` is off in `tsconfig.app.json` | 0 h (falls out of 1A) |

Housekeeping from this session: two `git status` calls each left a stale `.git/index.lock` that this shell cannot delete, so I renamed them into `_to_delete/` at the repo root. Delete that folder; git is unaffected. (Also: `scripts/` is gitignored — line 49 of `.gitignore` — which is why the smoke script lives in `tests/`.)

---

## 2. The wiring trace — what actually holds the professional layer on

### 2.1 Reachability

I built the import graph for all 104 source files (static, dynamic and `export … from`) and walked it from `src/main.tsx`.

| | Files | Size | Share |
| --- | --- | --- | --- |
| Live (reachable from `main.tsx`) | 68 | 831 KB | 69 % |
| **Dead (unreachable)** | **36** | **374 KB** | **31 %** |

Of the fifteen files `CLAUDE.md` lists, **eleven are dead**. They compile (TypeScript checks every file under `src/`) but no user can reach them, so moving them cannot change behaviour.

### 2.2 The fifteen listed files, plus two the list misses

| File | KB | Live? | Imported by | Imports from core | Wiring to cut |
| --- | --- | --- | --- | --- | --- |
| `components/CPD.tsx` | 22.0 | ✅ lazy | `App.tsx:27` | `types`, `holodeck/types`, `storageService` | `App.tsx:27, 343-348` · `AppContext.tsx:105` · dashboard tile · pack map · tutorial step |
| `services/cpdService.ts` | 12.6 | ✅ | `CPD.tsx` | `types`, `holodeck/types` | none (internal to module) |
| `data/cpdStandards.ts` | 29.8 | ✅ | `CPD.tsx`, `cpdService.ts` | — | none |
| `components/CrisisProtocols.tsx` | 17.3 | ✅ lazy | `App.tsx:25` | `types` (`CrisisProtocol`, `CrisisCategory`) | `App.tsx:25, 329-334` · `AppContext.tsx:109` · tutorial step. **No dashboard button reaches it** — only the tutorial does |
| `services/professionalDocService.ts` | 21.3 | ✅ | `ProfessionalDocExport.tsx` | `types` | none |
| **`components/ProfessionalDocExport.tsx`** *(not on the list)* | 15.3 | ✅ lazy | `App.tsx:29` | `storageService`, `types` | `App.tsx:29, 357-362` · `AppContext.tsx:106` · dashboard tile · pack map · tutorial step |
| `components/CompetencyMatrix.tsx` | 3.8 | ❌ dead | nobody | `constants` (`PROFESSION_CONFIG`), `types` | none |
| `components/CrisisChecklist.tsx` | 4.1 | ❌ dead | nobody | `types` | none |
| `components/IncidentCapture.tsx` | 25.0 | ❌ dead | nobody | `types`, `media/*` (incl. the otherwise-dead `VideoCapture.tsx`) | none |
| `components/RewardsStore.tsx` | 24.9 | ❌ dead | nobody | rewards services | none |
| `services/rewardsCatalogService.ts` | 14.6 | ❌ dead | `RewardsStore`, `rewardsRedemptionService` | — | none |
| `services/rewardsRedemptionService.ts` | 8.0 | ❌ dead | `RewardsStore` | `rewardsCatalogService` | none |
| `components/Library.tsx` | 13.6 | ❌ dead | nobody | `learningResources` | none |
| `data/learningResources.ts` | 41.0 | ❌ dead | `Library.tsx` (dead) | — | none |
| `components/LegalAcceptance.tsx` | 19.7 | ❌ dead | nobody | `DisclaimerQuiz`, `utils/legalDownloads` | none |
| **`components/DisclaimerQuiz.tsx`** *(not on the list)* | 13.8 | ❌ dead | `LegalAcceptance.tsx` (dead) | `disclaimerQuizService` | none |
| `services/disclaimerQuizService.ts` | 10.0 | ❌ dead | `DisclaimerQuiz.tsx` (dead) | — | none |
| **Total** | **296.8** | 6 live / 11 dead | | | |

`CLAUDE.md`'s "281 KB across 15 files" is 267.8 KB after the line-ending normalisation in `6bc0967`; with the two unlisted files it is 296.8 KB. Same 22–25 % either way.

**Nothing in the core imports any of these seventeen files except `App.tsx` (three lazy imports).** The dependency arrow points one way — module depends on core — which is exactly what you want for a later module and why the move is cheap.

### 2.3 Every core-side reference, by file and line

This is the complete list of edits phase 1A has to make outside the moved files.

| Core file | Lines | What | Action |
| --- | --- | --- | --- |
| `src/App.tsx` | 25, 27, 29 | `lazy(() => import(...))` for CrisisProtocols, CPD, ProfessionalDocExport | Delete |
| `src/App.tsx` | 329-334, 343-348, 357-362 | `case "CRISIS_PROTOCOLS"`, `case "CPD"`, `case "PROFESSIONAL_DOC"` | Delete |
| `src/contexts/AppContext.tsx` | 105, 106, 109 | `viewToStepMap` entries `'CPD'`, `'PROFESSIONAL_DOC'`, `'CRISIS_PROTOCOLS'` | Delete |
| `src/components/SimplifiedDashboard.tsx` | 41, 44, 159-177 | `hasProfessional = isPackEnabled('professional')` and the CPD / Docs tiles | Delete |
| `src/packs/packTypes.ts` | 11 | `'professional'` member of `PackId` | Remove (see §3.4 on why `packs/` can't stay untouched) |
| `src/packs/packRegistry.ts` | 66-80 | `professional` pack definition | Remove |
| `src/packs/packService.ts` | 296-297 | `'CPD': 'professional'`, `'PROFESSIONAL_DOC': 'professional'` in `featurePackMap` | Remove |
| `src/components/PackBrowser.tsx` | 74 | `professional: optionalPacks.filter(p => p.category === 'professional')` | Remove the group |
| `src/services/tutorialService.ts` | 14, 15, 19 | `'CPD_TRACKING' \| 'PROFESSIONAL_DOCS' \| 'CRISIS_PROTOCOLS'` in `TutorialStep` | Remove |
| `src/services/tutorialService.ts` | step objects at `id:` 167, 184, 248 | The three professional tutorial steps (~50 lines) | Remove; also fix B2's five orphan steps while there |
| `src/types.ts` | 148-154 | `LearningResource` | Move to module types |
| `src/types.ts` | 156-162 | `CPDLog` | Move to module types |
| `src/types.ts` | 202, 212, 215 | `ReflectionEntry.learningPath?`, `.cpd?`, `.nmcCodeThemes?` | **Keep** as optional fields — they describe data already on users' devices. Comment them as module-owned |
| `src/types.ts` | 263-286 | `CrisisCategory`, `CrisisProtocol`, `IncidentProtocol` | Move to module types |
| `src/types.ts` | 303, 304, 306, 310, 311, 312, 318 | `ViewState` members `LIBRARY`, `CPD`, `REWARDS`, `CRISIS_PROTOCOLS`, `CRISIS_CHECKLIST`, `COMPETENCY_MATRIX`, `PROFESSIONAL_DOC` | Remove — `tsc` then proves nothing routes there |
| `src/services/storageService.ts` | 30, 153 | `cpdMinutesTotal` in `UserStats` | **Keep** — stored data shape, harmless |

Roughly 60 lines of deletions plus the `types.ts` split. `tsc -b` catches every miss.

---

## 3. What the list misses — the hidden professional layer

Everything in §2 is a file move. This section is the actual work, and none of it is in `CLAUDE.md`'s fifteen.

### 3.1 `PROFESSION_CONFIG` — 75.8 KB of `constants.ts`

`src/constants.ts` is 81.4 KB. Lines 16-906 are `PROFESSION_CONFIG`: 32 profession presets (`NURSING`, `MEDICAL`, `PARAMEDIC` … `HOSPITALITY`, `LEADERSHIP`, `OTHER`) each with a label, description, AI prompt prefix, `modelsAllowed` and for the healthcare ones a `standards` array naming NMC, NMBA, NCNZ, CNA, HCPC and so on. `MODEL_CONFIG` (the reflection frameworks, phase 2 territory) is 6.8 KB. `ACHIEVEMENTS` is 430 bytes.

Live consumers of `PROFESSION_CONFIG`:

| File | Line(s) | Use |
| --- | --- | --- |
| `src/components/SimplifiedOnboarding.tsx` | 9, 11-20, 29, 134-159 | The "What's your profession?" dropdown. `HEALTHCARE_PROFESSIONS` first, `NURSING` pre-selected, **`NONE`/General is not offered at all** |
| `src/components/NeuralLink.tsx` | 3, 176-180 | Shows label + description on the profile screen |
| `src/components/ReflectionFlow.tsx` | 19, 35, 182, 196, 391 | Filters the model list by `modelsAllowed`, prepends `reflectionPromptPrefix` to AI calls, shows "Profession: Nursing" |
| `src/services/providers/geminiProvider.ts` | 6, 58 | Prompt prefix fallback |
| `src/data/offlinePrompts.ts` | 11-13 | `"Context: You are reflecting as a NURSING."` prepended offline |
| `src/App.tsx` | 261 | Passes `profession={profile.profession}` into `ReflectionFlow` |
| `src/types.ts` | 251-261, 324 | `ProfessionConfig`, `ProfessionType`, `UserProfile.profession` |

Dead consumers (move with the module, no edits): `Onboarding.tsx`, `CompetencyMatrix.tsx`, `geminiService.ts`.

### 3.2 The NMC block inside `ReflectionFlow.tsx`

`src/components/ReflectionFlow.tsx` lines 127-135 define `NMC_CODE_THEMES` and `NMC_PROFESSIONS = new Set(['NURSING', 'MENTAL_HEALTH'])`; line 154 holds the state, line 342 writes `nmcCodeThemes` onto the saved entry, and lines 529-560 render four "NMC Code Themes" checkboxes for those professions. Because Skip makes everyone a nurse (B1), **every user who skipped onboarding sees NMC Code checkboxes in the reflection composer.**

### 3.3 Quick Capture is an incident report

`src/components/QuickCapture.tsx:84-130` saves every capture as `{ id: 'incident_<ts>', type: 'INCIDENT', notes, media }`. `IncidentEntry` in `src/types.ts:218-245` carries `IncidentCategory` (`"Clinical Error" | "Patient Safety" | "Medication Error" …`), `severity`, `peopleInvolved`, `guardianBadge`. `Archive.tsx:406-440`, `Reports.tsx:43-220`, `searchService.ts:62-67`, `CalendarView.tsx` and `App.tsx:189-209` all branch on it, and the Archive filter offers "Incidents" with an "Incident Severity" dropdown to every user.

**This is not phase 1.** Renaming the entry type is a data migration of encrypted records on users' devices, and it needs phase 0's create/save/recover tests in place first. Cost when you do it: 6–10 h including migration and tests. Flagged here so it isn't mistaken for part of the file move.

### 3.4 Why `src/packs/` cannot stay completely untouched

`CLAUDE.md` says leave `src/packs/` alone. The professional views are gated by the `professional` pack, so after 1A the `PackBrowser` would still advertise "Professional Development — CPD time tracking, revalidation portfolio support" and enabling it would do nothing. The minimal honest edit is to remove the one pack entry, its two map lines and its `PackId` member (four small edits, all listed in §2.3). The registry, trials, `loadPackState` migration and everything else stay exactly as they are. `loadPackState` iterates `PACK_REGISTRY` for defaults and merges stored state on top, so a stale `professional` key in a user's `reflexia.packs.v2` is ignored, not fatal — worth one assertion in phase 0.

### 3.5 Other professional residue (cosmetic, not phase 1)

| Where | What | When |
| --- | --- | --- |
| `src/services/gamificationService.ts:164-210` | `streak-3/7/30/100` achievements | Decision 4 rework, phase 3 |
| `src/constants.ts:1048` and `gamificationService.ts:100` | Two separate `ACHIEVEMENTS` catalogues | Phase 3 |
| `src/components/Reports.tsx:120,220` | "N reflections, N incidents" wording | Phase 3, with §3.3 |
| `src/packs/packRegistry.ts:19` | Core pack advertises "Export (PDF/ZIP)" | Copy fix any time |
| `src/utils/legalDownloads.ts` | Downloads `DISCLAIMER.md` etc. — check the wording is not nurse-specific before phase 3 | Phase 3 |

---

## 4. Dead code inventory — 36 files, 374 KB

### 4.1 The full list, grouped by what it is

| Group | Files (KB) | Recommendation |
| --- | --- | --- |
| **Professional, dead** (11) | `IncidentCapture.tsx` (25.0), `RewardsStore.tsx` (24.9), `LegalAcceptance.tsx` (19.7), `rewardsCatalogService.ts` (14.6), `DisclaimerQuiz.tsx` (13.8), `Library.tsx` (13.6), `disclaimerQuizService.ts` (10.0), `rewardsRedemptionService.ts` (8.0), `CrisisChecklist.tsx` (4.1), `CompetencyMatrix.tsx` (3.8), `learningResources.ts` (41.0) | Move to `src/modules/professional/` in 1A. Zero behaviour change |
| **Commercial, dead** (5) | `Paywall.tsx` (12.0), `CookieConsent.tsx` (9.9), `stripeService.ts` (8.7), `Checkout.tsx` (8.0), `subscriptionService.ts` (7.3) | Decision 6 says nothing commercial. Move to `src/modules/commercial/` (same "don't delete, park it" logic). `AdBanner.tsx` is **live** on the dashboard — see B3. The `stripe` and `@stripe/stripe-js` dependencies can then leave `package.json` |
| **Features the February refactor dropped from `App.tsx`** (6 + their dependants) | `MentalAtlas.tsx` (14.9) + `mentalAtlasService.ts` (10.5) + `buildMentalAtlas.ts` (5.8), `DriveMode.tsx` (12.4), `GamificationHub.tsx` (11.5) + `gamification/AchievementUnlock.tsx` (6.3), `CanvasBoardBasic.tsx` (15.9), `EntryDetailModal.tsx` (5.9), `MediaAttachmentPanel.tsx` (8.6) | **Your call, not mine** — see §4.2. Note `CanvasBoard.tsx` (130 KB) is still live via `ReflectionFlow.tsx:24`, so the spatial differentiator is intact |
| **Media & grounding sub-components** (4) | `media/VideoCapture.tsx` (15.9), `grounding/BreathingGuide.tsx` (8.1), `grounding/BodyScan.tsx` (7.7), `grounding/FiveFourThreeTwoOne.tsx` (4.9) | `QuickCapture` only wires camera and audio; `Grounding.tsx` implements just the 5-4-3-2-1 exercise inline, so the breathing guide and body scan are unreachable. Probably intended to be live. Decide in phase 3 |
| **Superseded** (6) | `Onboarding.tsx` (4.5, replaced by `SimplifiedOnboarding`), `geminiService.ts` (6.1, replaced by `providers/geminiProvider.ts`), `StageIcon.tsx` (5.3), `Guide.tsx` (1.9), `guideShapes.ts` (1.2), `holodeck/spaces/DifficultConversation.tsx` (2.1, superseded by `UniversalSpace`) | Delete when convenient; nothing to preserve |

### 4.2 What the February refactor actually changed

`git show 33ce412:src/App.tsx` (the last commit before the recovery) lazy-loaded **six views the recovered `App.tsx` no longer does**: `DriveMode`, `GamificationHub`, `Library`, `CanvasBoard`, `MentalAtlas`, `RewardsStore`. The recovery commit `c79259a` also rewrote `Archive.tsx`, `SimplifiedDashboard.tsx`, `QuickCapture.tsx` (‑237 lines), the media capture components and all of `src/packs/`.

So "contexts layer, entry storage and crypto split" undersells it: the February refactor also removed six features from navigation, and the tutorial still points at four of them (B2). Whether that was a deliberate simplification or unfinished work only you know. It does not affect the phase 1 estimate — those files are dead either way — but it should be decided before phase 3 and recorded in `CLAUDE.md`.

---

## 5. The re-scoped plan

### 5.1 Structure

| Sub-phase | What | Hours | Needs phase 0 first? |
| --- | --- | --- | --- |
| **1A — Mechanical move** | 17 files → `src/modules/professional/`, cut the ~60 lines of wiring, fix B2, B4 | **8–11 h** | No. Nothing touches stored data or a save path; `tsc -b` + build + smoke script are sufficient |
| **1B — De-profession the live core** | `PROFESSION_CONFIG` out of `constants.ts`, profession picker out of onboarding, fix B1, NMC block out of `ReflectionFlow`, AI prefixes generic | **10–13 h** | **Yes, for the profile and entry save paths.** 1B edits onboarding-completion and reflection-save; that is precisely what phase 0's create/save/recover tests protect |
| 1C — Quick wins (optional) | Remove `AdBanner` and the streak tile from the dashboard; park the commercial files | 1–2 h | No |
| **Phase 1 total** | | **18–24 h** (20–26 h with 1C) | |

Against the 35–45 h in `CLAUDE.md`, that is roughly half. The original figure would have been fair if it assumed migrating stored entries, converting `packs/` to manifests or building a module runtime — all of which `CLAUDE.md` now defers. It also seems to have assumed the fifteen files were all live. Eleven are not.

Estimates include a 30 % margin over my step-by-step sums, because you have no tests and every "surely that compiles" moment in a 1 000-line `constants.ts` costs twenty minutes.

### 5.2 Phase 1A — step by step

Target layout (mirrors the current tree so the later module manifest can be generated from it):

```
src/modules/professional/
├── README.md                 ← one paragraph: what this is, why it is parked, what it imports from core
├── types.ts                  ← CPDLog, LearningResource, CrisisCategory, CrisisProtocol, IncidentProtocol
├── components/
│   ├── CPD.tsx
│   ├── CompetencyMatrix.tsx
│   ├── CrisisChecklist.tsx
│   ├── CrisisProtocols.tsx
│   ├── DisclaimerQuiz.tsx
│   ├── IncidentCapture.tsx
│   ├── LegalAcceptance.tsx
│   ├── Library.tsx
│   ├── ProfessionalDocExport.tsx
│   └── RewardsStore.tsx
├── data/
│   ├── cpdStandards.ts
│   └── learningResources.ts
└── services/
    ├── cpdService.ts
    ├── disclaimerQuizService.ts
    ├── professionalDocService.ts
    ├── rewardsCatalogService.ts
    └── rewardsRedemptionService.ts
```

| Step | Work | Hours | Done when |
| --- | --- | --- | --- |
| 1A.1 | Fix B2 + B4 first, on their own commit, so the tutorial is coherent before you start removing steps from it | 0.5 | `tsc -b` passes; every `targetView` in `tutorialService.ts` exists in the `App.tsx` switch |
| 1A.2 | `git mv` the 17 files into the layout above; rewrite their relative imports (`../types` → `../../../types`, `./media/CameraCapture` → `../../../components/media/CameraCapture`, etc.). About 40 import lines | 1.5 | `tsc -b` passes with the moved files still referenced from `App.tsx` (temporarily re-point the three lazy imports) |
| 1A.3 | Cut `App.tsx` (6 edits) and `AppContext.tsx` (3 edits) per §2.3 | 0.5 | `tsc -b` passes; `App.tsx` no longer mentions CPD, Crisis or ProfessionalDoc |
| 1A.4 | Cut the dashboard tiles (`SimplifiedDashboard.tsx:41,44,159-177`) | 0.3 | Dashboard renders with wellbeing/AI/scenario/reports groups only |
| 1A.5 | Remove the `professional` pack: `packTypes.ts:11`, `packRegistry.ts:66-80`, `packService.ts:296-297`, `PackBrowser.tsx:74`. Read `loadPackState` (lines 65-94) and confirm a stale stored key is tolerated | 1.0 | PackBrowser shows four optional packs; enabling/disabling each still works; a pre-existing `reflexia.packs.v2` with `professional: {enabled:true}` loads without error |
| 1A.6 | Remove the three professional tutorial steps and union members | 0.5 | Tutorial runs start to finish in the browser |
| 1A.7 | `types.ts` split: move the five types to `modules/professional/types.ts`; trim `ViewState`; leave the three optional entry fields and `UserStats.cpdMinutesTotal` (`types.ts:368`) with a comment | 1.0 | `tsc -b` passes; `grep -rnE "CPDLog\|CrisisProtocol\|CrisisCategory\|LearningResource\|cpdMinutesTotal" src` outside `modules/` returns only the commented lines in `types.ts` and `storageService.ts:30,153` |
| 1A.8 | Write `src/modules/professional/README.md`; update `CLAUDE.md` "Current state" | 0.5 | — |
| 1A.9 | Verify: `npm run build`, `node tests/smoke-runtime.mjs`, then a manual pass: onboarding → capture → reflect (simple and advanced) → archive → calendar → profile → packs → tutorial | 1.5 | Zero console errors; the smoke script's assertions all pass; bundle no longer emits `CPD-*.js`, `CrisisProtocols-*.js`, `ProfessionalDocExport-*.js` chunks |
| | **Sum** | **7.3** → **8–11 h with margin** | |

Commit after every step. If anything goes sideways you can bisect in minutes instead of unpicking a 17-file move.

### 5.3 Phase 1B — step by step

| Step | Work | Hours | Done when |
| --- | --- | --- | --- |
| 1B.1 | Move `PROFESSION_CONFIG` (`constants.ts:14-906`) to `src/modules/professional/data/professionConfig.ts`. Leave in `constants.ts` a single `DEFAULT_COACH_PREFIX` string (the current `NONE.reflectionPromptPrefix`) and nothing else profession-shaped | 1.0 | `constants.ts` is ~6 KB; `tsc -b` lists every consumer for you |
| 1B.2 | `SimplifiedOnboarding.tsx`: delete the selector (134-159) and the two profession arrays (11-20); default `profession: 'NONE'`; **fix B1** — if the loaded profile is already onboarded, `AppProvider` starts on `DASHBOARD`, and Skip never overwrites an existing name. Keep the 3-slide carousel for now; the first-90-seconds redesign is phase 3 | 1.5 | Reload as an onboarded user lands on the dashboard with name intact; a brand-new user still gets the carousel |
| 1B.3 | `NeuralLink.tsx:176-180`: remove the profession label/description block | 0.5 | Profile screen shows no profession |
| 1B.4 | `ReflectionFlow.tsx`: remove the `profession` prop (35, 137), the `modelsAllowed` filter (182 — the full model list shows; phase 2 reshapes it), the prefix lookup (196), the "Profession:" label (391), and the whole NMC block (127-135, 154, 342, 529-560). `App.tsx:261` drops the prop | 2.0 | Composer renders identically for every user; saved entries no longer carry `nmcCodeThemes` |
| 1B.5 | AI layer: `geminiProvider.ts:58` and `offlinePrompts.ts:11-13` use `DEFAULT_COACH_PREFIX`; leave the `profession?: string` parameters on the `AIProvider` interface (harmless, and a later module can pass them) | 1.0 | No import of `PROFESSION_CONFIG` remains outside `src/modules/` |
| 1B.6 | `types.ts`: `ProfessionConfig`/`ProfessionType` → module; `UserProfile.profession` stays as `string` with a comment ("stored; unused by core") | 0.5 | `tsc -b` passes |
| 1B.7 | Verify as 1A.9, plus: complete a reflection in simple and in Gibbs mode and confirm the saved record; confirm an old profile with `profession: 'NURSING'` still loads | 1.5 | — |
| | **Sum** | **8.0** → **10–13 h with margin** | |

### 5.4 Success criteria for phase 1 as a whole

- [ ] `grep -rnE "PROFESSION_CONFIG|nmcCodeThemes|CPDLog|CrisisProtocol|LearningResource|cpdMinutesTotal" src --include=*.ts --include=*.tsx` returns hits only under `src/modules/`, plus the commented stored-data fields in `types.ts` and `storageService.ts:30,153` (the Holodeck's general-purpose "Crisis Rewind" space is not professional and stays)
- [ ] `npm run build` passes and emits no `CPD-*`, `CrisisProtocols-*` or `ProfessionalDocExport-*` chunk
- [ ] Main bundle shrinks (currently 380 KB / 110 KB gzip; `PROFESSION_CONFIG` alone is 75.8 KB raw / 11.5 KB gzipped inside it)
- [ ] A first-time user is never asked their profession and never sees the words NMC, CPD, revalidation, incident severity or regulator
- [ ] A returning user lands on the dashboard with their name intact
- [ ] An entry saved on the current build still loads and opens after the change (backwards compatibility of stored data is untouched by design)
- [ ] `src/modules/professional/README.md` explains what is parked and why
- [ ] `CLAUDE.md` "Current state" updated

### 5.5 Explicitly out of phase 1

| Item | Why not now | Cost when you do it |
| --- | --- | --- |
| Renaming the `INCIDENT` entry type / reshaping Quick Capture's data model (§3.3) | Data migration on encrypted records; needs phase 0 | 6–10 h |
| Splitting `rewardsCatalogService.ts` by `ProfessionType` (`CLAUDE.md` says only `'nursing'` entries move) | The whole rewards trio is dead. Move it whole; split it when something actually uses it | 0 h now, 1–2 h later |
| Reworking the model list (Gibbs, SBAR, SOAP …) | Phase 2 | as planned |
| Onboarding-on-every-launch as a design | Phase 3 first-run work; 1B only fixes the data-loss part | — |
| Any module runtime, manifest or entitlement | Deferred by `CLAUDE.md` | — |

---

## 6. The three open questions — my view

### 6.1 The AI layer: what leaves the device, and is it opt-in?

**What the code does today** (`src/services/aiService.ts:9-25`, `providers/geminiProvider.ts:28-34`, `components/Oracle.tsx:33-37`, `components/ReflectionFlow.tsx:160,278,316`):

- The provider is chosen **at build time**. If `VITE_GEMINI_API_KEY` is set when Vite runs, every user gets `GeminiProvider`; otherwise `OfflineProvider`. There is no per-user choice of provider.
- Any `VITE_`-prefixed variable is inlined into the client bundle, so a key set at build time is **public** — anyone can read it out of `index-*.js`.
- The user's `aiEnabled` toggle guards only two of four calls: the daily prompt (`AppContext.tsx:63`) and stage coaching (`ReflectionFlow.tsx:277`). **"Unlock Insight"** (`analyzeReflection`, line 316 — the button merely appends "(Offline)" to its label at line 489) and **Oracle** (`askOracle`) call the provider unconditionally.
- Oracle sends `JSON.stringify(entries.slice(0, 40))` — the last forty entries, verbatim — while its own screen says "Uses only your local entries • No data sent to cloud" (`Oracle.tsx:144`).

**Current exposure: none.** I checked your last Windows build in `dist/` for a Google API key pattern (none) and your `.env` (still the `your_key_here` placeholder). Every deployed build so far has been offline-only. The problem is structural: the day someone sets that variable in Cloudflare, forty entries per Oracle question leave the device with no consent and a false privacy claim on screen.

**Recommendation:** (1) Never set `VITE_GEMINI_API_KEY` in the Cloudflare build — check the project's environment variables today. (2) Make provider selection a **runtime, per-user** decision: the user pastes their own key in Settings, it is stored in the existing `reflexia-keystore` IndexedDB store (not localStorage), and `aiService.ts` itself enforces a single `aiEnabled && hasKey` gate so no caller can bypass it. (3) One consent screen that names exactly what is sent (this reflection's text; the last N entries) before the first call. (4) Correct the Oracle copy. Roughly 4–6 h, best done in phase 3 alongside the settings work; until then the app is honestly offline and should say so.

### 6.2 `data/learningResources.ts` — move or rework?

**Move it, with the module, and spend nothing on it now.** It is dead: only `Library.tsx` imports it and `Library.tsx` is itself unreachable since the February refactor. Its 41 KB are curated external links framed "for healthcare professionals" with categories that happen to span engineering, finance and creative arts. Whether the general core ever wants a library is a phase 3 product question; if the answer is yes, you would write general content from scratch, not scrub a nursing list. Reworking a dead file is the one certain way to waste the hours.

### 6.3 What does a first-time user do in their first 90 seconds?

What I watched happen, on a 430 px viewport:

1. **0–20 s:** three marketing slides — Capture Anything / Reflect Deeply / Retrieve & Export — with a Skip in the corner.
2. **20–40 s:** "What should we call you?" and **"What's your profession?"** — a dropdown with Healthcare first and Nursing pre-selected. If they Skip, they are a nurse.
3. **40–50 s:** the dashboard. Greeting, one daily prompt, three buttons (Capture / Reflect / Archive), "Explore Optional Packs", an AdSense placeholder, "All data stored securely on this device".
4. **50–90 s:** tap Reflect → "SIMPLE MODE • STEP 1 OF 3 — What happened?" with a text box and Coach / Sketch / Voice chips. Or tap Capture → a text box, camera, mic, Save.

Two observations. First, the differentiator is invisible: Holodeck is behind the `scenario` pack toggle, off by default, two taps deep in "Explore Optional Packs". A new user will never find "a place you go". Second, the existing SIMPLE mode (`ReflectionFlow.tsx:109-125` — "What happened?" / "What stood out or mattered?" / "What will you carry forward?") **is already the Three-Part built-in from decision 5**. Phase 2 is closer than the plan suggests.

My answer to the question: in 90 seconds they should have written one true sentence and seen it land somewhere that feels like theirs. Today there are four taps of preamble before a text box, and a question about their job in between. 1B removes the question; phase 3 owns the rest.

---

## 7. Reproducing this verification

`tests/smoke-runtime.mjs` is delivered with this document. It starts nothing itself; run the dev server first.

```powershell
# Terminal 1
npm run dev

# Terminal 2 (Playwright is already in devDependencies; first run only:)
npx playwright install chromium
node tests/smoke-runtime.mjs https://localhost:5173/
```

It walks onboarding, saves a Quick Capture, reloads, asserts the entry survived in IndexedDB, opens Archive, opens the reflection composer, and writes screenshots to `.smoke/` (add `.smoke/` to `.gitignore`). It exits non-zero on any page error or failed assertion. It also probes B1 and will keep failing on that assertion until 1B.2 lands — leave it failing; that is the point of a regression check.

Treat it as the seed of phase 0, not phase 0. Phase 0 proper still needs unit coverage of `entryStorageService.ts` (IDB path, localStorage fallback, migration) and `cryptoService.ts`, and an export round-trip.

---

## 8. Where I'd push back on `CLAUDE.md`

1. **"Phase 1: 35–45 h" → 18–24 h.** See §5. Keep the margin, drop the myth that fifteen live files are being unpicked from three central files. Three files, sixty lines.
2. **"Phase 0 is a gate"** — true for 1B, not for 1A. Doing 1A now, before phase 0, is lower risk than leaving 300 KB of dead professional code in the tree while you write tests around it. Sequence: 1A → phase 0 → 1B → phase 2.
3. **"`rewardsCatalogService.ts`: only the `'nursing'` entries move."** The whole rewards feature is dead. Move all three files whole and make the split when a live consumer exists.
4. **"Leave `src/packs/` alone."** Four small edits are unavoidable (§3.4) or the Pack Browser advertises a pack that does nothing. Everything else in `packs/` stays untouched.
5. **"The spatial layer is the differentiator"** and it is off by default behind a pack toggle. That is not a phase 1 problem, but it is the biggest gap between what `CLAUDE.md` says the app is and what a new user sees.

### Immediate next actions

- [ ] Push `d9195d9` (the `CLAUDE.md` refocus) — local is one commit ahead of origin
- [ ] Delete `_to_delete/` at the repo root (contains only the stale git lock)
- [ ] Check Cloudflare Pages → Settings → Environment variables for `VITE_GEMINI_API_KEY`
- [ ] Decide §4.2: were the six dropped views (DriveMode, GamificationHub, Library, MentalAtlas, RewardsStore, the standalone CanvasBoard view) meant to go? Record it in `CLAUDE.md`
- [ ] Add `docs/PHASE-1-SCOPE.md` and `tests/smoke-runtime.mjs` to the repo (both are untracked until you commit them)
- [ ] Start 1A.1
