// src/services/providers/offlineProvider.ts
// Offline AI provider - always works, deterministic fallbacks

import type { AIProvider } from "../aiProvider";

export class OfflineProvider implements AIProvider {
  async generateDailyPrompt(dateIso?: string, _profession?: string): Promise<string> {
    const date = dateIso ?? new Date().toISOString().slice(0, 10);
    
    const prompts = [
      `What's the one thing you should do today that you'll thank yourself for tomorrow?`,
      `What small win can you celebrate from yesterday?`,
      `What's one moment from today you want to remember?`,
      `What's weighing on your mind right now?`,
      `What would make today feel complete?`,
      `What's one thing you learned recently that surprised you?`,
      `What's a decision you made today that you're proud of?`,
      `What pattern have you noticed in yourself lately?`,
      `What's one thing you'd do differently if you could?`,
      `What's something you did well today that you often overlook?`,
    ];

    // Deterministic selection based on date
    const dayOfYear = Math.floor(
      (new Date(date).getTime() - new Date(date.slice(0, 4) + "-01-01").getTime()) / 86400000
    );
    
    return `${prompts[dayOfYear % prompts.length]} (${date})`;
  }

  async getStageCoaching(stageId: string, _currentText: string, _profession?: string): Promise<string> {
    const tips: Record<string, string> = {
      Description: "Try adding one concrete detail and one honest 'why it mattered'.",
      Feelings: "Name the emotion specifically. Was it frustration, disappointment, relief?",
      Evaluation: "What went well? What could improve? Keep it balanced.",
      Analysis: "What patterns do you notice? What would you tell a friend in this situation?",
      Conclusion: "What's the one key insight you'll take forward from this?",
      ActionPlan: "Pick one specific action. Make it something you can do this week.",
    };

    return tips[stageId] || `Reflect honestly on this ${stageId} stage. One concrete detail makes a difference.`;
  }

  async analyzeReflection(
    answers: Record<string, string>,
    _profession?: string,
    _modelId?: string
  ): Promise<string> {
    const hasContent = Object.values(answers).some((v) => v && v.trim().length > 0);

    if (!hasContent) {
      return [
        `Summary: You created space for reflection today.`,
        `Insights:`,
        `- Sometimes the act of showing up matters more than what you write.`,
        `- You're building a habit of self-awareness.`,
        `Action Steps:`,
        `- Try writing one sentence tomorrow about what mattered most today.`,
      ].join("\n");
    }

    return [
      `Summary: You reflected on a key moment and identified what mattered most.`,
      `Insights:`,
      `- There's a pattern worth noticing in how you responded.`,
      `- One small change could improve the outcome next time.`,
      `Action Steps:`,
      `- Write one sentence: "Next time I will…" and keep it realistic.`,
    ].join("\n");
  }

  async askOracle(question: string, _entriesJson?: string, _profession?: string): Promise<string> {
    const responses = [
      `If you want a clean next step: pick ONE small action you can complete today, then review what changed after.`,
      `The answer is probably simpler than you think. What's the smallest thing you could try right now?`,
      `Trust your gut on this. You already know what matters—the hard part is choosing it.`,
      `Progress beats perfection. What's good enough for today?`,
      `Notice the pattern: what keeps coming up when you think about ${question.toLowerCase()}?`,
    ];

    // Simple hash of question for deterministic but varied responses
    const hash = question.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return responses[hash % responses.length];
  }
}
