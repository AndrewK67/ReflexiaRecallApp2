# Professional module (parked)

Everything in this folder is profession-specific — CPD tracking against
regulator standards (NMC, HCPC, GMC, GPhC and others), professional document
export for revalidation, crisis protocols, incident capture, a rewards store,
a learning-resource library and a disclaimer quiz. None of it makes sense to
someone without a professional background, so it does not belong in the core
(`CLAUDE.md`, locked decision 1).

It was moved here in phase 1A (September 2026) and is **not deleted** because
it becomes a speciality module later. That module runtime is deliberately
deferred; do not build it, and do not wire anything in here back into the app
in the meantime.

## What is here

```
components/   CPD.tsx, CompetencyMatrix.tsx, CrisisChecklist.tsx,
              CrisisProtocols.tsx, DisclaimerQuiz.tsx, IncidentCapture.tsx,
              LegalAcceptance.tsx, Library.tsx, ProfessionalDocExport.tsx,
              RewardsStore.tsx
data/         cpdStandards.ts, learningResources.ts
services/     cpdService.ts, disclaimerQuizService.ts,
              professionalDocService.ts, rewardsCatalogService.ts,
              rewardsRedemptionService.ts
types.ts      CPDLog, CrisisCategory, CrisisProtocol, IncidentProtocol
```

Every file still compiles (`tsc -b` checks the whole of `src/`), so it cannot
silently rot. Nothing imports it, so it is not in any bundle chunk.

## The rule

**The dependency arrow points one way.** Files in here import from the core
(`../../../types`, `../../../services/storageService`, the media capture
components). The core never imports from here. If you find yourself adding an
import from `src/modules/professional/` into `src/` proper, stop — that is the
professional layer coming back.

Two things the module wrote onto saved entries are declared in the core,
because entries already on users' devices carry them:
`ReflectionEntry.cpd` and `ReflectionEntry.nmcCodeThemes` in `src/types.ts`,
and `UserStats.cpdMinutesTotal`. The core does not read them. `CPDLog` in
`types.ts` here is derived from that declaration rather than duplicated.

## Still in the core, and not this module's problem

`PROFESSION_CONFIG` in `src/constants.ts` (32 profession presets), the
profession dropdown in `SimplifiedOnboarding.tsx`, the NMC Code themes block
in `ReflectionFlow.tsx` and the per-profession AI prompt prefixes are
phase 1B. Quick Capture saving entries as `INCIDENT` with clinical categories
is phase 3. See `docs/PHASE-1-SCOPE.md` §3.

## Reachability, for the record

Before the move, only six of these files were reachable from `main.tsx`
(`CPD.tsx`, `cpdService.ts`, `cpdStandards.ts`, `CrisisProtocols.tsx`,
`ProfessionalDocExport.tsx`, `professionalDocService.ts`), all behind the
`professional` pack, which was off by default. The other eleven were dead
code since the February 2026 refactor. `rewardsCatalogService.ts` declares a
`ProfessionType = 'nursing' | 'all'` split that `CLAUDE.md` once planned to
honour; the whole rewards feature is unreachable, so the trio moved whole and
the split can happen when something actually uses it.
