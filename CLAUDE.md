# Reflexia

A general-purpose reflection app that anybody can use easily regardless of
background, with optional paid speciality modules. **It is not a healthcare app.**
Nurses are the likely first add-on market, not the core's identity.

Stack: React 19.2, Vite 7.2, TypeScript 5.9. Offline-first PWA, IndexedDB, no
backend, no accounts. Deploys to Cloudflare Pages.

Full architecture spec, manifest schema, NMC tracker definition, phase plan and
risk register:
https://claude.ai/code/artifact/63c97b33-95d8-4e86-bf33-9b426bcdc4d5

## Locked decisions — do not reopen

1. **The core is profession-independent.** Test for every component: could
   someone with no professional background use this and enjoy it? If it only
   makes sense to one profession, it belongs in a module.
2. **The spatial layer is the differentiator** — `holodeck/`, `Interior3D.tsx`,
   `CanvasBoard.tsx`. "A place you go", not "a form you fill in". Core.
3. **XP and achievements attach to learning the app, never to reflecting.**
   Nothing rewards entry count. No streaks. Lessons complete by doing the real
   thing once, not by clicking a tour. Progression is invisible while writing.
   This replaces the `ACHIEVEMENTS` catalogue in `services/gamificationService.ts`;
   the engine stays.
4. **Each module ships its own learning track**, reopening progression after the
   core track completes.
5. **Modules ship content AND structure** — JSON plus declared stage sequences,
   tracker schemas and export formats, bound to core components. A module
   declares; it never executes. No third-party code, no sandboxing.
6. **Convert `src/packs/`** from compile-time feature flags to data-driven
   manifests. The `PackId` union goes; registry, service and trials stay.
7. **Gibbs is demoted** out of the composer into a free module. Core built-ins
   are Open Entry and Three-Part.
8. **Tracker vocabulary is exactly three primitives**: `counter`, `entryLink`,
   `milestone`.
9. **Free core, paid modules.** Entitlement via a pre-generated key pool verified
   offline with SHA-256 against a hash set in the build. This replaces
   `setUserTier()`, currently a one-line localStorage bypass.
10. **First paid module: NMC Revalidation**, extracted from the existing
    `professional` pack, sold through the Reflective Practice Toolkit funnel.

## Current state

- On `refactor/context-layer`. A February refactor was recovered from the
  working tree in Sept: contexts layer, entry storage and crypto split out of
  `storageService.ts`. `tsc -b` passes; runtime unverified.
- **No test suite anywhere.** This is the top constraint.
- `navigator.storage.persist()` is never called — entries are evictable.
- `stripeService.ts` exists alongside the localStorage tier bypass.

## Open questions

1. Sequencing: architecture-first vs revenue-first (hardcode NMC, sell sooner).
2. `professional` bundles six regulators (NMC, HCPC, GPhC, GMC, GDC, SWE) —
   one module or six SKUs?
3. The AI layer — `aiProvider.ts`, `aiService.ts`, `geminiService.ts`,
   `providers/geminiProvider.ts`. What leaves the device, and is it opt-in?
   Must be resolved before selling to nurses.
4. `data/learningResources.ts` (43 KB) says "for healthcare professionals" but
   its categories span engineering, finance and creative arts. Module or core?

## Working preferences

British English. Full file paths with extensions, complete file contents for
replacement — assume no prior knowledge of where things live. Honest hour
estimates, phase by phase. Show what's done versus what needs building. No
hand-waving about complexity.
