/**
 * Gamification Service
 * Manages achievements, badges, levels, streaks, and progress tracking
 */

import type { Entry } from '../types';

const GAMIFICATION_DATA_KEY = 'reflexia_gamification';
const UNLOCKED_ACHIEVEMENTS_KEY = 'reflexia_unlocked_achievements';

export type AchievementCategory =
  | 'reflection'
  | 'consistency'
  | 'exploration'
  | 'mastery'
  | 'wellness'
  | 'special';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string; // emoji
  points: number;
  requirement: string; // Human-readable requirement
  checkProgress: (data: GamificationData) => number; // Returns progress (0-100)
  checkUnlock: (data: GamificationData) => boolean;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
  viewedAt?: string; // When user saw the unlock notification
}

export interface GamificationData {
  totalEntries: number;
  totalReflections: number;
  totalIncidents: number;
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  uniqueReflectionModels: Set<string>;
  groundingSessions: number;
  holodeckSessions: number;
  totalPoints: number;
  level: number;
  entries: Entry[];
  joinedDate: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
}

export interface GamificationStats {
  level: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
}

// Level System (1-20)
export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Beginner', minPoints: 0, maxPoints: 99, icon: '🌱' },
  { level: 2, title: 'Novice', minPoints: 100, maxPoints: 249, icon: '🌿' },
  { level: 3, title: 'Apprentice', minPoints: 250, maxPoints: 499, icon: '🍃' },
  { level: 4, title: 'Practitioner', minPoints: 500, maxPoints: 999, icon: '🌳' },
  { level: 5, title: 'Adept', minPoints: 1000, maxPoints: 1999, icon: '🌲' },
  { level: 6, title: 'Skilled', minPoints: 2000, maxPoints: 3499, icon: '🏔️' },
  { level: 7, title: 'Expert', minPoints: 3500, maxPoints: 5499, icon: '⛰️' },
  { level: 8, title: 'Advanced', minPoints: 5500, maxPoints: 7999, icon: '🗻' },
  { level: 9, title: 'Professional', minPoints: 8000, maxPoints: 11499, icon: '🌄' },
  { level: 10, title: 'Master', minPoints: 11500, maxPoints: 15999, icon: '🏆' },
  { level: 11, title: 'Elite', minPoints: 16000, maxPoints: 21499, icon: '💎' },
  { level: 12, title: 'Champion', minPoints: 21500, maxPoints: 28499, icon: '👑' },
  { level: 13, title: 'Grandmaster', minPoints: 28500, maxPoints: 36999, icon: '🎖️' },
  { level: 14, title: 'Legend', minPoints: 37000, maxPoints: 46999, icon: '⭐' },
  { level: 15, title: 'Mythic', minPoints: 47000, maxPoints: 58999, icon: '✨' },
  { level: 16, title: 'Immortal', minPoints: 59000, maxPoints: 72999, icon: '🌟' },
  { level: 17, title: 'Divine', minPoints: 73000, maxPoints: 88999, icon: '💫' },
  { level: 18, title: 'Transcendent', minPoints: 89000, maxPoints: 107999, icon: '🌌' },
  { level: 19, title: 'Enlightened', minPoints: 108000, maxPoints: 129999, icon: '🔮' },
  { level: 20, title: 'Ascended', minPoints: 130000, maxPoints: Infinity, icon: '🪐' },
];

// Achievement Definitions
export const ACHIEVEMENTS: Record<string, Achievement> = {
  // Reflection Achievements
  'first-reflection': {
    id: 'first-reflection',
    name: 'First Steps',
    description: 'Complete your first reflection',
    category: 'reflection',
    tier: 'bronze',
    icon: '📝',
    points: 10,
    requirement: 'Complete 1 reflection',
    checkProgress: (data) => Math.min((data.totalReflections / 1) * 100, 100),
    checkUnlock: (data) => data.totalReflections >= 1,
  },
  'reflection-10': {
    id: 'reflection-10',
    name: 'Reflective Mind',
    description: 'Complete 10 reflections',
    category: 'reflection',
    tier: 'silver',
    icon: '📚',
    points: 50,
    requirement: 'Complete 10 reflections',
    checkProgress: (data) => Math.min((data.totalReflections / 10) * 100, 100),
    checkUnlock: (data) => data.totalReflections >= 10,
  },
  'reflection-50': {
    id: 'reflection-50',
    name: 'Deep Thinker',
    description: 'Complete 50 reflections',
    category: 'reflection',
    tier: 'gold',
    icon: '🧠',
    points: 150,
    requirement: 'Complete 50 reflections',
    checkProgress: (data) => Math.min((data.totalReflections / 50) * 100, 100),
    checkUnlock: (data) => data.totalReflections >= 50,
  },
  'reflection-100': {
    id: 'reflection-100',
    name: 'Reflection Master',
    description: 'Complete 100 reflections',
    category: 'reflection',
    tier: 'platinum',
    icon: '🏆',
    points: 300,
    requirement: 'Complete 100 reflections',
    checkProgress: (data) => Math.min((data.totalReflections / 100) * 100, 100),
    checkUnlock: (data) => data.totalReflections >= 100,
  },
  'reflection-365': {
    id: 'reflection-365',
    name: 'Year of Reflection',
    description: 'Complete 365 reflections',
    category: 'reflection',
    tier: 'diamond',
    icon: '💎',
    points: 1000,
    requirement: 'Complete 365 reflections',
    checkProgress: (data) => Math.min((data.totalReflections / 365) * 100, 100),
    checkUnlock: (data) => data.totalReflections >= 365,
  },

  // Consistency Achievements
  'streak-3': {
    id: 'streak-3',
    name: 'Building Momentum',
    description: 'Maintain a 3-day streak',
    category: 'consistency',
    tier: 'bronze',
    icon: '🔥',
    points: 20,
    requirement: '3-day streak',
    checkProgress: (data) => Math.min((data.currentStreak / 3) * 100, 100),
    checkUnlock: (data) => data.currentStreak >= 3,
  },
  'streak-7': {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'consistency',
    tier: 'silver',
    icon: '🔥',
    points: 50,
    requirement: '7-day streak',
    checkProgress: (data) => Math.min((data.currentStreak / 7) * 100, 100),
    checkUnlock: (data) => data.currentStreak >= 7,
  },
  'streak-30': {
    id: 'streak-30',
    name: 'Monthly Dedication',
    description: 'Maintain a 30-day streak',
    category: 'consistency',
    tier: 'gold',
    icon: '🔥',
    points: 200,
    requirement: '30-day streak',
    checkProgress: (data) => Math.min((data.currentStreak / 30) * 100, 100),
    checkUnlock: (data) => data.currentStreak >= 30,
  },
  'streak-100': {
    id: 'streak-100',
    name: 'Century of Growth',
    description: 'Maintain a 100-day streak',
    category: 'consistency',
    tier: 'platinum',
    icon: '🔥',
    points: 500,
    requirement: '100-day streak',
    checkProgress: (data) => Math.min((data.currentStreak / 100) * 100, 100),
    checkUnlock: (data) => data.currentStreak >= 100,
  },
  'streak-365': {
    id: 'streak-365',
    name: 'Unstoppable Force',
    description: 'Maintain a 365-day streak',
    category: 'consistency',
    tier: 'diamond',
    icon: '🔥',
    points: 2000,
    requirement: '365-day streak',
    checkProgress: (data) => Math.min((data.currentStreak / 365) * 100, 100),
    checkUnlock: (data) => data.currentStreak >= 365,
  },

  // Exploration Achievements
  'explorer-3': {
    id: 'explorer-3',
    name: 'Curious Explorer',
    description: 'Try 3 different reflection models',
    category: 'exploration',
    tier: 'bronze',
    icon: '🧭',
    points: 30,
    requirement: 'Use 3 different models',
    checkProgress: (data) => Math.min((data.uniqueReflectionModels.size / 3) * 100, 100),
    checkUnlock: (data) => data.uniqueReflectionModels.size >= 3,
  },
  'explorer-6': {
    id: 'explorer-6',
    name: 'Model Maven',
    description: 'Try 6 different reflection models',
    category: 'exploration',
    tier: 'silver',
    icon: '🗺️',
    points: 80,
    requirement: 'Use 6 different models',
    checkProgress: (data) => Math.min((data.uniqueReflectionModels.size / 6) * 100, 100),
    checkUnlock: (data) => data.uniqueReflectionModels.size >= 6,
  },
  'explorer-all': {
    id: 'explorer-all',
    name: 'Complete Explorer',
    description: 'Try all reflection models',
    category: 'exploration',
    tier: 'gold',
    icon: '🌍',
    points: 200,
    requirement: 'Use all 11 models',
    checkProgress: (data) => Math.min((data.uniqueReflectionModels.size / 11) * 100, 100),
    checkUnlock: (data) => data.uniqueReflectionModels.size >= 11,
  },

  // Wellness Achievements
  'grounding-first': {
    id: 'grounding-first',
    name: 'Centered',
    description: 'Complete your first grounding session',
    category: 'wellness',
    tier: 'bronze',
    icon: '🧘',
    points: 10,
    requirement: '1 grounding session',
    checkProgress: (data) => Math.min((data.groundingSessions / 1) * 100, 100),
    checkUnlock: (data) => data.groundingSessions >= 1,
  },
  'grounding-10': {
    id: 'grounding-10',
    name: 'Mindful Practice',
    description: 'Complete 10 grounding sessions',
    category: 'wellness',
    tier: 'silver',
    icon: '🧘',
    points: 50,
    requirement: '10 grounding sessions',
    checkProgress: (data) => Math.min((data.groundingSessions / 10) * 100, 100),
    checkUnlock: (data) => data.groundingSessions >= 10,
  },
  'grounding-50': {
    id: 'grounding-50',
    name: 'Zen Master',
    description: 'Complete 50 grounding sessions',
    category: 'wellness',
    tier: 'gold',
    icon: '☮️',
    points: 200,
    requirement: '50 grounding sessions',
    checkProgress: (data) => Math.min((data.groundingSessions / 50) * 100, 100),
    checkUnlock: (data) => data.groundingSessions >= 50,
  },

  // Holodeck Achievements
  'holodeck-first': {
    id: 'holodeck-first',
    name: 'Scenario Explorer',
    description: 'Complete your first holodeck scenario',
    category: 'exploration',
    tier: 'bronze',
    icon: '🎭',
    points: 15,
    requirement: '1 holodeck session',
    checkProgress: (data) => Math.min((data.holodeckSessions / 1) * 100, 100),
    checkUnlock: (data) => data.holodeckSessions >= 1,
  },
  'holodeck-10': {
    id: 'holodeck-10',
    name: 'Simulation Veteran',
    description: 'Complete 10 holodeck scenarios',
    category: 'exploration',
    tier: 'silver',
    icon: '🎬',
    points: 75,
    requirement: '10 holodeck sessions',
    checkProgress: (data) => Math.min((data.holodeckSessions / 10) * 100, 100),
    checkUnlock: (data) => data.holodeckSessions >= 10,
  },

  // Mastery Achievements
  'level-5': {
    id: 'level-5',
    name: 'Adept Achiever',
    description: 'Reach level 5',
    category: 'mastery',
    tier: 'silver',
    icon: '⬆️',
    points: 0, // Points already earned through actions
    requirement: 'Reach level 5',
    checkProgress: (data) => Math.min((data.level / 5) * 100, 100),
    checkUnlock: (data) => data.level >= 5,
  },
  'level-10': {
    id: 'level-10',
    name: 'Master Practitioner',
    description: 'Reach level 10',
    category: 'mastery',
    tier: 'gold',
    icon: '🎯',
    points: 0,
    requirement: 'Reach level 10',
    checkProgress: (data) => Math.min((data.level / 10) * 100, 100),
    checkUnlock: (data) => data.level >= 10,
  },
  'level-15': {
    id: 'level-15',
    name: 'Mythic Legend',
    description: 'Reach level 15',
    category: 'mastery',
    tier: 'platinum',
    icon: '⚡',
    points: 0,
    requirement: 'Reach level 15',
    checkProgress: (data) => Math.min((data.level / 15) * 100, 100),
    checkUnlock: (data) => data.level >= 15,
  },
  'level-20': {
    id: 'level-20',
    name: 'Ascended One',
    description: 'Reach maximum level 20',
    category: 'mastery',
    tier: 'diamond',
    icon: '👑',
    points: 0,
    requirement: 'Reach level 20',
    checkProgress: (data) => Math.min((data.level / 20) * 100, 100),
    checkUnlock: (data) => data.level >= 20,
  },

  // Special Achievements
  'early-bird': {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a morning reflection before 9 AM',
    category: 'special',
    tier: 'bronze',
    icon: '🌅',
    points: 25,
    requirement: 'Reflect before 9 AM',
    checkProgress: (data) => {
      const hasEarlyEntry = data.entries.some((e) => {
        const hour = new Date(e.date).getHours();
        return hour >= 5 && hour < 9;
      });
      return hasEarlyEntry ? 100 : 0;
    },
    checkUnlock: (data) => {
      return data.entries.some((e) => {
        const hour = new Date(e.date).getHours();
        return hour >= 5 && hour < 9;
      });
    },
  },
  'night-owl': {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete an evening reflection after 10 PM',
    category: 'special',
    tier: 'bronze',
    icon: '🌙',
    points: 25,
    requirement: 'Reflect after 10 PM',
    checkProgress: (data) => {
      const hasLateEntry = data.entries.some((e) => {
        const hour = new Date(e.date).getHours();
        return hour >= 22 || hour < 5;
      });
      return hasLateEntry ? 100 : 0;
    },
    checkUnlock: (data) => {
      return data.entries.some((e) => {
        const hour = new Date(e.date).getHours();
        return hour >= 22 || hour < 5;
      });
    },
  },
  'weekend-warrior': {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Reflect on a Saturday or Sunday',
    category: 'special',
    tier: 'bronze',
    icon: '🎉',
    points: 15,
    requirement: 'Reflect on weekend',
    checkProgress: (data) => {
      const hasWeekendEntry = data.entries.some((e) => {
        const day = new Date(e.date).getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      });
      return hasWeekendEntry ? 100 : 0;
    },
    checkUnlock: (data) => {
      return data.entries.some((e) => {
        const day = new Date(e.date).getDay();
        return day === 0 || day === 6;
      });
    },
  },
};

/**
 * Calculate level from total points
 */
export function calculateLevel(points: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

/**
 * Get points needed for next level
 */
export function getPointsToNextLevel(currentPoints: number): { current: number; next: number; remaining: number } {
  const currentLevel = calculateLevel(currentPoints);
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);

  if (!nextLevel) {
    return { current: currentPoints, next: currentLevel.maxPoints, remaining: 0 };
  }

  return {
    current: currentPoints,
    next: nextLevel.minPoints,
    remaining: nextLevel.minPoints - currentPoints,
  };
}

/**
 * Get all unlocked achievements
 */
export function getUnlockedAchievements(): UnlockedAchievement[] {
  const stored = localStorage.getItem(UNLOCKED_ACHIEVEMENTS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save unlocked achievements
 */
function saveUnlockedAchievements(unlocked: UnlockedAchievement[]): void {
  localStorage.setItem(UNLOCKED_ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
}

/**
 * Check and unlock new achievements
 * Returns newly unlocked achievements
 */
export function checkAndUnlockAchievements(data: GamificationData): Achievement[] {
  const unlocked = getUnlockedAchievements();
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of Object.values(ACHIEVEMENTS)) {
    if (!unlockedIds.has(achievement.id) && achievement.checkUnlock(data)) {
      unlocked.push({
        achievementId: achievement.id,
        unlockedAt: new Date().toISOString(),
      });
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievements(unlocked);
  }

  return newlyUnlocked;
}

/**
 * Mark achievement as viewed
 */
export function markAchievementViewed(achievementId: string): void {
  const unlocked = getUnlockedAchievements();
  const achievement = unlocked.find((u) => u.achievementId === achievementId);
  if (achievement && !achievement.viewedAt) {
    achievement.viewedAt = new Date().toISOString();
    saveUnlockedAchievements(unlocked);
  }
}

/**
 * Get newly unlocked achievements (not yet viewed)
 */
export function getNewAchievements(): Achievement[] {
  const unlocked = getUnlockedAchievements();
  const newUnlocked = unlocked.filter((u) => !u.viewedAt);
  return newUnlocked.map((u) => ACHIEVEMENTS[u.achievementId]).filter(Boolean);
}

/**
 * Build gamification data from entries and other sources
 */
export function buildGamificationData(
  entries: Entry[],
  groundingSessions: number = 0,
  holodeckSessions: number = 0,
  joinedDate?: string
): GamificationData {
  const reflections = entries.filter((e) => e.type === 'REFLECTION' || e.type === 'reflection');
  const incidents = entries.filter((e) => e.type === 'INCIDENT' || e.type === 'incident');

  // Extract unique reflection models
  const uniqueModels = new Set<string>();
  reflections.forEach((r: any) => {
    if (r.model || r.modelId) {
      uniqueModels.add(r.model || r.modelId);
    }
  });

  // Calculate streak
  const { currentStreak, longestStreak, totalDays } = calculateStreakFromEntries(entries);

  // Calculate total points from unlocked achievements
  const unlocked = getUnlockedAchievements();
  const totalPoints = unlocked.reduce((sum, u) => {
    const achievement = ACHIEVEMENTS[u.achievementId];
    return sum + (achievement?.points || 0);
  }, 0);

  const level = calculateLevel(totalPoints).level;

  return {
    totalEntries: entries.length,
    totalReflections: reflections.length,
    totalIncidents: incidents.length,
    currentStreak,
    longestStreak,
    totalDays,
    uniqueReflectionModels: uniqueModels,
    groundingSessions,
    holodeckSessions,
    totalPoints,
    level,
    entries,
    joinedDate: joinedDate || new Date().toISOString(),
  };
}

/**
 * Calculate streak from entries
 */
function calculateStreakFromEntries(entries: Entry[]): {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
} {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalDays: 0 };
  }

  // Get unique days with entries
  const daysSet = new Set<string>();
  entries.forEach((e) => {
    const date = new Date(e.date);
    date.setHours(0, 0, 0, 0);
    daysSet.add(date.toISOString().split('T')[0]);
  });

  const days = Array.from(daysSet).sort();
  const totalDays = days.length;

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Check if last entry was today or yesterday
  const lastDay = days[days.length - 1];
  if (lastDay !== todayStr && lastDay !== yesterdayStr) {
    currentStreak = 0;
  } else {
    let checkDate = new Date(today);
    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (days.includes(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < days.length; i++) {
    const prevDate = new Date(days[i - 1]);
    const currDate = new Date(days[i]);
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak, totalDays };
}

/**
 * Get gamification statistics
 */
export function getGamificationStats(data: GamificationData): GamificationStats {
  const unlocked = getUnlockedAchievements();
  const totalAchievements = Object.keys(ACHIEVEMENTS).length;

  return {
    level: data.level,
    totalPoints: data.totalPoints,
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak,
    totalAchievements,
    unlockedAchievements: unlocked.length,
    completionPercentage: Math.round((unlocked.length / totalAchievements) * 100),
  };
}
