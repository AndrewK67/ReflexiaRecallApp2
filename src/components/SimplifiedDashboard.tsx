/**
 * Simplified Dashboard - Core MVP experience
 * Focus: Capture → Reflect → Retrieve
 */

import { Rocket } from 'lucide-react';
import { isPackEnabled } from '../packs';
import { getTutorialProgress, getCompletionPercentage } from '../services/tutorialService';

interface SimplifiedDashboardProps {
  userName: string;
  dailyPrompt: string;
  onNavigate: (view: string) => void;
  onShowPackSettings?: () => void;
  onStartTutorial?: () => void;
}

export default function SimplifiedDashboard({
  userName,
  dailyPrompt,
  onNavigate,
  onShowPackSettings,
  onStartTutorial
}: SimplifiedDashboardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getFirstName = () => {
    return userName.trim().split(" ")[0] || "friend";
  };

  // Check which optional packs are enabled
  const hasWellbeing = isPackEnabled('wellbeing');
  const hasAI = isPackEnabled('aiReflectionCoach');
  const hasVisualTools = isPackEnabled('visualTools');

  // Tutorial state - drives whether we prompt to start, resume, or replay
  const tutorialProgress = getTutorialProgress();
  const tutorialPercent = getCompletionPercentage(tutorialProgress || undefined);
  const tutorialFinished =
    !!tutorialProgress && (tutorialProgress.skipped || tutorialProgress.currentStep === 'COMPLETED');
  const tutorialInProgress = !!tutorialProgress && !tutorialFinished;

  return (
    <div className="h-full overflow-y-auto flex flex-col items-center p-6 pt-8 nav-safe relative">
      {/* Animated Background */}
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      {/* Greeting */}
      <div className="text-center mb-8 max-w-xs mx-auto relative z-10">
        <h1 className="text-2xl font-light text-white tracking-tight mb-1">
          {getGreeting()}, {getFirstName()}.
        </h1>
        {dailyPrompt && (
          <p className="text-white/70 font-medium text-sm leading-relaxed mt-2">
            "{dailyPrompt}"
          </p>
        )}
      </div>

      {/* Core Actions */}
      <div className="w-full max-w-xs space-y-3 relative z-10">
        {/* Guided tour - front and centre until the user finishes or skips it */}
        {onStartTutorial && !tutorialFinished && (
          <button
            onClick={onStartTutorial}
            className="w-full bg-white/5 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 text-left hover:bg-white/10 active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                <Rocket size={20} className="text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white">
                  {tutorialInProgress ? 'Continue the guided tour' : 'Take the guided tour'}
                </div>
                <div className="text-xs text-white/60">
                  {tutorialInProgress
                    ? `${tutorialPercent}% complete`
                    : 'See everything Reflexia can do'}
                </div>
              </div>
            </div>

            {tutorialInProgress && (
              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${tutorialPercent}%` }}
                />
              </div>
            )}
          </button>
        )}

        {/* Primary CTA: Capture */}
        <button
          onClick={() => onNavigate("QUICK_CAPTURE")}
          className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white h-16 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:from-cyan-500 hover:to-indigo-500 active:scale-95 transition-all"
        >
          📸 Capture
        </button>

        {/* Secondary CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate("REFLECTION")}
            className="bg-white/10 text-white h-14 rounded-xl font-semibold text-sm border border-white/20 shadow-lg hover:bg-white/15 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">💭</span>
            <span>Reflect</span>
          </button>
          <button
            onClick={() => onNavigate("ARCHIVE")}
            className="bg-white/10 text-white h-14 rounded-xl font-semibold text-sm border border-white/20 shadow-lg hover:bg-white/15 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">📚</span>
            <span>Archive</span>
          </button>
        </div>

        {/* Optional: Quick access to enabled pack features */}
        {(hasWellbeing || hasAI || hasVisualTools) && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-3 mt-4">
            <div className="text-xs font-bold text-white/60 mb-2">ENABLED PACKS</div>
            <div className="grid grid-cols-3 gap-2">
              {hasWellbeing && (
                <>
                  <button
                    onClick={() => onNavigate("BIO_RHYTHM")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 transition flex flex-col items-center gap-1"
                  >
                    <span className="text-xl">🫁</span>
                    <span className="text-[9px] font-semibold text-white/80">BioRhythm</span>
                  </button>
                  <button
                    onClick={() => onNavigate("GROUNDING")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 transition flex flex-col items-center gap-1"
                  >
                    <span className="text-xl">🌊</span>
                    <span className="text-[9px] font-semibold text-white/80">Grounding</span>
                  </button>
                </>
              )}

              {hasAI && (
                <button
                  onClick={() => onNavigate("ORACLE")}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 transition flex flex-col items-center gap-1"
                >
                  <span className="text-xl">💬</span>
                  <span className="text-[9px] font-semibold text-white/80">Oracle</span>
                </button>
              )}

              {hasVisualTools && (
                <>
                  <button
                    onClick={() => onNavigate("CALENDAR")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 transition flex flex-col items-center gap-1"
                  >
                    <span className="text-xl">📅</span>
                    <span className="text-[9px] font-semibold text-white/80">Calendar</span>
                  </button>
                  <button
                    onClick={() => onNavigate("MENTAL_ATLAS")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 transition flex flex-col items-center gap-1"
                  >
                    <span className="text-xl">🗺️</span>
                    <span className="text-[9px] font-semibold text-white/80">Atlas</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Explore More Packs */}
        <button
          onClick={() => onShowPackSettings?.()}
          className="w-full mt-4 text-white/60 hover:text-white/90 text-xs font-medium py-2 transition"
        >
          ✨ Explore Optional Packs
        </button>

        {/* Replay the tour once it has been finished or skipped */}
        {onStartTutorial && tutorialFinished && (
          <button
            onClick={onStartTutorial}
            className="w-full text-white/60 hover:text-white/90 text-xs font-medium py-2 transition"
          >
            🚀 Replay the guided tour
          </button>
        )}
      </div>

      {/* Data Notice */}
      <div className="mt-8 max-w-xs text-center text-white/40 text-xs relative z-10">
        <p>All data stored securely on this device</p>
        <p className="mt-1">Export regularly to back up</p>
      </div>
    </div>
  );
}
