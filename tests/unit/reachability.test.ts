import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';

// Phase 3D.5: dead code cannot quietly come back. Anything under src/ that
// main.tsx cannot reach must be the parked professional module or be named,
// with a reason, in PARKED in tests/audit/reachability.mjs.
describe('reachability', () => {
  it('every unreachable file is parked on purpose', () => {
    const run = spawnSync(process.execPath, ['tests/audit/reachability.mjs', '--check'], { encoding: 'utf8' });
    expect(run.stderr).toBe('');
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/check: every unreachable file is the parked module or in PARKED/);
  });
});
