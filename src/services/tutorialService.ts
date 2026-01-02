/**
 * Tutorial Service
 * Gamified tutorial system that guides users through all features
 */

export type TutorialStep =
  | 'WELCOME'
  | 'FIRST_REFLECTION'
  | 'QUICK_CAPTURE'
  | 'DRIVE_MODE'
  | 'ORACLE_CHAT'
  | 'HOLODECK'
  | 'MENTAL_ATLAS'
  | 'CPD_TRACKING'
  | 'PROFESSIONAL_DOCS'
  | 'GAMIFICATION'
  | 'BIO_RHYTHM'
  | 'GROUNDING'
  | 'CRISIS_PROTOCOLS'
  | 'CALENDAR_VIEW'
  | 'CANVAS_BOARD'
  | 'LIBRARY'
  | 'REPORTS'
  | 'ARCHIVE'
  | 'NEURAL_LINK'
  | 'COMPLETED';

export interface TutorialProgress {
  currentStep: TutorialStep;
  completedSteps: TutorialStep[];
  xpEarned: number;
  badgesEarned: string[];
  startedAt: string;
  lastCompletedAt?: string;
  skipped: boolean;
}

interface TutorialStepConfig {
  id: TutorialStep;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  badge?: string;
  targetView?: string;
  instructions: string[];
  completionCriteria: string;
  funFact?: string;
}

const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    id: 'WELCOME',
    title: 'Welcome to Reflexia! 🎉',
    description: 'Your journey to professional excellence begins here',
    icon: '🚀',
    xpReward: 50,
    badge: 'New Explorer',
    instructions: [
      'Welcome to Reflexia, your AI-powered reflection companion!',
      'This tutorial will guide you through all the amazing features',
      'Complete each step to earn XP and unlock achievements',
      'You can skip anytime, but completing gives you bonus rewards!',
    ],
    completionCriteria: 'Click "Start Tutorial" to begin your journey',
  },
  {
    id: 'FIRST_REFLECTION',
    title: 'Create Your First Reflection ✍️',
    description: 'Learn the heart of Reflexia - structured reflection',
    icon: '📝',
    xpReward: 100,
    badge: 'Reflective Thinker',
    targetView: 'REFLECTION',
    instructions: [
      'Reflections help you learn from your experiences',
      'Choose a reflection model (we recommend Gibbs for beginners)',
      'Answer the prompts thoughtfully - AI will help you along the way',
      'Save your reflection when done',
    ],
    completionCriteria: 'Complete and save your first reflection',
    funFact: 'Did you know? Regular reflection improves learning by 23% according to research!',
  },
  {
    id: 'QUICK_CAPTURE',
    title: 'Quick Capture Mode 🎯',
    description: 'Capture thoughts instantly, reflect later',
    icon: '⚡',
    xpReward: 75,
    targetView: 'QUICK_CAPTURE',
    instructions: [
      'Sometimes you need to capture thoughts FAST',
      'Quick Capture lets you jot down ideas in seconds',
      'Add voice notes, photos, or quick text',
      'You can convert to full reflections later',
    ],
    completionCriteria: 'Create one quick capture entry',
    funFact: 'Quick captures are perfect for busy professionals on the go!',
  },
  {
    id: 'DRIVE_MODE',
    title: 'Drive Mode 🚗',
    description: 'Voice-powered reflection while you drive or commute',
    icon: '🎤',
    xpReward: 75,
    targetView: 'DRIVE_MODE',
    instructions: [
      'Drive Mode lets you reflect hands-free using voice',
      'Perfect for commutes, walks, or anytime you\'re on the move',
      'Just speak your thoughts - the app handles the rest',
      'Voice entries are automatically transcribed',
    ],
    completionCriteria: 'Try Drive Mode (tap the microphone)',
    funFact: 'Many professionals do their best thinking during commutes!',
  },
  {
    id: 'ORACLE_CHAT',
    title: 'Oracle AI Assistant 🤖',
    description: 'Chat with your AI reflection guide',
    icon: '💬',
    xpReward: 100,
    badge: 'Oracle Seeker',
    targetView: 'ORACLE',
    instructions: [
      'Oracle is your personal AI reflection coach',
      'Ask questions about your reflections and growth',
      'Get insights and suggestions for improvement',
      'Oracle learns from all your entries to give personalized advice',
    ],
    completionCriteria: 'Have a conversation with Oracle',
    funFact: 'Oracle analyzes patterns across all your reflections to spot growth opportunities!',
  },
  {
    id: 'HOLODECK',
    title: 'Holodeck Scenarios 🎭',
    description: 'Practice difficult situations in a safe space',
    icon: '🌟',
    xpReward: 150,
    badge: 'Scenario Master',
    targetView: 'HOLODECK',
    instructions: [
      'Holodeck lets you practice challenging scenarios',
      'Role-play difficult conversations with AI',
      'Prepare for presentations, interviews, or tough discussions',
      'Get feedback on your approach and communication',
    ],
    completionCriteria: 'Complete one Holodeck scenario',
    funFact: 'Practicing scenarios improves real-world performance by up to 40%!',
  },
  {
    id: 'MENTAL_ATLAS',
    title: 'Mental Atlas 🗺️',
    description: 'Visualize your knowledge and growth',
    icon: '🧠',
    xpReward: 100,
    targetView: 'MENTAL_ATLAS',
    instructions: [
      'Mental Atlas creates a visual map of your learning',
      'See connections between your reflections and topics',
      'Identify knowledge gaps and growth areas',
      'Watch your understanding evolve over time',
    ],
    completionCriteria: 'Explore your Mental Atlas',
    funFact: 'Visual learning aids improve retention by 400% compared to text alone!',
  },
  {
    id: 'CPD_TRACKING',
    title: 'CPD Tracking 📋',
    description: 'Track professional development for 29+ regulatory bodies',
    icon: '📊',
    xpReward: 100,
    badge: 'CPD Champion',
    targetView: 'CPD',
    instructions: [
      'Reflexia tracks CPD automatically from your reflections',
      'Supports NMC, GMC, HCPC, and 26+ other regulators',
      'Export CPD logs for revalidation and compliance',
      'Track hours, categories, and evidence',
    ],
    completionCriteria: 'View your CPD dashboard and select your regulatory body',
    funFact: 'Reflexia supports professionals from healthcare, law, finance, engineering, and more!',
  },
  {
    id: 'PROFESSIONAL_DOCS',
    title: 'Professional Documentation 📄',
    description: 'Generate ready-to-submit documentation',
    icon: '📑',
    xpReward: 100,
    targetView: 'PROFESSIONAL_DOC',
    instructions: [
      'Turn reflections into professional documentation instantly',
      'Supports NMC Revalidation, GMC Appraisal, HCPC CPD, and more',
      'Select a template, choose reflections, and generate',
      'Copy or download ready-to-submit text',
    ],
    completionCriteria: 'Generate one professional document',
    funFact: 'Save hours on paperwork - generate compliant documentation in seconds!',
  },
  {
    id: 'GAMIFICATION',
    title: 'Achievements & Progress 🏆',
    description: 'Track your growth with XP, levels, and badges',
    icon: '⭐',
    xpReward: 75,
    targetView: 'GAMIFICATION',
    instructions: [
      'Gamification makes reflection rewarding and fun',
      'Earn XP for every reflection and activity',
      'Level up and unlock badges',
      'Track streaks and celebrate milestones',
    ],
    completionCriteria: 'Check your achievements and level',
    funFact: 'You\'re already earning XP by completing this tutorial!',
  },
  {
    id: 'BIO_RHYTHM',
    title: 'BioRhythm Tracker 📈',
    description: 'Track your physical, emotional, and intellectual cycles',
    icon: '🌊',
    xpReward: 50,
    targetView: 'BIO_RHYTHM',
    instructions: [
      'BioRhythm shows your natural energy cycles',
      'Track physical, emotional, and intellectual states',
      'Plan important activities during peak periods',
      'Understand patterns in your performance',
    ],
    completionCriteria: 'View your BioRhythm chart',
    funFact: 'BioRhythm theory suggests we have natural 23, 28, and 33-day cycles!',
  },
  {
    id: 'GROUNDING',
    title: 'Grounding Exercises 🧘',
    description: 'Quick exercises for stress and anxiety',
    icon: '🌿',
    xpReward: 50,
    targetView: 'GROUNDING',
    instructions: [
      'Grounding exercises help manage stress and anxiety',
      'Try breathing exercises, 5-4-3-2-1 technique, or progressive relaxation',
      'Perfect before difficult situations or when overwhelmed',
      'Takes just 2-5 minutes',
    ],
    completionCriteria: 'Try one grounding exercise',
    funFact: 'Just 2 minutes of deep breathing can reduce cortisol by 20%!',
  },
  {
    id: 'CRISIS_PROTOCOLS',
    title: 'Crisis Protocols 🚨',
    description: 'Emergency support and resources',
    icon: '🆘',
    xpReward: 50,
    targetView: 'CRISIS_PROTOCOLS',
    instructions: [
      'Crisis Protocols provide immediate support resources',
      'Access emergency contacts and helplines',
      'Step-by-step guidance for different crisis types',
      'Always available when you need help',
    ],
    completionCriteria: 'View Crisis Protocols (just to know where they are)',
    funFact: 'Having a crisis plan increases safety and reduces anxiety!',
  },
  {
    id: 'CALENDAR_VIEW',
    title: 'Calendar View 📅',
    description: 'See your reflections over time',
    icon: '🗓️',
    xpReward: 50,
    targetView: 'CALENDAR',
    instructions: [
      'Calendar View shows all your entries by date',
      'See patterns in your reflection habits',
      'Identify busy periods and gaps',
      'Track streaks and consistency',
    ],
    completionCriteria: 'Open Calendar View',
    funFact: 'Consistent reflection creates lasting behavioral change!',
  },
  {
    id: 'CANVAS_BOARD',
    title: 'Canvas Board 🎨',
    description: 'Visual thinking and mind mapping',
    icon: '🖌️',
    xpReward: 75,
    targetView: 'CANVAS',
    instructions: [
      'Canvas Board lets you think visually',
      'Create mind maps, diagrams, and sketches',
      'Perfect for brainstorming and planning',
      'Add sticky notes, drawings, and connections',
    ],
    completionCriteria: 'Create something on the Canvas',
    funFact: 'Visual thinking activates different brain regions than text!',
  },
  {
    id: 'LIBRARY',
    title: 'Resource Library 📚',
    description: 'Curated resources for professional growth',
    icon: '📖',
    xpReward: 50,
    targetView: 'LIBRARY',
    instructions: [
      'The Library contains curated learning resources',
      'Articles, guides, and tools for your profession',
      'Save resources for later',
      'Build your personal knowledge base',
    ],
    completionCriteria: 'Browse the Library',
    funFact: 'Continuous learning is the #1 predictor of career success!',
  },
  {
    id: 'REPORTS',
    title: 'Reports & Analytics 📊',
    description: 'Insights from your reflection data',
    icon: '📈',
    xpReward: 75,
    targetView: 'REPORTS',
    instructions: [
      'Reports show patterns in your reflections',
      'See trends in mood, topics, and growth',
      'Identify what works and what doesn\'t',
      'Export data for deeper analysis',
    ],
    completionCriteria: 'View your Reports',
    funFact: 'Data-driven reflection leads to 35% faster skill development!',
  },
  {
    id: 'ARCHIVE',
    title: 'Archive & Search 🔍',
    description: 'Find and organize your reflections',
    icon: '📦',
    xpReward: 50,
    targetView: 'ARCHIVE',
    instructions: [
      'Archive contains all your past reflections',
      'Search by keyword, date, or tag',
      'Filter by type, model, or mood',
      'Export individual entries or collections',
    ],
    completionCriteria: 'Search for a reflection',
    funFact: 'The average professional creates 100+ reflections per year!',
  },
  {
    id: 'NEURAL_LINK',
    title: 'Neural Link Settings ⚙️',
    description: 'Customize Reflexia to your preferences',
    icon: '🔧',
    xpReward: 50,
    targetView: 'NEURAL_LINK',
    instructions: [
      'Neural Link is your settings and profile hub',
      'Customize AI features, privacy, and preferences',
      'Set up your profession and regulatory body',
      'Manage data and privacy settings',
    ],
    completionCriteria: 'Open Neural Link',
    funFact: 'Reflexia is built privacy-first - your data stays on your device!',
  },
  {
    id: 'COMPLETED',
    title: 'Tutorial Complete! 🎊',
    description: 'You\'ve mastered Reflexia!',
    icon: '🎉',
    xpReward: 500,
    badge: 'Tutorial Master',
    instructions: [
      'Congratulations! You\'ve completed the full tutorial!',
      'You\'ve earned bonus XP and the "Tutorial Master" badge',
      'You now know all of Reflexia\'s powerful features',
      'Keep reflecting, keep growing, keep achieving! 🚀',
    ],
    completionCriteria: 'Celebrate your achievement!',
    funFact: 'You\'re now part of the top 5% of users who complete the full tutorial!',
  },
];

const STORAGE_KEY = 'reflexia_tutorial_progress';

/**
 * Get current tutorial progress
 */
export function getTutorialProgress(): TutorialProgress | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

/**
 * Initialize tutorial
 */
export function initializeTutorial(): TutorialProgress {
  const progress: TutorialProgress = {
    currentStep: 'WELCOME',
    completedSteps: [],
    xpEarned: 0,
    badgesEarned: [],
    startedAt: new Date().toISOString(),
    skipped: false,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

/**
 * Complete a tutorial step
 */
export function completeStep(stepId: TutorialStep): {
  progress: TutorialProgress;
  xpEarned: number;
  badgeEarned?: string;
  nextStep?: TutorialStepConfig;
  allCompleted: boolean;
} {
  const progress = getTutorialProgress() || initializeTutorial();
  const stepConfig = TUTORIAL_STEPS.find(s => s.id === stepId);

  if (!stepConfig) {
    return { progress, xpEarned: 0, allCompleted: false };
  }

  // Don't re-complete steps
  if (progress.completedSteps.includes(stepId)) {
    return { progress, xpEarned: 0, allCompleted: false };
  }

  // Mark step as completed
  progress.completedSteps.push(stepId);
  progress.xpEarned += stepConfig.xpReward;
  progress.lastCompletedAt = new Date().toISOString();

  if (stepConfig.badge && !progress.badgesEarned.includes(stepConfig.badge)) {
    progress.badgesEarned.push(stepConfig.badge);
  }

  // Find next step
  const currentIndex = TUTORIAL_STEPS.findIndex(s => s.id === stepId);
  const nextStep = currentIndex < TUTORIAL_STEPS.length - 1
    ? TUTORIAL_STEPS[currentIndex + 1]
    : undefined;

  if (nextStep) {
    progress.currentStep = nextStep.id;
  }

  // Check if all steps completed
  const allCompleted = stepId === 'COMPLETED';

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

  return {
    progress,
    xpEarned: stepConfig.xpReward,
    badgeEarned: stepConfig.badge,
    nextStep,
    allCompleted,
  };
}

/**
 * Skip tutorial
 */
export function skipTutorial(): void {
  const progress = getTutorialProgress() || initializeTutorial();
  progress.skipped = true;
  progress.currentStep = 'COMPLETED';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Reset tutorial
 */
export function resetTutorial(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get current step config
 */
export function getCurrentStepConfig(progress?: TutorialProgress): TutorialStepConfig | null {
  const tutorialProgress = progress || getTutorialProgress();
  if (!tutorialProgress) return null;

  return TUTORIAL_STEPS.find(s => s.id === tutorialProgress.currentStep) || null;
}

/**
 * Get all tutorial steps
 */
export function getAllSteps(): TutorialStepConfig[] {
  return TUTORIAL_STEPS;
}

/**
 * Get step by ID
 */
export function getStepById(stepId: TutorialStep): TutorialStepConfig | undefined {
  return TUTORIAL_STEPS.find(s => s.id === stepId);
}

/**
 * Calculate completion percentage
 */
export function getCompletionPercentage(progress?: TutorialProgress): number {
  const tutorialProgress = progress || getTutorialProgress();
  if (!tutorialProgress) return 0;

  const totalSteps = TUTORIAL_STEPS.length - 1; // Exclude WELCOME
  const completed = tutorialProgress.completedSteps.length;

  return Math.round((completed / totalSteps) * 100);
}

/**
 * Check if tutorial should be shown
 */
export function shouldShowTutorial(): boolean {
  const progress = getTutorialProgress();

  // Show if never started
  if (!progress) return true;

  // Don't show if skipped
  if (progress.skipped) return false;

  // Don't show if completed
  if (progress.currentStep === 'COMPLETED') return false;

  // Show if in progress
  return true;
}

/**
 * Check if step is completed
 */
export function isStepCompleted(stepId: TutorialStep): boolean {
  const progress = getTutorialProgress();
  if (!progress) return false;

  return progress.completedSteps.includes(stepId);
}
