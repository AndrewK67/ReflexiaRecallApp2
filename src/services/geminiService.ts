import type { ReflectionModelId } from "../types";
import { MODEL_CONFIG, PROFESSION_CONFIG } from "../constants";

// AI Facade
// - Exports MUST exist for imports throughout app.
// - Signatures must accept existing call patterns.
// - Works even with no API key by falling back to deterministic offline text.

const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
const MODEL = ((import.meta as any).env?.VITE_GEMINI_MODEL as string | undefined) ?? "gemini-1.5-flash";

function hasKey() {
  return typeof API_KEY === "string" && API_KEY.trim().length > 10;
}

async function callGemini(prompt: string): Promise<string | null> {
  if (!hasKey()) return null;

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

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
    const msg = json?.error?.message ?? `Gemini request failed (${res.status})`;
    throw new Error(msg);
  }

  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("") ?? "";

  return text.trim() || null;
}

function safeProfessionPrefix(profession: string) {
  return PROFESSION_CONFIG[profession]?.reflectionPromptPrefix
    ?? PROFESSION_CONFIG.NONE.reflectionPromptPrefix;
}

function normaliseModelId(modelId?: string): ReflectionModelId {
  const m = (modelId ?? "GIBBS").toUpperCase().trim();
  const allowed: ReflectionModelId[] = [
    "GIBBS","SBAR","ERA","ROLFE","STAR","SOAP","MORNING","EVENING","FREE","CUSTOM_1","CUSTOM_2","CUSTOM_3",
  ];
  return (allowed as string[]).includes(m) ? (m as ReflectionModelId) : "GIBBS";
}

// -------------------- Exports --------------------

export async function generateDailyPrompt(
  dateIso?: string,
  profession: string = "NONE"
): Promise<string> {
  const date = dateIso ?? new Date().toISOString().slice(0, 10);
  const prefix = safeProfessionPrefix(profession);

  const prompt = [
    prefix,
    `Write ONE short daily journal prompt for ${date}.`,
    `Constraints:`,
    `- 1–2 sentences`,
    `- not cheesy`,
    `- practical`,
  ].join("\n");

  const ai = await callGemini(prompt);
  return ai ?? `What’s the one thing you should do today that you’ll thank yourself for tomorrow? (${date})`;
}

/**
 * Compatibility:
 * Some callers do: getStageCoaching(stageId, text, profession)
 * Older versions did: getStageCoaching(stageId, text)
 */
export async function getStageCoaching(
  stageId: string,
  currentText: string,
  profession: string = "NONE"
): Promise<string> {
  const prefix = safeProfessionPrefix(profession);

  const prompt = [
    prefix,
    `You are coaching the user on a reflection stage: ${stageId}.`,
    `User text so far:`,
    currentText || "(empty)",
    ``,
    `Return ONE helpful tip in 1–3 sentences.`,
  ].join("\n");

  const ai = await callGemini(prompt);
  return ai ?? `Try adding one concrete detail and one honest “why it mattered” for the ${stageId} stage.`;
}

/**
 * Compatibility:
 * ReflectionFlow currently calls analyzeReflection(answers, profession, selectedModel)
 * Older versions used analyzeReflection(answers, modelId, profession)
 */
export async function analyzeReflection(
  answers: Record<string, string>,
  arg2?: string,
  arg3?: string
): Promise<string> {
  // detect which is model vs profession
  const maybe2 = (arg2 ?? "").toUpperCase();
  const maybe3 = (arg3 ?? "").toUpperCase();

  const looksLikeModel = (v: string) =>
    ["GIBBS","SBAR","ERA","ROLFE","STAR","SOAP","MORNING","EVENING","FREE","CUSTOM_1","CUSTOM_2","CUSTOM_3"].includes(v);

  const modelId = looksLikeModel(maybe2)
    ? normaliseModelId(maybe2)
    : looksLikeModel(maybe3)
      ? normaliseModelId(maybe3)
      : "GIBBS";

  const profession = looksLikeModel(maybe2) ? (arg3 ?? "NONE") : (arg2 ?? "NONE");

  const prefix = safeProfessionPrefix(profession);
  const model = MODEL_CONFIG[modelId];

  const body = Object.entries(answers)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const prompt = [
    prefix,
    `Summarise this reflection using the ${model.title} model.`,
    `Return format:`,
    `Summary: ...`,
    `Insights:`,
    `- ...`,
    `Action Steps:`,
    `- ...`,
    ``,
    `Stages: ${model.stages.map(s => s.label).join(", ")}`,
    ``,
    `User answers:`,
    body || "(no answers)",
  ].join("\n");

  const ai = await callGemini(prompt);
  return ai ?? [
    `Summary: You reflected on a key moment and identified what mattered most.`,
    `Insights:`,
    `- There’s a pattern worth noticing in how you responded.`,
    `- One small change could improve the outcome next time.`,
    `Action Steps:`,
    `- Write one sentence: “Next time I will…” and keep it realistic.`,
  ].join("\n");
}

/**
 * Compatibility:
 * Oracle.tsx currently calls:
 * askOracle({ question, entriesJson, profession })
 * Earlier versions called askOracle(question, context?)
 */
export async function askOracle(
  input:
    | string
    | {
        question: string;
        entriesJson?: string;
        profession?: string;
      },
  context?: string
): Promise<string> {
  const question = typeof input === "string" ? input : input.question;
  const profession = typeof input === "string" ? "NONE" : (input.profession ?? "NONE");
  const entriesJson = typeof input === "string" ? (context ?? "") : (input.entriesJson ?? "");

  const prefix = safeProfessionPrefix(profession);

  const prompt = [
    prefix,
    `You are the ReflectApp2 Oracle.`,
    `Answer the user's question with practical, gentle clarity.`,
    `Keep it under 10 lines.`,
    ``,
    `Question: ${question}`,
    entriesJson ? `Context (recent entries JSON):\n${entriesJson}` : "",
  ].filter(Boolean).join("\n");

  const ai = await callGemini(prompt);
  return ai ?? `If you want a clean next step: pick ONE small action you can complete today, then review what changed after.`;
}
