export function offlineDailyPrompt(): string {
  const prompts = [
    "What’s the one thing you’re carrying today that you don’t need to carry alone?",
    "Name one win, one lesson, and one next step.",
    "Where did you show up well — even if nobody noticed?",
    "What tension are you avoiding, and what’s the smallest honest sentence about it?",
    "What do you need to release before the day ends?",
    "What would “peace with progress” look like today?",
    "What’s the simplest action that would move this forward by 1%?",
    "What did you learn about yourself in the last 24 hours?",
    "What matters most right now — and what’s just noise?",
    "If you could redo one moment, what would you do differently and why?",
  ];

  const idx = Math.floor(Math.random() * prompts.length);
  return prompts[idx];
}
