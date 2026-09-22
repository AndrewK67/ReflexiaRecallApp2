/**
 * Types owned by the professional module.
 *
 * The dependency arrow points one way: this module imports from the core,
 * the core never imports from here. The stored-data fields the module writes
 * onto entries (cpd, nmcCodeThemes) are declared on ReflectionEntry in
 * src/types.ts so that saved entries keep type-checking; CPDLog is derived
 * from that declaration rather than duplicated.
 */

import type { ReflectionEntry } from '../../types';

export type CPDLog = NonNullable<ReflectionEntry['cpd']>;

export interface ProfessionConfig {
  label: string;
  description?: string;
  reflectionPromptPrefix: string;
  badgeColor?: string;
  /** Framework ids, including the module's own (SBAR, SOAP). */
  modelsAllowed?: string[];
  standards?: Array<{ id: string; label: string; category?: string }>;
}

export type ProfessionType = string;

export type CrisisCategory =
  | "Immediate Safety"
  | "Mental Health"
  | "Clinical"
  | "Security"
  | "Fire / HazMat"
  | "Cyber / Data"
  | "Operational"
  | "Communication"
  | "Other";

export interface CrisisProtocol {
  id: string;
  title: string;
  category?: CrisisCategory;
  summary?: string;
  whenToUse?: string;
  notes?: string | string[];
  steps: string[];
  tags?: string[];
}

// Some components use an older name.
export type IncidentProtocol = CrisisProtocol;
