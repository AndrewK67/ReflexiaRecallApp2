# Phase 3 scope — make the core good for anyone

**Branch:** `phase-1a/professional-module` at `b8426a9` · **Written:** 22 September 2026 · **Status:** **all five parts done** — 3E, 3A, 3C and 3B on 22 September, 3D on 23 September 2026 (§3); all eight §4 decisions made. One success criterion (§6) stays open: open question 3 needs a real first-time user watched.

`CLAUDE.md` lists phase 3 as *first-run experience, persistent storage, accessibility, XP rework to learning tracks, Quick Capture data model — to be scoped*. It also carries open question 1 (the AI gate) and open question 3 (*what does a first-time user with no background actually do in their first 90 seconds?* — "still the most important question in the project"). This document traces all of it against the code as it stands after phase 2, says what each piece costs, and splits the phase into five parts that can land one at a time.

---

## 0. The verdict

1. 🔴 **The differentiator, as `CLAUDE.md` describes it, does not exist in the repo.** Locked decision 3 names `holodeck/`, `Interior3D.tsx` and `CanvasBoard.tsx` as "the spatial layer — a place you go, not a form you fill in". `Interior3D.tsx` is not in the tree and has never been in any of the 66 commits in this repository's history. `holodeck/` is twenty guided question sets (five prompts each, one textarea at a time) rendered by a single component; the hub's own strapline is "Inner Simulation". `CanvasBoard.tsx` is a 3,524-line sketch pad reached through the composer's Sketch button. There is no scene, no 3D, no dependency that could draw one. Nothing here is wrong — the twenty spaces are good — but decision 3 is describing an intention, not the code, and phase 3 has to decide which one to build toward (§4, decision 1).
2. 🔴 **What the spaces produce is thrown away.** `Holodeck.tsx:22–26` writes finished spaces to `localStorage['holodeckEntries']` as plaintext JSON: outside the encrypted entry store, outside Archive, search, calendar, reports and backup. Nothing in the core reads that key back (only the parked CPD module and the inert achievement checker do). A person who spends ten minutes in "Loss & Letting Go" cannot find what they wrote afterwards.
3. 🔴 **The onboarding promises three things the app cannot do.** Slide 1: "Text, voice, photos, or video" — `media/VideoCapture.tsx` is unreachable, Quick Capture offers photo and audio. Slide 2: "Optional advanced models" — phase 2 vocabulary that no longer exists. Slide 3: "Export to PDF/ZIP" — export is a JSON backup and a CSV. Nobody who trusts the first screen keeps trusting the app.
4. 🟡 **Two XP systems exist and both are inert.** `gamificationService.ts` (713 lines: 20 levels from *Beginner* to *Ascended*, 25 achievements — entry counts, day streaks, "night owl") is computed on every entries change in `EntriesContext` and rendered nowhere; its `checkAndUnlockAchievements()` is never called from the live app, so the catalogue can never unlock. `UserStats` in `storageService` is what Profile shows when Gamification is toggled on; nothing writes to it, so it reads *Level 1, 0/100 XP, 0 day streak* forever. Decision 4 ("XP attaches to learning the app, never to reflecting; no streaks") is therefore mostly deletion plus a fresh, small design — not a rework.
5. 🟡 **The tutorial is the opposite of decision 4.** Steps complete by pressing "I Tried It — Continue" (`Tutorial.tsx:298`) or by dwelling on a view for three seconds (`AppContext.tsx:100–124`). Its copy says "Your journey to professional excellence begins here" and "your AI-powered reflection companion" (`tutorialService.ts:47,52`). Five of its twelve steps lead to pack-gated views. It is only reachable from Profile → Start Tutorial, so almost nobody sees it — which is the kindest thing about it.
6. 🟡 **Quick Capture's data model is a nursing incident form with the fields left blank.** Every capture saves `type: "INCIDENT"` (`QuickCapture.tsx:118–126`) but sets no `category` or `severity`, so Archive's "Incident Severity" filter (`Archive.tsx:440`) can never match, and `CalendarView.tsx:22` paints any day with a capture at level 1 — "critical at a glance". A person's note about a nice walk turns the calendar red. The stored literal `"INCIDENT"` is on devices and stays; the word "incident" leaves every screen.
7. 🟡 **Storage is evictable and "encrypted at rest" is half true.** `navigator.storage.persist()` is never called anywhere, so a browser under storage pressure may discard the IndexedDB database. `saveEntry()` still dual-writes plaintext to `localStorage` (`entryStorageService.ts:182–185`, decision pending since phase 0 §4.2). The AES key is stored extractable in a second IndexedDB (`cryptoService.ts:29`), which is the honest maximum for a no-account app; it protects against casual reading of the database file, not against someone with the device unlocked.
8. 🟡 **Accessibility: fixable, and measured.** An axe scan of fifteen live screens (§1.6, `npm run audit:a11y`) finds 6 critical nodes (unlabelled selects and inputs, all in Archive's filter panel), 1 serious (a Holodeck button's contrast), 2 heading-order and 35 landmark issues. Beyond axe: text at 7–11 px appears 93 times in live components (64 of them at 10 px); `text-white/40` (3.7:1 on the dark background, below AA) 35 times; there is no `:focus-visible` style anywhere and 20 elements remove the outline; 38 native `alert()`/`confirm()` dialogs. None of this is structural. Most of it is a type scale and a stylesheet.
9. ⏱️ **Estimate: 46–63 h across five parts** (§3). The AI gate (3E, 5–7 h) is small, independent and removes a real footgun, so it goes first. The differentiator decision (§4.1) changes 3B's shape but not its cost band.

---

## 1. What a first-time user meets today

Traced by running it (`tests/e2e/first-run.spec.ts`, `reflect.spec.ts`, the audit spec) and reading the components.

### 1.1 The ninety seconds

| Second | Screen | What they see | Source |
| --- | --- | --- | --- |
| 0 | Loading | spinner until profile and entries load | `App.tsx` |
| 1 | Onboarding 1/3 | 📸 *Capture Anything* — "Text, voice, photos, or video" | `SimplifiedOnboarding.tsx:72` |
| 5 | 2/3 | 💭 *Reflect Deeply* — "3 focused questions", "Optional advanced models" | `:93` |
| 10 | 3/3 | 🔍 *Retrieve & Export* — "Export to PDF/ZIP"; name field; "Start Capturing"; the disclaimer | `:110,153` |
| 15 | Dashboard | "Good evening, friend." (no name → *friend*), a daily prompt in quotes, **📸 Capture**, 💭 Reflect, 📚 Archive, "✨ Explore Optional Packs", "All data stored securely on this device / Export regularly to back up" | `SimplifiedDashboard.tsx` |
| 20 | Capture | "Describe what happened…" textarea, Photo and Audio tabs, Save | `QuickCapture.tsx` |
| 40 | Dashboard | now with a "1 REFLECTIONS" tile | `:65–70` |
| 45 | Reflect | Three-Part, step 1 of 3, Coach / Sketch / Voice; "Just write", "Use a framework" | `ReflectionFlow.tsx` (phase 2) |

Three taps from launch to a saved capture, which is good. The problems are what the copy claims, that the name is optional but the greeting assumes it, that nothing says what "Reflect" is for or why someone would, and that the thing `CLAUDE.md` calls the differentiator is behind *Explore Optional Packs → Scenario Practice → Enable Pack*, described there as "Interactive scenario-based learning (Holodeck) — Decision-tree practice, Skill development" (`packRegistry.ts:47–58`). A person with no background has no reason to open that.

### 1.2 The spatial layer, as built

| Piece | What it is | Lines | Reachable |
| --- | --- | --- | --- |
| `holodeck/HolodeckHub.tsx` | 2-column grid of twenty spaces, each a name, purpose and colour; "Gentle" badge on the safety-critical ones | 97 | pack `scenario`, off by default |
| `holodeck/UniversalSpace.tsx` + `HolodeckSpace.tsx` | one textarea per prompt, progress bar, Previous / Next / Finish, Save Progress | 262 | same |
| `data/holodeckSpaces.ts` | the twenty definitions: `purpose`, `userActions`, `guideRole`, `rules`, `prompts[]`, `color`, `isSafetyCritical` — `guideRole` and `rules` are never rendered | 454 | same |
| `holodeck/spaces/DifficultConversation.tsx` | an older per-space component, superseded by `UniversalSpace` | 69 | dead |
| `Holodeck.tsx` | hub ↔ space switch; saves to `localStorage['holodeckEntries']` | 46 | same |
| `CanvasBoard.tsx` | sketch pad: layers, brushes, size presets, export | 3,524 | composer → Sketch |
| `CanvasBoardBasic.tsx` | a simpler sketch pad with an "upgrade" callback to the full one | 480 | dead |
| `Interior3D.tsx` | named in `CLAUDE.md` decision 3 | — | **not in the repository or its history** |

Structurally, a space *is* a framework: an ordered list of questions with one answer each. The twenty spaces are better written than most of the catalogue ("What outcome would feel okay, even if not perfect?"). Phase 2's `ReflectionFramework` could hold them as-is, which is what §2.2 proposes.

### 1.3 XP, achievements, streaks, tutorial

| Thing | Where | State |
| --- | --- | --- |
| Levels (20) and achievements (25) | `gamificationService.ts:76–450` | computed in `EntriesContext.tsx:36–46` on every change; `stats` destructured in `App.tsx:218` and never used; `checkAndUnlockAchievements()` has no caller in the core → nothing can unlock |
| Bonus XP | `awardBonusXP()` → `localStorage['reflexia_bonus_xp']` | written by the tutorial; displayed nowhere |
| Streak | `calculateStreakFromEntries()` `:629–697` | computed, displayed nowhere (the dashboard streak tile went in 1C) |
| `UserStats` | `storageService.ts:154–199`, `types.ts:217–231` | read by Profile when Gamification is ON (`NeuralLink.tsx:44–54, 250–300`); no writer → Level 1, 0 XP, 0 streak, no achievements, always |
| `gamificationEnabled` toggle | Profile | shows the empty panel above |
| Tutorial (12 steps including the finale, 1,300 XP) | `tutorialService.ts:44–241`, `Tutorial.tsx` | Profile → Start Tutorial only; steps complete by self-report or 3 s dwell; five steps target pack-gated views |
| "REFLECTIONS" tile | `SimplifiedDashboard.tsx:65–70` | an entry count on the front door — mild, but it is the one number the app shows, and decision 4 says nothing rewards entry count |

### 1.4 Quick Capture and the entry model

`types.ts:110–137`: `IncidentCategory` ("Clinical Error", "Patient Safety", "Medication Error"…), `IncidentEntry { category?, severity?, location?, peopleInvolved?, notes?, media?, guardianBadge?, outcome?, immediateActions?, contributingFactors? }`. Quick Capture writes `id, type: "INCIDENT", date, notes, media, createdAt, guardianBadge`. Consumers of the word:

| File | Lines | What it does with it |
| --- | --- | --- |
| `Archive.tsx` | 412, 437–447, 539–559 | "Incidents" type option; "Incident Severity" filter (can never match); row label "Incident" |
| `searchService.ts` | 17, 61–66, 157–165 | severity filter; searches `notes`, `location`, `peopleInvolved` |
| `CalendarView.tsx` | 20–22, 97–105, 332 | any capture → level 1 "critical" colour; row label "Incident" |
| `Reports.tsx` | 44, 85, 121, 135 | "Incidents: N"; CSV type column |
| `App.tsx` | 187–195, 374–375 | modal title "Incident", body "Incident / notes" |
| `gamificationService.ts` | 586, 611 | `totalIncidents` (inert) |
| `QuickCapture.tsx` | 20–66 | the crisis keyword badge (Samaritans, Shout, NHS 111) — general, UK, and worth keeping |

### 1.5 Storage and the AI boundary

| Concern | Today | Source |
| --- | --- | --- |
| Eviction | never asks for persistence; no `estimate()`; no install prompt handling; manifest name is "Reflexia Recall" | `vite.config.ts:16–27`, grep for `storage.persist` → none |
| Plaintext copy | every save also writes the entry unencrypted to `localStorage['reflexia.entries.v1']` | `entryStorageService.ts:182–185, 198–199` |
| Key | AES-GCM, extractable, in IndexedDB `reflexia-keystore` | `cryptoService.ts:9, 29` |
| Media | blobs in IndexedDB (web) / Capacitor filesystem (native), unencrypted | `fileStorageService.ts:98–141` |
| AI provider | chosen at build time from `VITE_GEMINI_API_KEY`; key would ship in the bundle | `aiService.ts:10–25` |
| AI gate | `aiEnabled` guards the daily prompt and Coach only; Unlock Insight and Oracle call the provider unconditionally | `ReflectionFlow.tsx`, `Oracle.tsx:35` |
| Oracle copy | sends the last 40 entries as JSON; screen says "Uses only your local entries • No data sent to cloud" | `Oracle.tsx:19, 144` |

No key has ever been set, so nothing has been sent. The gap is that one environment variable turns a private app into one that uploads reflections, with the screen still saying it doesn't.

### 1.6 Accessibility, measured

`npm run audit:a11y` (added with this document: `tests/audit/a11y.spec.ts`, `playwright.audit.config.ts`, `@axe-core/playwright`) walks fifteen screens with a fresh profile and writes `test-results/a11y-audit.json`. Today:

| Impact | Rule | Nodes | Where |
| --- | --- | --- | --- |
| critical | `select-name` — select has no accessible name | 4 | Archive filters (type, framework, severity, sort) |
| critical | `label` — input has no label | 2 | Archive filters (date inputs) |
| serious | `color-contrast` | 1 | Holodeck space "Next" button (inline colour on translucent background) |
| moderate | `heading-order` (h3 after h1) | 1 | Archive rows |
| moderate | `region` — content outside landmarks | 35 | every screen: no `<main>`, `<nav>`, `<header>` |

What axe cannot see, counted from the source of live components:

| Signal | Count | Note |
| --- | --- | --- |
| `text-[7px]`…`text-[11px]` | 93 (64 at 10 px, 5 at 11 px) | footers, tile labels, "Step 1 of 3", pack tiles at 8 px |
| `text-white/40` | 35 | 3.7:1 on slate-950 — fails AA (4.5:1) for body text; `/50` is 5.3:1 and passes |
| `focus:outline-none` | 20 | 26 have `focus:ring`; **0** `:focus-visible` rules in any stylesheet |
| `alert()` / `confirm()` | 38 | blocking native dialogs; the tutorial's Skip is a `confirm()` |
| `title=` as the only name | 57 | works for most screen readers, not for touch users; e.g. Back, Mute in the composer |
| `role="dialog"` + `aria-modal` | 1 | the entry modal; PackGate and the composer's canvas are not dialogs |
| reduced motion | handled for the backdrop orbs and `animate-in` (`index.css:309`) | `animate-pulse`, `animate-spin`, `active:scale-95` are not covered |
| `<html lang="en">`, viewport, system font stack | present | fine |

### 1.7 Dead code, refreshed

42 of 106 source files are unreachable from `main.tsx` (556 KB; `node tests/audit/reachability.mjs`, added with this document — phase 1's 36 of 104 was before 1B moved the presets into the module and phase 2 added five files and deleted four). Twenty are the parked professional module. Of the rest:

| File(s) | KB | What it is | Proposal |
| --- | --- | --- | --- |
| `MentalAtlas.tsx` + `mentalAtlasService.ts` + `utils/buildMentalAtlas.ts` | 31.2 | deterministic keyword/theme/pattern analysis of the archive, no ML, offline | **candidate to revive** as the offline answer to "what do I keep writing about?" — later, not phase 3 |
| `DriveMode.tsx` | 12.4 | hands-free voice loop: speaks a prompt, listens, saves, next | **park** — the accessibility angle is real, the code predates the frameworks; a phase 4 rebuild on `ReflectionFramework` would be 6–8 h |
| `GamificationHub.tsx` + `gamification/AchievementUnlock.tsx` | 17.8 | the achievements screen | **delete** in 3D with its service |
| `CanvasBoardBasic.tsx` | 15.9 | simpler sketch pad | **delete**; the full one is live |
| `EntryDetailModal.tsx` | 5.9 | a richer entry modal than the one inlined in `App.tsx` | **revive or delete** in 3B when the modal gets stage labels and media |
| `MediaAttachmentPanel.tsx`, `media/VideoCapture.tsx` | 24.5 | attachment list; video recording | **park** until video is a decision |
| `Checkout.tsx`, `Paywall.tsx`, `stripeService.ts`, `subscriptionService.ts`, `AdBanner.tsx`, `CookieConsent.tsx` | 48 | commerce and consent banners | **delete** under decision 6 (a `git rm` is reversible; the code is in history) |
| `grounding/BodyScan.tsx`, `BreathingGuide.tsx`, `FiveFourThreeTwoOne.tsx` | 20.7 | older grounding screens; `Grounding.tsx` reimplements them inline | **delete** |
| `holodeck/spaces/DifficultConversation.tsx` | 2.1 | superseded by `UniversalSpace` | **delete** |
| `App.css`, `components/guide.css` | 2.1 | unused stylesheets (the guide character went in phase 2) | delete |

`Library.tsx` and `RewardsStore.tsx` from the "six dropped views" are in the module already. That leaves the decision list at four: MentalAtlas (revive later), DriveMode (park), GamificationHub (delete), CanvasBoardBasic (delete).

---

## 2. The design

### 2.1 Principles for the phase

- **Nothing the first screen says may be untrue.** Copy describes the app as built, today.
- **Every word a person writes is findable, encrypted and in the backup.** Spaces included.
- **The front door has four doors, not three plus a shop.** Capture, Reflect, Spaces, Archive. Packs remain for the genuinely optional (wellbeing, reports, AI).
- **Progression is invisible while writing** (decision 4). Learning is noticed, not scored.
- **Twelve pixels is the floor.** Nothing a person needs to read is smaller.

### 2.2 Spaces become frameworks; Holodeck becomes "Spaces"

Each of the twenty `HolodeckSpaceDefinition`s maps onto a `ReflectionFramework` with `kind: 'space'`, stage ids `SPACE_<spaceId>_<n>` and the space's `purpose` as tagline. A finished space is a `ReflectionEntry` with `model: 'SPACE_<spaceId>'` — encrypted, in Archive, searchable, in the backup, opening with readable labels via `stageLabel()`. `Holodeck.tsx`, `UniversalSpace.tsx` and `HolodeckSpace.tsx` collapse into the composer with a different skin: the space's colour, the "Gentle" note for safety-critical ones, and the `guideRole` text finally rendered as the Coach line. Existing `holodeckEntries` (there may be none) migrate on first launch, the same way `reflexia.entries.v1` did.

What this is not: it is not the 3D "place you go". It is the honest version of what the repository contains, promoted to the front door. §4.1 asks whether that is the destination or a stop on the way.

### 2.3 Onboarding: one screen

Three slides that promise features become one screen that asks for nothing and says three true things: *Write down what happened. Come back to it later. It stays on this phone.* Name field stays, optional, with the greeting falling back to no name rather than "friend". The disclaimer line stays. "Start" lands on the dashboard with an empty-state line under the four doors: *Try capturing one thing. It can be a sentence.* First-run e2e asserts every sentence on the screen is true of the build (no "video", no "PDF").

### 2.4 Captures, not incidents

Stored `type: "INCIDENT"` stays on disk (it is the stored literal, like `model: "SIMPLE"`). In code, `isCapture(entry)` replaces every `type === 'INCIDENT'` test; on screen the word is "Capture" (Archive type filter, row label, modal, calendar, reports, CSV). `IncidentCategory`, `severity`, `location`, `peopleInvolved`, `outcome`, `immediateActions`, `contributingFactors` leave `IncidentEntry` — nothing writes them and the professional module can redeclare them when it exists. The severity filter goes. `CalendarView` colours a day by mood, or neutral when there is no mood; a capture is not a crisis. `guardianBadge` (the crisis keyword prompt) stays as stored and shown, and its copy stays UK-specific because the app is.

An actual migration (`INCIDENT → CAPTURE` in the store) is possible, 2 h, and buys nothing a person can see. Not proposed.

### 2.5 Storage that stays

On the first successful save, `navigator.storage.persist()`; the result, plus `estimate()`, shows in Profile as one plain line ("Stored durably on this device" / "This browser may clear this app's data if space runs short — install the app or export a backup"). The plaintext `localStorage` copy stops being written; the read-side migration stays for one more release so nobody loses the pre-IndexedDB entries. `phase-0` §4.2's `it.fails` test flips to a passing assertion that no plaintext exists after a save. Backup export remains plaintext JSON — it is the person's own copy, and encrypting it with a key they cannot recover would be theatre.

### 2.6 Learning tracks (decision 4)

Both XP systems go. What replaces them is a list of about ten *things the app can do*, each marked done when the real thing has happened once, detected from data the app already has:

| Track | Detected by |
| --- | --- |
| Captured something | a capture entry exists |
| Answered the three questions | a `SIMPLE` entry with all three answers non-empty |
| Just wrote | a `FREE` entry |
| Used a framework | any catalogue `model` |
| Went into a space | any `SPACE_*` model |
| Attached a sketch / a voice note / a photo | attachment types on any entry |
| Found something again | a search that returned results (a flag set by Archive) |
| Made a backup | `exportBackup()` ran (a timestamp in the profile) |
| Locked the app | `privacyLockEnabled` |

No XP numbers, no levels, no streaks, no dwell timers, no "I tried it". It shows in Profile as a checklist ("What you've tried") and, at most, as a single quiet line on the dashboard when something obvious is untried after a few entries ("There are spaces for specific situations — try one when you need it"). It never appears inside the composer. `awardBonusXP`/`getBonusXP` and `LEVELS` can stay as a dormant points engine if decision 4's last sentence is read literally; nothing in the core will call them.

### 2.7 The AI boundary (open question 1)

- The provider is chosen at **runtime**: Offline unless the person has pasted their own Gemini key into Profile → Neural Link, stored in the existing `reflexia-keystore` IndexedDB, never in a build.
- One gate in `aiService.ts`: every exported function short-circuits to the offline provider unless `aiEnabled && keyPresent`. `ReflectionFlow`, `Oracle`, `AppContext` stop checking on their own.
- A consent screen, shown once when turning AI on, that says exactly what leaves the device and when: Coach sends the current answer; Insight sends the whole entry; Oracle sends the last 40 entries. Oracle's "No data sent to cloud" line becomes true or false depending on the toggle, and says which.
- `VITE_GEMINI_API_KEY` is removed from `aiService.ts` entirely so the build-time path cannot come back by accident.

### 2.8 Accessibility as a stylesheet, then a gate

A type scale in `index.css` (`--text-xs: 0.75rem` floor) replaces the ninety-three sub-12 px utilities; `text-white/40` becomes `/60` wherever the text carries meaning (footnotes may stay `/50`). A global `:focus-visible` ring; the twenty bare `focus:outline-none` removed. `<header>`, `<main>` and `<nav>` around the shell. Labels on the six Archive controls. One in-app confirm/toast component replaces the thirty-eight native dialogs (this also fixes them on iOS PWA, where `confirm()` is ugly and `alert()` blocks the service worker's update prompt). Then the audit spec stops being a probe: it fails the CI run on any critical or serious node, so the number cannot climb back.

---

## 3. Step by step

Five parts. Each is one branch-worth of work with its own tests and can be reviewed alone. Order: **3E first** (small, removes a footgun), then 3A (the data protects everything after it), 3C (cheap, wide), 3B (the visible one, and it depends on §4.1), 3D last (it deletes the most and depends on 3B's front door).

### 3E — The AI boundary · 5–7 h

| Step | Work | Hours | Done when |
| --- | --- | --- | --- |
| 3E.1 | Runtime key: keystore read/write, Profile field with paste/clear, no `import.meta.env` in `aiService.ts` | 2.0 | build has no `VITE_GEMINI` reference; unit test: provider is Offline with no key |
| 3E.2 | One gate: `aiService.ts` checks `aiEnabled && key`; callers stop checking | 1.0 | unit test: with AI off, `analyzeReflection` and `askOracle` never construct `GeminiProvider` |
| 3E.3 | Consent screen and honest Oracle copy | 1.5 | e2e: turning AI on shows the screen; Oracle line reads correctly in both states |
| 3E.4 | `CLAUDE.md` open question 1 closed; `docs/` note | 0.5 | — |
| | **Sum** | **5.0** → **5–7 h** | |

**3E landed (22 Sep 2026).** `services/aiKeyService.ts` (key in the `reflexia-keystore` IndexedDB, in-memory fallback when there is none), `keystoreGet/Put/Delete` exported from `cryptoService.ts`, `aiService.ts` rewritten around one `live()` gate that reads `aiEnabled` from the saved profile at call time, `components/AISettings.tsx` (key field, toggle, consent panel) mounted in Profile in place of the bare AI switch, Oracle's banner and footer true in both states, the composer's and Quick Capture's `aiEnabled` props gone (labels come from `isAIActive()`), `utils/offlineDailyPrompt.ts` now behind the gate so the dashboard prompt is unchanged offline, `.env.example` says there are no build-time secrets. Tests: `tests/unit/aiGate.test.ts` (12: truth table of toggle × key with fetch counted, key-store round trip, key absent from backup and `localStorage`, source guard against `import.meta.env`/`VITE_GEMINI` in `aiService.ts` and anywhere under `src/`), `tests/e2e/ai.spec.ts` (4: off by default and not switchable without a key; consent shows the three payloads and needs the second tap, key survives reload, key not in `localStorage`; removing the key turns AI off and the composer and Oracle say so; with AI off, Coach and Oracle answer and no request goes to `googleapis.com`). 92 unit, 24 e2e. One thing §2.7 said that did not happen: the "consent once" flag — the panel shows every time AI is turned on, which is safer and costs one tap. Found on the way: the legacy-SBAR e2e from phase 2 raced the app's first launch (it seeded `localStorage` while the empty migration was setting its done-flag) and passed by luck; it now waits for the app and clears the flag, as an old build would have no flag.

### 3A — Data that stays and means what it says · 11–15 h

| Step | Work | Hours | Done when |
| --- | --- | --- | --- |
| 3A.1 | `navigator.storage.persist()` + `estimate()`; Profile line; `beforeinstallprompt` captured, "Install" button in Profile; manifest name "Reflexia" | 2.0 | e2e: after first save, `navigator.storage.persisted()` was requested (stubbed); Profile shows the line |
| 3A.2 | Stop the plaintext dual-write; keep read-side migration; flip the `it.fails` tests; backup unchanged | 1.5 | `entryStorage.test.ts`: after `saveEntry`, `localStorage['reflexia.entries.v1']` is absent |
| 3A.3 | Captures: `isCapture()`, type slimmed, severity filter and "Incident" wording gone from Archive/search/calendar/reports/modal/CSV; calendar colour by mood only | 3.0 | e2e: a capture day is not red; Archive filter says "Captures"; `search.test.ts` updated; stored `type` unchanged (`entryStorage.test.ts` pins it) |
| 3A.4 | Spaces as frameworks: 20 `ReflectionFramework`s generated from `holodeckSpaces.ts` (`kind: 'space'`), saved as entries; `holodeckEntries` migration; `Holodeck.tsx`/`UniversalSpace.tsx`/`HolodeckSpace.tsx` replaced by the composer with a space skin; `guideRole` rendered | 4.0 | `frameworks.test.ts` pins 20 space ids and their stage ids; e2e: finish a space → it is in Archive, opens with labels, is in the backup |
| 3A.5 | `EntriesContext` stops computing gamification on every change (moves to 3D if 3D is next; otherwise a one-line removal here) | 0.5 | — |
| | **Sum** | **11.0** → **11–15 h** | |

**3A landed (22 Sep 2026), four commits, in the order 3A.2 → 3A.1 → 3A.3 → 3A.4+3A.5.**

- **3A.2** `c63db3c` — no plaintext copy. The migration removes `reflexia.entries.v1` after moving it; a copy left by an already-migrated build goes on the next launch; backup import writes only the encrypted store; the service throws on a failed write (the context logs it — 3C.4's notice will show it). Only a browser with no IndexedDB falls back to plaintext (`isPlaintextFallback()`). *Found on the way:* `getCryptoKey()` memoised the resolved key, not the promise, so two concurrent first calls each generated a key and whichever lost the keystore write left its entries unreadable for good; `saveAllEntries()` encrypts in parallel, so a backup restored before init lost entries. Third data-loss bug of the day; regression test fails against the old code.
- **3A.1** `b993c6a` — `services/durabilityService.ts`, `components/StorageStatus.tsx` ("Your data" in Profile). *Found on the way:* the manifest named `/pwa-192.png` and `/pwa-512.png`, which have never existed in `public/` (the files are `icon-192.png`, `icon-512.png`), so no browser has ever offered to install the app and `beforeinstallprompt` could never fire. Fixed, with `tests/unit/pwa.test.ts` checking every icon the manifest names exists. Stale hand-written `public/manifest.json` ("Professional Reflection & Revalidation Companion") and `public/service-worker.js` removed; `index.html` gets a favicon, `apple-touch-icon`, iOS web-app meta, the title "Reflexia", and loses the AdSense comment.
- **3A.3** `7458f85` — captures. `CaptureEntry` (notes, media, guardianBadge); the seven clinical fields and `IncidentCategory` moved to the module as `ProfessionalIncidentEntry`; `utils/entryKind.ts`; severity filter gone; the Archive type filter value is `'capture'`. *Found on the way:* `CalendarView` is not reachable from any live screen — only the old tutorial navigated to it — so nobody has seen the red days. Fixed anyway (mood colours only, legend reads Rough…Great), ready for 3B to wire it in.
- **3A.4 + 3A.5** `4a7a72b` — `src/frameworks/spaces.ts`, the space skin in `ReflectionFlow` (`initialFramework` prop), `Holodeck.tsx` hands the hub's choice to the composer, three space screens deleted, `holodeckEntries` migration, Archive filter grouped. Guided Stillness had an empty fifth prompt; dropped before any entry could carry the id. `EntriesContext` no longer runs the inert gamification computation.

Numbers: 111 unit (was 92), 33 e2e (was 24); main chunk 314.8 KB (was 306.6; the spaces are now in the registry). Departures from the plan: none of substance. The `beforeinstallprompt` button can only be seen in a browser that fires the event, which headless Chromium does not, so its e2e coverage is the unit test of the service plus the Profile line in both persistence states.

### 3C — Readable, reachable, labelled · 8–11 h

| Step | Work | Hours | Done when |
| --- | --- | --- | --- |
| 3C.1 | Labels on Archive's six controls; heading order; `<header>/<main>/<nav>` landmarks; `aria-label` on the 57 title-only buttons that matter (composer, capture, nav) | 2.0 | audit: 0 critical, 0 serious |
| 3C.2 | Type scale: 12 px floor, `/40` text lifted; the two 7 px and nine 8 px pack tiles redesigned at 12 px | 2.5 | grep: no `text-[7–11px]` in live components; contrast spot-checks recorded |
| 3C.3 | `:focus-visible` ring; bare `outline-none` removed; reduced-motion covers pulse/spin/scale | 1.0 | keyboard walk of capture and composer in e2e (Tab/Enter only) |
| 3C.4 | In-app confirm/toast replacing 38 `alert()`/`confirm()` | 2.0 | grep: 0 native dialogs in `src/`; e2e for the two destructive confirms (delete entry, restart onboarding) |
| 3C.5 | Audit becomes a gate: `tests/audit` runs in CI, fails on critical/serious | 0.5 | `.github/workflows/test.yml` |
| | **Sum** | **8.0** → **8–11 h** | |

**3C landed (22 Sep 2026), five commits.**

- **3C.1** `55a0f4d` — labels on Archive's six controls (and its leftover light-theme colours fixed), a named search field, named pagination, `<main>`/`<nav>` landmarks, rows as `h2`, the empty list keyboard-scrollable, names on every icon-only button in the composer, capture, camera, recorder, PIN pad, hub, Oracle, BioRhythm, Grounding and Profile. The audit went from 6 critical + 1 serious + 37 moderate to **zero**, and now also scans the empty Archive a first-time user sees.
- **3C.2** `e5daa3a` — 79 uses of 7–11 px text in live components → 12 px; secondary text that carries meaning `/40` → `/60`; placeholders `/50`. The dashboard's 8 px pack tiles wrap to two readable rows.
- **3C.3** `2bd057a` — global `:focus-visible` ring; reduced motion covers pulse, bounce, tap scale, hover slide and transitions. *Found on the way:* after opening the composer or Archive from the keyboard, Tab landed on the tab bar and skipped the entire screen (React inserts the new screen before removing the old, so the browser's focus starting point ended up after it). `App.tsx` now moves focus to `<main>` on every screen change unless the screen focused its own control; the entry modal focuses Close. `tests/e2e/keyboard.spec.ts` completes a capture and a three-question reflection with Tab and Enter only, checking every focused element shows its ring.
- **3C.4** `b97e459` — `services/noticeService.ts` + `components/Notices.tsx`; all 38 native dialogs gone and the one `prompt()` replaced by the PIN pad; the duplicated audio-export helpers in `App.tsx` and `Archive.tsx` became one module (their `openDocumentsFolder()` had no caller); a failed entry write shows a notice. *Found on the way:* `importBackup()` accepted any JSON, reported success and reloaded; it now refuses anything that is not a backup before writing.
- **3C.5** `5f2f06f` — the audit fails on critical or serious and runs in CI after e2e; verified by removing one label and watching it fail.

Numbers: 115 unit (was 111), 38 e2e (was 33). Not done, deliberately: the module's own `alert()`s (parked code gets its pass when it is built), and a screen-reader walk by hand — the automated checks are necessary, not sufficient, and that walk is yours to do on a phone with VoiceOver or TalkBack.

### 3B — The front door · 12–16 h

| Step | Work | Hours | Done when |
| --- | --- | --- | --- |
| 3B.1 | Onboarding: one screen, true copy, optional name, no "friend" | 2.0 | e2e: no "video", "PDF", "advanced models" anywhere on first run; skip and complete both land on the dashboard |
| 3B.2 | Dashboard: four doors (Capture, Reflect, Spaces, Archive); Spaces out of the pack gate; entry-count tile replaced by "last written: Tuesday" or nothing; empty-state line | 3.0 | e2e: Spaces reachable in one tap on a fresh profile |
| 3B.3 | Packs: `scenario` pack removed (core now); the 7-day trial machinery removed (decision 6 — a trial is a commercial primitive with nothing to sell); wellbeing / reports / AI stay as plain on-off packs | 2.5 | `packs.test.ts` updated: three packs, no trial fields; stored `reflexia.packs.v2` still loads |
| 3B.4 | Entry modal: stage labels already; add media, the space colour, "Delete"; consider reviving `EntryDetailModal.tsx` | 2.0 | e2e opens a capture with a photo |
| 3B.5 | Spaces hub skin: the twenty tiles, "Gentle" badge, one line of what a space is for someone who has never heard the word | 1.5 | — |
| 3B.6 | First-90-seconds e2e: launch → capture → reflect → space → archive, asserting copy, taps and that every screen has a way back | 1.0 | — |
| | **Sum** | **12.0** → **12–16 h** | |

**3B landed (22 Sep 2026), three commits, after the §4 decisions were made the same evening.**

- **3B.1–3B.3, 3B.5** `22e6eb2` (one commit, because each depends on the others: the new welcome copy mentions spaces, and removing the `scenario` pack takes away the only route into them until the dashboard has a Spaces door). One welcome screen with three true sentences, an optional name (prefilled for someone who comes back via Profile; clearing it never erases a saved name), one Start. The dashboard has four doors, each with a line saying what it is for, "Last written today / yesterday / on Tuesday" instead of an entry count, and "Try capturing one thing. It can be a sentence." before the first entry; no "friend" in the greeting. Three optional packs remain as plain switches; the `scenario` pack and all trial code are gone. *Found on the way:* turning on any pack opened a "Try or Subscribe" sheet offering Pro at £9.99 a month, Lifetime at £99 and Enterprise, none of which existed (decision 6); gone with the trials. Older stored pack state still loads (an ended trial is off, anything else on stays on). The hub is called Spaces and scrolls as one page. It used to scroll inside its own box under a fixed footer, so a phone showed one and a half rows of the twenty spaces, with each description cut off.
- **3B.4** `390c1c7` — `components/EntryModal.tsx`. *Found on the way:* a reflection's own attachments (the composer's sketches and voice notes) were never shown anywhere after saving, and every `idb://` media reference (all audio, all composer sketches) went straight into `src` unresolved; sketches are type `SKETCH`, which the old modal did not recognise. Now media is resolved and shown, audio plays in place, answers appear in the framework's order under their questions, a space wears its colour, and Delete (confirmed, Cancel focused first) removes the entry and its stored media. `EntryDetailModal.tsx` deleted.
- **3B.6** `426522e` — `tests/e2e/first-ninety-seconds.spec.ts`: a new person on a 375 px screen captures (three taps from launch), reflects, finishes a space and finds all three in Archive, with no professional, clinical, commercial or false-promise wording on any screen along the way; every door on the dashboard has a way back.

Numbers: 121 unit (was 115), 44 e2e (was 38). Main chunk 318.3 KB. One intermittent e2e timeout seen once and not reproduced in seven further runs (`ai.spec.ts`, "removing the key…"); if CI shows it, it is a real race and needs looking at, not a retry.

### 3D — Learning, not scoring · 10–14 h

| Step | Work | Hours | Done when |
| --- | --- | --- | --- |
| 3D.1 | Delete `gamificationService.ts` achievements/levels/streak, `GamificationHub.tsx`, `AchievementUnlock.tsx`, the `UserStats` gamification fields' UI and the Profile toggle; keep `awardBonusXP`/`getBonusXP` dormant if wanted | 2.5 | build; nothing reads `reflexia_unlocked_achievements`; stored `reflexia.stats.v1` still parses |
| 3D.2 | `learningService.ts`: the ten tracks in §2.6, pure functions over entries + profile; search and backup set their flags | 3.0 | unit tests: each track from fixture data; none from a dwell or a click |
| 3D.3 | Profile "What you've tried"; the single dashboard nudge with its rule (after ≥3 entries, at most one line, dismissable, never in the composer) | 2.0 | e2e: nudge absent on a fresh profile; present after three captures and no space |
| 3D.4 | `Tutorial.tsx` + `tutorialService.ts` deleted; "Start Tutorial" becomes "Show me around" → the checklist | 1.5 | grep: no "professional excellence", no "AI-powered" |
| 3D.5 | Dead code from §1.7 removed: commerce files, old grounding screens, `CanvasBoardBasic`, `DifficultConversation`, `App.css` | 1.0 | reachability script: unreachable count ≤ module + parked (`DriveMode`, `MentalAtlas` trio, video, `MediaAttachmentPanel`) |
| 3D.6 | *Added 23 Sep 2026 at Andrew's request:* the CSV export (phase 0 §0.3's declared failure) | 1.0–1.5 | the `it.fails` unit test and the `test.fail` e2e spec pass as ordinary tests |
| | **Sum** | **11.0–11.5** → **11–15.5 h** | |

**3D landed (23 Sep 2026), four commits.** Hashes are this repository's.

- **3D.1 + 3D.4** `2ed510b` — one commit, because the tutorial was the only thing awarding XP. `gamificationService.ts` (713 lines), `GamificationHub.tsx`, `AchievementUnlock.tsx`, `Tutorial.tsx` and `tutorialService.ts` deleted, with the three-second dwell timer in `AppContext` and Profile's "Progress & Growth" card, Gamification switch and "Reset Stats Only". What stays: `services/pointsEngine.ts` (the level table and bonus-points store, because decision 4 says "the points engine itself stays"; nothing imports it; level 9 "Professional" renamed "Seasoned"); stored `reflexia.stats.v1`, now an opaque `UserStats` that a backup carries through untouched (tested). *Found on the way:* Profile's "Switch User / Logout — Return to the login screen to switch accounts" — there is no login and there are no accounts; it jumped to the welcome screen with nothing changed and no question asked. Removed. "Return to Onboarding" became "Show the welcome screen again".
- **3D.2 + 3D.3** `fc0d935` — `services/learningService.ts`: eleven tracks (the nine of §2.6, with attachments split into sketch, voice note and photo), each from entries, the profile or two flags in `reflexia.learning.v1` (a search of 2+ characters that returned something; `exportBackup()` ran). Not in the profile as §2.6 suggested: `UserContext` rebuilds the profile from named fields on load, so a new field would need threading through it, and neither flag needs to survive a restore. Profile → "What you've tried" (`components/WhatYouveTried.tsx`), no numbers; "Show me around" moves focus to it. The dashboard suggestion: none before three entries; Reflect first when there are only captures, then spaces, then backup; × puts it away for good and the next waits three more entries; rendered by the dashboard only. The done-when in the table ("present after three captures and no space") changed with the order: three captures now suggest Reflect, and spaces come after that is put away or done.
- **3D.5** `524d23d` — 13 files deleted (commerce, the old grounding screens and `groundingService.ts`, `CanvasBoardBasic.tsx`, `App.css`, `guide.css`; `DifficultConversation.tsx` had already gone in 3A.4), and the `stripe` and `@stripe/stripe-js` packages. Unreachable now: the module's 20 files and 7 parked on purpose, each named with its reason in `PARKED` in `tests/audit/reachability.mjs`; `--check` fails on anything else and `tests/unit/reachability.test.ts` runs it. *Found on the way:* the script compared `'src/main.tsx'` against `path.join` paths, so on Windows `main.tsx` itself counted as unreachable. Not changed: `@google/genai` is a dependency nothing imports.
- **3D.6** `c664de8` — the CSV bug had three siblings in the same code, all from reading `entry.title`/`entry.content`, which nothing writes: the Archive CSV held only the page on screen and said "INCIDENT"; Archive rows never previewed what was written; Reports' CSV and text export carried almost nothing. And two worse ones, both reproduced by a failing test before the fix: **the Archive preview was injected as HTML**, so an imported backup file could run code in the app, next to the decrypted entries and the AI key; and **searching for `(again` with "Most Relevant" crashed the app** (a RegExp built from the query). Now `utils/entryText.ts` is the one definition of what an entry says (modal, preview, both CSVs, Reports text); `utils/csv.ts` writes RFC 4180 with a BOM and neutralises formula cells; the preview is React text with `<mark>` from `highlightParts()`; no RegExp is built from a query; Archive exports every match, not the page. `tests/unit/search.test.ts` fails if a raw-HTML sink appears in `src/` outside the parked module.

Numbers: 148 unit (was 121), 50 e2e (was 44), **no declared failures left**; the audit scans 18 screens and finds nothing at any level. Main chunk 316.7 KB (was 318.3). *Found, not fixed:* each Archive row is a `<button>` containing audio play buttons and a slider — nested interactive controls. Listed in §5.

### Total

| Part | Hours | Depends on |
| --- | --- | --- |
| 3E AI boundary | 5–7 | — |
| 3A Data | 11–15 | — |
| 3C Accessibility | 8–11 | — (3C.4's confirm component is reused by 3B.4) |
| 3B Front door | 12–16 | 3A.4 (spaces as entries), §4.1 |
| 3D Learning (+ 3D.6 CSV) | 11–15.5 | 3B.2 (the door the nudge points at) |
| **Phase 3** | **47–64.5 h** | |

The `CLAUDE.md` row said "to be scoped". This is two and a half to three times phase 2, because phase 2 reshaped one component and this touches every screen a person sees. Splitting it into five landable parts is the mitigation; none of them is a big-bang.

---

## 4. Decisions for you

**All eight decided by Andrew on 22 September 2026, each as recommended below.** In short: (1) spaces now, the 3D room a question for after phase 3 — `CLAUDE.md` decision 3 reworded; (2) on screen they are **Spaces**; (3) plaintext dual-write removed (done, 3A.2); (4) captures by read-time alias, no migration (done, 3A.3); (5) the trial mechanism goes in 3B.3; (6) the dashboard shows "Last written: <day>" instead of an entry count; (7) delete `GamificationHub` and `CanvasBoardBasic`, park `DriveMode`, keep `MentalAtlas`; (8) neither video nor PDF is planned — the promises go in 3B.1 and demand decides later. The options as they were put are kept below for the record.

1. **What is the differentiator?** `CLAUDE.md` decision 3 describes a spatial, 3D, "place you go" layer, and names a file that has never existed in this repository. The code has twenty well-written guided spaces and a sketch pad. Three honest options:
   - **(a) Reword decision 3 to what exists** — "Spaces: guided rooms for specific situations" — and promote it to the front door (this document assumes (a); §2.2, 3A.4, 3B.2).
   - **(b) Keep the 3D ambition as phase 4**, do (a) now so the spaces stop being wasted, and budget the real thing separately: a `three.js`/`react-three-fiber` scene with a navigable room, spaces as places in it, on a PWA that must work on a mid-range phone. My estimate for a first version that is *not* embarrassing: 40–60 h, plus design you do not yet have. It would roughly double the bundle.
   - **(c) Build (b) inside phase 3.** I would push back: it puts the least certain, most expensive work in front of the accessibility and data fixes, and decision 2 (the game-like feel) is served today by the sound, the orbs and the sketch pad more than by geometry.
   I recommend (a) now and (b) as a question for after phase 3, when you can watch someone use the spaces.
2. **The name.** "Holodeck" and "Inner Simulation" mean nothing to someone with no background and sound like a game. "Spaces" is my proposal; "Rooms" and "Situations" are the alternatives that came up. It is a display string and a pack id; changing it later is cheap, so decide fast.
3. **Plaintext dual-write** (phase 0 §4.2): remove it (3A.2). The alternative — keep it as a fallback for browsers without IndexedDB — protects a browser that has not existed since 2015 at the cost of the app's central promise.
4. **Captures** (3A.3): read-time alias, no migration. Say if you want the stored literal changed too; it is +2 h and a migration test.
5. **The trial mechanism** (3B.3): remove. It is 7-day-trial plumbing for packs nobody pays for; decision 6 says nothing commercial. Removing it also removes `cleanupExpiredTrials()` from every boot.
6. **The dashboard number.** The entry-count tile: keep, replace with "last written", or nothing. I lean "last written" — it is about returning, not accumulating.
7. **The four dead files** from the February refactor (§1.7): delete `GamificationHub` and `CanvasBoardBasic`; park `DriveMode`; keep `MentalAtlas` for a later "patterns" screen. Say otherwise and 3D.5 changes.
8. **Video and PDF.** Both are promised today and neither exists. Phase 3 removes the promises. Building video capture (the unreachable `VideoCapture.tsx` is a start, ~4 h to wire and test, plus storage cost) or a PDF export (~4 h with a library, +200 KB) is phase 4 if you want them at all.

---

## 5. Out of phase 3

| Item | Why | When |
| --- | --- | --- |
| A navigable 3D room for the spaces | §4.1: decided to revisit after phase 3, once someone has been watched using the spaces | after phase 3, not committed |
| Video capture, PDF export | §4.8: decided neither for now | only if people ask |
| Light theme | `themeMode: 'LIGHT'` exists in the profile and changes one class name (`App.tsx:475`); every component hard-codes dark | later — 8–12 h, no one has asked |
| Android (Capacitor) | `@capacitor/*` are dependencies; nothing here has been run as an APK; `fileStorageService` has a native path that is untested | later |
| Mental Atlas revival | §1.7 | after 3D, as "Patterns" |
| Archive row audio player | found in 3D.6: play buttons and a slider nested inside each row's `<button>`; the entry modal already plays audio, so the row could show a count badge | small (1–2 h); next accessibility pass |
| `@google/genai` dependency | found in 3D.5: in `package.json`, imported by nothing | remove when convenient |
| DriveMode rebuild on frameworks | §1.7 | phase 4 |
| User-defined frameworks | phase 2 §5 | later, if ever |
| Encrypting media blobs | photos and audio in IndexedDB are plaintext; entries are not | phase 4; needs a streaming approach for audio |
| The professional module runtime | deferred indefinitely (`CLAUDE.md`) | — |

---

## 6. Success criteria

- [x] Every sentence on the first screen and the dashboard is true of the build (e2e asserts the specific words that were false) (3B.1, 3B.2)
- [x] Capture, Reflect, Spaces and Archive are each one tap from the dashboard on a fresh profile (3B.2)
- [x] A finished space is an encrypted entry: in Archive, searchable, in the backup, opening with readable labels (3A.4)
- [x] No "incident" wording on any screen; a capture never colours a calendar day as critical; stored `type` unchanged (3A.3)
- [x] After the first save, persistence has been requested and Profile says whether it was granted; no plaintext entry copy exists in `localStorage` (3A.1, 3A.2)
- [x] AI can only be reached with the person's own key and their toggle, through one gate; the consent screen names what is sent; no `VITE_GEMINI` in the build (3E)
- [x] `npm run audit:a11y` reports 0 critical and 0 serious nodes and runs in CI; no text under 12 px in live components; every interactive element has a visible focus state; no native `alert()`/`confirm()` (3C)
- [x] No levels, XP totals, achievements or streaks anywhere; "What you've tried" reflects real actions only; the nudge follows its rule (3D.1–3D.4)
- [ ] `CLAUDE.md` decision 3 reworded per §4.1, decision 4 marked done, open questions 1 and 3 closed — all done except open question 3, which is answered by watching a first-time user, not by code
- [x] Unreachable core files reduced to the parked set; unit and e2e counts recorded in `CLAUDE.md` (3D.5, and a check that fails if it grows)

---

## 7. Added with this document

`tests/audit/a11y.spec.ts` and `playwright.audit.config.ts` (the axe walk in §1.6), `@axe-core/playwright` as a dev dependency, `npm run audit:a11y`, and `tests/audit/reachability.mjs` (the dead-code count in §1.7). The regular `npm run test:e2e` does not run the audit; 3C.5 makes it a gate.
