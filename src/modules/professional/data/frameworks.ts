import type { ReflectionFramework } from '../../../frameworks/types';

/**
 * Clinical structures that used to sit in the core's framework list. SBAR is
 * a handover script and SOAP a clinical-notes format; neither is a reflection
 * framework for a general user. Parked here for the module (phase 2).
 * Entries already saved with these ids still open in the core via
 * getFramework()'s legacy fallback.
 */

export const SBAR: ReflectionFramework = {
  id: 'SBAR',
  name: 'SBAR',
  tagline: 'Situation, Background, Assessment, Recommendation.',
  kind: 'framework',
  origin: 'Clinical handover, US Navy / Kaiser Permanente',
  stages: [
    { id: 'SBAR_Situation', label: 'Situation', question: 'What is the situation?', placeholder: 'State the situation clearly...',
      coaching: "State the immediate situation in one paragraph: what's happening right now?" },
    { id: 'SBAR_Background', label: 'Background', question: 'What background is relevant?', placeholder: 'Key context...',
      coaching: 'Give the key history and context only. What matters most to understanding the situation?' },
    { id: 'SBAR_Assessment', label: 'Assessment', question: 'What is your assessment?', placeholder: 'What do you think is happening?',
      coaching: 'What do you think is going on? What evidence supports it? What are the risks?' },
    { id: 'SBAR_Recommendation', label: 'Recommendation', question: 'What do you recommend next?', placeholder: 'Next action / decision...',
      coaching: 'What do you want to happen next? Be specific: request, timeframe, escalation route.' },
  ],
};

export const SOAP: ReflectionFramework = {
  id: 'SOAP',
  name: 'SOAP',
  tagline: 'Subjective, Objective, Assessment, Plan.',
  kind: 'framework',
  origin: 'Clinical notes, Weed, 1968',
  stages: [
    { id: 'SOAP_Subjective', label: 'Subjective', question: "What's the subjective experience?", placeholder: 'Symptoms / feelings...',
      coaching: 'What was reported or experienced? What did the person say? What did you notice?' },
    { id: 'SOAP_Objective', label: 'Objective', question: 'What objective data exists?', placeholder: 'Facts / observations...',
      coaching: 'What facts and observations were present? Measurements? Behaviours?' },
    { id: 'SOAP_Assessment', label: 'Assessment', question: "What's your assessment?", placeholder: 'Interpretation...',
      coaching: "Your professional judgement: what's the working understanding and risk?" },
    { id: 'SOAP_Plan', label: 'Plan', question: "What's the plan?", placeholder: 'Next steps...',
      coaching: "What's the plan? Actions, follow-ups, escalation, documentation." },
  ],
};

export const PROFESSIONAL_FRAMEWORKS: ReflectionFramework[] = [SBAR, SOAP];
