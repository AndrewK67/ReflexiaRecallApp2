# Phase 0 scope — the test harness

**Branch:** `phase-1a/professional-module` at `b51baf1` · **Written:** 22 September 2026 · **Status:** scoped, then **executed the same day** in seven commits: harness, the two data-loss fixes, eight unit suites (67 tests), the Playwright runner (15 specs), CI. Line numbers below refer to the tree *before* those fixes. Open items: the plaintext dual-write decision (§4.2 — decided and done in phase 3A.2) and the CSV text fix (§0.3 — **fixed in phase 3D.6, 23 Sep 2026**, `c664de8`; both declared-failing tests now pass as ordinary tests).

`CLAUDE.md` says phase 0 is "entry create/save/recover, IndexedDB, export — 20–25 h". This document says what that actually means for this codebase, what it costs, and what the spike found on the way.

---

## 0. The verdict

1. 🧨 **Two data-loss bugs, found by the spike before a single real test was written.** Both are the same mistake — `await`ing `crypto.subtle.encrypt()` inside an open IndexedDB transaction, which auto-commits the moment control leaves it — and both make the store *look* empty:
   - **Backup restore wipes the user's entries.** `saveAllEntries()` clears the store, then every `put` throws `TransactionInactiveError`. IndexedDB ends up empty and `loadEntries()` returns `[]`, so after the automatic reload the app shows nothing: entries that were in the backup sit invisible in `localStorage`, and any entry saved since that backup is gone outright (localStorage was overwritten too). `src/services/entryStorageService.ts:200-219`, reached from Profile → Backup & Restore → Restore (`NeuralLink.tsx:84`).
   - **Upgrading from the pre-February build hides every entry.** `migrateFromLocalStorage()` fails the same way on every launch, never sets its "done" flag, and `loadEntries()` reads only IndexedDB — so anyone who used the nurse-testing build (`33ce412`, localStorage-only) and updates sees zero entries. Their data is still in `reflexia.entries.v1`; the UI just never shows it. `entryStorageService.ts:108-132`.
   - Fix for both: encrypt every record *before* opening the transaction, then `put` them in a tight loop. About 30 minutes plus the tests that now exist. **Phase 0 should include this fix**; leaving red tests for known data loss in a "gate" phase makes no sense.
2. 🔓 **"Encrypted at rest" is currently untrue.** `saveEntry()` dual-writes the plaintext entry to `localStorage` after encrypting it into IndexedDB (`entryStorageService.ts:180-183`). Any script on the origin, and anyone with the browser profile, reads the plaintext next to the ciphertext. The encryption costs CPU and protects nothing. This is a design decision, not a typo — the dual-write is what makes the localStorage fallback in `loadEntries()` possible — so §4.2 lays out the options; phase 0 pins the current behaviour with an expected-fail test and does not decide.
3. 📤 **Archive's "Export CSV" exports no text.** It reads `entry.title` and `entry.content`, and nothing in the app ever writes either — Quick Capture writes `notes`, reflections write `answers`. Every row is date, type, `""`, `""`. `src/services/searchService.ts:355-384`, `Archive.tsx:292`. Small fix; phase 0 pins it. **Fixed in 3D.6** — and the same code was injecting `entry.content` into Archive as HTML, which an imported backup could exploit (`docs/PHASE-3-SCOPE.md` §3, 3D landed).
4. ✅ **The runner stack works against the real code, unmodified.** Vitest 3 + `fake-indexeddb` 6 + Node 22's built-in WebCrypto + a 12-line `localStorage` shim runs `entryStorageService`, `cryptoService` and `fileStorageService` as-is. Six tests took 650 ms. No mocking of the app's own modules.
5. ⏱️ **Estimate: 17–22 h.** Close to the 20–25 h in `CLAUDE.md`, but for different reasons — the harness itself is cheap (the spike took ten minutes), the hours are in the test inventory below and in making Playwright a proper runner with CI behind it. The two bug fixes add an hour.

---

## 1. What "entry create/save/recover" actually touches

| Path | Code | Reachable how | Today |
| --- | --- | --- | --- |
| Create + save | `QuickCapture.tsx:84-130` → `EntriesContext.addEntry` → `entryStorageService.saveEntry` | Dashboard → Capture | ✅ works (smoke-tested) |
| Create + save (composer) | `ReflectionFlow.tsx:~300-350` → same | Dashboard → Reflect | ✅ works |
| Encrypt / key | `cryptoService.ts` — AES-256-GCM, key in `reflexia-keystore` IDB, extractable | every save/load | ✅ works |
| Load on launch | `EntriesContext` → `initEntryStorage` + `loadEntries` | app boot | ✅ works |
| Media | `fileStorageService.ts` — blobs in `reflexia-media` IDB, `idb://` refs | audio/photo/drawing | ✅ works (spike) |
| Delete | `entryStorageService.deleteEntry` | Archive | ✅ works (spike) |
| Migrate from old build | `migrateFromLocalStorage` | first launch after upgrade | ❌ **fails every launch** |
| Backup export | `storageService.exportBackup` → JSON download | Profile → Backup | ✅ works — but omits media blobs, so `idb://` references dangle on another device |
| Backup restore | `storageService.importBackup` → `importEntries` → `saveAllEntries` | Profile → Restore | ❌ **wipes entries** |
| CSV export | `searchService.exportSearchResultsToCSV` | Archive → Export CSV | ❌ exports empty text |
| Persist against eviction | `navigator.storage.persist()` | — | ❌ never called (phase 3) |

Three of the ten paths are broken, and two of the three lose or hide data. That's the honest state of "recover" today.

---

## 2. Test inventory

### 2.1 Layer A — unit, in Node (vitest + fake-indexeddb)

Runs in under two seconds, no browser, no dev server. Each test gets a fresh module graph (`vi.resetModules()`) and a fresh `IDBFactory`, because the services cache their DB handle and crypto key at module scope.

| Suite | Tests | Protects | Hours |
| --- | --- | --- | --- |
| `entryStorage.test.ts` | round-trip; record is encrypted; reload persistence; delete from both stores; `saveAllEntries` replaces; **migration from localStorage** (fails today); **import/restore** (fails today); legacy unencrypted record still loads; corrupt record is skipped not fatal; IDB unavailable → localStorage path; crypto unavailable → plaintext record; newest-first ordering; **no plaintext copy in localStorage** (`it.fails`, design decision) | the whole save/recover contract, and the two bugs | 2.5 |
| `crypto.test.ts` | key created once and reloaded from keystore; encrypt/decrypt round trip; fresh IV per call; tampered ciphertext throws; wrong key throws; `isCryptoAvailable` | the at-rest guarantee | 1.0 |
| `storage.test.ts` | profile load merges defaults; `patchProfile`; stats; `importBackup` round trip via `File`; malformed JSON → `false`; backup carries `version: 1`; **`exportBackup` after a 20-minute refactor** that splits the pure `buildBackup()` from the DOM `download()` — untestable as written | backup format, profile persistence | 2.0 |
| `search.test.ts` | matches `notes` and `answers`; type/date/severity/model filters; suggestions; **CSV export contains the entry text** (fails today) | Archive search + export | 1.5 |
| `media.test.ts` | save/read/delete; `getStorageStats`; `migrateBase64ToFile`; `clearAllMediaFiles` | attachments | 1.0 |
| `packs.test.ts` | default state; stale stored key tolerated (1A.5 assertion); trial expiry; enable/disable/toggle; v1→v2 migration | the pack system nobody must touch | 1.0 |
| `tutorial.test.ts` | `normaliseProgress` heals unknown ids (1A.1); `completeStep` sequence and XP | the learning-track seed | 0.5 |
| `offlineProvider.test.ts` | daily prompt, stage coaching and analysis return non-empty strings for every model; never touches `fetch` | the offline AI contract | 0.5 |
| | **Layer A total** | | **10.0** |

### 2.2 Layer B — the two data-loss fixes, test-first

The failing tests from 2.1 already exist (§5). Fix `migrateFromLocalStorage` and `saveAllEntries` by encrypting before the transaction opens; re-run; both go green. Include a regression note in the commit. **1.0 h.**

### 2.3 Layer C — end-to-end, in a real browser (Playwright test runner)

`tests/smoke-runtime.mjs` becomes proper specs under `tests/e2e/`, with `playwright.config.ts` starting the dev server itself (`webServer`), so `npx playwright test` is one command. Runs in about a minute.

| Spec | Covers | Hours |
| --- | --- | --- |
| `first-run.spec.ts` | onboarding → dashboard; profile written; **returning user lands on dashboard, Skip preserves profile** (B1 — expected-fail until 1B.2) | 0.5 |
| `capture.spec.ts` | Quick Capture with text; save; entry in IndexedDB encrypted; survives reload; appears in Archive | 0.5 |
| `reflect.spec.ts` | SIMPLE mode three stages → save → Archive; switch to an advanced model → save; stored `answers` shape | 1.0 |
| `backup.spec.ts` | export backup (intercept the download); wipe storage; restore; entries return with text intact — **would have caught the restore bug at the UI** | 1.0 |
| `archive.spec.ts` | search finds text; type filter; CSV export has text (expected-fail until the CSV fix) | 0.5 |
| `packs.spec.ts` | enable a pack → tile appears; disable → gone; stale key inert | 0.5 |
| | **Layer C total** | | **4.0** |

### 2.4 Layer D — CI

`.github/workflows/test.yml`: on push and PR, `npm ci` → `npm run build` → `npm test` → `npx playwright test` (Chromium only). Cloudflare Pages builds on its own from the branch, so CI can't *block* a deploy without switching to CI-driven deploys — but a red badge on the PR is the point. **1.0 h.**

### 2.5 Setup and housekeeping

`npm install -D vitest fake-indexeddb`, `vitest.config.ts`, `tests/unit/setup.ts`, `"test"` and `"test:e2e"` scripts, `.gitignore` for `playwright-report/` and `test-results/`, a paragraph in `CLAUDE.md`. **0.5 h** (the spike already did most of it).

### 2.6 Total

| | Hours |
| --- | --- |
| A — unit | 10.0 |
| B — data-loss fixes | 1.0 |
| C — e2e | 4.0 |
| D — CI | 1.0 |
| Setup | 0.5 |
| **Sum** | **16.5** |
| **With the usual 30 % margin** | **17–22 h** |

---

## 3. Explicitly out of phase 0

| Item | Why | When |
| --- | --- | --- |
| React component tests (Testing Library + jsdom) for `ReflectionFlow`, `SimplifiedOnboarding`, `Archive` | 1B and phase 3 will rewrite all three; the e2e specs cover their behaviour at the level that matters. Add RTL when a component stabilises | phase 3 |
| Holodeck / CanvasBoard | canvas and pointer-driven; needs visual or snapshot testing; nothing in phase 0–2 touches them | phase 3 |
| Gemini provider | network; covered by "offline provider never fetches" plus a manual check. The real fix is the runtime gate in §6.1 of the phase 1 doc | phase 3 |
| The 245 lint problems | not tests. But the test files should lint clean, and `no-explicit-any` will fire on test helpers — either scope the lint config to exclude `tests/` for now or spend 2–3 h on the backlog first | your call |
| `navigator.storage.persist()` | one line plus a UI decision about when to ask | phase 3 |
| Backup including media blobs | a format change (`version: 2`) | phase 3, with the persistent-storage work |

---

## 4. Two decisions phase 0 surfaces but does not make

### 4.1 Order of operations

Do the two data-loss fixes (§2.2) first — before the rest of the unit suite, before e2e — and ship them. They are a real risk to anyone restoring a backup today, they are thirty minutes, and the tests that prove them are already written.

### 4.2 The plaintext dual-write

Today every entry is stored twice: encrypted in IndexedDB, plaintext in `localStorage`. The plaintext copy exists so that `loadEntries()` can fall back when IndexedDB throws. Options:

| Option | What changes | Cost | Trade |
| --- | --- | --- | --- |
| **A. Drop the dual-write; localStorage is used only when IndexedDB is unavailable at init** | `saveEntry`, `deleteEntry`, `saveAllEntries` stop writing LS when IDB works; on upgrade, delete the existing plaintext copy once | 2–3 h incl. tests | Loses the "IDB threw mid-session" fallback. IDB failures mid-session are rare; eviction (the real risk) takes both stores anyway |
| B. Encrypt the localStorage copy too | key lives in IDB, so if IDB is gone the key is gone — the fallback becomes undecryptable | 2 h | Fallback becomes pointless; strictly worse than A |
| C. Keep it, say so | update copy: "stored on this device" not "encrypted" | 0.5 h | Honest, but the encryption then serves nothing |

My view: A, in phase 3's persistent-storage work, alongside `navigator.storage.persist()`. Phase 0 pins today's behaviour with an `it.fails` test so the decision can't be forgotten.

**Decided: A, done in phase 3A.2 (22 Sep 2026).** The plaintext copy is read once by the migration and removed; a copy left by an already-migrated build is removed on the next launch; only a browser with no IndexedDB at all uses plaintext `localStorage`, and Profile says so. The `it.fails` test is now a passing assertion that nothing in `localStorage` contains the entry text.

---

## 5. What already exists (uncommitted, in the clone)

| File | Lines | Status |
| --- | --- | --- |
| `vitest.config.ts` | 12 | node environment, `tests/unit/**`, setup file |
| `tests/unit/setup.ts` | 15 | `fake-indexeddb/auto` + `MemoryStorage` shim |
| `tests/unit/entryStorage.spike.test.ts` | 60 | 6 tests: round-trip, encrypted record, reload, migration (**red**), delete, plaintext-copy (`it.fails`) |
| `tests/unit/idb-tx.spike.test.ts` | 25 | the two reproductions with console output; becomes the regression pair |
| `tests/unit/media.spike.test.ts` | 15 | blob save/read/stats |

Landing them is phase 0 step 1 and changes `package.json` and `package-lock.json` (two devDependencies). You'd run `npm install` on Windows once afterwards. Nothing else in the plan touches your environment.

---

## 6. Success criteria

- [ ] `npm test` runs Layer A in under five seconds and is green, except tests explicitly marked `it.fails` with a comment naming the decision they wait on
- [ ] Backup restore round-trips entries with text intact (unit and e2e); migration from a localStorage-only build shows the entries on first launch
- [ ] `npx playwright test` is one command, needs no running dev server, and is green except the B1 first-run assertions
- [ ] CI runs both on every push to the branch
- [ ] `CLAUDE.md` "Current state" no longer says "No test suite"
- [ ] The plaintext dual-write decision (§4.2) is recorded in `CLAUDE.md`, whichever way it goes

---

## 7. Reproducing the two bugs yourself

In the clone the reproductions run with `npx vitest run tests/unit/idb-tx.spike.test.ts`. In a browser, without any test code: open the app, save one Quick Capture, go to Profile → Backup & Restore → Backup, then Restore the file you just saved. The dashboard count drops to zero. DevTools → Application → IndexedDB → `reflexia-entries` → `entries` is empty; Local Storage → `reflexia.entries.v1` still holds the entry.
