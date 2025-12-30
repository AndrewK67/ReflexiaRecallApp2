// src/services/aiService.ts
// Main AI service - selects provider and exports functions for UI components

import type { AIProvider } from "./aiProvider";
import { OfflineProvider } from "./providers/offlineProvider";
import { GeminiProvider } from "./providers/geminiProvider";

// Configuration
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
const MODEL = ((import.meta as any).env?.VITE_GEMINI_MODEL as string | undefined) ?? "gemini-1.5-flash";

/**
 * Get the appropriate AI provider based on configuration
 * @param forceOffline - Force offline mode even if API key exists
 */
function getProvider(forceOffline: boolean = false): AIProvider {
  // Check if we have a valid API key and user hasn't forced offline
  const hasKey = !forceOffline && typeof API_KEY === "string" && API_KEY.trim().length > 10;

  if (hasKey) {
    return new GeminiProvider(API_KEY, MODEL);
  }

  return new OfflineProvider();
}

// Singleton provider instance (can be swapped if needed)
let provider: AIProvider = getProvider();

/**
 * Set the AI provider explicitly (useful for testing or user preferences)
 */
export function setAIProvider(newProvider: AIProvider) {
  provider = newProvider;
}

/**
 * Reset to default provider based on environment config
 */
export function resetAIProvider(forceOffline: boolean = false) {
  provider = getProvider(forceOffline);
}

// ---------------- Exported functions for UI ----------------

/**
 * Generate a daily journal prompt
 * UI Components: App.tsx, Dashboard
 */
export async function generateDailyPrompt(dateIso?: string, profession?: string): Promise<string> {
  return provider.generateDailyPrompt(dateIso, profession);
}

/**
 * Get coaching tips for a reflection stage
 * UI Components: ReflectionFlow.tsx
 */
export async function getStageCoaching(
  stageId: string,
  currentText: string,
  profession?: string
): Promise<string> {
  return provider.getStageCoaching(stageId, currentText, profession);
}

/**
 * Analyze a completed reflection
 * UI Components: ReflectionFlow.tsx
 * 
 * Compatibility note: Accepts arguments in either order (profession, modelId) or (modelId, profession)
 */
export async function analyzeReflection(
  answers: Record<string, string>,
  arg2?: string,
  arg3?: string
): Promise<string> {
  // Detect which is model vs profession
  const maybe2 = (arg2 ?? "").toUpperCase();
  const maybe3 = (arg3 ?? "").toUpperCase();

  const looksLikeModel = (v: string) =>
    ["GIBBS", "SBAR", "ERA", "ROLFE", "STAR", "SOAP", "MORNING", "EVENING", "FREE", "CUSTOM_1", "CUSTOM_2", "CUSTOM_3"].includes(v);

  const modelId = looksLikeModel(maybe2) ? maybe2 : looksLikeModel(maybe3) ? maybe3 : undefined;
  const profession = looksLikeModel(maybe2) ? arg3 : arg2;

  return provider.analyzeReflection(answers, profession, modelId);
}

/**
 * Ask the Oracle a question
 * UI Components: Oracle.tsx
 * 
 * Compatibility note: Accepts either:
 * - askOracle(question, context?)
 * - askOracle({ question, entriesJson?, profession? })
 */
export async function askOracle(
  input: string | { question: string; entriesJson?: string; profession?: string },
  context?: string
): Promise<string> {
  const question = typeof input === "string" ? input : input.question;
  const profession = typeof input === "string" ? undefined : input.profession;
  const entriesJson = typeof input === "string" ? context : input.entriesJson;

  return provider.askOracle(question, entriesJson, profession);
}
