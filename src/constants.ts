import type { Achievement } from "./types";

// ---------- App Version ----------
export const APP_VERSION = '1.0.0'; // Keep in sync with package.json
export const APP_BUILD_DATE = __BUILD_DATE__; // Injected at build time

// ---------- AI coaching ----------

/**
 * The system-prompt prefix every AI coaching call uses. It used to vary by
 * profession (PROFESSION_CONFIG, now in src/modules/professional/); the core
 * has one voice for everyone.
 */
export const DEFAULT_COACH_PREFIX =
  "You are a reflective coach. Keep answers practical, kind, and concise.";

// Reflection frameworks live in src/frameworks/ (phase 2).

// ---------- Achievements (minimal, to unblock gamificationService) ----------

export const ACHIEVEMENTS: Achievement[] = [
  { id: "FIRST_ENTRY", title: "First Entry", description: "You made your first entry." },
  { id: "THREE_DAY_STREAK", title: "3-Day Streak", description: "You showed up three days in a row." },
  { id: "TEN_ENTRIES", title: "10 Entries", description: "You've written ten entries." },
  { id: "CPD_1H", title: "1 Hour CPD", description: "You logged 60 minutes of CPD reflection." },
];
