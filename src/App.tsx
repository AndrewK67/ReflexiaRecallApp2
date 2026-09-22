import { lazy, Suspense } from "react";
import type { Entry, IncidentEntry, ReflectionEntry } from "./types";
import { UserProvider, EntriesProvider, AppProvider, useApp, useUser, useEntries } from "./contexts";
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { readMediaFile } from './services/fileStorageService';

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
const CrisisProtocols = lazy(() => import("./modules/professional/components/CrisisProtocols"));
const Archive = lazy(() => import("./components/Archive"));
const CPD = lazy(() => import("./modules/professional/components/CPD"));
const Reports = lazy(() => import("./components/Reports"));
const ProfessionalDocExport = lazy(() => import("./modules/professional/components/ProfessionalDocExport"));
const Tutorial = lazy(() => import("./components/Tutorial"));
const PackBrowser = lazy(() => import("./components/PackBrowser"));
const PermissionsHelp = lazy(() => import("./components/PermissionsHelp"));

// Eager load update notification (needs to be available immediately)
import UpdateNotification from "./components/UpdateNotification";

// Helper function to open Documents folder
async function openDocumentsFolder() {
  try {
    if (Capacitor.getPlatform() === 'android') {
      try {
        window.location.href = 'content://com.android.externalstorage.documents/document/primary%3ADocuments';
      } catch (e) {
        // silently ignore - fallback methods below
      }

      setTimeout(() => {
        try {
          const intent = 'intent:#Intent;' +
            'action=android.intent.action.GET_CONTENT;' +
            'type=*/*;' +
            'end';
          window.open(intent, '_system');
        } catch (e) {
          // silently ignore - fallback methods below
        }
      }, 500);

      setTimeout(() => {
        try {
          window.location.href = 'intent:#Intent;action=android.intent.action.VIEW;end';
        } catch (e) {
          alert('Could not open file manager. Please open My Files app and go to Documents folder manually.');
        }
      }, 1000);
    } else {
      alert('Please open your Files app and navigate to the Documents folder.');
    }
  } catch (error) {
    console.error('Error opening folder:', error);
    alert('Please open your Files/My Files app manually and go to Documents folder.');
  }
}

// Helper function to save audio to Downloads folder
async function saveAudioToDownloads(audioUrl: string) {
  try {
    if (audioUrl.startsWith('file://')) {
      if (Capacitor.getPlatform() === 'android') {
        try {
          const originalPath = audioUrl.replace('file://', '');

          const fileData = await Filesystem.readFile({
            path: originalPath,
          });

          const dataSize = typeof fileData.data === 'string' ? fileData.data.length : fileData.data.size;

          if (!fileData.data || dataSize === 0) {
            alert('Error: Audio file is empty or could not be read.');
            return;
          }

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          const publicFileName = `Reflexia_Audio_${timestamp}.webm`;

          await Filesystem.writeFile({
            path: publicFileName,
            data: fileData.data,
            directory: Directory.Documents,
          });

          const verification = await Filesystem.readFile({
            path: publicFileName,
            directory: Directory.Documents,
          });
          const verifySize = typeof verification.data === 'string' ? verification.data.length : verification.data.size;

          alert(
            `✅ Audio saved successfully!\n\n` +
            `📂 Location: Documents folder\n` +
            `📄 File: ${publicFileName}\n` +
            `File size: ${Math.round(verifySize / 1024)}KB\n\n` +
            `🎵 How to play:\n` +
            `1. Open "My Files" or "Files" app on your phone\n` +
            `2. Tap "Documents" folder\n` +
            `3. Look for file: ${publicFileName}\n` +
            `4. Tap the file to play\n\n` +
            `📱 Recommended players:\n` +
            `• VLC for Android (free from Play Store)\n` +
            `• Chrome browser\n` +
            `• MX Player\n\n` +
            `💡 Tip: All Reflexia audio files start with "Reflexia_Audio_"`
          );

        } catch (err) {
          console.error('Error saving file:', err);
          alert(`Error saving audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } else {
        window.open(audioUrl, '_system');
      }
    } else if (audioUrl.startsWith('idb://')) {
      try {
        const resolvedUrl = await readMediaFile(audioUrl);
        const response = await fetch(resolvedUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `audio_${Date.now()}.${blob.type.split('/')[1] || 'webm'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error('Error reading audio from IndexedDB:', err);
        alert('Could not read audio file. It may have been deleted.');
      }
    } else if (audioUrl.startsWith('blob:')) {
      alert('This audio is not yet saved. Please use the "Save to Device" button in the capture screen first.');
    } else if (audioUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `audio_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert('Could not download audio: unsupported format.');
    }
  } catch (error) {
    console.error('Error saving audio file:', error);
    alert('Could not save audio file. Please try again.');
  }
}

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
  const { entries, addEntry, stats, awardXP } = useEntries();

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
              profession={profile.profession}
              aiEnabled={profile.aiEnabled === true}
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
              aiEnabled={profile.aiEnabled === true}
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
            <Holodeck onClose={() => navigate("DASHBOARD")} />
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

      case "CRISIS_PROTOCOLS":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <CrisisProtocols onClose={() => navigate("DASHBOARD")} />
          </Suspense>
        );

      case "ARCHIVE":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Archive entries={entries} onOpenEntry={(e) => setOpenEntry(e)} />
          </Suspense>
        );

      case "CPD":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <CPD entries={entries} onClose={() => navigate("DASHBOARD")} />
          </Suspense>
        );

      case "REPORTS":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Reports entries={entries} onClose={() => navigate("DASHBOARD")} />
          </Suspense>
        );

      case "PROFESSIONAL_DOC":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ProfessionalDocExport entries={entries} onClose={() => navigate("DASHBOARD")} />
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
            currentStreak={stats.currentStreak ?? 0}
          />
        );
    }
  };

  const renderEntryModal = () => {
    if (!openEntry) return null;

    const title = openEntry.type === "INCIDENT" ? "Incident" : `Reflection • ${(openEntry as ReflectionEntry).model}`;
    const body = openEntry.type === "INCIDENT" ? formatIncident(openEntry as IncidentEntry) : formatReflection(openEntry as ReflectionEntry);

    const media = (openEntry as IncidentEntry).media || [];
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
                              alert('No audio file URL available.');
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
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {renderScreen()}
                  {renderEntryModal()}
                </div>

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
