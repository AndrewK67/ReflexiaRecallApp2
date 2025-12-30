import type { ReflectionModel, ProfessionType } from "../types";

export type OfflinePrompt = {
  title: string;
  prompt: string;
  quickOptions?: string[];
};

type ModelStagePrompts = Record<string, OfflinePrompt>;

const baseProfessionalNote = (profession: ProfessionType) =>
  profession && profession !== "NONE"
    ? `Context: You are reflecting as a ${profession.split("_").join(" ")}.`
    : `Context: Professional reflection.`;

// Keys here are stage identifiers used by your UI.
// We deliberately keep this as a *partial* map so that adding new model ids (e.g. CUSTOM_1..3)
// doesn't break compilation. Unknown models fall back to FREE.
export const OFFLINE_PROMPTS: Partial<Record<ReflectionModel, ModelStagePrompts>> = {
  GIBBS: {
    DESCRIPTION: {
      title: "What happened?",
      prompt:
        "Write a clear, factual description. Who was involved? What did you see/hear? What was the outcome (so far)? Avoid interpretation here.",
      quickOptions: ["Who / Where / When", "Sequence of events", "Outcome so far"],
    },
    FEELINGS: {
      title: "What were you thinking and feeling?",
      prompt:
        "Name the emotions you felt during the event and after. What did you assume in the moment? What felt most difficult?",
      quickOptions: ["Emotion words", "Assumptions", "Hardest moment"],
    },
    EVALUATION: {
      title: "What was good and bad about the experience?",
      prompt:
        "List what went well and what didn’t. Be honest but fair. Include what others did that helped or made things harder.",
      quickOptions: ["What went well", "What went wrong", "What helped"],
    },
    ANALYSIS: {
      title: "Make sense of it",
      prompt:
        "Why did it unfold like that? What factors influenced it (systems, communication, time pressure, knowledge, environment)?",
      quickOptions: ["Root causes", "Contributing factors", "Patterns"],
    },
    CONCLUSION: {
      title: "What could you have done differently?",
      prompt:
        "If you could replay the moment, what would you change? What would you keep the same?",
      quickOptions: ["Do differently", "Keep", "New approach"],
    },
    ACTION_PLAN: {
      title: "Action plan",
      prompt:
        "Write 1–3 actions you’ll take. Make them small and realistic. Include what support/resources you need.",
      quickOptions: ["1 small action", "1 skill to build", "1 support needed"],
    },
  },

  SBAR: {
    SBAR_SITUATION: { title: "Situation", prompt: "State the immediate situation in one paragraph: what’s happening right now?" },
    SBAR_BACKGROUND: { title: "Background", prompt: "Give the key history/context only. What matters most to understanding the situation?" },
    SBAR_ASSESSMENT: { title: "Assessment", prompt: "What do you think is going on? What evidence supports it? What are the risks?" },
    SBAR_RECOMMENDATION: { title: "Recommendation", prompt: "What do you want to happen next? Be specific: request, timeframe, escalation route." },
  },

  ERA: {
    ERA_EXPERIENCE: { title: "Experience", prompt: "Describe what happened and what you did. Keep it grounded." },
    ERA_REFLECTION: { title: "Reflection", prompt: "What did you learn about yourself, others, or the system? What surprised you?" },
    ERA_ACTION: { title: "Action", prompt: "What will you change next time? What will you practise? What will you prepare?" },
  },

  ROLFE: {
    ROLFE_WHAT: { title: "What?", prompt: "What happened? What is the key issue you’re reflecting on?" },
    ROLFE_SOWHAT: { title: "So what?", prompt: "Why does this matter? What does it mean for your practice / decisions / wellbeing?" },
    ROLFE_NOWWHAT: { title: "Now what?", prompt: "What next? What will you do differently and how will you measure improvement?" },
  },

  STAR: {
    STAR_Situation: { title: "Situation", prompt: "Describe the setting and the challenge." },
    STAR_Task: { title: "Task", prompt: "What needed to be done? What was your responsibility?" },
    STAR_Action: { title: "Action", prompt: "What did you do (step by step)?" },
    STAR_Result: { title: "Result", prompt: "What happened? What changed? What would you improve next time?" },
  },

  SOAP: {
    SOAP_Subjective: { title: "Subjective", prompt: "What was reported/experienced? What did the person say? What did you notice?" },
    SOAP_Objective: { title: "Objective", prompt: "What facts and observations were present? Measurements? Behaviours?" },
    SOAP_Assessment: { title: "Assessment", prompt: "Your professional judgement: what’s the working understanding and risk?" },
    SOAP_Plan: { title: "Plan", prompt: "What’s the plan? Actions, follow-ups, escalation, documentation." },
  },

  MORNING: {
    MORNING_Energy: { title: "Energy check", prompt: "How’s your body and mind today? What’s your baseline energy?" },
    MORNING_Gratitude: { title: "Gratitude", prompt: "Name 1–3 things you’re grateful for. Keep it simple and real." },
    MORNING_Intention: {
      title: "Intention",
      prompt: "What’s the one way you want to show up today (character + action)?",
      quickOptions: ["Patient", "Courageous", "Focused", "Kind"],
    },
  },

  EVENING: {
    EVENING_Wins: { title: "Wins", prompt: "What went well today (even small wins)? What did you handle better than before?" },
    EVENING_Growth: { title: "Growth", prompt: "What challenged you today? What did it teach you?" },
    EVENING_Unwind: { title: "Unwind", prompt: "What do you need to let go of before sleep? Write a closing sentence." },
  },

  FREE: {
    FREE_Writing: {
      title: "Free write",
      prompt: "Write whatever needs to come out. No structure. No judgment. Just clarity.",
    },
  },
};

export function getOfflineStagePrompt(
  model: ReflectionModel,
  stageKey: string,
  profession: ProfessionType
): OfflinePrompt {
  const freePrompts = OFFLINE_PROMPTS.FREE || OFFLINE_PROMPTS["FREE"];
  const modelPrompts = OFFLINE_PROMPTS[model] || freePrompts || {
    FREE_Writing: { title: "Free write", prompt: "Write your thoughts." },
  };
  const found = modelPrompts[stageKey] || modelPrompts.FREE_Writing || { title: "Prompt", prompt: "Write your thoughts." };

  return {
    ...found,
    prompt: `${baseProfessionalNote(profession)}\n\n${found.prompt}`,
  };
}
