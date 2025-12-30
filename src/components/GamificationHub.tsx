import React, { useMemo, useState } from 'react';
import { ArrowLeft, Trophy, Lock, Flame, TrendingUp, Star, Award, Filter } from 'lucide-react';
import type { Entry } from '../types';
import {
  buildGamificationData,
  getGamificationStats,
  getUnlockedAchievements,
  calculateLevel,
  getPointsToNextLevel,
  ACHIEVEMENTS,
  LEVELS,
  type AchievementCategory,
} from '../services/gamificationService';
import { getGroundingSessions } from '../services/groundingService';

interface GamificationHubProps {
  entries: Entry[];
  onClose: () => void;
}

export default function GamificationHub({ entries, onClose }: GamificationHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  // Build gamification data
  const gamificationData = useMemo(() => {
    const groundingSessions = getGroundingSessions().filter((s) => s.completed).length;
    const holodeckSessions = 0; // TODO: Track holodeck sessions
    return buildGamificationData(entries, groundingSessions, holodeckSessions);
  }, [entries]);

  const stats = useMemo(() => getGamificationStats(gamificationData), [gamificationData]);
  const unlockedAchievements = useMemo(() => getUnlockedAchievements(), []);
  const unlockedIds = useMemo(() => new Set(unlockedAchievements.map((u) => u.achievementId)), [unlockedAchievements]);

  const levelInfo = calculateLevel(stats.totalPoints);
  const pointsInfo = getPointsToNextLevel(stats.totalPoints);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    const achievements = Object.values(ACHIEVEMENTS);
    if (selectedCategory === 'all') return achievements;
    return achievements.filter((a) => a.category === selectedCategory);
  }, [selectedCategory]);

  // Group achievements by category
  const categories: { id: AchievementCategory | 'all'; label: string; icon: any; color: string }[] = [
    { id: 'all', label: 'All', icon: Trophy, color: 'text-white' },
    { id: 'reflection', label: 'Reflection', icon: Trophy, color: 'text-cyan-400' },
    { id: 'consistency', label: 'Consistency', icon: Flame, color: 'text-orange-400' },
    { id: 'exploration', label: 'Exploration', icon: TrendingUp, color: 'text-purple-400' },
    { id: 'wellness', label: 'Wellness', icon: Award, color: 'text-emerald-400' },
    { id: 'mastery', label: 'Mastery', icon: Star, color: 'text-yellow-400' },
    { id: 'special', label: 'Special', icon: Star, color: 'text-pink-400' },
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'from-orange-600 to-amber-700';
      case 'silver':
        return 'from-gray-400 to-gray-600';
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'platinum':
        return 'from-cyan-400 to-blue-600';
      case 'diamond':
        return 'from-purple-400 to-pink-600';
      default:
        return 'from-slate-400 to-slate-600';
    }
  };

  const progressPercentage = levelInfo.level < 20
    ? ((pointsInfo.current - levelInfo.minPoints) / (pointsInfo.next - levelInfo.minPoints)) * 100
    : 100;

  return (
    <div className="h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition"
            aria-label="Go back to dashboard"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <h1 className="text-xl font-bold">Achievements</h1>
          <div className="w-10" aria-hidden="true" />
        </div>

        {/* Level Card */}
        <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-4xl font-black text-white flex items-center gap-2">
                <span>{levelInfo.icon}</span>
                <span>Level {levelInfo.level}</span>
              </div>
              <div className="text-sm text-white/70 font-semibold">{levelInfo.title}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-cyan-400">{stats.totalPoints}</div>
              <div className="text-[10px] text-white/60 font-semibold">TOTAL POINTS</div>
            </div>
          </div>

          {/* Progress bar */}
          {levelInfo.level < 20 && (
            <div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-white/50">
                  {pointsInfo.current - levelInfo.minPoints} / {pointsInfo.next - levelInfo.minPoints} XP
                </span>
                <span className="text-xs text-white/70 font-semibold">
                  {pointsInfo.remaining} to Level {levelInfo.level + 1}
                </span>
              </div>
            </div>
          )}
          {levelInfo.level === 20 && (
            <div className="text-center text-sm text-yellow-300 font-semibold">Maximum Level Reached!</div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-white/10">
        <div className="bg-white/10 rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.unlockedAchievements}</div>
          <div className="text-[10px] text-white/60 font-semibold">Unlocked</div>
        </div>
        <div className="bg-white/10 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame size={20} className="text-orange-400" />
            <span className="text-2xl font-bold text-orange-400">{stats.currentStreak}</span>
          </div>
          <div className="text-[10px] text-white/60 font-semibold">Day Streak</div>
        </div>
        <div className="bg-white/10 rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.completionPercentage}%</div>
          <div className="text-[10px] text-white/60 font-semibold">Complete</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <Icon size={16} className={selectedCategory === cat.id ? cat.color : ''} />
                <span className="text-xs font-semibold">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievements List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-32 custom-scrollbar">
        <div className="grid grid-cols-1 gap-3">
          {filteredAchievements.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            const progress = achievement.checkProgress(gamificationData);

            return (
              <div
                key={achievement.id}
                className={`relative p-4 rounded-2xl border transition ${
                  isUnlocked
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/5 border-white/10 opacity-60'
                }`}
              >
                {/* Icon badge */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getTierColor(
                      achievement.tier
                    )} flex items-center justify-center text-3xl flex-shrink-0 ${
                      !isUnlocked && 'opacity-40'
                    }`}
                  >
                    {isUnlocked ? achievement.icon : <Lock size={24} className="text-white/60" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title and points */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-white text-sm">{achievement.name}</h3>
                      {achievement.points > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                          <Star size={12} />
                          <span className="text-xs font-bold">{achievement.points}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-white/70 mb-2">{achievement.description}</p>

                    {/* Requirement */}
                    <div className="text-[10px] text-white/50 font-semibold mb-2">
                      {achievement.requirement}
                    </div>

                    {/* Progress bar (if not unlocked) */}
                    {!isUnlocked && progress > 0 && (
                      <div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-white/50 mt-1">{Math.round(progress)}% complete</div>
                      </div>
                    )}

                    {/* Tier badge */}
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 mt-2">
                      <span className="text-[10px] font-bold uppercase text-white/70">
                        {achievement.tier}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unlocked indicator */}
                {isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Trophy size={14} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
