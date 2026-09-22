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

  /**
   * Framework id (src/frameworks/). A plain string, not a union: entries on
   * devices may carry ids the core no longer ships (SBAR, SOAP, CUSTOM_1..3
   * from earlier builds) and getFramework() resolves those to a legacy
   * framework so they still open.
   */
  modelId?: string;
  /** Same as modelId; the field most code and all saved entries use. */
  model?: string;

  answers?: Record<string, string>;

  // Used by ReflectionFlow
  summary?: string;
  insights?: string[];
  // Some screens expect a single text field for the AI output.
  aiInsight?: string;
  // Optional quick rating captured alongside a reflection.
  mood?: number; // 1-5
  actionSteps?: string[];

  // ---- Owned by the professional module (src/modules/professional/) ----
  // Kept here because entries already saved on users' devices carry these
  // fields. The core does not read them. Remove only with a data migration.
  cpd?: {
    timeSpentMinutes?: number;
    minutes?: number;
    type?: string;
    standardsMatched?: string[];
  };
  nmcCodeThemes?: string[];
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
  | "GAMIFICATION"
  | "MENTAL_ATLAS"
  | "CALENDAR"
  | "NEURAL_LINK"
  | "BIO_RHYTHM"
  | "CANVAS_BOARD"
  | "CANVAS"
  | "REPORTS"
  | "PRIVACY_LOCK"
  | "PACK_BROWSER"
  | "PERMISSIONS_HELP";

export interface UserProfile {
  name: string;
  // Stored on users' devices from before phase 1B (values like 'NURSING',
  // 'ENGINEERING', 'NONE'). The core no longer asks for it or reads it;
  // ProfessionConfig lives in src/modules/professional/. Kept so saved
  // profiles keep type-checking.
  profession: string;

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

  // UI preferences
  showDisclaimers?: boolean;
  autoOpenKeyboard?: boolean;
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
  cpdMinutesTotal?: number; // professional module; kept for stored stats
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
