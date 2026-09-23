/**
 * Packs: optional features a person can switch on (phase 3B.3).
 *
 * A pack is a plain on/off switch. There used to be a fourth pack,
 * `scenario`, gating the Holodeck; the spaces are the differentiator and
 * are core now. There also used to be 7-day trials with expiry dates; they
 * were commercial plumbing for packs nobody pays for (CLAUDE.md, decision 6)
 * and are gone. Stored state from those builds still loads: see
 * normaliseStoredState() in packService.ts.
 */

export type PackId =
  | 'core'                    // Always on: Capture, Reflect, Spaces, Archive, backup, settings
  | 'wellbeing'               // BioRhythm breathing + Grounding
  | 'aiReflectionCoach'       // The Oracle
  | 'reports';                // Reports

export interface PackDefinition {
  id: PackId;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'wellbeing' | 'productivity' | 'advanced';
  isCore: boolean;            // If true, cannot be disabled
  features: string[];         // What switching it on adds
}

export interface PackInfo {
  enabled: boolean;
}

/** PackId -> on/off. Only known pack ids are kept. */
export type PackState = Partial<Record<PackId, PackInfo>>;
