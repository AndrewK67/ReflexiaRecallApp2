// src/services/providers/geminiProvider.ts
// Gemini AI provider - uses API when available, falls back to offline

import type { AIProvider } from "../aiProvider";
import { OfflineProvider } from "./offlineProvider";
import { MODEL_CONFIG, PROFESSION_CONFIG } from "../../constants";
import type { ReflectionModelId } from "../../types";

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

  private safeProfessionPrefix(profession: string = "NONE"): string {
    return PROFESSION_CONFIG[profession]?.reflectionPromptPrefix ?? PROFESSION_CONFIG.NONE.reflectionPromptPrefix;
  }

  private normalizeModelId(modelId?: string): ReflectionModelId {
    const m = (modelId ?? "GIBBS").toUpperCase().trim();
    const allowed: ReflectionModelId[] = [
      "GIBBS",
      "SBAR",
      "ERA",
      "ROLFE",
      "STAR",
      "SOAP",
      "MORNING",
      "EVENING",
      "FREE",
      "CUSTOM_1",
      "CUSTOM_2",
      "CUSTOM_3",
    ];
    return (allowed as string[]).includes(m) ? (m as ReflectionModelId) : "GIBBS";
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

  async getStageCoaching(stageId: string, currentText: string, profession: string = "NONE"): Promise<string> {
    const prefix = this.safeProfessionPrefix(profession);

    const prompt = [
      prefix,
      `You are coaching the user on a reflection stage: ${stageId}.`,
      `User text so far:`,
      currentText || "(empty)",
      ``,
      `Return ONE helpful tip in 1–3 sentences.`,
    ].join("\n");

    const ai = await this.callGemini(prompt);
    if (ai) return ai;

    // Fallback to offline
    return this.offlineFallback.getStageCoaching(stageId, currentText, profession);
  }

  async analyzeReflection(
    answers: Record<string, string>,
    profession?: string,
    modelId?: string
  ): Promise<string> {
    const prof = profession ?? "NONE";
    const model = this.normalizeModelId(modelId);
    const prefix = this.safeProfessionPrefix(prof);
    const modelConfig = MODEL_CONFIG[model];

    const body = Object.entries(answers)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const prompt = [
      prefix,
      `Summarise this reflection using the ${modelConfig.title} model.`,
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
