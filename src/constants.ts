import type {
  Achievement,
  ProfessionConfig,
  ReflectionModelConfig,
  ReflectionModelId,
  StageId,
} from "./types";
import { StageId as S } from "./types";

// ---------- Profession presets ----------

export const PROFESSION_CONFIG: Record<string, ProfessionConfig> = {
  NONE: {
    label: "General",
    description: "A neutral default. Good if you just want a clean reflective flow.",
    reflectionPromptPrefix:
      "You are a reflective coach. Keep answers practical, kind, and concise.",
  },
  HEALTHCARE: {
    label: "Healthcare",
    description: "Structured, safety-aware reflection with clinical clarity.",
    reflectionPromptPrefix:
      "You are a healthcare reflective coach. Be structured, safety-aware, and concise.",
  },
  EDUCATION: {
    label: "Education",
    description: "Reflection tuned for learning outcomes and student support.",
    reflectionPromptPrefix:
      "You are an education reflective coach. Focus on outcomes, clarity, and next actions.",
  },
  BUSINESS: {
    label: "Business",
    description: "Reflection tuned for decision-making and execution.",
    reflectionPromptPrefix:
      "You are a business reflective coach. Focus on clarity, options, and action steps.",
  },
};

// ---------- Reflection model configuration ----------

export const MODEL_CONFIG: Record<ReflectionModelId, ReflectionModelConfig> = {
  GIBBS: {
    id: "GIBBS",
    title: "Gibbs",
    description: "Classic reflective cycle: description → feelings → evaluation → analysis → conclusion → action plan.",
    stages: [
      { id: S.Description, label: "Description", prompt: "What happened?", placeholder: "Describe the situation..." },
      { id: S.Feelings, label: "Feelings", prompt: "What were you thinking and feeling?", placeholder: "How did it affect you?" },
      { id: S.Evaluation, label: "Evaluation", prompt: "What was good and bad about the experience?", placeholder: "What worked / didn’t work?" },
      { id: S.Analysis, label: "Analysis", prompt: "What sense can you make of the situation?", placeholder: "What was really going on?" },
      { id: S.Conclusion, label: "Conclusion", prompt: "What else could you have done?", placeholder: "What would you change?" },
      { id: S.ActionPlan, label: "Action Plan", prompt: "If it arose again, what would you do?", placeholder: "Concrete next steps..." },
    ],
  },

  SBAR: {
    id: "SBAR",
    title: "SBAR",
    description: "Situation → Background → Assessment → Recommendation.",
    stages: [
      { id: S.SBAR_Situation, label: "Situation", prompt: "What is the situation?", placeholder: "State the situation clearly..." },
      { id: S.SBAR_Background, label: "Background", prompt: "What background is relevant?", placeholder: "Key context..." },
      { id: S.SBAR_Assessment, label: "Assessment", prompt: "What is your assessment?", placeholder: "What do you think is happening?" },
      { id: S.SBAR_Recommendation, label: "Recommendation", prompt: "What do you recommend next?", placeholder: "Next action / decision..." },
    ],
  },

  ERA: {
    id: "ERA",
    title: "ERA",
    description: "Experience → Reflection → Action.",
    stages: [
      { id: S.ERA_Experience, label: "Experience", prompt: "Describe the experience.", placeholder: "What happened?" },
      { id: S.ERA_Reflection, label: "Reflection", prompt: "What did you learn?", placeholder: "What stood out and why?" },
      { id: S.ERA_Action, label: "Action", prompt: "What will you do next?", placeholder: "Your next steps..." },
    ],
  },

  ROLFE: {
    id: "ROLFE",
    title: "Rolfe",
    description: "What? → So what? → Now what?",
    stages: [
      { id: S.ROLFE_What, label: "What?", prompt: "What happened?", placeholder: "Describe it..." },
      { id: S.ROLFE_SoWhat, label: "So what?", prompt: "Why does it matter?", placeholder: "Meaning/impact..." },
      { id: S.ROLFE_NowWhat, label: "Now what?", prompt: "What will you do next?", placeholder: "Actionable next steps..." },
    ],
  },

  STAR: {
    id: "STAR",
    title: "STAR",
    description: "Situation → Task → Action → Result.",
    stages: [
      { id: S.STAR_Situation, label: "Situation", prompt: "What was the situation?", placeholder: "Context..." },
      { id: S.STAR_Task, label: "Task", prompt: "What was your task?", placeholder: "Your responsibility..." },
      { id: S.STAR_Action, label: "Action", prompt: "What did you do?", placeholder: "Your actions..." },
      { id: S.STAR_Result, label: "Result", prompt: "What happened as a result?", placeholder: "Outcome..." },
    ],
  },

  SOAP: {
    id: "SOAP",
    title: "SOAP",
    description: "Subjective → Objective → Assessment → Plan.",
    stages: [
      { id: S.SOAP_Subjective, label: "Subjective", prompt: "What’s the subjective experience?", placeholder: "Symptoms/feelings..." },
      { id: S.SOAP_Objective, label: "Objective", prompt: "What objective data exists?", placeholder: "Facts/observations..." },
      { id: S.SOAP_Assessment, label: "Assessment", prompt: "What’s your assessment?", placeholder: "Interpretation..." },
      { id: S.SOAP_Plan, label: "Plan", prompt: "What’s the plan?", placeholder: "Next steps..." },
    ],
  },

  MORNING: {
    id: "MORNING",
    title: "Morning Check-in",
    description: "Energy → Focus → Intention.",
    stages: [
      { id: S.MORNING_Energy, label: "Energy", prompt: "How’s your energy?", placeholder: "0–10 and why..." },
      { id: S.MORNING_Focus, label: "Focus", prompt: "What do you need to focus on today?", placeholder: "Top priorities..." },
      { id: S.MORNING_Intention, label: "Intention", prompt: "What’s your intention for the day?", placeholder: "A guiding intention..." },
    ],
  },

  EVENING: {
    id: "EVENING",
    title: "Evening Review",
    description: "Wins → Growth → Unwind.",
    stages: [
      { id: S.EVENING_Wins, label: "Wins", prompt: "What went well today?", placeholder: "Small and big wins..." },
      { id: S.EVENING_Growth, label: "Growth", prompt: "What did you learn today?", placeholder: "Lessons..." },
      { id: S.EVENING_Unwind, label: "Unwind", prompt: "What do you need to release?", placeholder: "Anything to let go of..." },
    ],
  },

  FREE: {
    id: "FREE",
    title: "Free Writing",
    description: "Open reflection, no structure.",
    stages: [{ id: S.FREE_Writing, label: "Write", prompt: "Write freely.", placeholder: "Just start..." }],
  },

  CUSTOM_1: {
    id: "CUSTOM_1",
    title: "Custom 1",
    description: "Custom model placeholder.",
    stages: [
      { id: S.CUSTOM_Stage1, label: "Stage 1", prompt: "Custom stage 1 prompt.", placeholder: "..." },
      { id: S.CUSTOM_Stage2, label: "Stage 2", prompt: "Custom stage 2 prompt.", placeholder: "..." },
      { id: S.CUSTOM_Stage3, label: "Stage 3", prompt: "Custom stage 3 prompt.", placeholder: "..." },
    ],
  },

  CUSTOM_2: {
    id: "CUSTOM_2",
    title: "Custom 2",
    description: "Custom model placeholder.",
    stages: [{ id: S.FREE_Writing, label: "Write", prompt: "Custom writing.", placeholder: "..." }],
  },

  CUSTOM_3: {
    id: "CUSTOM_3",
    title: "Custom 3",
    description: "Custom model placeholder.",
    stages: [{ id: S.FREE_Writing, label: "Write", prompt: "Custom writing.", placeholder: "..." }],
  },
};

// ---------- Achievements (minimal, to unblock gamificationService) ----------

export const ACHIEVEMENTS: Achievement[] = [
  { id: "FIRST_ENTRY", title: "First Entry", description: "You made your first entry." },
  { id: "THREE_DAY_STREAK", title: "3-Day Streak", description: "You showed up three days in a row." },
  { id: "TEN_ENTRIES", title: "10 Entries", description: "You’ve written ten entries." },
  { id: "CPD_1H", title: "1 Hour CPD", description: "You logged 60 minutes of CPD reflection." },
];
