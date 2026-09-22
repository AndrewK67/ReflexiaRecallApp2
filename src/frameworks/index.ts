import type { ReflectionFramework, FrameworkStage } from './types';
import { THREE_PART, OPEN_ENTRY, BUILT_IN } from './builtIn';
import { CATALOGUE } from './catalogue';

export type { ReflectionFramework, FrameworkStage, FrameworkKind } from './types';
export { THREE_PART, OPEN_ENTRY, BUILT_IN } from './builtIn';
export { CATALOGUE, GIBBS, ROLFE, ERA, STAR, MORNING, EVENING } from './catalogue';

/** Every framework the core knows, built-ins first. */
export const ALL: ReflectionFramework[] = [THREE_PART, OPEN_ENTRY, ...CATALOGUE];

const BY_ID: Record<string, ReflectionFramework> = Object.fromEntries(ALL.map((f) => [f.id, f]));

export const DEFAULT_FRAMEWORK = THREE_PART;

/**
 * Names for ids the core no longer ships but entries on devices may carry:
 * SBAR and SOAP moved to the professional module; CUSTOM_1..3 were
 * placeholders. Their answers still open; the stage ids become the labels.
 */
const LEGACY_NAMES: Record<string, string> = {
  SBAR: 'SBAR',
  SOAP: 'SOAP',
  CUSTOM_1: 'Custom framework',
  CUSTOM_2: 'Custom framework',
  CUSTOM_3: 'Custom framework',
};

export function isKnownFramework(id: string | undefined | null): boolean {
  return !!id && id in BY_ID;
}

/**
 * Resolve an id to a framework. Unknown ids get a `legacy` framework built
 * from the answer keys supplied, so any saved entry still renders.
 */
export function getFramework(id: string | undefined | null, answerKeys: string[] = []): ReflectionFramework {
  if (id && BY_ID[id]) return BY_ID[id];
  const name = (id && LEGACY_NAMES[id]) || id || 'Reflection';
  return {
    id: id || 'UNKNOWN',
    name,
    tagline: '',
    kind: 'legacy',
    stages: answerKeys.map((k) => ({ id: k, label: humanise(k), question: '', coaching: '' })),
  };
}

export function frameworkName(id: string | undefined | null): string {
  return getFramework(id).name;
}

export function stageLabel(frameworkId: string | undefined | null, stageId: string): string {
  const stage = getFramework(frameworkId).stages.find((s) => s.id === stageId);
  return stage ? stage.label : humanise(stageId);
}

export function stageCoaching(frameworkId: string | undefined | null, stageId: string): string {
  const stage = getFramework(frameworkId).stages.find((s) => s.id === stageId);
  return stage?.coaching || DEFAULT_COACHING;
}

export const DEFAULT_COACHING = 'One concrete detail makes the difference. What actually happened, and what did it leave you with?';

/** "ROLFE_SoWhat" -> "So What", "what_happened" -> "What happened", "ActionPlan" -> "Action Plan". */
function humanise(id: string): string {
  const withoutPrefix = id.replace(/^[A-Z]+_/, '');
  const spaced = withoutPrefix.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
