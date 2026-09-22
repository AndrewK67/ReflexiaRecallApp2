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
  | 'burnout-prevention'
  | 'education'
  | 'legal'
  | 'business-management'
  | 'finance-accounting'
  | 'engineering'
  | 'emergency-services'
  | 'social-work'
  | 'creative-arts'
  | 'public-service'
  | 'customer-service';

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

  // ==================== EDUCATION ====================
  {
    id: 'edu-001',
    title: 'Reflective Practice in Teaching',
    type: 'article',
    category: 'education',
    description: 'Using structured reflection to improve teaching effectiveness and student outcomes.',
    keyPoints: [
      'Kolb and Gibbs reflective cycles for educators',
      'Critical incident analysis in classroom settings',
      'Peer observation and collaborative reflection',
      'Creating a reflective teaching portfolio',
    ],
    author: 'Dr. Rachel Green',
    duration: '14 min read',
    tags: ['teaching', 'professional development', 'pedagogy', 'reflection'],
    difficulty: 'intermediate',
    dateAdded: '2024-03-01T00:00:00Z',
    offlineContent: `Reflective practice is essential for continuous teaching improvement. Kolb's cycle (concrete experience, reflective observation, abstract conceptualization, active experimentation) helps teachers systematically analyze classroom experiences. Critical incident technique focuses on significant teaching moments - both successful and challenging. Regular reflection helps identify patterns in student engagement, assess instructional strategies, and refine classroom management. Maintain a teaching journal noting what worked, what didn't, and why. Peer observation provides external perspectives on teaching blind spots.`,
  },
  {
    id: 'edu-002',
    title: 'Differentiated Instruction Strategies',
    type: 'video',
    category: 'education',
    description: 'Practical approaches to meeting diverse student needs in mixed-ability classrooms.',
    keyPoints: [
      'Content, process, product differentiation',
      'Flexible grouping strategies',
      'Tiered assignments and scaffolding',
      'Assessment for learning vs assessment of learning',
    ],
    duration: '25 min',
    tags: ['differentiation', 'inclusive education', 'classroom management', 'student needs'],
    difficulty: 'intermediate',
    dateAdded: '2024-03-05T00:00:00Z',
  },
  {
    id: 'edu-003',
    title: 'Managing Teacher Stress and Workload',
    type: 'exercise',
    category: 'education',
    description: 'Evidence-based techniques for managing the emotional and time demands of teaching.',
    keyPoints: [
      'Boundary setting with work hours',
      'Efficient marking and feedback strategies',
      'Self-compassion for teaching challenges',
      'Building supportive professional networks',
    ],
    duration: '18 min',
    tags: ['teacher wellness', 'stress management', 'work-life balance', 'self-care'],
    difficulty: 'beginner',
    dateAdded: '2024-03-08T00:00:00Z',
    offlineContent: `Teaching is emotionally and cognitively demanding. Protect boundaries: set specific work hours and stick to them. Efficient marking: use rubrics, provide group feedback on common errors, focus detailed feedback on high-impact areas. Practice self-compassion: not every lesson will be perfect, and that's normal. Build networks: connect with colleagues for support, share resources, debrief challenging situations. Schedule regular breaks during term and fully disconnect during holidays. Recognize early signs of burnout: cynicism, exhaustion, reduced effectiveness.`,
  },

  // ==================== LEGAL ====================
  {
    id: 'legal-001',
    title: 'Ethical Dilemmas in Legal Practice',
    type: 'article',
    category: 'legal',
    description: 'Navigating conflicts between client advocacy and professional responsibility.',
    keyPoints: [
      'Confidentiality vs duty to report',
      'Conflicts of interest identification',
      'Candor to the court requirements',
      'Declining representation ethically',
    ],
    author: 'Sarah Martinez, JD',
    duration: '16 min read',
    tags: ['legal ethics', 'professional responsibility', 'client relations', 'integrity'],
    difficulty: 'advanced',
    dateAdded: '2024-03-10T00:00:00Z',
  },
  {
    id: 'legal-002',
    title: 'Reflective Practice for Lawyers',
    type: 'tool',
    category: 'legal',
    description: 'Structured frameworks for analyzing case outcomes and improving legal judgment.',
    keyPoints: [
      'Case outcome analysis beyond win/loss',
      'Client communication effectiveness review',
      'Legal strategy evaluation frameworks',
      'Continuing professional development through reflection',
    ],
    duration: '12 min',
    tags: ['reflection', 'legal practice', 'professional development', 'case analysis'],
    difficulty: 'intermediate',
    dateAdded: '2024-03-12T00:00:00Z',
  },

  // ==================== BUSINESS & MANAGEMENT ====================
  {
    id: 'biz-001',
    title: 'Strategic Decision-Making Frameworks',
    type: 'article',
    category: 'business-management',
    description: 'Structured approaches to making high-stakes business decisions under uncertainty.',
    keyPoints: [
      'SWOT analysis and competitive positioning',
      'Scenario planning and risk assessment',
      'Stakeholder analysis and management',
      'Decision trees and expected value calculations',
    ],
    author: 'James Chen, MBA',
    duration: '18 min read',
    tags: ['strategy', 'decision making', 'risk management', 'business analysis'],
    difficulty: 'advanced',
    dateAdded: '2024-03-15T00:00:00Z',
  },
  {
    id: 'biz-002',
    title: 'Leading Through Change',
    type: 'video',
    category: 'business-management',
    description: 'Change management principles for organizational transformation.',
    keyPoints: [
      "Kotter's 8-step change process",
      'Managing resistance and building buy-in',
      'Communication strategies during transition',
      'Sustaining change momentum',
    ],
    duration: '30 min',
    tags: ['change management', 'leadership', 'organizational development', 'communication'],
    difficulty: 'intermediate',
    dateAdded: '2024-03-18T00:00:00Z',
  },

  // ==================== FINANCE & ACCOUNTING ====================
  {
    id: 'fin-001',
    title: 'Professional Skepticism in Audit Practice',
    type: 'article',
    category: 'finance-accounting',
    description: 'Maintaining appropriate professional skepticism while building client relationships.',
    keyPoints: [
      'Balancing trust and verification',
      'Red flags in financial statements',
      'Questioning management assertions',
      'Documentation of skeptical inquiry',
    ],
    author: 'Michael Roberts, CPA',
    duration: '14 min read',
    tags: ['audit', 'professional skepticism', 'ethics', 'fraud detection'],
    difficulty: 'advanced',
    dateAdded: '2024-03-20T00:00:00Z',
  },
  {
    id: 'fin-002',
    title: 'Reflective Practice for Finance Professionals',
    type: 'exercise',
    category: 'finance-accounting',
    description: 'Using reflection to improve financial analysis and decision quality.',
    keyPoints: [
      'Post-decision analysis of forecasts',
      'Learning from estimation errors',
      'Ethical decision documentation',
      'Continuous professional competence',
    ],
    duration: '15 min',
    tags: ['reflection', 'professional development', 'financial analysis', 'ethics'],
    difficulty: 'intermediate',
    dateAdded: '2024-03-22T00:00:00Z',
  },

  // ==================== ENGINEERING ====================
  {
    id: 'eng-001',
    title: 'Root Cause Analysis for Engineering Failures',
    type: 'tool',
    category: 'engineering',
    description: 'Systematic methods for investigating technical failures and preventing recurrence.',
    keyPoints: [
      'Fishbone diagrams and 5 Whys technique',
      'Failure mode and effects analysis (FMEA)',
      'Lessons learned documentation',
      'Safety culture and error reporting',
    ],
    duration: '25 min',
    tags: ['root cause analysis', 'safety', 'quality', 'problem solving'],
    difficulty: 'advanced',
    dateAdded: '2024-03-25T00:00:00Z',
  },
  {
    id: 'eng-002',
    title: 'Engineering Ethics and Professional Responsibility',
    type: 'article',
    category: 'engineering',
    description: 'Ethical frameworks for engineering practice and public safety responsibilities.',
    keyPoints: [
      'Professional codes of conduct',
      'Whistleblowing and duty to public',
      'Conflicts between safety and cost',
      'Environmental and social responsibilities',
    ],
    author: 'Dr. Patricia Lee, PE',
    duration: '16 min read',
    tags: ['ethics', 'professional responsibility', 'public safety', 'sustainability'],
    difficulty: 'intermediate',
    dateAdded: '2024-03-28T00:00:00Z',
  },

  // ==================== EMERGENCY SERVICES ====================
  {
    id: 'emer-001',
    title: 'Critical Incident Stress Management',
    type: 'article',
    category: 'emergency-services',
    description: 'Recognizing and managing psychological impact of traumatic emergency responses.',
    keyPoints: [
      'Normal reactions to abnormal events',
      'Critical incident stress debriefing (CISD)',
      'Peer support and professional counseling',
      'Long-term resilience building',
    ],
    author: 'Chief Robert Thompson',
    duration: '18 min read',
    tags: ['trauma', 'mental health', 'peer support', 'resilience'],
    difficulty: 'intermediate',
    dateAdded: '2024-04-01T00:00:00Z',
    offlineContent: `Emergency responders face repeated exposure to traumatic events. Normal stress reactions include sleep disturbance, intrusive thoughts, hypervigilance, and emotional numbing. Critical incident stress debriefing within 24-72 hours helps process traumatic responses. Peer support programs provide immediate, confidential assistance from colleagues who understand the work. Professional counseling should be readily available without stigma. Build resilience through physical fitness, strong social connections, healthy coping mechanisms, and regular mental health check-ins. Organizations must create culture where seeking help is normalized.`,
  },
  {
    id: 'emer-002',
    title: 'After-Action Reviews for Emergency Operations',
    type: 'tool',
    category: 'emergency-services',
    description: 'Structured debriefing process to learn from emergency incidents and improve response.',
    keyPoints: [
      'What was supposed to happen vs what actually happened',
      'Identifying effective practices and gaps',
      'Blame-free analysis culture',
      'Actionable improvements and follow-up',
    ],
    duration: '20 min',
    tags: ['debriefing', 'continuous improvement', 'operations', 'learning'],
    difficulty: 'intermediate',
    dateAdded: '2024-04-05T00:00:00Z',
  },

  // ==================== SOCIAL WORK ====================
  {
    id: 'sw-001',
    title: 'Reflective Supervision in Social Work',
    type: 'article',
    category: 'social-work',
    description: 'Using supervision to process complex cases and maintain professional boundaries.',
    keyPoints: [
      'Functions of supervision: support, education, management',
      'Parallel process in supervision relationships',
      'Self-care and vicarious trauma prevention',
      'Ethical dilemma exploration',
    ],
    author: 'Dr. Linda Martinez, LCSW',
    duration: '15 min read',
    tags: ['supervision', 'self-care', 'professional development', 'ethics'],
    difficulty: 'intermediate',
    dateAdded: '2024-04-08T00:00:00Z',
  },
  {
    id: 'sw-002',
    title: 'Trauma-Informed Practice Principles',
    type: 'video',
    category: 'social-work',
    description: 'Understanding trauma impact and applying trauma-informed approaches in social work.',
    keyPoints: [
      'Recognizing signs and impact of trauma',
      'Safety, trustworthiness, and collaboration',
      'Avoiding re-traumatization in interventions',
      'Cultural considerations in trauma work',
    ],
    duration: '28 min',
    tags: ['trauma-informed', 'client care', 'safety', 'cultural competence'],
    difficulty: 'advanced',
    dateAdded: '2024-04-10T00:00:00Z',
  },

  // ==================== CREATIVE ARTS ====================
  {
    id: 'art-001',
    title: 'Reflective Practice for Creative Professionals',
    type: 'article',
    category: 'creative-arts',
    description: 'Using reflection to develop artistic practice and overcome creative blocks.',
    keyPoints: [
      'Documenting creative process and decisions',
      'Learning from both successes and failures',
      'Peer critique and feedback integration',
      'Balancing artistic vision with practical constraints',
    ],
    author: 'Maya Johnson',
    duration: '12 min read',
    tags: ['creative process', 'artistic development', 'reflection', 'feedback'],
    difficulty: 'beginner',
    dateAdded: '2024-04-12T00:00:00Z',
  },
  {
    id: 'art-002',
    title: 'Managing Creative Career Sustainability',
    type: 'exercise',
    category: 'creative-arts',
    description: 'Strategies for long-term success in creative professions.',
    keyPoints: [
      'Financial planning for irregular income',
      'Building diverse revenue streams',
      'Networking and professional community',
      'Preventing creative burnout',
    ],
    duration: '20 min',
    tags: ['career development', 'financial planning', 'sustainability', 'networking'],
    difficulty: 'intermediate',
    dateAdded: '2024-04-15T00:00:00Z',
  },

  // ==================== PUBLIC SERVICE ====================
  {
    id: 'pub-001',
    title: 'Ethical Decision-Making in Public Service',
    type: 'article',
    category: 'public-service',
    description: 'Navigating competing interests and maintaining public trust.',
    keyPoints: [
      'Public interest vs political pressure',
      'Transparency and accountability principles',
      'Conflicts of interest management',
      'Whistleblower protections and responsibilities',
    ],
    author: 'Dr. Thomas Anderson',
    duration: '14 min read',
    tags: ['ethics', 'public accountability', 'transparency', 'integrity'],
    difficulty: 'advanced',
    dateAdded: '2024-04-18T00:00:00Z',
  },
  {
    id: 'pub-002',
    title: 'Stakeholder Engagement Best Practices',
    type: 'tool',
    category: 'public-service',
    description: 'Effective consultation and communication with diverse public stakeholders.',
    keyPoints: [
      'Identifying and mapping stakeholders',
      'Inclusive engagement strategies',
      'Managing conflicting stakeholder interests',
      'Feedback integration and accountability',
    ],
    duration: '18 min',
    tags: ['stakeholder engagement', 'consultation', 'communication', 'public participation'],
    difficulty: 'intermediate',
    dateAdded: '2024-04-20T00:00:00Z',
  },

  // ==================== CUSTOMER SERVICE ====================
  {
    id: 'cs-service-001',
    title: 'De-escalation Techniques for Customer Service',
    type: 'video',
    category: 'customer-service',
    description: 'Managing difficult customer interactions with empathy and professionalism.',
    keyPoints: [
      'Active listening and acknowledgment',
      'LEAP technique: Listen, Empathize, Apologize, Problem-solve',
      'Managing own emotional responses',
      'When to escalate vs resolve',
    ],
    duration: '22 min',
    tags: ['de-escalation', 'conflict resolution', 'empathy', 'communication'],
    difficulty: 'beginner',
    dateAdded: '2024-04-22T00:00:00Z',
  },
  {
    id: 'cs-service-002',
    title: 'Preventing Burnout in Customer-Facing Roles',
    type: 'article',
    category: 'customer-service',
    description: 'Self-care strategies for emotionally demanding customer service work.',
    keyPoints: [
      'Emotional labor and its impact',
      'Boundary setting with customers',
      'Peer support and debriefing',
      'Recovery practices between interactions',
    ],
    author: 'Jennifer Williams',
    duration: '13 min read',
    tags: ['burnout prevention', 'self-care', 'emotional labor', 'boundaries'],
    difficulty: 'intermediate',
    dateAdded: '2024-04-25T00:00:00Z',
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
  education: {
    label: 'Education',
    description: 'Teaching practice, pedagogy, and professional development for educators',
    color: '#14b8a6',
  },
  legal: {
    label: 'Legal',
    description: 'Legal ethics, professional responsibility, and case analysis',
    color: '#10b981',
  },
  'business-management': {
    label: 'Business & Management',
    description: 'Strategic thinking, leadership, and organizational development',
    color: '#f59e0b',
  },
  'finance-accounting': {
    label: 'Finance & Accounting',
    description: 'Professional skepticism, ethics, and financial practice',
    color: '#06b6d4',
  },
  engineering: {
    label: 'Engineering',
    description: 'Technical problem-solving, safety, and professional responsibility',
    color: '#6366f1',
  },
  'emergency-services': {
    label: 'Emergency Services',
    description: 'Critical incident management, resilience, and operational learning',
    color: '#ef4444',
  },
  'social-work': {
    label: 'Social Work',
    description: 'Supervision, trauma-informed practice, and professional boundaries',
    color: '#8b5cf6',
  },
  'creative-arts': {
    label: 'Creative Arts',
    description: 'Artistic development, creative process, and career sustainability',
    color: '#ec4899',
  },
  'public-service': {
    label: 'Public Service',
    description: 'Public accountability, ethical decision-making, and stakeholder engagement',
    color: '#3b82f6',
  },
  'customer-service': {
    label: 'Customer Service',
    description: 'De-escalation, empathy, and preventing emotional burnout',
    color: '#f43f5e',
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
