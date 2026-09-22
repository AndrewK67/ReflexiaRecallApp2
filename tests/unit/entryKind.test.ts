import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { isCapture, isReflection, CAPTURE_TYPE } from '../../src/utils/entryKind';
import type { Entry } from '../../src/types';

/**
 * A capture is stored as type "INCIDENT" (both spellings exist on devices).
 * The literal is stored data and must not change without a migration; the
 * word must not reach a person (phase 3A.3).
 */
describe('entry kinds', () => {
  const e = (type: string): Entry => ({ id: 'x', type, date: '2026-01-01T00:00:00.000Z' } as unknown as Entry);

  it('recognises both stored spellings of each kind', () => {
    expect(isCapture(e('INCIDENT'))).toBe(true);
    expect(isCapture(e('incident'))).toBe(true);
    expect(isCapture(e('REFLECTION'))).toBe(false);
    expect(isReflection(e('REFLECTION'))).toBe(true);
    expect(isReflection(e('reflection'))).toBe(true);
    expect(isReflection(e('INCIDENT'))).toBe(false);
    expect(isCapture(null)).toBe(false);
    expect(isReflection(undefined)).toBe(false);
  });

  it('Quick Capture still writes the stored literal', () => {
    expect(CAPTURE_TYPE).toBe('INCIDENT');
    const src = fs.readFileSync('src/components/QuickCapture.tsx', 'utf8');
    expect(src).toContain('type: CAPTURE_TYPE');
    expect(src).toContain('id: `incident_${Date.now()}`');
  });

  it('no live core component compares entry.type by hand or shows the word "Incident"', () => {
    const live = [
      'src/App.tsx',
      'src/components/Archive.tsx',
      'src/components/CalendarView.tsx',
      'src/components/Reports.tsx',
      'src/components/QuickCapture.tsx',
      'src/components/SimplifiedDashboard.tsx',
      'src/services/searchService.ts',
    ];
    for (const f of live) {
      const src = fs.readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/type === ['"](INCIDENT|incident|REFLECTION|reflection)['"]/);
      // the word may appear in comments explaining the stored literal, never in JSX text or strings shown to people
      expect(src, f).not.toMatch(/>[^<]*Incident[^<]*</);
      expect(src, f).not.toMatch(/['"`]Incident['"`]/);
    }
  });
});
