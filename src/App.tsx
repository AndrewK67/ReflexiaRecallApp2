import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Entry } from "./types";
import { newestDate } from "./utils/lastWritten";
import { triedTracks, pickNudge, dismissNudge, loadFlags } from "./services/learningService";
import { UserProvider, EntriesProvider, AppProvider, useApp, useUser, useEntries } from "./contexts";
import Notices from './components/Notices';
import EntryModal from './components/EntryModal';

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
const PackBrowser = lazy(() => import("./components/PackBrowser"));
const PermissionsHelp = lazy(() => import("./components/PermissionsHelp"));

// Eager load update notification (needs to be available immediately)
import UpdateNotification from "./components/UpdateNotification";

function AppContent() {
  const {
    currentView, navigate, navigateWithGating,
    isLoaded, isLocked, setIsLocked,
    dailyPrompt,
    openEntry, setOpenEntry,
    refreshPackState, showPackGate, setShowPackGate,
  } = useApp();
  const { profile, updateProfile, completeOnboarding } = useUser();
  const { entries, addEntry, deleteEntry } = useEntries();

  // The dashboard's one suggestion (phase 3D.3). Worked out again whenever the
  // screen changes, so a search in Archive or a backup in Profile counts by
  // the time the dashboard is back.
  const [nudgeTick, setNudgeTick] = useState(0);
  const nudge = useMemo(() => {
    const flags = loadFlags();
    return pickNudge(triedTracks(entries, profile, flags), entries.length, flags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, profile.privacyLockEnabled, currentView, nudgeTick]);

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
        return <SimplifiedOnboarding onComplete={handleOnboardingComplete} initialName={profile.name || ''} />;

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
            lastEntryDate={newestDate(entries)}
            nudge={nudge}
            onDismissNudge={() => {
              if (nudge) dismissNudge(nudge.id, entries.length);
              setNudgeTick((n) => n + 1);
            }}
          />
        );
    }
  };

  const renderEntryModal = () =>
    openEntry ? <EntryModal entry={openEntry} onClose={() => setOpenEntry(null)} onDelete={deleteEntry} /> : null;

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
