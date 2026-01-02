/**
 * Pack System - Feature gating for Reflexia
 * Allows users to opt-in to advanced features beyond core capture/reflect/retrieve
 */

export type PackId =
  | 'core'                    // Always enabled (Capture, Reflect, Archive, Export, Settings)
  | 'wellbeing'               // BioRhythm + Grounding exercises
  | 'aiReflectionCoach'       // Oracle AI assistant
  | 'gamification'            // XP, levels, achievements, rewards
  | 'scenario'                // Holodeck scenario practice
  | 'professional'            // CPD tracking, professional docs, revalidation
  | 'visualTools'             // Canvas, Mental Atlas, Calendar view
  | 'reports'                 // Analytics and Reports
  | 'driveVoiceNotes';        // Voice Notes (Parked/Passenger mode)

export interface PackDefinition {
  id: PackId;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'wellbeing' | 'productivity' | 'professional' | 'advanced';
  isCore: boolean;            // If true, cannot be disabled
  features: string[];         // List of features included
}

export type TrialDuration = 1 | 3 | 7 | 'forever';

export interface PackTrialInfo {
  enabled: boolean;
  isPermanent: boolean;       // True if enabled forever, false if on trial
  trialStartDate?: string;    // ISO date when trial started
  trialEndDate?: string;      // ISO date when trial expires
  trialDuration?: TrialDuration; // Duration chosen (1, 3, 7 days or 'forever')
}

export interface PackState {
  [key: string]: PackTrialInfo; // PackId -> trial info
}
