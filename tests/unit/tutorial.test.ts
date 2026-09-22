import { describe, it, expect, beforeEach } from 'vitest';
import { resetBrowserStorage } from './helpers';

async function loadTutorial() {
  return import('../../src/services/tutorialService');
}
const KEY = 'reflexia_tutorial_progress';

describe('tutorialService', () => {
  beforeEach(() => resetBrowserStorage());

  it('every step targets a view that exists in App.tsx', async () => {
    const t = await loadTutorial();
    const fs = await import('node:fs');
    const app = fs.readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8');
    const rendered = new Set([...app.matchAll(/case "([A-Z_]+)":/g)].map((m) => m[1]));
    for (const step of t.getAllSteps()) {
      if (step.targetView) expect(rendered, `step ${step.id} targets ${step.targetView}`).toContain(step.targetView);
    }
  });

  it('runs from WELCOME to COMPLETED, awarding XP and badges once each', async () => {
    const t = await loadTutorial();
    const steps = t.getAllSteps();
    let progress = t.initializeTutorial();
    expect(progress.currentStep).toBe('WELCOME');
    let xp = 0;
    for (const step of steps) {
      const r = t.completeStep(step.id);
      xp += r.xpEarned;
      progress = r.progress;
      if (step.badge) expect(progress.badgesEarned).toContain(step.badge);
    }
    expect(progress.currentStep).toBe('COMPLETED');
    expect(progress.completedSteps).toHaveLength(steps.length);
    expect(progress.xpEarned).toBe(xp);
    expect(t.getCompletionPercentage(progress)).toBeGreaterThanOrEqual(100);
    // completing a step twice earns nothing more
    expect(t.completeStep('WELCOME').xpEarned).toBe(0);
  });

  it('heals stored progress that points at a step which no longer exists', async () => {
    localStorage.setItem(KEY, JSON.stringify({
      currentStep: 'DRIVE_MODE', // removed in phase 1A
      completedSteps: ['WELCOME', 'FIRST_REFLECTION', 'MENTAL_ATLAS'],
      xpEarned: 150, badgesEarned: [], startedAt: '2026-01-01T00:00:00Z', skipped: false,
    }));
    const t = await loadTutorial();
    const p = t.getTutorialProgress()!;
    expect(p.currentStep).toBe('QUICK_CAPTURE'); // first uncompleted known step
    expect(p.completedSteps).toEqual(['WELCOME', 'FIRST_REFLECTION']);
    expect(t.getCurrentStepConfig(p)).not.toBeNull();
    expect(JSON.parse(localStorage.getItem(KEY)!).currentStep).toBe('QUICK_CAPTURE'); // persisted
  });

  it('skip marks the tutorial complete and shouldShowTutorial reflects it', async () => {
    const t = await loadTutorial();
    expect(t.shouldShowTutorial()).toBe(true);
    t.skipTutorial();
    expect(t.getTutorialProgress()).toMatchObject({ skipped: true, currentStep: 'COMPLETED' });
    expect(t.shouldShowTutorial()).toBe(false);
    t.resetTutorial();
    expect(t.getTutorialProgress()).toBeNull();
  });
});
