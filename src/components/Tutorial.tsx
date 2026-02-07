import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Trophy,
  Star,
  Zap,
  ChevronRight,
  X,
  Check,
  Sparkles,
  Gift,
  Target,
  Award
} from 'lucide-react';
import {
  getTutorialProgress,
  initializeTutorial,
  completeStep,
  skipTutorial,
  getCurrentStepConfig,
  getCompletionPercentage,
  type TutorialStep,
} from '../services/tutorialService';
import type { ViewState } from '../types';

interface TutorialProps {
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
  onAwardXP?: (amount: number, reason: string) => void;
}

export default function Tutorial({ onClose, onNavigate, onAwardXP }: TutorialProps) {
  const [progress, setProgress] = useState(getTutorialProgress() || initializeTutorial());
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentXP, setRecentXP] = useState(0);
  const [recentBadge, setRecentBadge] = useState<string | null>(null);

  const currentStep = getCurrentStepConfig(progress);
  const completionPercentage = getCompletionPercentage(progress);

  useEffect(() => {
    // Auto-detect when users complete step requirements
    const checkCompletion = () => {
      if (!currentStep) return;

      // Auto-complete certain steps based on conditions
      // This would be triggered by the parent App component in real implementation
    };

    checkCompletion();
  }, [currentStep]);

  const handleCompleteStep = () => {
    if (!currentStep) return;

    const result = completeStep(currentStep.id);
    setProgress(result.progress);

    // Show celebration
    if (result.xpEarned > 0) {
      setRecentXP(result.xpEarned);
      setShowCelebration(true);

      // Award XP to gamification system
      if (onAwardXP) {
        onAwardXP(result.xpEarned, `Tutorial: ${currentStep.title}`);
      }

      setTimeout(() => {
        setShowCelebration(false);
        setRecentXP(0);
      }, 3000);
    }

    if (result.badgeEarned) {
      setRecentBadge(result.badgeEarned);
      setTimeout(() => setRecentBadge(null), 5000);
    }

    // If all completed, show final celebration
    if (result.allCompleted) {
      setTimeout(() => {
        onClose();
      }, 5000);
    }

    // Navigate to next step if it has a target view
    if (result.nextStep?.targetView) {
      const targetView = result.nextStep.targetView;
      setTimeout(() => {
        onNavigate(targetView as ViewState);
      }, 1000);
    }
  };

  const handleClose = () => {
    // Just close without confirmation - user can restart anytime
    onClose();
  };

  const handleSkip = () => {
    if (confirm('Are you sure you want to skip the tutorial? You can restart it anytime from settings.')) {
      skipTutorial();
      onClose();
    }
  };

  const handleNavigateToFeature = () => {
    if (currentStep?.targetView) {
      // Navigate to the feature first
      onNavigate(currentStep.targetView as ViewState);
      // Close tutorial to let user interact with the feature
      setTimeout(() => {
        onClose();
      }, 300);
    }
  };

  if (!currentStep) {
    return null;
  }

  const isWelcome = currentStep.id === 'WELCOME';
  const isCompleted = currentStep.id === 'COMPLETED';

  return (
    <>
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
          <div className="animate-bounce">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-8 shadow-2xl">
              <Zap size={64} className="text-white" />
            </div>
          </div>
          <div className="absolute top-1/3 text-center">
            <div className="text-6xl font-bold text-yellow-400 animate-pulse">
              +{recentXP} XP
            </div>
          </div>
        </div>
      )}

      {/* Badge Earned Notification */}
      {recentBadge && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-500">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            <Award size={32} className="text-white" />
            <div>
              <div className="text-sm text-white/80">Badge Unlocked!</div>
              <div className="text-lg font-bold text-white">{recentBadge}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tutorial Modal */}
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 pb-safe pt-safe">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border-2 border-cyan-500/30 max-w-lg w-full relative overflow-hidden flex flex-col max-h-[90vh]">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Scrollable content wrapper */}
          <div className="overflow-y-auto custom-scrollbar flex-1 p-4">
          {/* Header */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="text-3xl">{currentStep.icon}</div>
                <div>
                  <div className="text-[10px] text-cyan-400 font-semibold">
                    Step {progress.completedSteps.length + 1} of 19
                  </div>
                  <h2 className="text-lg font-bold text-white">{currentStep.title}</h2>
                </div>
              </div>
              {/* Exit button - more prominent */}
              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 transition text-white flex-shrink-0"
                title="Exit Tutorial"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60">Progress</span>
                <span className="text-xs font-bold text-cyan-400">{completionPercentage}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-white/80 mb-3">{currentStep.description}</p>

            {/* XP Reward Badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <Star size={16} className="text-yellow-400" />
                <span className="text-yellow-400 font-bold text-sm">+{currentStep.xpReward} XP</span>
              </div>
              {currentStep.badge && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                  <Trophy size={16} className="text-purple-400" />
                  <span className="text-purple-400 font-bold text-sm">{currentStep.badge}</span>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white">What to do:</h3>
              </div>
              <ul className="space-y-2">
                {currentStep.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] text-cyan-400 font-bold">{index + 1}</span>
                    </div>
                    <span className="text-white/80 text-xs leading-relaxed">{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Completion Criteria */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-3 mb-3">
              <div className="flex items-start gap-2">
                <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-white/60 mb-0.5">To complete:</div>
                  <div className="text-white font-semibold text-sm">{currentStep.completionCriteria}</div>
                </div>
              </div>
            </div>

            {/* Fun Fact */}
            {currentStep.funFact && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-3 mb-3">
                <div className="flex items-start gap-2">
                  <Sparkles size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-white/60 mb-0.5">Fun Fact</div>
                    <div className="text-white/90 text-xs">{currentStep.funFact}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-4 relative z-10">
              {currentStep.targetView && !isCompleted && !isWelcome && (
                <button
                  onClick={handleNavigateToFeature}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2 text-sm"
                >
                  <Rocket size={18} />
                  Go Try It Now
                </button>
              )}

              <button
                onClick={handleCompleteStep}
                className={`w-full py-3 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm ${
                  currentStep.targetView && !isCompleted && !isWelcome
                    ? 'bg-white/10 border border-white/20 text-white hover:bg-white/15 active:scale-95'
                    : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 active:scale-95'
                }`}
              >
                {isWelcome && (
                  <>
                    <Rocket size={18} />
                    Start Tutorial
                  </>
                )}
                {isCompleted && (
                  <>
                    <Trophy size={18} />
                    Finish & Claim Rewards!
                  </>
                )}
                {!isWelcome && !isCompleted && currentStep.targetView && (
                  <>
                    <Check size={18} />
                    I Tried It - Continue to Next Step
                    <ChevronRight size={18} />
                  </>
                )}
                {!isWelcome && !isCompleted && !currentStep.targetView && (
                  <>
                    <Check size={18} />
                    Continue
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              {/* Skip button at bottom */}
              {!isCompleted && (
                <button
                  onClick={handleSkip}
                  className="w-full py-2 text-white/40 hover:text-white/60 text-xs transition"
                >
                  Skip Tutorial
                </button>
              )}
            </div>

            {/* Total XP Earned */}
            {progress.xpEarned > 0 && (
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full px-4 py-1.5">
                  <Gift size={14} className="text-yellow-400" />
                  <span className="text-xs text-white/60">Total XP:</span>
                  <span className="text-sm font-bold text-yellow-400">{progress.xpEarned}</span>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
