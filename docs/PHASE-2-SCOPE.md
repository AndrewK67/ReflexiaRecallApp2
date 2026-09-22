# Phase 2 scope — frameworks, not models

**Branch:** `phase-1a/professional-module` at `36e7bf4` · **Written:** 22 September 2026 · **Status:** **done** (same day; §8 records what landed and where it differs from the plan).

`CLAUDE.md` locked decision 5: *Gibbs is not the core. It comes out of the composer. Core built-ins become Open Entry (one field) and Three-Part (what happened / what it means / what now); Gibbs becomes one selectable framework among several.* Estimate on file: 15–20 h. This document says what the code actually needs, what it costs, and what I found on the way.

---

## 0. The verdict

1. 🟢 **Decision 5 is already half true at runtime.** The composer opens in a three-question "Simple Mode" (`SIMPLE`: what happened → what stood out → what will you carry forward) and Gibbs is one of nine tiles behind "Switch to Advanced Models". `FREE` ("Free Writing", one stage) exists too. So Three-Part and Open Entry are not things to build — they are `SIMPLE` and `FREE`, renamed and promoted. Phase 2 is reshaping, not building.
2. 🔴 **The offline coaching prompts are broken for four of the nine frameworks.** `src/data/offlinePrompts.ts` keys its prompts as `DESCRIPTION`, `ERA_EXPERIENCE`, `ROLFE_WHAT`; the frameworks' stage ids are `Description`, `ERA_Experience`, `ROLFE_What`. The lookup misses and falls through to a generic "Write your thoughts." — for **every stage of Gibbs, SBAR, ERA and Rolfe**, and one Morning stage. Simple Mode never finds its own prompts either (it looks up a null model) and gets Free Writing's. With AI toggled on but no key, the tip is the raw stage id: *"Reflect honestly on this what_happened stage."* Only STAR, SOAP and Evening work as designed. This is the second parallel key space for the same data, and phase 2 should delete it rather than repair it.
3. 🟡 **Two frameworks are not reflection frameworks.** SBAR is a clinical handover script; SOAP is a clinical notes format ("Your professional judgement: what's the working understanding and risk?"). They belong with the professional module, alongside the profession presets. Gibbs, Rolfe, ERA, STAR, Morning and Evening are general enough to stay.
4. 🟡 **Raw ids leak into the UI.** The entry detail modal prints `Model: SIMPLE` and headings like `what_happened`; Archive, Calendar and Reports show `SIMPLE`/`GIBBS`; Archive's framework filter lists "Custom 1", "Custom 2", "Custom 3" — placeholders nothing can create.
5. 🔒 **Stored data fixes the ids.** Entries on devices carry `model: "SIMPLE"` and answers keyed `what_happened`; `model: "GIBBS"` keyed `Description`. Ids stay exactly as they are. Only display names change. Anything else is a migration and belongs in phase 3 with the `INCIDENT` work.
6. ⏱️ **Estimate: 14–18 h.** In line with the 15–20 h on file, but the hours go on unifying three parallel definitions (framework config, offline prompts, the composer's own hard-coded stages) and the composer's entry flow — not on Gibbs.

---

## 1. How frameworks work today

Three places define the same thing, and they disagree.

| Where | What | Problem |
| --- | --- | --- |
| `src/constants.ts` `MODEL_CONFIG` (lines 25–162) | 13 entries: `SIMPLE`, `GIBBS`, `SBAR`, `ERA`, `ROLFE`, `STAR`, `SOAP`, `MORNING`, `EVENING`, `FREE`, `CUSTOM_1..3`. Each has `title`, `description`, `stages[{id,label,prompt,placeholder}]` | The canonical source, but no coaching text, no origin, no notion of built-in vs optional. `CUSTOM_1..3` are placeholders with no creation path |
| `src/components/ReflectionFlow.tsx:108–124` `SIMPLE_MODE_STAGES` | The three Simple Mode stages, hard-coded a second time | Duplicates `MODEL_CONFIG.SIMPLE` (already drifted: no placeholders) |
| `src/data/offlinePrompts.ts` `OFFLINE_PROMPTS` | Per-stage coaching text keyed by model and stage | Keys don't match `MODEL_CONFIG` stage ids for GIBBS/SBAR/ERA/ROLFE/MORNING (§0.2) |
| `src/types.ts` `StageId` const (lines 47–112) | Every stage id as a constant, including SBAR/SOAP ones | Only `constants.ts` and the dead `StageIcon.tsx` use it |
| `src/services/providers/offlineProvider.ts:31–44` | AI-on coaching tips keyed `Description`, `Feelings`… | Gibbs only; everything else gets the raw-id sentence |

Consumers of model ids outside those files — all of which currently render the id as text:

| File | Lines | Use |
| --- | --- | --- |
| `src/App.tsx` | 167, 176–182, 373 | Entry modal: `Model: SIMPLE`, answer keys as headings |
| `src/components/Archive.tsx` | 31, 423–430, 559 | Framework filter (lists all 13 incl. Custom), list row shows `entry.model` |
| `src/components/CalendarView.tsx` | 331 | Shows `entry.model` |
| `src/components/Reports.tsx` | 54, 82, 134 | Model breakdown by id; CSV column |
| `src/services/searchService.ts` | 11, 104 | `reflectionModel` filter |
| `src/services/providers/geminiProvider.ts` | 63–79, 127–129 | `normalizeModelId()` defaults to **`GIBBS`**; prompt says "using the Gibbs model" |
| `src/services/aiService.ts` | 82 | Hard-coded list of model ids to disambiguate arguments |
| `src/services/gamificationService.ts` | 589–594 | Counts unique models used |
| `src/services/tutorialService.ts` | 69 | *"Choose a reflection model (we recommend Gibbs for beginners)"* |
| `src/components/StageIcon.tsx`, `Guide.tsx`, `guideShapes.ts` | — | Dead since the February refactor; icons per Gibbs stage |

The composer (`ReflectionFlow.tsx`, 697 lines after 1B) has three screens gated by state: the framework picker (`!selectedModel && !useSimpleMode`, lines 341–443), the finished screen (445–527) and the stage screen (539–697). `useSimpleMode` and `selectedModel` are separate state, which is why the simple stages had to be duplicated.

---

## 2. The design

### 2.1 One definition: `ReflectionFramework`

```ts
// src/frameworks/types.ts
export interface FrameworkStage {
  id: string;          // persistent — matches answer keys already on devices
  label: string;       // "What happened?"
  question: string;    // the prompt shown above the text box (today's `prompt`)
  placeholder?: string;
  coaching: string;    // the offline Coach tip for this stage (today's OFFLINE_PROMPTS, fixed)
}

export interface ReflectionFramework {
  id: ReflectionModelId;      // persistent — matches entry.model already on devices
  name: string;               // display: "Three-Part", "Open Entry", "Gibbs' Reflective Cycle"
  tagline: string;            // one line under the name
  kind: 'built-in' | 'framework';
  origin?: string;            // "Gibbs, 1988" — the picker is honest about where these come from
  stages: FrameworkStage[];
}
```

`src/frameworks/index.ts` exports `BUILT_IN` (Three-Part = id `SIMPLE`, Open Entry = id `FREE`), `CATALOGUE` (Gibbs, Rolfe, ERA, STAR, Morning, Evening), `ALL`, `getFramework(id)`, `frameworkName(id)`, `stageLabel(frameworkId, stageId)`. `getFramework` returns a `Legacy` fallback for an id it does not know (an `SBAR` entry saved last year still opens; its stage ids become its labels). `MODEL_CONFIG` becomes a thin re-export for anything not yet migrated, then goes.

**Ids never change.** `SIMPLE` is displayed as "Three-Part"; `FREE` as "Open Entry". A future renaming of persistent ids is a migration and is not phase 2.

### 2.2 What moves, what goes

| | Where |
| --- | --- |
| Gibbs, Rolfe, ERA, STAR, Morning, Evening | `src/frameworks/catalogue.ts` |
| Three-Part (`SIMPLE`), Open Entry (`FREE`) | `src/frameworks/builtIn.ts` |
| SBAR, SOAP | `src/modules/professional/data/frameworks.ts` — clinical structures, not reflection. Entries already saved with them still open via the Legacy fallback |
| `CUSTOM_1..3` | Deleted. Nothing creates them; the Archive filter advertises them. `ReflectionModelId` shrinks accordingly; the three ids are kept in the Legacy fallback in case an old entry has one |
| `src/data/offlinePrompts.ts` | Deleted; its text moves into each stage's `coaching`, with the four broken frameworks' text finally reachable. `offlineDailyPrompt.ts` (unrelated) stays |
| `SIMPLE_MODE_STAGES` in the composer | Deleted; the composer reads `BUILT_IN.threePart.stages` |
| `StageId` const in `src/types.ts` | The SBAR/SOAP members go with their frameworks; the rest can go once `constants.ts` stops using them. `StageIcon.tsx`, `Guide.tsx`, `guideShapes.ts` are dead and deleted |

### 2.3 The composer's entry flow

Today: Reflect → Simple Mode (three stages) → *Switch to Advanced Models* → picker of nine → stages. "Advanced" is the wrong word and Free Writing is buried in the picker.

After: Reflect → **Three-Part** (default, unchanged behaviour) with two quiet links under the header: **Just write** (Open Entry — one field, straight in) and **Use a framework** (the catalogue picker: name, tagline, origin, stage count). `useSimpleMode` and `selectedModel` collapse into one `framework` state that is never null. Everything else in the composer — voice, sketch, mood, coaching, insight, save — is untouched. This is deliberately *not* the first-run redesign (phase 3); it is the smallest change that makes the built-ins first-class.

### 2.4 Coaching that works

`Coach` button, AI off: `framework.stages[i].coaching`. AI on: `getStageCoaching(frameworkId, stageId, text)` — the provider interface gains the framework id so the offline fallback can use the same text instead of *"Reflect honestly on this what_happened stage."* `geminiProvider.normalizeModelId()` defaults to `SIMPLE`, not `GIBBS`, and validates against `ALL` rather than a hard-coded list; `aiService.looksLikeModel` derives from the registry too.

### 2.5 Names on screen, not ids

`stageLabel()` in the entry modal (`App.tsx:176–182`); `frameworkName()` in Archive rows, Calendar, Reports and the modal title; Archive's filter lists built-ins, catalogue, and "Other" for legacy ids.

---

## 3. Step by step

| Step | Work | Hours | Done when |
| --- | --- | --- | --- |
| 2.1 | `src/frameworks/{types,builtIn,catalogue,index}.ts`; SBAR/SOAP to the module; `CUSTOM_1..3` out; `ReflectionModelId` trimmed; `constants.ts` `MODEL_CONFIG` re-exports `ALL` as a record | 2.5 | `tsc -b`; `frameworks.test.ts` (registry integrity: unique ids and stage ids, every stage has a question and coaching, legacy ids resolve, `stageLabel`) |
| 2.2 | Fold `OFFLINE_PROMPTS` into `coaching`; delete `offlinePrompts.ts`; `AIProvider.getStageCoaching(frameworkId, stageId, text)`; providers and `aiService` updated | 2.0 | A unit test asserts every stage of every framework returns its own coaching text offline (the probe in §0.2, made permanent) |
| 2.3 | Composer: one `framework` state; Three-Part default; "Just write" and "Use a framework"; picker reads `CATALOGUE` with name/tagline/origin; `SIMPLE_MODE_STAGES` gone | 4.0 | e2e: Three-Part save; Open Entry save; picker → Gibbs → save; stored `model`/`answers` shapes unchanged |
| 2.4 | Consumers: entry modal labels, Archive rows and filter, Calendar, Reports, gemini default, tutorial copy; delete `StageIcon.tsx`, `Guide.tsx`, `guideShapes.ts` | 2.0 | No raw framework or stage id visible anywhere; e2e opens a legacy `SBAR` entry from Archive and sees "Other" with readable labels |
| 2.5 | Tests: update `search.test.ts`, `offlineProvider.test.ts`, `reflect.spec.ts`; add the legacy-entry spec | 1.5 | 70+ unit, 18+ e2e green |
| 2.6 | `CLAUDE.md` (decision 5 done; what "framework" means), scope status | 1.0 | — |
| | **Sum** | **13.0** → **14–18 h with margin** | |

Sequence matters: 2.1 and 2.2 are pure data plus one signature and are safe to land alone; 2.3 is the only step that touches the save path, and it is protected by `reflect.spec.ts` and `entryStorage.test.ts` already.

---

## 4. Decisions for you

1. **Which frameworks stay in the core catalogue.** My proposal: Gibbs, Rolfe, ERA, STAR, Morning, Evening stay; SBAR and SOAP go to the module. STAR is an interview technique rather than a reflection model, but it is general and harmless. If you'd rather the core shipped only the two built-ins plus Gibbs and Rolfe, that is a smaller catalogue, not more work.
2. **Three-Part's three questions.** Decision 5 sketches *what happened / what it means / what now*. The current stages are *What happened? / What stood out or mattered? / What will you carry forward?* — better English, and the ids (`what_happened`, `what_mattered`, `what_forward`) are on devices. I'd keep the current questions and treat decision 5's wording as the gist. Say if you want the literal three.
3. **Whether "Just write" is a link or an equal button.** The link keeps Three-Part as the obvious default for someone who has never reflected; an equal button would say the app has two front doors. I lean link. Phase 3 can revisit with the first-run work.

---

## 5. Out of phase 2

| Item | Why | When |
| --- | --- | --- |
| User-defined frameworks | `CUSTOM_1..3` were placeholders; a real feature needs an editor, storage and the phase 3 spatial thinking | later, if ever |
| The composer's look and first-run feel | phase 3 | phase 3 |
| Quick Capture's `INCIDENT` data model | migration | phase 3 |
| The gamification "models used" count (`gamificationService.ts:589`) | part of the XP rework in decision 4 | phase 3 |
| The AI gate and consent screen | `docs/PHASE-1-SCOPE.md` §6.1 | phase 3 |

---

## 6. Success criteria

- [x] One `ReflectionFramework` definition per framework, in `src/frameworks/`, each stage carrying its own coaching text; `offlinePrompts.ts` and `SIMPLE_MODE_STAGES` gone
- [x] Reflect opens in Three-Part; Open Entry is one tap away; the catalogue picker names each framework and its origin
- [x] Every stage of every framework returns its own coaching text with AI off — `frameworks.test.ts` asserts no stage falls through to the default
- [x] No raw framework or stage id rendered anywhere; the Archive filter no longer lists Custom 1–3
- [x] `SBAR`, `SOAP` and `CUSTOM_*` entries already on a device still open and read cleanly — `reflect.spec.ts` seeds a pre-IndexedDB SBAR entry and opens it
- [x] Stored `model` and `answers` shapes unchanged — `frameworks.test.ts` pins every framework and stage id; `entryStorage.test.ts` and `reflect.spec.ts` exercise the save path
- [x] `CLAUDE.md` decision 5 marked done and the word "model" retired in favour of "framework" where the code talks to a person

---

## 7. A small fix made while scoping

`vitest.config.ts` now defines `__BUILD_DATE__`, which `constants.ts` reads at import time from Vite's `define`. Without it, any unit test importing `constants.ts` threw `ReferenceError` — which is why nothing had tested `MODEL_CONFIG`, and why the probe in §0.2 needed it. It is a two-line change and is committed with this document.

---

## 8. What landed (22 September 2026)

All six steps, in the order scoped, one commit. `tsc -b`, `npm run build`, 80 unit tests (9 suites, up from 67), 20 e2e specs (up from 16; 19 pass, the empty-text CSV export stays the declared failure). Bundle: `ReflectionFlow` chunk 88.6 → 83.6 KB (gzip 22.6 → 20.4 KB); main chunk 306.3 → 306.6 KB (gzip 95.3 → 95.8 KB). The framework text that left `constants.ts` and `offlinePrompts.ts` came back as `src/frameworks/`, now in the main chunk because Archive and the entry modal read names from it; the composer chunk lost its duplicate stages and the picker's dead branches.

### Files

| | |
| --- | --- |
| **New** | `src/frameworks/types.ts`, `builtIn.ts`, `catalogue.ts`, `index.ts`; `src/modules/professional/data/frameworks.ts` (SBAR, SOAP); `tests/unit/frameworks.test.ts` (13 tests) |
| **Deleted** | `src/data/offlinePrompts.ts`, `src/components/StageIcon.tsx`, `Guide.tsx`, `guideShapes.ts` |
| **Reshaped** | `src/components/ReflectionFlow.tsx` (697 → 654 lines: one `framework` state, `showPicker`, `startFramework()`; `useSimpleMode`, `selectedModel`, `SIMPLE_MODE_STAGES`, `safeModel*` gone) |
| **Migrated** | `src/constants.ts` (`MODEL_CONFIG` gone), `src/types.ts` (`StageId`, `ReflectionModelConfig`, `ReflectionModelId` gone; `model` is a documented plain string), `aiProvider.ts`, `aiService.ts`, `offlineProvider.ts`, `geminiProvider.ts`, `searchService.ts`, `tutorialService.ts`, `App.tsx`, `Archive.tsx`, `CalendarView.tsx`, `Reports.tsx`, `modules/professional/types.ts` |
| **Tests** | `offlineProvider.test.ts` (new coaching signature), `reflect.spec.ts` rewritten (six specs), `helpers.ts` (`setPacks` now waits for the app to settle after reload — a pre-existing flake in `packs.spec.ts`, seen once in this run) |

### Where it differs from §3

1. **`MODEL_CONFIG` is gone, not re-exported.** §3 step 2.1 planned to keep it as a record over `ALL` for a transition. Nothing needed the transition: every consumer moved in the same commit, so the alias would have been a second name for the registry from day one.
2. **`ReflectionModelId` is gone too**, not trimmed. After 2.4 nothing referenced it; a union that has to be kept in step with the registry by hand is the kind of duplication phase 2 exists to remove. `entry.model` is a plain `string` with a comment saying why.
3. **A legacy SBAR entry shows "SBAR", not "Other".** §3 step 2.4 said "Other". The entry was written with SBAR; saying so is more honest than a bucket, and the stage labels (`Situation`, `Recommendation`) come out readable from the answer keys. `CUSTOM_1..3` show as "Custom framework". Unknown ids show the id.
4. **Switching keeps what was typed.** Moving from Three-Part to "Just write" (or into the picker and out) on the first step carries the first box's text into the new framework's first stage. The old toggle threw it away. Small; it removes the one way the new links could lose someone's words.
5. **Coach with AI on falls back to the offline tip** if the provider throws or returns nothing, instead of showing nothing.
6. **The picker copy** says a framework is "a fixed set of questions in a fixed order" and that none is better than the three questions the person started with. §2.3's wording was looser; this is the version that went in.

### Still open after phase 2

- `services/subscriptionService.ts:251` advertises "All reflection models (Gibbs, SBAR, ERA, etc.)" in a paywall nothing reaches. Decision 6 says nothing commercial; it is dead text in dead code and was left alone.
- `gamificationService.ts` "models used" count — phase 3 (XP rework), as §5 said.
- The composer's look, the first-run experience and the `INCIDENT` data model — phase 3.
