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
