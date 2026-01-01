// Central app types for ReflectApp2 / Reflexia Recall
// Backwards-compatible schema to stop type drift from breaking the build.

// ---------- Core primitive unions ----------

/**
 * Older components use UPPERCASE: "REFLECTION"/"INCIDENT"
 * Newer types used lowercase: "reflection"/"incident"
 * We support both to prevent cascading errors.
 */
export type EntryType = "reflection" | "incident" | "REFLECTION" | "INCIDENT";

export type ThemeMode = "DARK" | "LIGHT";

/**
 * Reflection model IDs used throughout the UI.
 * Must be string unions (usable as Record keys).
 */
export type ReflectionModelId =
  | "GIBBS"
  | "SBAR"
  | "ERA"
  | "ROLFE"
  | "STAR"
  | "SOAP"
  | "MORNING"
  | "EVENING"
  | "FREE"
  | "CUSTOM_1"
  | "CUSTOM_2"
  | "CUSTOM_3";

/**
 * IMPORTANT:
 * Several files treat `ReflectionModel` as an ID string (not an object).
 * So `ReflectionModel` is the ID type.
 */
export type ReflectionModel = ReflectionModelId;

// ---------- Stage IDs ----------

/**
 * StageId is referenced by Guide.tsx / StageIcon.tsx using dot access.
 * Keep it as a const object so StageId.SomeKey exists.
 */
export const StageId = {
  // Generic narrative stages (commonly referenced)
  Description: "Description",
  Feelings: "Feelings",
  Evaluation: "Evaluation",
  Analysis: "Analysis",
  Conclusion: "Conclusion",
  ActionPlan: "ActionPlan",

  // Generic / alternate naming used elsewhere
  Intent: "Intent",
  Options: "Options",
  Thoughts: "Thoughts",
  Learnings: "Learnings",
  Summary: "Summary",

  // ROLFE
  ROLFE_What: "ROLFE_What",
  ROLFE_SoWhat: "ROLFE_SoWhat",
  ROLFE_NowWhat: "ROLFE_NowWhat",

  // STAR
  STAR_Situation: "STAR_Situation",
  STAR_Task: "STAR_Task",
  STAR_Action: "STAR_Action",
  STAR_Result: "STAR_Result",

  // SOAP
  SOAP_Subjective: "SOAP_Subjective",
  SOAP_Objective: "SOAP_Objective",
  SOAP_Assessment: "SOAP_Assessment",
  SOAP_Plan: "SOAP_Plan",

  // SBAR (referenced by Guide/StageIcon even if not used everywhere)
  SBAR_Situation: "SBAR_Situation",
  SBAR_Background: "SBAR_Background",
  SBAR_Assessment: "SBAR_Assessment",
  SBAR_Recommendation: "SBAR_Recommendation",

  // ERA
  ERA_Experience: "ERA_Experience",
  ERA_Reflection: "ERA_Reflection",
  ERA_Action: "ERA_Action",

  // Morning/Evening
  MORNING_Energy: "MORNING_Energy",
  // Some UI components reference a "Gratitude" stage for morning prompts.
  // Keep it here for backward compatibility (even if a given model doesn't use it).
  MORNING_Gratitude: "MORNING_Gratitude",
  MORNING_Focus: "MORNING_Focus",
  MORNING_Intention: "MORNING_Intention",

  EVENING_Wins: "EVENING_Wins",
  EVENING_Growth: "EVENING_Growth",
  EVENING_Unwind: "EVENING_Unwind",

  // Free writing
  FREE_Writing: "FREE_Writing",

  // Custom placeholders referenced in codebase
  CUSTOM_Stage1: "CUSTOM_Stage1",
  CUSTOM_Stage2: "CUSTOM_Stage2",
  CUSTOM_Stage3: "CUSTOM_Stage3",
} as const;

export type StageId = (typeof StageId)[keyof typeof StageId];

// ---------- Domain objects ----------

export interface MediaItem {
  id: string;
  /**
   * Code currently uses "PHOTO" | "AUDIO" | "VIDEO" | "SKETCH" | "DRAWING"
   * Keep broad for compatibility.
   */
  type: "PHOTO" | "AUDIO" | "VIDEO" | "SKETCH" | "DRAWING";
  // Some components store drawings as data URLs.
  // Keep url optional so drawing-only attachments don't break compilation.
  url?: string;
  dataUrl?: string;
  name?: string;

  /**
   * Some components use ISO string, others expect number.
   * Allow both for now.
   */
  createdAt: number | string;

  // older fields seen in components
  timestamp?: string;
}

export interface GuardianBadge {
  label: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | string;
  // Used by QuickCapture and App formatIncident
  riskLevel?: string;
  summary?: string;
  suggestedActions: string[];
}

export interface LearningResource {
  id: string;
  title: string;
  description?: string;
  url?: string;
  tags?: string[];
}

export interface CPDLog {
  // Some components expect timeSpentMinutes; others might track minutes differently.
  timeSpentMinutes?: number;
  minutes?: number;
  type?: "INDIVIDUAL" | "GROUP" | "FORMAL" | "INFORMAL" | string;
  standardsMatched?: string[];
}

export interface BaseEntry {
  id: string;

  // Support both legacy and current values
  type: EntryType;

  /**
   * Some services expect `date` for sorting/streaks.
   * We store ISO date string.
   */
  date: string;

  title?: string;
  content?: string;

  // Used by MentalAtlas
  keywords?: string[];

  // Shared attachments
  attachments?: MediaItem[];

  createdAt?: number;
  updatedAt?: number;
}

export interface ReflectionEntry extends BaseEntry {
  type: "reflection" | "REFLECTION";

  modelId?: ReflectionModelId;

  /**
   * Some code refers to `.model` (legacy). Keep alias.
   */
  model?: ReflectionModelId;

  answers?: Record<string, string>;

  // Used by Library.tsx
  learningPath?: LearningResource[];

  // Used by ReflectionFlow
  summary?: string;
  insights?: string[];
  // Some screens expect a single text field for the AI output.
  aiInsight?: string;
  // Optional quick rating captured alongside a reflection.
  mood?: number; // 1-5
  actionSteps?: string[];
  cpd?: CPDLog;
}

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

export interface IncidentEntry extends BaseEntry {
  type: "incident" | "INCIDENT";
  category?: IncidentCategory;
  severity?: "LOW" | "MEDIUM" | "HIGH";
  location?: string;
  peopleInvolved?: string[];
  // Free-text capture fields used by DriveMode/EntryDetail
  notes?: string;
  // Optional media captured during an incident
  media?: MediaItem[];
  guardianBadge?: GuardianBadge;
  // Enhanced fields for Phase 7
  outcome?: string;
  immediateActions?: string[];
  contributingFactors?: string[];
}

export type Entry = ReflectionEntry | IncidentEntry;

// ---------- Profile / settings ----------

export interface ProfessionConfig {
  label: string;
  description?: string;
  reflectionPromptPrefix: string;
  // Used by competency/gamification features (optional so older configs still work)
  badgeColor?: string;
  modelsAllowed?: ReflectionModelId[];
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

export type ViewState =
  | "ONBOARDING"
  | "DASHBOARD"
  | "REFLECTION"
  | "ARCHIVE"
  | "ORACLE"
  | "HOLODECK"
  // Legacy/short names (kept for compatibility)
  | "QUICK"
  | "DRIVE"
  // Explicit screen names used by App.tsx
  | "QUICK_CAPTURE"
  | "DRIVE_MODE"
  | "GROUNDING"
  | "PROFILE"
  | "LIBRARY"
  | "CPD"
  | "GAMIFICATION"
  | "MENTAL_ATLAS"
  | "CALENDAR"
  | "NEURAL_LINK"
  | "CRISIS_PROTOCOLS"
  | "CRISIS_CHECKLIST"
  | "COMPETENCY_MATRIX"
  | "BIO_RHYTHM"
  | "CANVAS_BOARD"
  | "CANVAS"
  | "REPORTS"
  | "PRIVACY_LOCK";

export interface UserProfile {
  name: string;
  profession: keyof Record<string, ProfessionConfig> | string;

  // toggles used in NeuralLink / storageService
  aiEnabled?: boolean;
  gamificationEnabled?: boolean;

  privacyLockEnabled?: boolean;
  blurHistory?: boolean;

  themeMode?: ThemeMode;

  // onboarding
  isOnboarded?: boolean;

  // storageService default expects this
  guidePersonality?: "ZEN" | "PRO" | "PLAYFUL" | "DIRECT" | string;
}

// ---------- Gamification ----------

export interface Achievement {
  id: string;
  title: string;
  description: string;
  // UI icon mapping
  icon?: string;
  iconName?: string;

  // Gamification conditions (loose so we can evolve without breaking builds)
  conditionType?: "STREAK" | "MODEL" | "TOTAL" | string;
  threshold?: number;
  meta?: string;

  // When earned
  unlockedAt?: string;
}

export interface UserStats {
  totalEntries?: number;
  reflectionStreak?: number;
  cpdMinutesTotal?: number;
  unlockedAchievements?: Achievement[];
  lastActiveDate?: string;

  // Newer gamification fields used by several components
  level?: number;
  currentXP?: number;
  nextLevelXP?: number;
  streak?: number;
  totalReflections?: number;
  achievements?: Achievement[];
}

// ---------- Reflection model config shape (used by constants.ts) ----------

export interface ReflectionModelConfig {
  id: ReflectionModelId;
  title: string;
  description: string;
  stages: Array<{
    id: StageId | string;
    label: string;
    prompt: string;
    placeholder?: string;
  }>;
}
