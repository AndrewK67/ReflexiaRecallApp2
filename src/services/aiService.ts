// src/services/aiService.ts
// The one gate between the app and any AI provider (phase 3E).
//
// Nothing leaves the device unless BOTH are true at the moment of the call:
//   1. the person turned AI on in Profile (profile.aiEnabled), and
//   2. they pasted their own API key there (aiKeyService, keystore).
// Otherwise every function below answers from the offline provider. UI code
// does not choose a provider and does not check aiEnabled for that purpose;
// it may call isAIActive() for labels such as "Coach (Offline)".
//
// There is deliberately no build-time key (no VITE_ variable for it): one
// would ship in the bundle, and would turn on uploads for every user of that
// build. tests/unit/aiGate.test.ts fails if that path comes back.

import type { AIProvider } from "./aiProvider";
import { OfflineProvider } from "./providers/offlineProvider";
import { GeminiProvider } from "./providers/geminiProvider";
import { isKnownFramework } from "../frameworks";
import { storageService } from "./storageService";
import { loadAIKey, looksLikeAIKey } from "./aiKeyService";
import { offlineDailyPrompt } from "../utils/offlineDailyPrompt";

/** The model the person's key is used with. One place to change it. */
export const GEMINI_MODEL = "gemini-1.5-flash";

/** What is sent when AI is active, in the words the consent screen uses. */
export const AI_DATA_SENT = {
  coach: "the answer you are currently typing, and which question it is for",
  insight: "the whole reflection you have just finished (every answer)",
  oracle: "your question and your most recent 40 entries",
  dailyPrompt: "nothing about you — only a request for a prompt",
} as const;

const offline = new OfflineProvider();

let apiKey: string | null = null;
let gemini: GeminiProvider | null = null;
let keyLoaded = false;

/** Load the person's key from the keystore. Safe to call more than once. */
export async function initAI(): Promise<void> {
  apiKey = await loadAIKey();
  keyLoaded = true;
  gemini = null;
}

/** Called by Profile after saving or clearing the key. */
export function setAIKey(key: string | null): void {
  apiKey = looksLikeAIKey(key) ? key.trim() : null;
  keyLoaded = true;
  gemini = null;
}

export function hasAIKey(): boolean {
  return looksLikeAIKey(apiKey);
}

/** The person's toggle, read from the saved profile at call time so there is one source of truth. */
export function isAIEnabled(): boolean {
  return storageService.loadProfile().aiEnabled === true;
}

/** True only when a call made right now would reach the network. */
export function isAIActive(): boolean {
  return isAIEnabled() && hasAIKey();
}

export function aiStatus(): { enabled: boolean; hasKey: boolean; active: boolean; keyLoaded: boolean } {
  const enabled = isAIEnabled();
  const key = hasAIKey();
  return { enabled, hasKey: key, active: enabled && key, keyLoaded };
}

/** The gate. Every exported call goes through here. */
function live(): AIProvider {
  if (!isAIActive()) return offline;
  if (!gemini) gemini = new GeminiProvider(apiKey!, GEMINI_MODEL);
  return gemini;
}

// ---------------- Exported functions for UI ----------------

/**
 * Daily prompt for the dashboard. Offline it is a random line from a fixed
 * list; with AI on it asks the provider, and sends nothing personal.
 */
export async function generateDailyPrompt(dateIso?: string): Promise<string> {
  if (!isAIActive()) return offlineDailyPrompt();
  try {
    return (await live().generateDailyPrompt(dateIso)) || offlineDailyPrompt();
  } catch {
    return offlineDailyPrompt();
  }
}

/** Coaching tip for a stage of a framework (ReflectionFlow → Coach). */
export async function getStageCoaching(frameworkId: string, stageId: string, currentText: string): Promise<string> {
  return live().getStageCoaching(frameworkId, stageId, currentText);
}

/**
 * Analyse a completed reflection (ReflectionFlow → Unlock Insight).
 * Accepts (answers, modelId) or the older (answers, profession, modelId).
 */
export async function analyzeReflection(
  answers: Record<string, string>,
  arg2?: string,
  arg3?: string
): Promise<string> {
  const maybe2 = (arg2 ?? "").toUpperCase();
  const maybe3 = (arg3 ?? "").toUpperCase();
  const modelId = isKnownFramework(maybe2) ? maybe2 : isKnownFramework(maybe3) ? maybe3 : undefined;
  const profession = isKnownFramework(maybe2) ? arg3 : arg2;
  return live().analyzeReflection(answers, profession, modelId);
}

/**
 * Ask the Oracle a question with recent entries as context.
 * Accepts askOracle(question, entriesJson?) or askOracle({ question, entriesJson?, profession? }).
 */
export async function askOracle(
  input: string | { question: string; entriesJson?: string; profession?: string },
  context?: string
): Promise<string> {
  const question = typeof input === "string" ? input : input.question;
  const profession = typeof input === "string" ? undefined : input.profession;
  const entriesJson = typeof input === "string" ? context : input.entriesJson;
  return live().askOracle(question, entriesJson, profession);
}
