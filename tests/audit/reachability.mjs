// Which files under src/ are reachable from src/main.tsx through static and
// lazy imports? Run: node tests/audit/reachability.mjs (from the repo root)
// With --check it exits 1 if anything is unreachable that is neither in the
// parked professional module nor in PARKED below (tests/unit/reachability
// runs that, so dead code cannot quietly come back - phase 3D.5).
// Used for the dead-code inventories in docs/PHASE-1-SCOPE.md §4 and
// docs/PHASE-3-SCOPE.md §1.7. Ignores type-only resolution subtleties: a file
// that is imported is counted as reachable even if only for a type.
import fs from 'node:fs';
import path from 'node:path';

const root = 'src';
// Paths are compared with forward slashes on every OS (path.join gives
// backslashes on Windows, which made main.tsx itself look unreachable there).
const posix = (p) => p.split(path.sep).join('/');

// Unreachable on purpose: docs/PHASE-3-SCOPE.md §1.7 and §4.7.
const PARKED = new Set([
  'src/components/DriveMode.tsx', // hands-free voice loop; rebuild on frameworks later
  'src/components/MentalAtlas.tsx', // offline themes and patterns; a later "Patterns" screen
  'src/services/mentalAtlasService.ts',
  'src/utils/buildMentalAtlas.ts',
  'src/components/media/VideoCapture.tsx', // video: decided "neither for now"
  'src/components/MediaAttachmentPanel.tsx', // parked with video
  'src/services/pointsEngine.ts', // decision 4: "the points engine itself stays"; nothing calls it
]);
const all = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(f) && !/\.d\.ts$/.test(f)) all.push(posix(p));
  }
})(root);

function resolve(from, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(from), spec);
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx', '.css']) {
    const c = base + ext;
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return posix(path.relative(process.cwd(), c));
  }
  return null;
}

const seen = new Set();
const queue = ['src/main.tsx'];
const importRe = /(?:from\s*|import\s*\(\s*|^\s*import\s+)["']([^"']+)["']/gm;
while (queue.length) {
  const f = queue.shift();
  if (seen.has(f)) continue;
  seen.add(f);
  if (f.endsWith('.css')) continue;
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = importRe.exec(src))) {
    const r = resolve(f, m[1]);
    if (r && !seen.has(r)) queue.push(r);
  }
}

const unreachable = all.filter((f) => !seen.has(f)).sort();
const kb = (f) => (fs.statSync(f).size / 1024).toFixed(1).padStart(6);
console.log(`src files: ${all.length}  reachable: ${seen.size}  unreachable: ${unreachable.length}`);
console.log(`unreachable KB: ${(unreachable.reduce((s, f) => s + fs.statSync(f).size, 0) / 1024).toFixed(1)}`);
for (const f of unreachable) console.log(kb(f), f);

if (process.argv.includes('--check')) {
  const unexpected = unreachable.filter((f) => !f.startsWith('src/modules/') && !PARKED.has(f));
  const missing = [...PARKED].filter((f) => !fs.existsSync(f));
  if (unexpected.length || missing.length) {
    if (unexpected.length) console.error(`\nUnreachable and not parked (delete it, wire it in, or add it to PARKED with a reason):\n  ${unexpected.join('\n  ')}`);
    if (missing.length) console.error(`\nIn PARKED but gone (take it out of the list):\n  ${missing.join('\n  ')}`);
    process.exit(1);
  }
  console.log('\ncheck: every unreachable file is the parked module or in PARKED');
}
