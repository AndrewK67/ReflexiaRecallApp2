/**
 * Simplified Dashboard - Core MVP experience
 * Focus: Capture → Reflect → Retrieve
 */

import { isPackEnabled } from '../packs';
import AdBanner from './AdBanner';

interface SimplifiedDashboardProps {
  userName: string;
  dailyPrompt: string;
  onNavigate: (view: string) => void;
  onShowPackSettings?: () => void;
  totalEntries?: number;
  currentStreak?: number;
}

export default function SimplifiedDashboard({
  userName,
  dailyPrompt,
  onNavigate,
  onShowPackSettings,
  totalEntries = 0,
  currentStreak = 0,
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
  const hasScenario = isPackEnabled('scenario');
  const hasProfessional = isPackEnabled('professional');
  const hasReports = isPackEnabled('reports');

  const hasAnyPacks = hasWellbeing || hasAI || hasScenario || hasProfessional || hasReports;

  return (
    <div className="h-full overflow-y-auto flex flex-col items-center p-4 pt-6 nav-safe relative">
      {/* Animated Background */}
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      {/* Greeting */}
      <div className="text-center mb-6 max-w-xs mx-auto relative z-10">
        <h1 className="text-xl font-light text-white tracking-tight mb-1">
          {getGreeting()}, {getFirstName()}.
        </h1>
        {dailyPrompt && (
          <p className="text-white/70 font-medium text-xs leading-relaxed mt-2">
            "{dailyPrompt}"
          </p>
        )}
      </div>

      {/* Quick Stats */}
      {totalEntries > 0 && (
        <div className="flex items-center justify-center gap-4 mb-4 relative z-10">
          <div className="text-center px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <div className="text-sm font-bold text-white">{totalEntries}</div>
            <div className="text-[9px] text-white/50 uppercase tracking-wider">Reflections</div>
          </div>
          {currentStreak > 0 && (
            <div className="text-center px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm font-bold text-orange-400">{currentStreak}d</div>
              <div className="text-[9px] text-white/50 uppercase tracking-wider">Streak</div>
            </div>
          )}
        </div>
      )}

      {/* Core Actions */}
      <div className="w-full max-w-xs space-y-2.5 relative z-10">
        {/* Primary CTA: Capture */}
        <button
          onClick={() => onNavigate("QUICK_CAPTURE")}
          className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white h-14 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:from-cyan-500 hover:to-indigo-500 active:scale-95 transition-all"
        >
          📸 Capture
        </button>

        {/* Secondary CTAs */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onNavigate("REFLECTION")}
            className="bg-white/10 text-white h-12 rounded-xl font-semibold text-xs border border-white/20 shadow-lg hover:bg-white/15 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="text-base">💭</span>
            <span>Reflect</span>
          </button>
          <button
            onClick={() => onNavigate("ARCHIVE")}
            className="bg-white/10 text-white h-12 rounded-xl font-semibold text-xs border border-white/20 shadow-lg hover:bg-white/15 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="text-base">📚</span>
            <span>Archive</span>
          </button>
        </div>

        {/* Optional: Quick access to enabled pack features */}
        {hasAnyPacks && (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-2.5 mt-3">
            <div className="text-[10px] font-bold text-white/60 mb-1.5">ENABLED PACKS</div>
            <div className="grid grid-cols-3 gap-1.5">
              {/* Wellbeing */}
              {hasWellbeing && (
                <>
                  <button
                    onClick={() => onNavigate("BIO_RHYTHM")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-1.5 transition flex flex-col items-center gap-0.5"
                  >
                    <span className="text-base">🫁</span>
                    <span className="text-[8px] font-semibold text-white/80">BioRhythm</span>
                  </button>
                  <button
                    onClick={() => onNavigate("GROUNDING")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-1.5 transition flex flex-col items-center gap-0.5"
                  >
                    <span className="text-base">🌊</span>
                    <span className="text-[8px] font-semibold text-white/80">Grounding</span>
                  </button>
                </>
              )}

              {/* AI Coach */}
              {hasAI && (
                <button
                  onClick={() => onNavigate("ORACLE")}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-1.5 transition flex flex-col items-center gap-0.5"
                >
                  <span className="text-base">💬</span>
                  <span className="text-[8px] font-semibold text-white/80">Oracle</span>
                </button>
              )}

              {/* Scenario Practice */}
              {hasScenario && (
                <button
                  onClick={() => onNavigate("HOLODECK")}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-1.5 transition flex flex-col items-center gap-0.5"
                >
                  <span className="text-base">🎭</span>
                  <span className="text-[8px] font-semibold text-white/80">Holodeck</span>
                </button>
              )}

              {/* Professional */}
              {hasProfessional && (
                <>
                  <button
                    onClick={() => onNavigate("CPD")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-1.5 transition flex flex-col items-center gap-0.5"
                  >
                    <span className="text-base">📋</span>
                    <span className="text-[8px] font-semibold text-white/80">CPD</span>
                  </button>
                  <button
                    onClick={() => onNavigate("PROFESSIONAL_DOC")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-1.5 transition flex flex-col items-center gap-0.5"
                  >
                    <span className="text-base">📄</span>
                    <span className="text-[8px] font-semibold text-white/80">Docs</span>
                  </button>
                </>
              )}

              {/* Reports */}
              {hasReports && (
                <button
                  onClick={() => onNavigate("REPORTS")}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-1.5 transition flex flex-col items-center gap-0.5"
                >
                  <span className="text-base">📊</span>
                  <span className="text-[8px] font-semibold text-white/80">Reports</span>
                </button>
              )}

            </div>
          </div>
        )}

        {/* Explore More Packs */}
        <button
          onClick={() => onShowPackSettings?.()}
          className="w-full mt-3 text-white/60 hover:text-white/90 text-[11px] font-medium py-1.5 transition"
        >
          ✨ Explore Optional Packs
        </button>

        {/* Ad Banner (if configured with Publisher ID) */}
        <div className="mt-6 w-full max-w-xs">
          <AdBanner 
            slotId="0000000000"
            format="horizontal"
            className="justify-center"
          />
        </div>
      </div>

      {/* Data Notice */}
      <div className="mt-4 max-w-xs text-center text-white/40 text-[10px] relative z-10 leading-tight">
        <p>All data stored securely on this device</p>
        <p className="mt-0.5">Export regularly to back up</p>
      </div>
    </div>
  );
}
