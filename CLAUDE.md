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

## The core question for every change

**Could someone with no professional background use this and enjoy it?**
If something only makes sense to a member of a particular profession, it does
not belong in the core — however much work is already in it.

## Locked decisions

1. **Profession-independent core.** See the question above.
2. **The game-like feel is the point.** It is the mechanism that makes the app
   approachable to someone with no training in reflective practice.
3. **The spatial layer is the differentiator** — `holodeck/`, `Interior3D.tsx`,
   `CanvasBoard.tsx`. "A place you go", not "a form you fill in".
4. **XP and achievements attach to learning the app, never to reflecting.**
   Nothing rewards entry count. No streaks. Lessons complete by doing the real
   thing once, not by clicking through a tour. Progression is invisible while
   someone is writing. This replaces the `ACHIEVEMENTS` catalogue in
   `services/gamificationService.ts`; the points engine itself stays.
5. **Gibbs is not the core.** The six-stage cycle (Description, Feelings,
   Evaluation, Analysis, Conclusion, Action Plan) is a nursing and teacher-
   training framework. It comes out of the composer. Core built-ins become
   Open Entry (one field) and Three-Part (what happened / what it means /
   what now); Gibbs becomes one selectable framework among several.
6. **Nothing commercial yet.** No entitlement, no paid tiers, no key pools, no
   storefront. `setUserTier()` is a localStorage bypass and stays broken for
   now — just do not build on it.

## The main near-term job: strip the professional layer out

About **22% of the source is profession-specific** — 281 KB across 15 files —
and it is referenced from `App.tsx`, `AppContext.tsx` and `constants.ts`.

Move to `src/modules/professional/`, off the navigation. **Do not delete** —
it becomes a module later.

- `components/CPD.tsx`, `CompetencyMatrix.tsx`, `CrisisChecklist.tsx`,
  `CrisisProtocols.tsx`, `IncidentCapture.tsx`, `RewardsStore.tsx`,
  `Library.tsx`, `LegalAcceptance.tsx`
- `data/cpdStandards.ts`, `data/learningResources.ts`
- `services/professionalDocService.ts`, `cpdService.ts`,
  `rewardsCatalogService.ts`, `rewardsRedemptionService.ts`,
  `disclaimerQuizService.ts`

Note `rewardsCatalogService.ts` already declares
`ProfessionType = 'nursing' | 'all'`. The redemption engine is core; only the
catalogue entries marked `'nursing'` move.

## Phases

| # | Phase | Estimate |
| - | ----- | -------- |
| 0 | Test harness — entry create/save/recover, IndexedDB, export | 20–25h |
| 1 | Strip the professional layer to `src/modules/professional/` | 35–45h, re-scope first |
| 2 | Demote Gibbs, framework interface, Open Entry + Three-Part | 15–20h |
| 3 | Make the core good for anyone — first-run experience, persistent storage, accessibility, XP rework to learning tracks | to be scoped |

Deferred indefinitely: module runtime, manifests, entitlement, specialities.

## Current state

- On `refactor/context-layer`, pushed. A February refactor was recovered in
  September: contexts layer, entry storage and crypto split out of
  `storageService.ts`. `tsc -b` passes; **runtime unverified** — confirm
  `npm run build` and `npm run dev` before trusting it.
- **No test suite anywhere.** Top constraint. Phase 0 is a gate, not a phase.
- `navigator.storage.persist()` is never called — entries are evictable.
- `src/packs/` is a compile-time feature-flag system. Leave it alone for now.

## Open questions

1. The AI layer — `aiProvider.ts`, `aiService.ts`, `geminiService.ts`,
   `providers/geminiProvider.ts`. What leaves the device, and is it opt-in?
   An offline-first, privacy-focused app cannot quietly send entries to a
   third-party model.
2. `data/learningResources.ts` (43 KB) is healthcare-framed but its categories
   span engineering, finance and creative arts. Probably moves out; confirm.
3. What does a first-time user with no background actually do in their first
   90 seconds? Currently unanswered, and it is the most important question
   in the project.

## Working preferences

British English. Full file paths with extensions, complete file contents for
replacement — assume no prior knowledge of where things live. Honest hour
estimates, phase by phase. Show what's done versus what needs building. No
hand-waving about complexity, no oversimplification, no false reassurance.
