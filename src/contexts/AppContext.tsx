import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Entry, ViewState } from '../types';
import type { PackId } from '../packs/packTypes';
import { loadPackState, isPackEnabled, getRequiredPack } from '../packs';
import { generateDailyPrompt, initAI } from '../services/aiService';
import { useUser } from './UserContext';
import { useEntries } from './EntriesContext';

interface PackGateInfo {
  packId: PackId;
  featureName: string;
}

interface AppContextType {
  currentView: ViewState;
  navigate: (view: ViewState) => void;
  navigateWithGating: (viewName: string) => void;
  isLoaded: boolean;
  isLocked: boolean;
  setIsLocked: (v: boolean) => void;
  dailyPrompt: string;
  openEntry: Entry | null;
  setOpenEntry: (e: Entry | null) => void;
  packState: ReturnType<typeof loadPackState>;
  refreshPackState: () => void;
  showPackGate: PackGateInfo | null;
  setShowPackGate: (v: PackGateInfo | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { profile, isProfileLoaded } = useUser();
  const { isEntriesLoaded } = useEntries();

  const [currentView, setCurrentView] = useState<ViewState>('ONBOARDING');
  const [isLocked, setIsLocked] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState('Space for your thoughts.');
  const [openEntry, setOpenEntry] = useState<Entry | null>(null);
  const [packState, setPackState] = useState(loadPackState());
  const [showPackGate, setShowPackGate] = useState<PackGateInfo | null>(null);
  const [isInitDone, setIsInitDone] = useState(false);

  const isLoaded = isProfileLoaded && isEntriesLoaded && isInitDone;

  // Init: choose the first screen, check privacy lock, generate daily prompt
  useEffect(() => {
    if (!isProfileLoaded || !isEntriesLoaded) return;

    // A returning user goes straight to the dashboard. Only a first-time user
    // (or one who chose "Return to onboarding" on the profile screen) sees
    // the intro. Before this, every launch replayed onboarding (bug B1).
    setCurrentView(profile.isOnboarded ? 'DASHBOARD' : 'ONBOARDING');

    if (profile.privacyLockEnabled) {
      setIsLocked(true);
    }

    // aiService decides offline vs provider itself (the one gate, phase 3E);
    // it needs the person's key loaded from the keystore first.
    const generatePrompt = async () => {
      try {
        await initAI();
      } catch {
        // no keystore: AI stays offline
      }
      setDailyPrompt(await generateDailyPrompt());
      setIsInitDone(true);
    };

    generatePrompt();
  }, [isProfileLoaded, isEntriesLoaded]);

  // Regenerate the daily prompt when the AI toggle changes
  useEffect(() => {
    if (!isLoaded) return;
    generateDailyPrompt().then(setDailyPrompt);
  }, [profile.aiEnabled]);

  // Escape on the entry modal is handled by EntryModal itself (phase 3B.4),
  // so it can leave Escape to a confirmation dialog open on top of it.

  const navigate = (view: ViewState) => {
    setCurrentView(view);
  };

  const navigateWithGating = (viewName: string) => {
    const requiredPack = getRequiredPack(viewName);
    if (requiredPack && !isPackEnabled(requiredPack)) {
      setShowPackGate({ packId: requiredPack, featureName: viewName });
      return;
    }
    setCurrentView(viewName as ViewState);
  };

  const refreshPackState = () => {
    setPackState(loadPackState());
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        navigate,
        navigateWithGating,
        isLoaded,
        isLocked,
        setIsLocked,
        dailyPrompt,
        openEntry,
        setOpenEntry,
        packState,
        refreshPackState,
        showPackGate,
        setShowPackGate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
