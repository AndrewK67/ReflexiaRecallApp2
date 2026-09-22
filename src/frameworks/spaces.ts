/**
 * The twenty spaces as frameworks (phase 3A.4).
 *
 * A space is a place you go with a situation — "Difficult Conversation",
 * "Loss & Letting Go" — and, structurally, a fixed list of questions with one
 * answer each: exactly what ReflectionFramework describes. Building them from
 * src/data/holodeckSpaces.ts means a finished space is an ordinary entry:
 * encrypted, in Archive, searchable, in the backup, opening with its
 * questions as labels. Before this, finished spaces went to plaintext
 * localStorage and nothing ever read them back.
 *
 * Ids are stored data from the moment the first space is saved:
 *   entry.model  = SPACE_<SPACE_ID>              e.g. SPACE_DIFFICULT_CONVERSATION
 *   answer keys  = SPACE_<SPACE_ID>_<n>, n from 1 e.g. SPACE_DIFFICULT_CONVERSATION_1
 * tests/unit/frameworks.test.ts pins them.
 */

import type { ReflectionFramework, FrameworkStage } from './types';
import { HOLODECK_SPACES } from '../data/holodeckSpaces';
import type { HolodeckSpaceDefinition } from '../components/holodeck/types';

export const SPACE_ID_PREFIX = 'SPACE_';

/** "difficult-conversation" -> "SPACE_DIFFICULT_CONVERSATION" */
export function spaceFrameworkId(spaceId: string): string {
  return SPACE_ID_PREFIX + spaceId.toUpperCase().replace(/-/g, '_');
}

export function isSpaceFrameworkId(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith(SPACE_ID_PREFIX);
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function sentence(s: string): string {
  const t = s.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** The guide's one line for every step of the space: what it does, and the space's rules. */
function coachingFor(space: HolodeckSpaceDefinition): string {
  const role = `Your guide here ${lowerFirst(sentence(space.guideRole))}`;
  const rules = space.rules.map(sentence).join(' ');
  return rules ? `${role} ${rules}` : role;
}

export function toFramework(space: HolodeckSpaceDefinition): ReflectionFramework {
  const id = spaceFrameworkId(space.id);
  const coaching = coachingFor(space);
  const stages: FrameworkStage[] = space.prompts.map((question, i) => ({
    id: `${id}_${i + 1}`,
    // The question is the label: it is short, and it is what the entry
    // should show as the heading of each answer afterwards.
    label: question,
    question,
    placeholder: 'Take your time…',
    coaching,
  }));
  return {
    id,
    name: space.name,
    tagline: space.purpose,
    kind: 'space',
    stages,
    space: {
      spaceId: space.id,
      color: space.color,
      gentle: space.isSafetyCritical === true,
      guideRole: space.guideRole,
      rules: space.rules,
    },
  };
}

/** All twenty, in the order src/data/holodeckSpaces.ts lists them. */
export const SPACES: ReflectionFramework[] = Object.values(HOLODECK_SPACES).map(toFramework);

export function spaceFramework(spaceId: string): ReflectionFramework | undefined {
  return SPACES.find((f) => f.space?.spaceId === spaceId);
}
