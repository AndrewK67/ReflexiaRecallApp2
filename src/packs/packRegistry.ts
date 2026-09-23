/**
 * Pack Registry - the packs and what each one adds. Every line here is
 * shown to people in the pack browser; keep it true of the build.
 */

import type { PackDefinition, PackId } from './packTypes';

export const PACK_REGISTRY: Record<PackId, PackDefinition> = {
  core: {
    id: 'core',
    name: 'Core',
    description: 'Capture, reflect, spaces, archive and backup. Always on.',
    icon: '⚡',
    category: 'core',
    isCore: true,
    features: [
      'Quick Capture (text, photo, voice)',
      'Reflect: three questions, Just write, or a framework',
      'Spaces for specific situations',
      'Archive and search',
      'Backup and restore',
    ],
  },

  wellbeing: {
    id: 'wellbeing',
    name: 'Wellbeing Tools',
    description: 'Breathing and grounding exercises, for when you need to settle before you write.',
    icon: '🫁',
    category: 'wellbeing',
    isCore: false,
    features: [
      'BioRhythm: paced breathing',
      'Grounding: the 5-4-3-2-1 exercise',
    ],
  },

  aiReflectionCoach: {
    id: 'aiReflectionCoach',
    name: 'AI Reflection Coach',
    description:
      'The Oracle: ask questions about what you have written. It uses AI only if you add your own key and turn AI on in Profile; otherwise it answers from built-in prompts.',
    icon: '🤖',
    category: 'productivity',
    isCore: false,
    features: [
      'The Oracle',
    ],
  },

  reports: {
    id: 'reports',
    name: 'Analytics & Reports',
    description: 'Mood over time, how often you write, which frameworks you use, and a text or CSV export.',
    icon: '📊',
    category: 'advanced',
    isCore: false,
    features: [
      'Mood and activity over time',
      'Frameworks used',
      'Text and CSV export',
    ],
  },
};

export function getPack(id: PackId): PackDefinition | undefined {
  return PACK_REGISTRY[id];
}

export function getAllPacks(): PackDefinition[] {
  return Object.values(PACK_REGISTRY);
}

/** The packs a person can switch on and off. */
export function getOptionalPacks(): PackDefinition[] {
  return getAllPacks().filter((pack) => !pack.isCore);
}

export function getPacksByCategory(category: PackDefinition['category']): PackDefinition[] {
  return getAllPacks().filter((pack) => pack.category === category);
}
