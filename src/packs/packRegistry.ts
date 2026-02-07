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
      'Quick Capture (text, audio, photo, video)',
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

  gamification: {
    id: 'gamification',
    name: 'Gamification',
    description: 'XP, levels, achievements, and rewards to build consistent habits',
    icon: '🏆',
    category: 'productivity',
    isCore: false,
    features: [
      'Experience points (XP)',
      'Levels and progression',
      'Achievement badges',
      'Streak tracking',
      'Rewards store'
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

  professional: {
    id: 'professional',
    name: 'Professional Development',
    description: 'CPD tracking and professional documentation. ⚠️ Not an official regulatory resource - verify requirements with your regulatory body.',
    icon: '📋',
    category: 'professional',
    isCore: false,
    features: [
      'CPD time tracking',
      'Professional document export',
      'Revalidation portfolio support',
      'Standards mapping reference',
      '⚠️ Disclaimer: This assists with CPD tracking but does not replace official regulatory requirements. Always verify with NMC, HCPC, GPhC, or your regulatory body.'
    ]
  },

  visualTools: {
    id: 'visualTools',
    name: 'Visual Tools',
    description: 'Mind mapping, timelines, and visual organization',
    icon: '🎨',
    category: 'productivity',
    isCore: false,
    features: [
      'Canvas board (mind mapping)',
      'Mental Atlas (knowledge graph)',
      'Calendar timeline view',
      'Library resources'
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

  driveVoiceNotes: {
    id: 'driveVoiceNotes',
    name: 'Quick Voice Capture',
    description: '⚠️ SAFETY WARNING: Never use while driving or operating machinery',
    icon: '🎙️',
    category: 'advanced',
    isCore: false,
    features: [
      'Voice-first interface',
      'Large touch targets for easy access',
      'Auto-save functionality',
      '⚠️ Do NOT use while driving',
      '⚠️ Do NOT use while operating equipment',
      'Safe for use when stationary only'
    ]
  }
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
