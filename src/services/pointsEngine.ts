/**
 * The points engine — dormant.
 *
 * CLAUDE.md decision 4: "XP and achievements attach to learning the app,
 * never to reflecting … This replaces the ACHIEVEMENTS catalogue …; the
 * points engine itself stays." Phase 3D removed the catalogue, the streaks,
 * the level display and the tutorial that was the only thing awarding
 * points. This file is what stays: the level table and the bonus-points
 * store (localStorage 'reflexia_bonus_xp', written by the tutorial on
 * builds before 3D).
 *
 * Nothing in the app imports it. Learning is shown as a checklist of things
 * tried (services/learningService.ts), with no numbers. If points are ever
 * attached to that checklist, they come from here — and they must never be
 * shown while someone is writing, and never count entries or days.
 */

const BONUS_XP_KEY = 'reflexia_bonus_xp';

export interface LevelInfo {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Beginner', minPoints: 0, maxPoints: 99, icon: '🌱' },
  { level: 2, title: 'Novice', minPoints: 100, maxPoints: 249, icon: '🌿' },
  { level: 3, title: 'Apprentice', minPoints: 250, maxPoints: 499, icon: '🍃' },
  { level: 4, title: 'Practitioner', minPoints: 500, maxPoints: 999, icon: '🌳' },
  { level: 5, title: 'Adept', minPoints: 1000, maxPoints: 1999, icon: '🌲' },
  { level: 6, title: 'Skilled', minPoints: 2000, maxPoints: 3499, icon: '🏔️' },
  { level: 7, title: 'Expert', minPoints: 3500, maxPoints: 5499, icon: '⛰️' },
  { level: 8, title: 'Advanced', minPoints: 5500, maxPoints: 7999, icon: '🗻' },
  { level: 9, title: 'Seasoned', minPoints: 8000, maxPoints: 11499, icon: '🌄' },
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

export function calculateLevel(points: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getPointsToNextLevel(currentPoints: number): { current: number; next: number; remaining: number } {
  const currentLevel = calculateLevel(currentPoints);
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);
  if (!nextLevel) return { current: currentPoints, next: currentLevel.maxPoints, remaining: 0 };
  return { current: currentPoints, next: nextLevel.minPoints, remaining: nextLevel.minPoints - currentPoints };
}

export function getBonusXP(): number {
  try {
    const stored = localStorage.getItem(BONUS_XP_KEY);
    return stored ? parseInt(stored, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function awardBonusXP(amount: number): void {
  try {
    localStorage.setItem(BONUS_XP_KEY, String(getBonusXP() + amount));
  } catch {
    // storage full or unavailable: points are never worth an error
  }
}
