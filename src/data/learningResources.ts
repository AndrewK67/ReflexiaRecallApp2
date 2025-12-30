/**
 * Learning Resources Library
 * Curated resources for healthcare professionals
 * All content works offline (descriptions, summaries, key points)
 */

export type ResourceType = 'article' | 'video' | 'podcast' | 'tool' | 'book' | 'course' | 'exercise';

export type ResourceCategory =
  | 'clinical-skills'
  | 'mental-health'
  | 'communication'
  | 'ethics'
  | 'self-care'
  | 'leadership'
  | 'research'
  | 'technology'
  | 'patient-safety'
  | 'burnout-prevention';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearningResource {
  id: string;
  title: string;
  type: ResourceType;
  category: ResourceCategory;
  description: string;
  keyPoints?: string[]; // Offline-accessible key takeaways
  author?: string;
  duration?: string; // "5 min read", "30 min", "2 hours"
  url?: string; // External link (optional)
  tags: string[];
  difficulty: DifficultyLevel;
  dateAdded: string; // ISO date
  isFavorite?: boolean;
  offlineContent?: string; // Full offline summary/transcript
}

export const LEARNING_RESOURCES: LearningResource[] = [
  // ==================== CLINICAL SKILLS ====================
  {
    id: 'cs-001',
    title: 'Reflective Practice in Clinical Decision Making',
    type: 'article',
    category: 'clinical-skills',
    description: 'Evidence-based framework for using reflection to improve diagnostic accuracy and patient outcomes.',
    keyPoints: [
      'Reflection-in-action vs reflection-on-action',
      'Structured frameworks: Gibbs, Kolb, Schön',
      'Clinical reasoning patterns and biases',
      'Documentation strategies for reflective practice',
    ],
    author: 'Dr. Sarah Chen',
    duration: '12 min read',
    tags: ['clinical reasoning', 'evidence-based', 'decision making', 'reflection'],
    difficulty: 'intermediate',
    dateAdded: '2024-01-15T00:00:00Z',
    offlineContent: `Reflective practice is essential for continuous improvement in clinical settings. This article explores two primary modes: reflection-in-action (thinking on your feet during patient encounters) and reflection-on-action (analyzing past decisions). Key frameworks include Gibbs' Reflective Cycle (description, feelings, evaluation, analysis, conclusion, action plan) and Schön's model of professional artistry. Common cognitive biases affecting clinical decisions include anchoring bias, availability heuristic, and confirmation bias. Structured reflection helps identify these patterns and improve future practice.`,
  },
  {
    id: 'cs-002',
    title: 'Breaking Bad News: The SPIKES Protocol',
    type: 'video',
    category: 'clinical-skills',
    description: 'Step-by-step guide to delivering difficult news with compassion and clarity.',
    keyPoints: [
      'Setting up the conversation (privacy, time, support)',
      'Assessing patient perception',
      'Obtaining invitation to share information',
      'Providing knowledge with empathy',
      'Addressing emotions with validation',
      'Strategy and summary for next steps',
    ],
    duration: '18 min',
    tags: ['communication', 'empathy', 'patient care', 'difficult conversations'],
    difficulty: 'intermediate',
    dateAdded: '2024-01-20T00:00:00Z',
    offlineContent: `The SPIKES protocol is a six-step framework: (S) Setting - ensure privacy and adequate time; (P) Perception - assess what the patient already knows; (I) Invitation - determine how much the patient wants to know; (K) Knowledge - share information clearly and empathetically; (E) Emotions - respond to patient's emotional reactions with validation; (S) Strategy - summarize and plan next steps together. Practice empathetic silence, avoid medical jargon, and check understanding frequently.`,
  },
  {
    id: 'cs-003',
    title: 'Diagnostic Error Recognition and Prevention',
    type: 'course',
    category: 'clinical-skills',
    description: 'Interactive course on identifying cognitive biases and system factors that contribute to diagnostic errors.',
    keyPoints: [
      'Types of diagnostic errors: no-fault, system-related, cognitive',
      'Premature closure and confirmation bias',
      'Differential diagnosis strategies',
      'Safety nets and follow-up systems',
    ],
    duration: '2 hours',
    tags: ['patient safety', 'cognitive bias', 'diagnosis', 'error prevention'],
    difficulty: 'advanced',
    dateAdded: '2024-02-01T00:00:00Z',
  },

  // ==================== MENTAL HEALTH ====================
  {
    id: 'mh-001',
    title: 'Recognizing Secondary Traumatic Stress',
    type: 'article',
    category: 'mental-health',
    description: 'Understanding vicarious trauma and its impact on healthcare workers exposed to patient suffering.',
    keyPoints: [
      'Difference between burnout, compassion fatigue, and secondary trauma',
      'Early warning signs: intrusive thoughts, emotional numbing, hypervigilance',
      'Neurobiological impact of repeated trauma exposure',
      'Evidence-based interventions and boundary setting',
    ],
    author: 'Dr. Maria Rodriguez',
    duration: '15 min read',
    tags: ['trauma', 'compassion fatigue', 'mental health', 'self-care'],
    difficulty: 'intermediate',
    dateAdded: '2024-01-10T00:00:00Z',
    offlineContent: `Secondary traumatic stress (STS) occurs when healthcare workers absorb the trauma of patients they care for. Unlike burnout (gradual exhaustion from workload), STS can develop suddenly after a single traumatic case. Symptoms mirror PTSD: intrusive memories, avoidance, negative cognitions, and hyperarousal. Risk factors include high empathy, personal trauma history, and lack of organizational support. Protective strategies: regular clinical supervision, peer support groups, clear professional boundaries, mindfulness practices, and limiting exposure to graphic details when clinically unnecessary.`,
  },
  {
    id: 'mh-002',
    title: 'Mindfulness-Based Stress Reduction for Clinicians',
    type: 'exercise',
    category: 'mental-health',
    description: 'Practical MBSR techniques adapted for busy healthcare professionals.',
    keyPoints: [
      'Body scan meditation (10 min version)',
      'Three-minute breathing space',
      'Mindful walking between patient rooms',
      'RAIN technique for difficult emotions',
    ],
    duration: '8 min practice',
    tags: ['mindfulness', 'stress reduction', 'meditation', 'self-care'],
    difficulty: 'beginner',
    dateAdded: '2024-01-25T00:00:00Z',
    offlineContent: `MBSR techniques for clinical settings: (1) Three-Minute Breathing Space - pause, observe breath, expand awareness to whole body; use between patients. (2) RAIN for emotions - Recognize what you're feeling, Allow it to be present, Investigate with kindness, Non-identification (you are not your emotions). (3) Mindful walking - focus on foot contact, rhythm, breath while moving between rooms. (4) Brief body scan - mental sweep from head to toes, noting tension without judgment. Even 3-5 minutes daily reduces stress hormones and improves emotional regulation.`,
  },
  {
    id: 'mh-003',
    title: 'CBT Techniques for Managing Clinical Anxiety',
    type: 'tool',
    category: 'mental-health',
    description: 'Cognitive behavioral strategies for managing performance anxiety and imposter syndrome.',
    keyPoints: [
      'Thought records and cognitive restructuring',
      'Behavioral experiments to test anxious predictions',
      'Graduated exposure to feared situations',
      'Self-compassion vs self-criticism patterns',
    ],
    duration: '20 min',
    tags: ['anxiety', 'CBT', 'imposter syndrome', 'cognitive restructuring'],
    difficulty: 'intermediate',
    dateAdded: '2024-02-10T00:00:00Z',
  },

  // ==================== COMMUNICATION ====================
  {
    id: 'comm-001',
    title: 'Motivational Interviewing Fundamentals',
    type: 'video',
    category: 'communication',
    description: 'Core principles and techniques for patient-centered conversations about behavior change.',
    keyPoints: [
      'OARS: Open questions, Affirmations, Reflections, Summaries',
      'Avoiding the righting reflex',
      'Eliciting change talk vs sustain talk',
      'Rolling with resistance',
    ],
    duration: '25 min',
    tags: ['motivational interviewing', 'patient engagement', 'behavior change', 'communication'],
    difficulty: 'intermediate',
    dateAdded: '2024-01-18T00:00:00Z',
    offlineContent: `Motivational Interviewing (MI) is a collaborative, patient-centered approach to facilitating behavior change. Core principles: (1) Express empathy through reflective listening, (2) Develop discrepancy between current behavior and personal goals, (3) Roll with resistance rather than confronting it, (4) Support self-efficacy. OARS techniques: Open-ended questions invite exploration, Affirmations highlight patient strengths, Reflections demonstrate understanding, Summaries collect and link key points. Avoid the "righting reflex" - the urge to fix problems immediately. Instead, elicit the patient's own motivations for change.`,
  },
  {
    id: 'comm-002',
    title: 'De-escalation Techniques for Agitated Patients',
    type: 'article',
    category: 'communication',
    description: 'Evidence-based verbal and non-verbal strategies for managing escalating situations safely.',
    keyPoints: [
      'Recognizing early warning signs of escalation',
      'CALM approach: Communicate, Assess, Listen, Manage',
      'Body language and spatial awareness',
      'When to involve security vs continuing engagement',
    ],
    author: 'Dr. James Wilson',
    duration: '10 min read',
    tags: ['de-escalation', 'patient safety', 'conflict resolution', 'crisis management'],
    difficulty: 'intermediate',
    dateAdded: '2024-01-28T00:00:00Z',
  },
  {
    id: 'comm-003',
    title: 'Team Communication: SBAR Framework',
    type: 'tool',
    category: 'communication',
    description: 'Structured communication technique for clear, efficient handoffs and critical updates.',
    keyPoints: [
      'Situation: State the issue clearly',
      'Background: Provide relevant context',
      'Assessment: Share your clinical judgment',
      'Recommendation: Suggest next steps',
    ],
    duration: '5 min',
    tags: ['SBAR', 'handoffs', 'team communication', 'patient safety'],
    difficulty: 'beginner',
    dateAdded: '2024-02-05T00:00:00Z',
    offlineContent: `SBAR is a standardized framework for critical communications. Situation: "I'm calling about [patient name] in [location] regarding [specific problem]." Background: "Relevant history includes [diagnosis, recent events, medications]." Assessment: "I believe the problem is [your clinical interpretation], vital signs show [key data]." Recommendation: "I recommend [specific action], and I need you to [explicit request]." SBAR reduces miscommunication errors by ensuring all parties have the same information structure. Practice until it becomes automatic for urgent calls.`,
  },

  // ==================== ETHICS ====================
  {
    id: 'eth-001',
    title: 'Ethical Decision-Making Frameworks',
    type: 'article',
    category: 'ethics',
    description: 'Systematic approaches to navigating complex ethical dilemmas in clinical practice.',
    keyPoints: [
      'Four principles: autonomy, beneficence, non-maleficence, justice',
      'Ethical decision-making models',
      'Balancing patient wishes with clinical judgment',
      'Documentation and consultation strategies',
    ],
    author: 'Dr. Emily Thompson',
    duration: '14 min read',
    tags: ['ethics', 'decision making', 'autonomy', 'bioethics'],
    difficulty: 'advanced',
    dateAdded: '2024-01-12T00:00:00Z',
  },
  {
    id: 'eth-002',
    title: 'Boundaries in Therapeutic Relationships',
    type: 'article',
    category: 'ethics',
    description: 'Understanding and maintaining appropriate professional boundaries with patients.',
    keyPoints: [
      'Defining therapeutic vs non-therapeutic relationships',
      'Early warning signs of boundary violations',
      'Social media and digital boundaries',
      'Self-disclosure: when and how much',
    ],
    duration: '11 min read',
    tags: ['boundaries', 'professionalism', 'ethics', 'therapeutic relationship'],
    difficulty: 'intermediate',
    dateAdded: '2024-02-15T00:00:00Z',
  },

  // ==================== SELF-CARE ====================
  {
    id: 'sc-001',
    title: 'Building Sustainable Self-Care Practices',
    type: 'exercise',
    category: 'self-care',
    description: 'Practical framework for integrating self-care into demanding clinical schedules.',
    keyPoints: [
      'Micro-practices: 2-5 minute interventions throughout the day',
      'Physical self-care: sleep, nutrition, movement',
      'Emotional self-care: processing, boundaries, support',
      'Professional self-care: supervision, CPD, work-life balance',
    ],
    duration: '15 min',
    tags: ['self-care', 'wellness', 'burnout prevention', 'work-life balance'],
    difficulty: 'beginner',
    dateAdded: '2024-01-22T00:00:00Z',
    offlineContent: `Self-care is not selfish - it's essential for sustainable practice. Framework: (1) Physical - prioritize 7-9 hours sleep, regular meals, 20 min daily movement. (2) Emotional - debrief difficult cases with peers, maintain boundaries, weekly supervision. (3) Professional - engage in CPD, vary clinical tasks, take full breaks. (4) Micro-practices - 2-minute breathing exercises between patients, stretch breaks, hydration reminders, gratitude journaling. Schedule self-care like patient appointments. Monitor warning signs: cynicism, exhaustion, reduced empathy, mistakes.`,
  },
  {
    id: 'sc-002',
    title: 'Sleep Optimization for Shift Workers',
    type: 'article',
    category: 'self-care',
    description: 'Evidence-based strategies for managing sleep with irregular schedules and night shifts.',
    keyPoints: [
      'Circadian rhythm protection strategies',
      'Sleep environment optimization',
      'Strategic caffeine and napping protocols',
      'Recovery sleep after night shifts',
    ],
    author: 'Dr. Michael Park',
    duration: '12 min read',
    tags: ['sleep', 'shift work', 'fatigue management', 'health'],
    difficulty: 'intermediate',
    dateAdded: '2024-02-08T00:00:00Z',
  },
  {
    id: 'sc-003',
    title: 'Peer Support Networks: Starting and Sustaining',
    type: 'tool',
    category: 'self-care',
    description: 'Guide to creating structured peer support groups for healthcare professionals.',
    keyPoints: [
      'Schwartz Rounds model',
      'Balint groups for case discussion',
      'Psychological safety and confidentiality',
      'Facilitation skills for peer leaders',
    ],
    duration: '18 min',
    tags: ['peer support', 'community', 'resilience', 'team wellness'],
    difficulty: 'intermediate',
    dateAdded: '2024-01-30T00:00:00Z',
  },

  // ==================== LEADERSHIP ====================
  {
    id: 'lead-001',
    title: 'Psychological Safety in Clinical Teams',
    type: 'article',
    category: 'leadership',
    description: 'Creating team environments where members feel safe to speak up about errors and concerns.',
    keyPoints: [
      "Amy Edmondson's framework for psychological safety",
      'Linking psychological safety to patient outcomes',
      'Behaviors that build vs undermine safety',
      'Measuring and improving team dynamics',
    ],
    author: 'Dr. Lisa Chang',
    duration: '16 min read',
    tags: ['psychological safety', 'team dynamics', 'leadership', 'patient safety'],
    difficulty: 'advanced',
    dateAdded: '2024-01-14T00:00:00Z',
  },
  {
    id: 'lead-002',
    title: 'Giving and Receiving Feedback',
    type: 'video',
    category: 'leadership',
    description: 'Techniques for delivering constructive feedback and creating a feedback culture.',
    keyPoints: [
      'SBI model: Situation, Behavior, Impact',
      'Separating observation from interpretation',
      'Receiving feedback without defensiveness',
      'Closing the feedback loop with action',
    ],
    duration: '22 min',
    tags: ['feedback', 'communication', 'professional development', 'leadership'],
    difficulty: 'intermediate',
    dateAdded: '2024-02-12T00:00:00Z',
  },

  // ==================== BURNOUT PREVENTION ====================
  {
    id: 'burn-001',
    title: 'Burnout Assessment and Early Intervention',
    type: 'tool',
    category: 'burnout-prevention',
    description: 'Self-assessment tools and evidence-based interventions for preventing and recovering from burnout.',
    keyPoints: [
      'Maslach Burnout Inventory domains',
      'Distinguishing burnout from depression',
      'Individual vs organizational interventions',
      'Return-to-work strategies after burnout',
    ],
    duration: '25 min',
    tags: ['burnout', 'assessment', 'prevention', 'recovery'],
    difficulty: 'intermediate',
    dateAdded: '2024-01-08T00:00:00Z',
  },
  {
    id: 'burn-002',
    title: 'Moral Injury in Healthcare',
    type: 'article',
    category: 'burnout-prevention',
    description: 'Understanding moral injury as distinct from burnout and its impact on clinician wellbeing.',
    keyPoints: [
      'Definition: betrayal of deeply held moral values',
      'Common sources in healthcare systems',
      'Symptoms: shame, guilt, anger, loss of meaning',
      'Processing moral injury through narrative',
    ],
    author: 'Dr. David Foster',
    duration: '13 min read',
    tags: ['moral injury', 'ethics', 'systems issues', 'trauma'],
    difficulty: 'advanced',
    dateAdded: '2024-02-18T00:00:00Z',
  },
  {
    id: 'burn-003',
    title: 'Job Crafting for Meaning and Engagement',
    type: 'exercise',
    category: 'burnout-prevention',
    description: 'Proactive strategies to reshape your role for greater satisfaction and purpose.',
    keyPoints: [
      'Task crafting: adjusting activities and responsibilities',
      'Relational crafting: changing interactions with colleagues',
      'Cognitive crafting: reframing the meaning of work',
      'Creating a job crafting action plan',
    ],
    duration: '20 min',
    tags: ['job crafting', 'engagement', 'meaning', 'satisfaction'],
    difficulty: 'intermediate',
    dateAdded: '2024-02-20T00:00:00Z',
  },

  // ==================== PATIENT SAFETY ====================
  {
    id: 'ps-001',
    title: 'Root Cause Analysis After Adverse Events',
    type: 'course',
    category: 'patient-safety',
    description: 'Systematic approach to investigating errors and implementing system improvements.',
    keyPoints: [
      'Swiss cheese model of error causation',
      'Conducting blame-free investigations',
      'Identifying latent vs active failures',
      'Implementing sustainable corrective actions',
    ],
    duration: '90 min',
    tags: ['patient safety', 'error analysis', 'systems thinking', 'quality improvement'],
    difficulty: 'advanced',
    dateAdded: '2024-01-16T00:00:00Z',
  },
  {
    id: 'ps-002',
    title: 'Speaking Up: Psychological Barriers and Strategies',
    type: 'article',
    category: 'patient-safety',
    description: 'Overcoming hierarchical and social barriers to voicing safety concerns.',
    keyPoints: [
      'Authority gradient and its impact on safety',
      'CUS words: I am Concerned, Uncomfortable, this is a Safety issue',
      'Two-challenge rule for persistence',
      'Protecting yourself when speaking up',
    ],
    duration: '9 min read',
    tags: ['speaking up', 'safety culture', 'assertiveness', 'advocacy'],
    difficulty: 'intermediate',
    dateAdded: '2024-02-22T00:00:00Z',
  },

  // ==================== RESEARCH ====================
  {
    id: 'res-001',
    title: 'Critical Appraisal of Clinical Research',
    type: 'tool',
    category: 'research',
    description: 'Skills for evaluating research quality and applicability to your practice.',
    keyPoints: [
      'Study design hierarchy and appropriate use',
      'Assessing bias and confounding',
      'Understanding statistical vs clinical significance',
      'Applying evidence to individual patients',
    ],
    duration: '30 min',
    tags: ['evidence-based practice', 'research', 'critical appraisal', 'statistics'],
    difficulty: 'advanced',
    dateAdded: '2024-01-24T00:00:00Z',
  },

  // ==================== TECHNOLOGY ====================
  {
    id: 'tech-001',
    title: 'Clinical AI: Benefits and Risks',
    type: 'article',
    category: 'technology',
    description: 'Understanding AI tools in healthcare, their appropriate use, and ethical considerations.',
    keyPoints: [
      'Current AI applications: diagnosis support, triage, documentation',
      'Algorithmic bias and health equity concerns',
      'Maintaining clinical judgment and accountability',
      'Patient consent and data privacy',
    ],
    author: 'Dr. Priya Sharma',
    duration: '17 min read',
    tags: ['AI', 'technology', 'ethics', 'clinical decision support'],
    difficulty: 'intermediate',
    dateAdded: '2024-02-25T00:00:00Z',
  },
];

// Helper functions for filtering and organizing resources

export function getResourcesByCategory(category: ResourceCategory): LearningResource[] {
  return LEARNING_RESOURCES.filter((r) => r.category === category);
}

export function getResourcesByType(type: ResourceType): LearningResource[] {
  return LEARNING_RESOURCES.filter((r) => r.type === type);
}

export function searchResources(query: string): LearningResource[] {
  const lowerQuery = query.toLowerCase();
  return LEARNING_RESOURCES.filter(
    (r) =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.description.toLowerCase().includes(lowerQuery) ||
      r.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      r.author?.toLowerCase().includes(lowerQuery)
  );
}

export function getFavoriteResources(): LearningResource[] {
  return LEARNING_RESOURCES.filter((r) => r.isFavorite);
}

export function getResourceById(id: string): LearningResource | undefined {
  return LEARNING_RESOURCES.find((r) => r.id === id);
}

export const CATEGORY_INFO: Record<
  ResourceCategory,
  { label: string; description: string; color: string }
> = {
  'clinical-skills': {
    label: 'Clinical Skills',
    description: 'Diagnostic reasoning, clinical decision-making, and patient care techniques',
    color: '#3b82f6',
  },
  'mental-health': {
    label: 'Mental Health',
    description: 'Wellbeing, stress management, and psychological resilience',
    color: '#8b5cf6',
  },
  communication: {
    label: 'Communication',
    description: 'Patient interactions, team collaboration, and difficult conversations',
    color: '#06b6d4',
  },
  ethics: {
    label: 'Ethics',
    description: 'Professional boundaries, ethical frameworks, and moral decision-making',
    color: '#10b981',
  },
  'self-care': {
    label: 'Self-Care',
    description: 'Personal wellness, work-life balance, and sustainable practice',
    color: '#f59e0b',
  },
  leadership: {
    label: 'Leadership',
    description: 'Team dynamics, feedback, and creating safe clinical environments',
    color: '#ef4444',
  },
  research: {
    label: 'Research',
    description: 'Evidence-based practice and critical appraisal skills',
    color: '#6366f1',
  },
  technology: {
    label: 'Technology',
    description: 'Clinical AI, digital tools, and healthcare innovation',
    color: '#14b8a6',
  },
  'patient-safety': {
    label: 'Patient Safety',
    description: 'Error prevention, speaking up, and systems improvement',
    color: '#f43f5e',
  },
  'burnout-prevention': {
    label: 'Burnout Prevention',
    description: 'Recognition, intervention, and recovery from occupational stress',
    color: '#ec4899',
  },
};

export const RESOURCE_TYPE_INFO: Record<ResourceType, { label: string; icon: string }> = {
  article: { label: 'Article', icon: '📄' },
  video: { label: 'Video', icon: '🎥' },
  podcast: { label: 'Podcast', icon: '🎧' },
  tool: { label: 'Tool', icon: '🔧' },
  book: { label: 'Book', icon: '📚' },
  course: { label: 'Course', icon: '🎓' },
  exercise: { label: 'Exercise', icon: '✏️' },
};
