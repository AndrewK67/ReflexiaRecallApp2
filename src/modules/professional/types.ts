/**
 * Types owned by the professional module.
 *
 * The dependency arrow points one way: this module imports from the core,
 * the core never imports from here. The stored-data fields the module writes
 * onto entries (cpd, nmcCodeThemes) are declared on ReflectionEntry in
 * src/types.ts so that saved entries keep type-checking; CPDLog is derived
 * from that declaration rather than duplicated.
 */

import type { ReflectionEntry, CaptureEntry } from '../../types';

export type CPDLog = NonNullable<ReflectionEntry['cpd']>;

/** Clinical incident categories. Moved here from the core in phase 3A.3. */
export type IncidentCategory =
  | "Clinical Error"
  | "Patient Safety"
  | "Medication Error"
  | "Communication Breakdown"
  | "Equipment Failure"
  | "Near Miss"
  | "Adverse Event"
  | "Procedural Complication"
  | "Workplace Safety"
  | "Other";

/**
 * A capture with the clinical fields the module's IncidentCapture writes.
 * Same stored `type: "INCIDENT"` as a core capture; the extra fields are
 * simply absent on entries the core wrote.
 */
export interface ProfessionalIncidentEntry extends CaptureEntry {
  category?: IncidentCategory;
  severity?: "LOW" | "MEDIUM" | "HIGH";
  location?: string;
  peopleInvolved?: string[];
  outcome?: string;
  immediateActions?: string[];
  contributingFactors?: string[];
}

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
