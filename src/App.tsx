import { lazy, Suspense, useEffect, useRef } from "react";
import type { Entry, CaptureEntry, ReflectionEntry } from "./types";
import { isCapture } from "./utils/entryKind";
import { UserProvider, EntriesProvider, AppProvider, useApp, useUser, useEntries } from "./contexts";
import { saveAudioToDownloads } from './services/audioExport';
import { notify } from './services/noticeService';
import Notices from './components/Notices';
import { frameworkName, stageLabel } from "./frameworks";

// Eager load critical components
import SimplifiedOnboarding from "./components/SimplifiedOnboarding";
import SimplifiedDashboard from "./components/SimplifiedDashboard";
import Navigation from "./components/Navigation";
import PrivacyLock from "./components/PrivacyLock";
import LoadingScreen from "./components/LoadingScreen";
import PackGate from "./components/PackGate";

// Lazy load feature components for better code splitting
const ReflectionFlow = lazy(() => import("./components/ReflectionFlow"));
const QuickCapture = lazy(() => import("./components/QuickCapture"));
const NeuralLink = lazy(() => import("./components/NeuralLink"));
const Oracle = lazy(() => import("./components/Oracle"));
const Holodeck = lazy(() => import("./components/Holodeck"));
const BioRhythm = lazy(() => import("./components/BioRhythm"));
const Grounding = lazy(() => import("./components/Grounding"));
const CalendarView = lazy(() => import("./components/CalendarView"));
const Archive = lazy(() => import("./components/Archive"));
const Reports = lazy(() => import("./components/Reports"));
const Tutorial = lazy(() => import("./components/Tutorial"));
const PackBrowser = lazy(() => import("./components/PackBrowser"));
const PermissionsHelp = lazy(() => import("./components/PermissionsHelp"));

// Eager load update notification (needs to be available immediately)
import UpdateNotification from "./components/UpdateNotification";

function formatReflection(entry: ReflectionEntry) {
  const lines: string[] = [];
  lines.push(`Framework: ${frameworkName(entry.model)}`);
  if (typeof entry.mood === "number") lines.push(`Mood: ${entry.mood}/5`);
  lines.push("");

  const answers = entry.answers || {};
  const keys = Object.keys(answers);
  if (keys.length === 0) lines.push("(No text saved)");
  else {
    for (const k of keys) {
      const v = (answers[k] || "").trim();
      if (!v) continue;
      lines.push(stageLabel(entry.model, k));
      lines.push(v);
      lines.push("");
    }
  }
  return lines.join("\n").trim();
}

function formatCapture(entry: CaptureEntry) {
  const lines: string[] = [];
  lines.push("Capture");
  lines.push("");
  lines.push((entry.notes || "").trim() || "(No notes)");

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

function AppContent() {
  const {
    currentView, navigate, navigateWithGating,
    isLoaded, isLocked, setIsLocked,
    dailyPrompt, showTutorial, setShowTutorial,
    openEntry, setOpenEntry,
    refreshPackState, showPackGate, setShowPackGate,
  } = useApp();
  const { profile, updateProfile, completeOnboarding } = useUser();
  const { entries, addEntry, awardXP } = useEntries();

  // Keyboard: when the screen changes, start the tab order at the top of the
  // new screen. Without this, focus stays wherever the removed button was and
  // Tab lands on the tab bar, skipping the whole screen (phase 3C.3). A screen
  // that focuses one of its own controls on mount keeps that focus.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const active = document.activeElement;
    if (active && active !== document.body && main.contains(active)) return;
    main.focus({ preventScroll: true });
  }, [currentView, isLoaded, isLocked]);

  const handleEntryComplete = (entry: Entry) => {
    addEntry(entry);
    navigate("DASHBOARD");
  };

  const handleOnboardingComplete = (partial: Partial<import('./types').UserProfile>) => {
    completeOnboarding(partial);
    navigate("DASHBOARD");
  };

  const ComponentLoader = () => (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-3 border-t-cyan-400 border-white/20 rounded-full animate-spin" />
    </div>
  );

  if (showPackGate) {
    return (
      <PackGate
        requiredPack={showPackGate.packId}
        featureName={showPackGate.featureName}
        onClose={() => setShowPackGate(null)}
        onEnable={() => {
          refreshPackState();
          setShowPackGate(null);
        }}
      />
    );
  }

  const renderScreen = () => {
    switch (currentView) {
      case "ONBOARDING":
        return <SimplifiedOnboarding onComplete={handleOnboardingComplete} />;

      case "REFLECTION":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ReflectionFlow
              onComplete={handleEntryComplete}
              onCancel={() => navigate("DASHBOARD")}
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
              onComplete={handleEntryComplete}
              onCancel={() => navigate("DASHBOARD")}
            />
          </Suspense>
        );

      case "NEURAL_LINK":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <NeuralLink
              entries={entries}
              profile={profile}
              onUpdateProfile={updateProfile}
              onNavigateToWelcome={() => navigate("ONBOARDING")}
              onStartTutorial={() => setShowTutorial(true)}
              onShowPermissionsHelp={() => navigate("PERMISSIONS_HELP")}
            />
          </Suspense>
        );

      case "HOLODECK":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Holodeck onClose={() => navigate("DASHBOARD")} onComplete={handleEntryComplete} />
          </Suspense>
        );

      case "BIO_RHYTHM":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <BioRhythm onClose={() => navigate("DASHBOARD")} />
          </Suspense>
        );

      case "GROUNDING":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Grounding onClose={() => navigate("DASHBOARD")} />
          </Suspense>
        );

      case "ORACLE":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Oracle entries={entries} onClose={() => navigate("DASHBOARD")} />
          </Suspense>
        );

      case "ARCHIVE":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Archive entries={entries} onOpenEntry={(e) => setOpenEntry(e)} />
          </Suspense>
        );

      case "REPORTS":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Reports entries={entries} onClose={() => navigate("DASHBOARD")} />
          </Suspense>
        );

      case "PACK_BROWSER":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <PackBrowser
              onClose={() => navigate("DASHBOARD")}
              onPacksChanged={() => refreshPackState()}
            />
          </Suspense>
        );

      case "PERMISSIONS_HELP":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <PermissionsHelp onClose={() => navigate("NEURAL_LINK")} />
          </Suspense>
        );

      case "DASHBOARD":
      default:
        return (
          <SimplifiedDashboard
            userName={profile.name || ""}
            dailyPrompt={dailyPrompt}
            onNavigate={(viewName) => navigateWithGating(viewName)}
            onShowPackSettings={() => navigate("PACK_BROWSER")}
            totalEntries={entries.length}
          />
        );
    }
  };

  const renderEntryModal = () => {
    if (!openEntry) return null;

    const title = isCapture(openEntry) ? "Capture" : `Reflection • ${frameworkName((openEntry as ReflectionEntry).model)}`;
    const body = isCapture(openEntry) ? formatCapture(openEntry) : formatReflection(openEntry as ReflectionEntry);

    const media = (isCapture(openEntry) ? openEntry.media : undefined) || [];
    const hasMedia = media.length > 0;

    return (
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
      >
        <div className="w-full max-w-md bg-white rounded-t-3xl border border-slate-200 shadow-2xl p-5 max-h-[90vh] flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="text-xs text-slate-500 font-bold">{new Date(openEntry.date).toLocaleString()}</div>
              <div id="entry-modal-title" className="text-base font-extrabold text-slate-800">{title}</div>
            </div>
            <button
              autoFocus
              onClick={() => setOpenEntry(null)}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              aria-label="Close entry details"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {hasMedia && (
              <div className="mb-4 space-y-3">
                {media.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                    {item.type === 'PHOTO' && (
                      <img
                        src={item.url}
                        alt="Captured photo"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    )}

                    {item.type === 'VIDEO' && (
                      <div className="relative bg-black">
                        <video
                          src={item.url}
                          controls
                          playsInline
                          className="w-full h-auto max-h-96"
                          preload="metadata"
                        >
                          Your browser does not support video playback.
                        </video>
                      </div>
                    )}

                    {item.type === 'AUDIO' && (
                      <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex flex-col items-center gap-3">
                        <div className="text-4xl">🎵</div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-700 mb-1">Audio Recording</p>
                          <p className="text-xs text-slate-500">Click to save to your Documents folder</p>
                        </div>
                        <button
                          onClick={() => {
                            if (item.url) {
                              saveAudioToDownloads(item.url);
                            } else {
                              notify('This attachment has no audio file.', 'error');
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 transition shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Save to Documents
                        </button>
                      </div>
                    )}

                    {item.type === 'DRAWING' && (
                      <img
                        src={item.url}
                        alt="Drawing"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="whitespace-pre-line text-sm text-slate-700 leading-relaxed border border-slate-200 rounded-2xl p-4 bg-slate-50">
              {body}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const bgMode = profile.themeMode === "LIGHT" ? "bg-anim light" : "bg-anim";
  const showNav = isLoaded && !isLocked && currentView !== "ONBOARDING";

  return (
    <>
      <UpdateNotification />
      <Notices />
      <div className={bgMode} />

      <div className="app-shell">
        <div className="phone">
          {!isLoaded && <LoadingScreen />}

          {isLoaded && isLocked && (
            <div className="fade-in">
              <PrivacyLock onUnlock={() => setIsLocked(false)} userName={profile.name || ""} />
            </div>
          )}

          {isLoaded && !isLocked && (
            <>
              <div className="fade-in h-full flex flex-col">
                {/* One landmark for the screen; the nav below is its own (phase 3C.1) */}
                <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 overflow-y-auto custom-scrollbar outline-none">
                  {renderScreen()}
                  {renderEntryModal()}
                </main>

                {showNav && <Navigation current={currentView} onChange={(v) => navigate(v)} />}
              </div>
            </>
          )}
        </div>
      </div>

      {showTutorial && isLoaded && !isLocked && (
        <Suspense fallback={null}>
          <Tutorial
            onClose={() => setShowTutorial(false)}
            onNavigate={(targetView) => navigate(targetView)}
            onAwardXP={(amount, _reason) => {
              awardXP(amount);
            }}
          />
        </Suspense>
      )}
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <EntriesProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </EntriesProvider>
    </UserProvider>
  );
}
