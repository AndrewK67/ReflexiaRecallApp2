import { describe, it, expect } from 'vitest';
import {
  ALL,
  BUILT_IN,
  CATALOGUE,
  DEFAULT_FRAMEWORK,
  DEFAULT_COACHING,
  THREE_PART,
  OPEN_ENTRY,
  GIBBS,
  getFramework,
  isKnownFramework,
  frameworkName,
  stageLabel,
  stageCoaching,
} from '../../src/frameworks';
import { PROFESSIONAL_FRAMEWORKS } from '../../src/modules/professional/data/frameworks';

/**
 * Ids are stored data. `entry.model` on users' devices is one of these
 * framework ids and `entry.answers` is keyed by these stage ids. If one of
 * the tests below fails because an id changed, that change needs a data
 * migration, not a test edit.
 */
const STORED_FRAMEWORK_IDS = ['SIMPLE', 'FREE', 'GIBBS', 'ROLFE', 'ERA', 'STAR', 'MORNING', 'EVENING'];
const STORED_STAGE_IDS: Record<string, string[]> = {
  SIMPLE: ['what_happened', 'what_mattered', 'what_forward'],
  FREE: ['FREE_Writing'],
  GIBBS: ['Description', 'Feelings', 'Evaluation', 'Analysis', 'Conclusion', 'ActionPlan'],
  ROLFE: ['ROLFE_What', 'ROLFE_SoWhat', 'ROLFE_NowWhat'],
  ERA: ['ERA_Experience', 'ERA_Reflection', 'ERA_Action'],
  STAR: ['STAR_Situation', 'STAR_Task', 'STAR_Action', 'STAR_Result'],
  MORNING: ['MORNING_Energy', 'MORNING_Focus', 'MORNING_Intention'],
  EVENING: ['EVENING_Wins', 'EVENING_Growth', 'EVENING_Unwind'],
};

describe('framework registry', () => {
  it('ships exactly the stored framework ids, built-ins first', () => {
    expect(ALL.map((f) => f.id)).toEqual(STORED_FRAMEWORK_IDS);
    expect(ALL[0]).toBe(THREE_PART);
    expect(ALL[1]).toBe(OPEN_ENTRY);
    expect(CATALOGUE).not.toContain(THREE_PART);
    expect(CATALOGUE).not.toContain(OPEN_ENTRY);
  });

  it('keeps every stored stage id, in order', () => {
    for (const f of ALL) {
      expect(f.stages.map((s) => s.id), f.id).toEqual(STORED_STAGE_IDS[f.id]);
    }
  });

  it('Three-Part is the default and Gibbs is one catalogue entry among several', () => {
    expect(DEFAULT_FRAMEWORK).toBe(THREE_PART);
    expect(THREE_PART.kind).toBe('built-in');
    expect(OPEN_ENTRY.kind).toBe('built-in');
    expect(BUILT_IN.threePart).toBe(THREE_PART);
    expect(GIBBS.kind).toBe('framework');
    expect(CATALOGUE.length).toBeGreaterThanOrEqual(5);
    expect(CATALOGUE.filter((f) => f.kind === 'framework')).toHaveLength(CATALOGUE.length);
  });

  it('every framework has a name, a tagline and unique stage ids; every stage has its own question and coaching', () => {
    const seen = new Set<string>();
    for (const f of ALL) {
      expect(f.name.trim().length, f.id).toBeGreaterThan(2);
      expect(f.tagline.trim().length, f.id).toBeGreaterThan(10);
      expect(f.stages.length, f.id).toBeGreaterThan(0);
      const ids = f.stages.map((s) => s.id);
      expect(new Set(ids).size, f.id).toBe(ids.length);
      for (const s of f.stages) {
        expect(seen.has(s.id), `${f.id}.${s.id} reused across frameworks`).toBe(false);
        seen.add(s.id);
        expect(s.label.trim().length, `${f.id}.${s.id}`).toBeGreaterThan(2);
        expect(s.question.trim().length, `${f.id}.${s.id}`).toBeGreaterThan(5);
        expect(s.coaching.trim().length, `${f.id}.${s.id}`).toBeGreaterThan(20);
        expect(s.coaching, `${f.id}.${s.id} uses the generic fallback`).not.toBe(DEFAULT_COACHING);
      }
    }
  });

  it('catalogue entries are honest about where they come from', () => {
    for (const f of [GIBBS]) expect(f.origin, f.id).toMatch(/\d{4}/);
  });

  it('SBAR and SOAP are not in the core but still resolve to a name', () => {
    expect(ALL.map((f) => f.id)).not.toContain('SBAR');
    expect(ALL.map((f) => f.id)).not.toContain('SOAP');
    expect(PROFESSIONAL_FRAMEWORKS.map((f) => f.id).sort()).toEqual(['SBAR', 'SOAP']);
    expect(isKnownFramework('SBAR')).toBe(false);
    expect(frameworkName('SBAR')).toBe('SBAR');
    expect(frameworkName('CUSTOM_2')).toBe('Custom framework');
  });
});

describe('lookups', () => {
  it('isKnownFramework', () => {
    expect(isKnownFramework('SIMPLE')).toBe(true);
    expect(isKnownFramework('GIBBS')).toBe(true);
    expect(isKnownFramework('simple')).toBe(false);
    expect(isKnownFramework('')).toBe(false);
    expect(isKnownFramework(undefined)).toBe(false);
    expect(isKnownFramework(null)).toBe(false);
  });

  it('getFramework returns the registered object for known ids', () => {
    expect(getFramework('GIBBS')).toBe(GIBBS);
    expect(getFramework('SIMPLE')).toBe(THREE_PART);
  });

  it('getFramework builds a legacy framework from the answer keys for unknown ids', () => {
    const legacy = getFramework('SBAR', ['SBAR_Situation', 'SBAR_Background', 'SBAR_Assessment', 'SBAR_Recommendation']);
    expect(legacy.kind).toBe('legacy');
    expect(legacy.id).toBe('SBAR');
    expect(legacy.name).toBe('SBAR');
    expect(legacy.stages.map((s) => s.id)).toEqual(['SBAR_Situation', 'SBAR_Background', 'SBAR_Assessment', 'SBAR_Recommendation']);
    expect(legacy.stages.map((s) => s.label)).toEqual(['Situation', 'Background', 'Assessment', 'Recommendation']);
  });

  it('getFramework never throws on garbage', () => {
    expect(getFramework(undefined).name).toBe('Reflection');
    expect(getFramework(null).stages).toEqual([]);
    expect(getFramework('').name).toBe('Reflection');
    expect(getFramework('WHATEVER').name).toBe('WHATEVER');
  });

  it('frameworkName is the display name, never the id, for known ids', () => {
    expect(frameworkName('SIMPLE')).toBe('Three-Part');
    expect(frameworkName('FREE')).toBe('Open Entry');
    expect(frameworkName('GIBBS')).toMatch(/Gibbs/);
    expect(frameworkName(undefined)).toBe('Reflection');
  });

  it('stageLabel resolves known stages and humanises the rest', () => {
    expect(stageLabel('SIMPLE', 'what_happened')).toBe('What happened?');
    expect(stageLabel('GIBBS', 'ActionPlan')).toMatch(/Action Plan/i);
    expect(stageLabel('SBAR', 'SBAR_Recommendation')).toBe('Recommendation');
    expect(stageLabel('SIMPLE', 'not_a_stage')).toBe('Not a stage');
    expect(stageLabel(undefined, 'ActionPlan')).toBe('Action Plan');
  });

  it('stageCoaching returns the stage text or a usable default', () => {
    expect(stageCoaching('SIMPLE', 'what_happened')).toBe(THREE_PART.stages[0].coaching);
    expect(stageCoaching('GIBBS', 'Feelings')).toBe(GIBBS.stages[1].coaching);
    expect(stageCoaching('SBAR', 'SBAR_Situation')).toBe(DEFAULT_COACHING);
    expect(stageCoaching(undefined, 'anything')).toBe(DEFAULT_COACHING);
    expect(DEFAULT_COACHING.length).toBeGreaterThan(20);
  });
});
