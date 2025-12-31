import { useEffect, useState, lazy, Suspense } from "react";
import type { Entry, UserProfile, IncidentEntry, ReflectionEntry, ViewState } from "./types";
import { storageService } from "./services/storageService";
import { generateDailyPrompt } from "./services/aiService";
import { offlineDailyPrompt } from "./utils/offlineDailyPrompt";

// Eager load critical components
import Onboarding from "./components/Onboarding";
import Navigation from "./components/Navigation";
import Guide from "./components/Guide";
import PrivacyLock from "./components/PrivacyLock";
import LoadingScreen from "./components/LoadingScreen";

// Lazy load feature components for better code splitting
const ReflectionFlow = lazy(() => import("./components/ReflectionFlow"));
const QuickCapture = lazy(() => import("./components/QuickCapture"));
const NeuralLink = lazy(() => import("./components/NeuralLink"));
const Oracle = lazy(() => import("./components/Oracle"));
const Holodeck = lazy(() => import("./components/Holodeck"));
const BioRhythm = lazy(() => import("./components/BioRhythm"));
const Grounding = lazy(() => import("./components/Grounding"));
const DriveMode = lazy(() => import("./components/DriveMode"));
const CalendarView = lazy(() => import("./components/CalendarView"));
const CrisisProtocols = lazy(() => import("./components/CrisisProtocols"));
const Archive = lazy(() => import("./components/Archive"));
const GamificationHub = lazy(() => import("./components/GamificationHub"));
const CPD = lazy(() => import("./components/CPD"));
const CanvasBoard = lazy(() => import("./components/CanvasBoard"));

function formatReflection(entry: ReflectionEntry) {
  const lines: string[] = [];
  lines.push(`Model: ${entry.model}`);
  if (typeof entry.mood === "number") lines.push(`Mood: ${entry.mood}/5`);
  lines.push("");

  const answers = entry.answers || {};
  const keys = Object.keys(answers);
  if (keys.length === 0) lines.push("(No text saved)");
  else {
    for (const k of keys) {
      const v = (answers[k] || "").trim();
      if (!v) continue;
      lines.push(`${k}`);
      lines.push(v);
      lines.push("");
    }
  }
  return lines.join("\n").trim();
}

function formatIncident(entry: IncidentEntry) {
  const lines: string[] = [];
  lines.push("Incident");
  lines.push("");
  lines.push((entry.notes || "").trim() || "(No notes)");

  // guardianBadge is used by some builds; keep runtime safe even if not in type
  const badge = (entry as any)?.guardianBadge;
  if (badge) {
    lines.push("");
    if (badge?.riskLevel) lines.push(`Guardian: ${badge.riskLevel}`);
    if (badge?.summary) lines.push(String(badge.summary));

    if (Array.isArray(badge?.suggestedActions) && badge.suggestedActions.length) {
      lines.push("");
      lines.push("Suggested actions:");
      for (const a of badge.suggestedActions) lines.push(`• ${a}`);
    }
  }

  return lines.join("\n").trim();
}

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Login-first
  const [view, setView] = useState<ViewState>("ONBOARDING");

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    profession: "NONE",
    guidePersonality: "ZEN",
    aiEnabled: false,
    gamificationEnabled: false,
    themeMode: "DARK",
    isOnboarded: false,
    privacyLockEnabled: false,
    blurHistory: false,
  });

  const [entries, setEntries] = useState<Entry[]>([]);
  const [dailyPrompt, setDailyPrompt] = useState("Space for your thoughts.");
  const [openEntry, setOpenEntry] = useState<Entry | null>(null);

  useEffect(() => {
    const load = async () => {
      const profile = storageService.loadProfile();
      const loadedEntries = storageService.loadEntries();

      // ✅ No duplicate property assignment / spread-overwrite warnings
      const mergedProfile: UserProfile = {
        name: profile?.name ?? "",
        profession: profile?.profession ?? "NONE",
        guidePersonality: profile?.guidePersonality ?? "ZEN",

        isOnboarded: (profile as any)?.isOnboarded ?? false,
        privacyLockEnabled: (profile as any)?.privacyLockEnabled ?? false,
        blurHistory: (profile as any)?.blurHistory ?? false,

        // OFF by default
        aiEnabled: (profile as any)?.aiEnabled ?? false,
        gamificationEnabled: (profile as any)?.gamificationEnabled ?? false,

        themeMode: (profile as any)?.themeMode ?? "DARK",
      };

      setUserProfile(mergedProfile);
      setEntries(loadedEntries);

      if (mergedProfile.privacyLockEnabled) setIsLocked(true);

      try {
        if (mergedProfile.aiEnabled) {
          const prompt = await generateDailyPrompt();
          setDailyPrompt(prompt);
        } else {
          setDailyPrompt(offlineDailyPrompt());
        }
      } catch {
        setDailyPrompt(offlineDailyPrompt());
      }

      setIsLoaded(true);

      // Keep login-first behaviour. If you later want “auto-skip” when onboarded,
      // we can add it as an optional setting.
      setView("ONBOARDING");
    };

    load();
  }, []);

  // Close entry modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openEntry) {
        setOpenEntry(null);
      }
    };

    if (openEntry) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [openEntry]);

  const handleOnboardingComplete = async (partial: Partial<UserProfile>) => {
    const newProfile: UserProfile = { ...userProfile, ...partial, isOnboarded: true };

    storageService.saveProfile(newProfile);
    setUserProfile(newProfile);

    // After login, go dashboard
    setView("DASHBOARD");
  };

  const persistEntries = async (next: Entry[]) => {
    setEntries(next);
    storageService.saveEntries(next);
  };

  const handleEntryComplete = async (newEntry: Entry) => {
    const updated = [newEntry, ...entries];
    await persistEntries(updated);
    setView("DASHBOARD");
  };

  const handleUpdateProfile = async (p: UserProfile) => {
    setUserProfile(p);
    storageService.saveProfile(p);

    try {
      if (p.aiEnabled) setDailyPrompt(await generateDailyPrompt());
      else setDailyPrompt(offlineDailyPrompt());
    } catch {
      setDailyPrompt(offlineDailyPrompt());
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getFirstName = () => {
    const safe = typeof userProfile.name === "string" ? userProfile.name : "";
    return safe.trim().split(" ")[0] || "friend";
  };

  const renderDashboard = () => (
    <div className="h-full overflow-y-auto flex flex-col items-center justify-center p-6 nav-safe">
      <div className="text-center mb-8 max-w-xs mx-auto">
        <h1 className="text-3xl font-light text-white tracking-tight mb-2">
          {getGreeting()}, {getFirstName()}.
        </h1>
        <p className="text-white/70 font-medium text-lg leading-relaxed">{dailyPrompt ? `"${dailyPrompt}"` : ""}</p>
      </div>

      <div className="mb-12 transform scale-125 transition-transform duration-1000 hover:scale-[1.3]">
        <Guide stageId={null} state="idle" />
      </div>

      <button
        onClick={() => setView("REFLECTION")}
        className="w-full max-w-xs bg-white/10 text-white h-16 rounded-full font-semibold text-lg border border-white/20 shadow-xl hover:bg-white/15 active:scale-95 transition-all"
      >
        Reflect
      </button>
    </div>
  );

  const renderEntryModal = () => {
    if (!openEntry) return null;

    const title = openEntry.type === "INCIDENT" ? "Incident" : `Reflection • ${(openEntry as ReflectionEntry).model}`;
    const body = openEntry.type === "INCIDENT" ? formatIncident(openEntry as IncidentEntry) : formatReflection(openEntry as ReflectionEntry);

    return (
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
      >
        <div className="w-full max-w-md bg-white rounded-t-3xl border border-slate-200 shadow-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="text-xs text-slate-500 font-bold">{new Date(openEntry.date).toLocaleString()}</div>
              <div id="entry-modal-title" className="text-base font-extrabold text-slate-800">{title}</div>
            </div>
            <button
              onClick={() => setOpenEntry(null)}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              aria-label="Close entry details"
            >
              Close
            </button>
          </div>

          <div className="mt-3 max-h-[60vh] overflow-y-auto custom-scrollbar whitespace-pre-line text-sm text-slate-700 leading-relaxed border border-slate-200 rounded-2xl p-4 bg-slate-50">
            {body}
          </div>
        </div>
      </div>
    );
  };

  const bgMode = userProfile.themeMode === "LIGHT" ? "bg-anim light" : "bg-anim";

  // Simple loading fallback for Suspense
  const ComponentLoader = () => (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-3 border-t-cyan-400 border-white/20 rounded-full animate-spin" />
    </div>
  );

  const renderScreen = () => {
    switch (view) {
      case "ONBOARDING":
        return <Onboarding onComplete={handleOnboardingComplete} />;

      case "REFLECTION":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ReflectionFlow
                profession={userProfile.profession}
                aiEnabled={userProfile.aiEnabled === true}
                onComplete={handleEntryComplete}
                onCancel={() => setView("DASHBOARD")}
              />
          </Suspense>
        );

      case "CALENDAR":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <CalendarView entries={entries} onOpenEntry={(e) => setOpenEntry(e)} />
          </Suspense>
        );

      case "QUICK_CAPTURE":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <QuickCapture
                aiEnabled={userProfile.aiEnabled === true}
                onComplete={handleEntryComplete}
                onCancel={() => setView("DASHBOARD")}
              />
          </Suspense>
        );

      case "DRIVE_MODE":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <DriveMode onComplete={handleEntryComplete} onClose={() => setView("DASHBOARD")} />
          </Suspense>
        );

      case "NEURAL_LINK":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <NeuralLink
                entries={entries}
                profile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                onNavigateToWelcome={() => setView("ONBOARDING")}
              />
          </Suspense>
        );

      case "HOLODECK":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <Holodeck onClose={() => setView("DASHBOARD")} />
          </Suspense>
        );

      case "BIO_RHYTHM":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <BioRhythm onClose={() => setView("DASHBOARD")} />
          </Suspense>
        );

      case "GROUNDING":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <Grounding onClose={() => setView("DASHBOARD")} />
          </Suspense>
        );

      case "ORACLE":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <Oracle entries={entries} onClose={() => setView("DASHBOARD")} />
          </Suspense>
        );

      case "CRISIS_PROTOCOLS":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <CrisisProtocols onClose={() => setView("DASHBOARD")} />
          </Suspense>
        );

      case "ARCHIVE":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <Archive entries={entries} onOpenEntry={(e) => setOpenEntry(e)} />
          </Suspense>
        );

      case "GAMIFICATION":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <GamificationHub entries={entries} onClose={() => setView("DASHBOARD")} />
          </Suspense>
        );

      case "CPD":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <CPD entries={entries} onClose={() => setView("DASHBOARD")} />
          </Suspense>
        );

      case "CANVAS":
        return (
          <Suspense fallback={<ComponentLoader />}>
              <CanvasBoard onCancel={() => setView("DASHBOARD")} />
          </Suspense>
        );

      case "DASHBOARD":
      default:
        return renderDashboard();
    }
  };

  const showNav = isLoaded && !isLocked && view !== "ONBOARDING";

  return (
    <>
      <div className={bgMode} />

      <div className="app-shell">
        <div className="phone">
          {!isLoaded && <LoadingScreen />}

          {isLoaded && isLocked && (
            <div className="fade-in">
              <PrivacyLock onUnlock={() => setIsLocked(false)} userName={userProfile.name || ""} />
            </div>
          )}

          {isLoaded && !isLocked && (
            <>
              <div className="fade-in h-full flex flex-col">
                {/* Top Section - Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {renderScreen()}
                  {renderEntryModal()}
                </div>

                {/* Bottom Section - Fixed Navigation */}
                {showNav && <Navigation current={view} onChange={(v) => setView(v)} />}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
