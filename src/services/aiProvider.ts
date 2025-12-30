// src/services/aiProvider.ts
// Defines the AI provider interface for the app

export interface AIProvider {
  /**
   * Generate a daily journal prompt
   * @param dateIso - ISO date string (YYYY-MM-DD)
   * @param profession - User's profession key
   * @returns A short, practical prompt
   */
  generateDailyPrompt(dateIso?: string, profession?: string): Promise<string>;

  /**
   * Get coaching tips for a specific reflection stage
   * @param stageId - The stage identifier
   * @param currentText - User's current text for this stage
   * @param profession - User's profession key
   * @returns A helpful tip (1-3 sentences)
   */
  getStageCoaching(stageId: string, currentText: string, profession?: string): Promise<string>;

  /**
   * Analyze a completed reflection
   * @param answers - The user's answers to reflection prompts
   * @param profession - User's profession key
   * @param modelId - The reflection model used
   * @returns Summary, insights, and action steps
   */
  analyzeReflection(
    answers: Record<string, string>,
    profession?: string,
    modelId?: string
  ): Promise<string>;

  /**
   * Answer user questions (Oracle feature)
   * @param question - The user's question
   * @param entriesJson - Optional JSON context from past entries
   * @param profession - User's profession key
   * @returns A thoughtful answer
   */
  askOracle(question: string, entriesJson?: string, profession?: string): Promise<string>;
}

export interface AIProviderConfig {
  /** Provider type */
  type: "offline" | "gemini";
  
  /** Optional API key (for Gemini) */
  apiKey?: string;
  
  /** Optional model name (for Gemini) */
  modelName?: string;
}
