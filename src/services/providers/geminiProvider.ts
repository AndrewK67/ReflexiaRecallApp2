// src/services/providers/geminiProvider.ts
// Gemini AI provider - uses API when available, falls back to offline

import type { AIProvider } from "../aiProvider";
import { OfflineProvider } from "./offlineProvider";
import { DEFAULT_COACH_PREFIX } from "../../constants";
import { getFramework, DEFAULT_FRAMEWORK, isKnownFramework } from "../../frameworks";

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private modelName: string;
  private offlineFallback: OfflineProvider;

  constructor(apiKey: string, modelName: string = "gemini-1.5-flash") {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.offlineFallback = new OfflineProvider();
  }

  private hasValidKey(): boolean {
    return typeof this.apiKey === "string" && this.apiKey.trim().length > 10;
  }

  private async callGemini(prompt: string): Promise<string | null> {
    if (!this.hasValidKey()) return null;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 700,
          },
        }),
      });

      const json = (await res.json()) as any;

      if (!res.ok) {
        console.warn(`Gemini request failed (${res.status}):`, json?.error?.message);
        return null;
      }

      const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("") ?? "";
      return text.trim() || null;
    } catch (error) {
      console.warn("Gemini API error:", error);
      return null;
    }
  }

  // The profession argument is accepted for interface compatibility and
  // ignored: the core has one coaching voice for everyone (phase 1B).
  private safeProfessionPrefix(_profession?: string): string {
    return DEFAULT_COACH_PREFIX;
  }

  private normalizeModelId(modelId?: string): string {
    const m = (modelId ?? DEFAULT_FRAMEWORK.id).toUpperCase().trim();
    return isKnownFramework(m) ? m : DEFAULT_FRAMEWORK.id;
  }

  async generateDailyPrompt(dateIso?: string, profession: string = "NONE"): Promise<string> {
    const date = dateIso ?? new Date().toISOString().slice(0, 10);
    const prefix = this.safeProfessionPrefix(profession);

    const prompt = [
      prefix,
      `Write ONE short daily journal prompt for ${date}.`,
      `Constraints:`,
      `- 1–2 sentences`,
      `- not cheesy`,
      `- practical`,
    ].join("\n");

    const ai = await this.callGemini(prompt);
    if (ai) return ai;

    // Fallback to offline
    return this.offlineFallback.generateDailyPrompt(dateIso, profession);
  }

  async getStageCoaching(frameworkId: string, stageId: string, currentText: string): Promise<string> {
    const prefix = this.safeProfessionPrefix();
    const framework = getFramework(frameworkId);
    const stage = framework.stages.find((s) => s.id === stageId);

    const prompt = [
      prefix,
      `You are coaching the user on the "${stage?.label ?? stageId}" step of the ${framework.name} reflection.`,
      stage?.question ? `The question they are answering: ${stage.question}` : "",
      `User text so far:`,
      currentText || "(empty)",
      ``,
      `Return ONE helpful tip in 1–3 sentences.`,
    ].join("\n");

    const ai = await this.callGemini(prompt);
    if (ai) return ai;

    // Fallback to offline
    return this.offlineFallback.getStageCoaching(frameworkId, stageId, currentText);
  }

  async analyzeReflection(
    answers: Record<string, string>,
    profession?: string,
    modelId?: string
  ): Promise<string> {
    const prof = profession ?? "NONE";
    const model = this.normalizeModelId(modelId);
    const prefix = this.safeProfessionPrefix(prof);
    const modelConfig = getFramework(model);

    const body = Object.entries(answers)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const prompt = [
      prefix,
      `Summarise this reflection, written with the ${modelConfig.name} framework.`,
      `Return format:`,
      `Summary: ...`,
      `Insights:`,
      `- ...`,
      `Action Steps:`,
      `- ...`,
      ``,
      `Stages: ${modelConfig.stages.map((s) => s.label).join(", ")}`,
      ``,
      `User answers:`,
      body || "(no answers)",
    ].join("\n");

    const ai = await this.callGemini(prompt);
    if (ai) return ai;

    // Fallback to offline
    return this.offlineFallback.analyzeReflection(answers, profession, modelId);
  }

  async askOracle(question: string, entriesJson?: string, profession?: string): Promise<string> {
    const prof = profession ?? "NONE";
    const prefix = this.safeProfessionPrefix(prof);

    const prompt = [
      prefix,
      `You are the ReflectApp2 Oracle.`,
      `Answer the user's question with practical, gentle clarity.`,
      `Keep it under 10 lines.`,
      ``,
      `Question: ${question}`,
      entriesJson ? `Context (recent entries JSON):\n${entriesJson}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const ai = await this.callGemini(prompt);
    if (ai) return ai;

    // Fallback to offline
    return this.offlineFallback.askOracle(question, entriesJson, profession);
  }
}
