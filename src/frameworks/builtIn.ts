import type { ReflectionFramework } from './types';

/**
 * The two built-ins (CLAUDE.md, locked decision 5). Ids are the ones the
 * composer has always saved: SIMPLE and FREE.
 */

export const THREE_PART: ReflectionFramework = {
  id: 'SIMPLE',
  name: 'Three-Part',
  tagline: 'What happened, what mattered, what you take forward.',
  kind: 'built-in',
  stages: [
    {
      id: 'what_happened',
      label: 'What happened?',
      question: 'Describe the situation or event.',
      placeholder: 'Tell the story...',
      coaching: 'Start with the plain facts: where you were, who was there, what was said or done. Interpretation can wait for the next question.',
    },
    {
      id: 'what_mattered',
      label: 'What stood out or mattered?',
      question: 'What feelings, thoughts, or details caught your attention?',
      placeholder: 'What did you notice?',
      coaching: 'Pick the one moment you keep coming back to. Name the feeling it left, even if the word is imperfect.',
    },
    {
      id: 'what_forward',
      label: 'What will you carry forward?',
      question: 'What insight or action will you take with you?',
      placeholder: "What's next?",
      coaching: 'One sentence is enough. Something you now understand, or one small thing you will try next time.',
    },
  ],
};

export const OPEN_ENTRY: ReflectionFramework = {
  id: 'FREE',
  name: 'Open Entry',
  tagline: 'One page, no structure. Just write.',
  kind: 'built-in',
  stages: [
    {
      id: 'FREE_Writing',
      label: 'Write',
      question: 'Write freely.',
      placeholder: 'Just start...',
      coaching: 'Write whatever needs to come out. No structure. No judgement. Just clarity.',
    },
  ],
};

export const BUILT_IN = { threePart: THREE_PART, openEntry: OPEN_ENTRY } as const;
