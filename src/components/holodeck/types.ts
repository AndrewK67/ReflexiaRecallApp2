import type { LucideIcon } from 'lucide-react';

export type SpaceId =
  | 'difficult-conversation'
  | 'decision-space'
  | 'emotional-processing'
  | 'role-reversal'
  | 'performance-rehearsal'
  | 'crisis-rewind'
  | 'values-clarification'
  | 'identity-space'
  | 'compassion-space'
  | 'creative-ideation'
  | 'guided-stillness'
  | 'gratitude-space'
  | 'loss-letting-go'
  | 'fear-exploration'
  | 'conflict-deescalation'
  | 'forgiveness-space'
  | 'purpose-direction'
  | 'boundary-setting'
  | 'inner-dialogue'
  | 're-anchoring';

export interface HolodeckSpaceDefinition {
  id: SpaceId;
  name: string;
  icon: LucideIcon;
  purpose: string;
  userActions: string[];
  guideRole: string;
  rules: string[];
  prompts: string[];
  exitAllowed: boolean;
  canSave: boolean;
  worksOffline: boolean;
  color: string; // Theme color for the space
  isSafetyCritical?: boolean; // For spaces like Crisis Rewind
}

export interface HolodeckEntry {
  id: string;
  spaceId: SpaceId;
  spaceName: string;
  date: string;
  answers: string[];
  prompts: string[];
  completed: boolean;
  createdAt: number;
}
