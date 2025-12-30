import React, { useEffect, useState } from 'react';
import { Trophy, X, Sparkles } from 'lucide-react';
import type { Achievement } from '../../services/gamificationService';
import { markAchievementViewed } from '../../services/gamificationService';

interface AchievementUnlockProps {
  achievements: Achievement[];
  onClose: () => void;
}

export default function AchievementUnlock({ achievements, onClose }: AchievementUnlockProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const currentAchievement = achievements[currentIndex];

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
  }, [currentIndex]);

  const handleNext = () => {
    // Mark as viewed
    markAchievementViewed(currentAchievement.id);

    if (currentIndex < achievements.length - 1) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 300);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    // Mark all as viewed
    achievements.forEach((a) => markAchievementViewed(a.id));
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

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

  const getTierGlow = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'shadow-[0_0_60px_rgba(251,146,60,0.6)]';
      case 'silver':
        return 'shadow-[0_0_60px_rgba(156,163,175,0.6)]';
      case 'gold':
        return 'shadow-[0_0_60px_rgba(250,204,21,0.6)]';
      case 'platinum':
        return 'shadow-[0_0_60px_rgba(6,182,212,0.6)]';
      case 'diamond':
        return 'shadow-[0_0_60px_rgba(168,85,247,0.6)]';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div
        className={`relative w-full max-w-md mx-4 transition-all duration-500 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-4 -right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition z-10"
        >
          <X size={20} />
        </button>

        {/* Achievement card */}
        <div className="relative bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl border-2 border-white/20 overflow-hidden">
          {/* Sparkle effect */}
          <div className="absolute inset-0 pointer-events-none">
            <Sparkles
              className="absolute top-4 right-4 text-yellow-300 animate-pulse"
              size={24}
            />
            <Sparkles
              className="absolute bottom-4 left-4 text-yellow-300 animate-pulse"
              size={20}
              style={{ animationDelay: '0.5s' }}
            />
            <Sparkles
              className="absolute top-1/2 left-1/4 text-yellow-300 animate-pulse"
              size={16}
              style={{ animationDelay: '1s' }}
            />
          </div>

          {/* Content */}
          <div className="relative p-8 text-center">
            {/* Badge */}
            <div className="mb-6">
              <div
                className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${getTierColor(
                  currentAchievement.tier
                )} ${getTierGlow(
                  currentAchievement.tier
                )} flex items-center justify-center text-6xl animate-bounce`}
                style={{ animationDuration: '2s' }}
              >
                {currentAchievement.icon}
              </div>
            </div>

            {/* Title */}
            <div className="mb-2 flex items-center justify-center gap-2">
              <Trophy size={24} className="text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Achievement Unlocked!</h2>
            </div>

            {/* Achievement details */}
            <h3 className="text-3xl font-black text-white mb-2">{currentAchievement.name}</h3>
            <p className="text-white/70 mb-4">{currentAchievement.description}</p>

            {/* Tier badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-4">
              <span className="text-xs font-bold uppercase text-white/80">
                {currentAchievement.tier} Tier
              </span>
            </div>

            {/* Points */}
            {currentAchievement.points > 0 && (
              <div className="mb-6">
                <div className="text-4xl font-black text-cyan-400">
                  +{currentAchievement.points}
                </div>
                <div className="text-xs text-white/60 font-semibold">POINTS EARNED</div>
              </div>
            )}

            {/* Progress indicator */}
            {achievements.length > 1 && (
              <div className="mb-6 flex justify-center gap-2">
                {achievements.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentIndex
                        ? 'bg-cyan-400 scale-125'
                        : i < currentIndex
                        ? 'bg-white/60'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handleNext}
              className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-lg transition-all active:scale-95 shadow-lg"
            >
              {currentIndex < achievements.length - 1 ? 'Next Achievement' : 'Awesome!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
