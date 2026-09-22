/**
 * Pack Registry - Defines all available packs and their features
 */

import type { PackDefinition, PackId } from './packTypes';

export const PACK_REGISTRY: Record<PackId, PackDefinition> = {
  core: {
    id: 'core',
    name: 'Core Features',
    description: 'Essential capture, reflection, and retrieval tools',
    icon: '⚡',
    category: 'core',
    isCore: true,
    features: [
      'Quick Capture (text, audio, photo)',
      'Reflection prompts',
      'Archive & Search',
      'Export (PDF/ZIP)',
      'Settings & Privacy Screen'
    ]
  },

  wellbeing: {
    id: 'wellbeing',
    name: 'Wellbeing Tools',
    description: 'Breathing exercises, grounding techniques, and stress management',
    icon: '🫁',
    category: 'wellbeing',
    isCore: false,
    features: [
      'BioRhythm breathing exercises',
      'Grounding techniques (5-4-3-2-1)',
      'Stress management tools'
    ]
  },

  aiReflectionCoach: {
    id: 'aiReflectionCoach',
    name: 'AI Reflection Coach',
    description: 'AI-powered reflection guidance and insights (Oracle)',
    icon: '🤖',
    category: 'productivity',
    isCore: false,
    features: [
      'Oracle AI chat assistant',
      'AI-generated reflection prompts',
      'Contextual guidance'
    ]
  },

  scenario: {
    id: 'scenario',
    name: 'Scenario Practice',
    description: 'Interactive scenario-based learning (Holodeck)',
    icon: '🎭',
    category: 'advanced',
    isCore: false,
    features: [
      'Holodeck scenarios',
      'Decision-tree practice',
      'Skill development'
    ]
  },

  reports: {
    id: 'reports',
    name: 'Analytics & Reports',
    description: 'Data visualization, trends, and insights',
    icon: '📊',
    category: 'advanced',
    isCore: false,
    features: [
      'Reflection analytics',
      'Mood trends',
      'Activity reports',
      'Data visualization'
    ]
  },
};

// Helper to get pack definition
export function getPack(id: PackId): PackDefinition | undefined {
  return PACK_REGISTRY[id];
}

// Helper to get all packs
export function getAllPacks(): PackDefinition[] {
  return Object.values(PACK_REGISTRY);
}

// Helper to get non-core packs (user can enable/disable)
export function getOptionalPacks(): PackDefinition[] {
  return getAllPacks().filter(pack => !pack.isCore);
}

// Helper to get packs by category
export function getPacksByCategory(category: PackDefinition['category']): PackDefinition[] {
  return getAllPacks().filter(pack => pack.category === category);
}
