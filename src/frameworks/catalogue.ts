import type { ReflectionFramework } from './types';

/**
 * Optional frameworks anyone can pick from "Use a framework". Stage ids match
 * what MODEL_CONFIG has always saved. SBAR and SOAP are not here: they are
 * clinical structures and live with the professional module.
 */

export const GIBBS: ReflectionFramework = {
  id: 'GIBBS',
  name: "Gibbs' Reflective Cycle",
  tagline: 'Six steps from what happened to what you will do differently.',
  kind: 'framework',
  origin: 'Graham Gibbs, 1988',
  stages: [
    { id: 'Description', label: 'Description', question: 'What happened?', placeholder: 'Describe the situation...',
      coaching: 'Write a clear, factual description. Who was involved? What did you see or hear? What was the outcome so far? Save interpretation for later.' },
    { id: 'Feelings', label: 'Feelings', question: 'What were you thinking and feeling?', placeholder: 'How did it affect you?',
      coaching: 'Name the emotions you felt during the event and after. What did you assume in the moment? What felt most difficult?' },
    { id: 'Evaluation', label: 'Evaluation', question: 'What was good and bad about the experience?', placeholder: "What worked / didn't work?",
      coaching: "List what went well and what didn't. Be honest but fair. Include what others did that helped or made things harder." },
    { id: 'Analysis', label: 'Analysis', question: 'What sense can you make of the situation?', placeholder: 'What was really going on?',
      coaching: 'Why did it unfold like that? What influenced it: the setting, communication, time pressure, what you knew at the time?' },
    { id: 'Conclusion', label: 'Conclusion', question: 'What else could you have done?', placeholder: 'What would you change?',
      coaching: 'If you could replay the moment, what would you change? What would you keep the same?' },
    { id: 'ActionPlan', label: 'Action Plan', question: 'If it arose again, what would you do?', placeholder: 'Concrete next steps...',
      coaching: "Write one to three actions you'll take. Make them small and realistic. Include any support you'd need." },
  ],
};

export const ROLFE: ReflectionFramework = {
  id: 'ROLFE',
  name: 'What? So what? Now what?',
  tagline: 'Three questions that get to the point.',
  kind: 'framework',
  origin: 'Rolfe, Freshwater & Jasper, 2001',
  stages: [
    { id: 'ROLFE_What', label: 'What?', question: 'What happened?', placeholder: 'Describe it...',
      coaching: "What happened? What is the key issue you're reflecting on?" },
    { id: 'ROLFE_SoWhat', label: 'So what?', question: 'Why does it matter?', placeholder: 'Meaning / impact...',
      coaching: 'Why does this matter? What does it mean for how you act, decide or feel?' },
    { id: 'ROLFE_NowWhat', label: 'Now what?', question: 'What will you do next?', placeholder: 'Actionable next steps...',
      coaching: 'What next? What will you do differently, and how will you know it worked?' },
  ],
};

export const ERA: ReflectionFramework = {
  id: 'ERA',
  name: 'Experience, Reflection, Action',
  tagline: 'The simplest loop: what happened, what it taught you, what you will do.',
  kind: 'framework',
  origin: 'Jasper, 2013',
  stages: [
    { id: 'ERA_Experience', label: 'Experience', question: 'Describe the experience.', placeholder: 'What happened?',
      coaching: 'Describe what happened and what you did. Keep it grounded.' },
    { id: 'ERA_Reflection', label: 'Reflection', question: 'What did you learn?', placeholder: 'What stood out and why?',
      coaching: 'What did you learn about yourself, others, or the situation? What surprised you?' },
    { id: 'ERA_Action', label: 'Action', question: 'What will you do next?', placeholder: 'Your next steps...',
      coaching: 'What will you change next time? What will you practise? What will you prepare?' },
  ],
};

export const STAR: ReflectionFramework = {
  id: 'STAR',
  name: 'STAR',
  tagline: 'Situation, task, action, result — good for telling a story clearly.',
  kind: 'framework',
  origin: 'Widely used in interviews and reviews',
  stages: [
    { id: 'STAR_Situation', label: 'Situation', question: 'What was the situation?', placeholder: 'Context...',
      coaching: 'Describe the setting and the challenge.' },
    { id: 'STAR_Task', label: 'Task', question: 'What was your task?', placeholder: 'Your responsibility...',
      coaching: 'What needed to be done? What was your responsibility?' },
    { id: 'STAR_Action', label: 'Action', question: 'What did you do?', placeholder: 'Your actions...',
      coaching: 'What did you do, step by step?' },
    { id: 'STAR_Result', label: 'Result', question: 'What happened as a result?', placeholder: 'Outcome...',
      coaching: 'What happened? What changed? What would you improve next time?' },
  ],
};

export const MORNING: ReflectionFramework = {
  id: 'MORNING',
  name: 'Morning Check-in',
  tagline: 'Energy, focus, intention — before the day starts.',
  kind: 'framework',
  stages: [
    { id: 'MORNING_Energy', label: 'Energy', question: "How's your energy?", placeholder: '0–10 and why...',
      coaching: "How's your body and mind today? What's your baseline energy?" },
    { id: 'MORNING_Focus', label: 'Focus', question: 'What do you need to focus on today?', placeholder: 'Top priorities...',
      coaching: 'Name the one thing that, done today, would make the day feel worthwhile.' },
    { id: 'MORNING_Intention', label: 'Intention', question: "What's your intention for the day?", placeholder: 'A guiding intention...',
      coaching: "What's the one way you want to show up today? Patient, courageous, focused, kind — pick one." },
  ],
};

export const EVENING: ReflectionFramework = {
  id: 'EVENING',
  name: 'Evening Review',
  tagline: 'Wins, growth, unwind — before you close the day.',
  kind: 'framework',
  stages: [
    { id: 'EVENING_Wins', label: 'Wins', question: 'What went well today?', placeholder: 'Small and big wins...',
      coaching: 'What went well today, even the small wins? What did you handle better than before?' },
    { id: 'EVENING_Growth', label: 'Growth', question: 'What did you learn today?', placeholder: 'Lessons...',
      coaching: 'What challenged you today? What did it teach you?' },
    { id: 'EVENING_Unwind', label: 'Unwind', question: 'What do you need to release?', placeholder: 'Anything to let go of...',
      coaching: 'What do you need to let go of before sleep? Write a closing sentence.' },
  ],
};

export const CATALOGUE: ReflectionFramework[] = [GIBBS, ROLFE, ERA, STAR, MORNING, EVENING];
