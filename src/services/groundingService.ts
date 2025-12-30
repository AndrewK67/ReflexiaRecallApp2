/**
 * Grounding & Breathing Service
 * Manages grounding techniques, breathing patterns, and session tracking
 */

const GROUNDING_SESSIONS_KEY = 'reflexia_grounding_sessions';
const GROUNDING_STATS_KEY = 'reflexia_grounding_stats';

export type GroundingTechniqueId =
  | 'five-four-three-two-one'
  | 'box-breathing'
  | 'four-seven-eight'
  | 'physiological-sigh'
  | 'resonant-breathing'
  | 'body-scan';

export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  phases: BreathingPhase[];
  cycles?: number; // Number of cycles to complete (optional)
  duration?: number; // Total duration in seconds (optional)
}

export interface BreathingPhase {
  type: 'inhale' | 'hold' | 'exhale' | 'pause';
  duration: number; // in seconds
  instruction: string;
}

export interface GroundingTechnique {
  id: GroundingTechniqueId;
  name: string;
  shortName: string;
  description: string;
  duration: string; // Estimated duration
  category: 'breathing' | 'sensory' | 'physical';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  benefits: string[];
  whenToUse: string;
  breathingPattern?: BreathingPattern;
}

export interface GroundingSession {
  id: string;
  techniqueId: GroundingTechniqueId;
  startedAt: string;
  completedAt?: string;
  completed: boolean;
  cyclesCompleted?: number;
}

export interface GroundingStats {
  totalSessions: number;
  totalMinutes: number;
  favoriteTechnique?: GroundingTechniqueId;
  lastSessionDate?: string;
  streakDays: number;
}

// Breathing Patterns
export const BREATHING_PATTERNS: Record<string, BreathingPattern> = {
  'box-breathing': {
    id: 'box-breathing',
    name: 'Box Breathing',
    description: 'Equal 4-count breathing used by Navy SEALs for stress reduction',
    cycles: 4,
    phases: [
      { type: 'inhale', duration: 4, instruction: 'Breathe in through your nose' },
      { type: 'hold', duration: 4, instruction: 'Hold your breath' },
      { type: 'exhale', duration: 4, instruction: 'Breathe out through your mouth' },
      { type: 'hold', duration: 4, instruction: 'Hold your breath' },
    ],
  },
  'four-seven-eight': {
    id: 'four-seven-eight',
    name: '4-7-8 Breathing',
    description: 'Developed by Dr. Andrew Weil for relaxation and sleep',
    cycles: 4,
    phases: [
      { type: 'inhale', duration: 4, instruction: 'Breathe in quietly through your nose' },
      { type: 'hold', duration: 7, instruction: 'Hold your breath' },
      { type: 'exhale', duration: 8, instruction: 'Exhale completely through your mouth with a whoosh' },
    ],
  },
  'physiological-sigh': {
    id: 'physiological-sigh',
    name: 'Physiological Sigh',
    description: 'Double inhale followed by long exhale for rapid stress relief',
    cycles: 3,
    phases: [
      { type: 'inhale', duration: 2, instruction: 'First quick inhale through nose' },
      { type: 'inhale', duration: 1, instruction: 'Second quick inhale through nose' },
      { type: 'exhale', duration: 6, instruction: 'Long, slow exhale through mouth' },
    ],
  },
  'resonant-breathing': {
    id: 'resonant-breathing',
    name: 'Resonant Breathing',
    description: 'Breathing at 5-6 breaths per minute for optimal heart rate variability',
    duration: 300, // 5 minutes
    phases: [
      { type: 'inhale', duration: 5, instruction: 'Breathe in slowly and deeply' },
      { type: 'exhale', duration: 5, instruction: 'Breathe out slowly and completely' },
    ],
  },
};

// Grounding Techniques
export const GROUNDING_TECHNIQUES: Record<GroundingTechniqueId, GroundingTechnique> = {
  'five-four-three-two-one': {
    id: 'five-four-three-two-one',
    name: '5-4-3-2-1 Grounding',
    shortName: '5-4-3-2-1',
    description: 'Sensory grounding technique to bring you into the present moment',
    duration: '3-5 min',
    category: 'sensory',
    difficulty: 'beginner',
    benefits: [
      'Reduces anxiety and panic',
      'Brings awareness to the present',
      'Interrupts racing thoughts',
      'Can be done anywhere, anytime',
    ],
    whenToUse: 'When feeling anxious, overwhelmed, or dissociating',
  },
  'box-breathing': {
    id: 'box-breathing',
    name: 'Box Breathing',
    shortName: 'Box',
    description: 'Equal-count breathing pattern for stress reduction and focus',
    duration: '2-5 min',
    category: 'breathing',
    difficulty: 'beginner',
    benefits: [
      'Calms the nervous system',
      'Improves focus and concentration',
      'Reduces stress hormones',
      'Used by military and first responders',
    ],
    whenToUse: 'Before high-stress situations, during anxiety, or for mental clarity',
    breathingPattern: BREATHING_PATTERNS['box-breathing'],
  },
  'four-seven-eight': {
    id: 'four-seven-eight',
    name: '4-7-8 Breathing',
    shortName: '4-7-8',
    description: 'Relaxing breath pattern developed by Dr. Andrew Weil',
    duration: '2-4 min',
    category: 'breathing',
    difficulty: 'intermediate',
    benefits: [
      'Promotes deep relaxation',
      'Helps with sleep onset',
      'Reduces anxiety',
      'Lowers blood pressure',
    ],
    whenToUse: 'Before bed, during panic attacks, or for deep relaxation',
    breathingPattern: BREATHING_PATTERNS['four-seven-eight'],
  },
  'physiological-sigh': {
    id: 'physiological-sigh',
    name: 'Physiological Sigh',
    shortName: 'Sigh',
    description: 'Double inhale, long exhale for rapid stress relief',
    duration: '30 sec - 1 min',
    category: 'breathing',
    difficulty: 'beginner',
    benefits: [
      'Rapid stress reduction',
      'Resets the nervous system',
      'Increases alertness',
      'Backed by neuroscience research',
    ],
    whenToUse: 'For immediate stress relief or to break a stress cycle',
    breathingPattern: BREATHING_PATTERNS['physiological-sigh'],
  },
  'resonant-breathing': {
    id: 'resonant-breathing',
    name: 'Resonant Breathing',
    shortName: 'Resonant',
    description: 'Slow breathing at 5-6 breaths per minute',
    duration: '5-10 min',
    category: 'breathing',
    difficulty: 'intermediate',
    benefits: [
      'Optimizes heart rate variability',
      'Balances autonomic nervous system',
      'Deep emotional regulation',
      'Scientifically validated',
    ],
    whenToUse: 'For deep relaxation, emotional regulation, or daily practice',
    breathingPattern: BREATHING_PATTERNS['resonant-breathing'],
  },
  'body-scan': {
    id: 'body-scan',
    name: 'Body Scan Meditation',
    shortName: 'Body Scan',
    description: 'Progressive awareness through the entire body',
    duration: '10-15 min',
    category: 'physical',
    difficulty: 'intermediate',
    benefits: [
      'Releases physical tension',
      'Increases body awareness',
      'Promotes deep relaxation',
      'Helps identify stress patterns',
    ],
    whenToUse: 'For deep relaxation, before sleep, or for chronic tension',
  },
};

/**
 * Get all grounding sessions
 */
export function getGroundingSessions(): GroundingSession[] {
  const stored = localStorage.getItem(GROUNDING_SESSIONS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save grounding sessions
 */
function saveGroundingSessions(sessions: GroundingSession[]): void {
  localStorage.setItem(GROUNDING_SESSIONS_KEY, JSON.stringify(sessions));
}

/**
 * Start a new grounding session
 */
export function startGroundingSession(techniqueId: GroundingTechniqueId): GroundingSession {
  const session: GroundingSession = {
    id: `grounding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    techniqueId,
    startedAt: new Date().toISOString(),
    completed: false,
  };

  const sessions = getGroundingSessions();
  sessions.push(session);
  saveGroundingSessions(sessions);

  return session;
}

/**
 * Complete a grounding session
 */
export function completeGroundingSession(
  sessionId: string,
  cyclesCompleted?: number
): void {
  const sessions = getGroundingSessions();
  const session = sessions.find((s) => s.id === sessionId);

  if (session) {
    session.completed = true;
    session.completedAt = new Date().toISOString();
    if (cyclesCompleted !== undefined) {
      session.cyclesCompleted = cyclesCompleted;
    }
    saveGroundingSessions(sessions);
    updateGroundingStats(session);
  }
}

/**
 * Update grounding statistics
 */
function updateGroundingStats(session: GroundingSession): void {
  const stats = getGroundingStats();

  stats.totalSessions += 1;

  // Calculate minutes
  if (session.completedAt) {
    const start = new Date(session.startedAt).getTime();
    const end = new Date(session.completedAt).getTime();
    const minutes = Math.round((end - start) / 60000);
    stats.totalMinutes += minutes;
  }

  // Update favorite technique
  const sessions = getGroundingSessions().filter((s) => s.completed);
  const counts = sessions.reduce((acc, s) => {
    acc[s.techniqueId] = (acc[s.techniqueId] || 0) + 1;
    return acc;
  }, {} as Record<GroundingTechniqueId, number>);

  const favorite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (favorite) {
    stats.favoriteTechnique = favorite[0] as GroundingTechniqueId;
  }

  stats.lastSessionDate = session.completedAt;

  // Calculate streak
  stats.streakDays = calculateStreak(sessions);

  saveGroundingStats(stats);
}

/**
 * Calculate current streak of daily practice
 */
function calculateStreak(sessions: GroundingSession[]): number {
  if (sessions.length === 0) return 0;

  const completedSessions = sessions
    .filter((s) => s.completed && s.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  if (completedSessions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastSessionDate = new Date(completedSessions[0].completedAt!);
  lastSessionDate.setHours(0, 0, 0, 0);

  // Check if last session was today or yesterday to continue streak
  if (lastSessionDate.getTime() !== today.getTime() && lastSessionDate.getTime() !== yesterday.getTime()) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(today);

  const dateSet = new Set(
    completedSessions.map((s) => {
      const d = new Date(s.completedAt!);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  while (dateSet.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

/**
 * Get grounding statistics
 */
export function getGroundingStats(): GroundingStats {
  const stored = localStorage.getItem(GROUNDING_STATS_KEY);
  if (!stored) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      streakDays: 0,
    };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      streakDays: 0,
    };
  }
}

/**
 * Save grounding statistics
 */
function saveGroundingStats(stats: GroundingStats): void {
  localStorage.setItem(GROUNDING_STATS_KEY, JSON.stringify(stats));
}

/**
 * Get recommended technique based on time of day and user history
 */
export function getRecommendedTechnique(): GroundingTechniqueId {
  const hour = new Date().getHours();
  const stats = getGroundingStats();

  // If user has a favorite, recommend it 30% of the time
  if (stats.favoriteTechnique && Math.random() < 0.3) {
    return stats.favoriteTechnique;
  }

  // Morning: energizing techniques
  if (hour >= 5 && hour < 12) {
    return 'box-breathing';
  }

  // Afternoon: focus techniques
  if (hour >= 12 && hour < 18) {
    return 'physiological-sigh';
  }

  // Evening: relaxing techniques
  if (hour >= 18 && hour < 22) {
    return 'four-seven-eight';
  }

  // Late night: sleep techniques
  return 'resonant-breathing';
}
