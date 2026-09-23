import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Entry } from '../types';
import * as entryStorage from '../services/entryStorageService';
import { requestPersistenceOnce } from '../services/durabilityService';
import { notify } from '../services/noticeService';

interface EntriesContextType {
  entries: Entry[];
  addEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  persistEntries: (entries: Entry[]) => void;
  isEntriesLoaded: boolean;
}

const EntriesContext = createContext<EntriesContextType | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isEntriesLoaded, setIsEntriesLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      await entryStorage.initEntryStorage();
      const loaded = await entryStorage.loadEntries();
      setEntries(loaded);
      setIsEntriesLoaded(true);
    };
    init();
  }, []);

  // The achievements/levels/streak computation that used to run here on
  // every change fed nothing on screen (docs/PHASE-3-SCOPE.md §1.3). Since
  // phase 3D, what someone has tried is worked out from these entries when a
  // screen asks (services/learningService.ts), not on every change.

  // A failed write is shown, not swallowed: the service throws (there is no
  // plaintext copy to fall back on since 3A.2) and the person sees a notice
  // telling them what to do, because the entry is still on screen.
  const writeFailed = (what: string) => (e: unknown) => {
    console.error(`[entries] ${what} failed`, e);
    notify(
      `Could not ${what} on this device. Copy your text somewhere safe before leaving this screen, then try again.`,
      'error',
    );
  };

  const persistEntriesFn = (next: Entry[]) => {
    setEntries(next);
    entryStorage.saveAllEntries(next).catch(writeFailed('save your entries'));
  };

  const addEntry = (entry: Entry) => {
    const updated = [entry, ...entries];
    setEntries(updated);
    entryStorage
      .saveEntry(entry)
      // The first thing worth keeping is the moment to ask the browser to
      // keep it (phase 3A.1). Asked once per device.
      .then(() => requestPersistenceOnce())
      .catch(writeFailed('save this entry'));
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    entryStorage.deleteEntry(id).catch(writeFailed('delete that entry'));
  };

  return (
    <EntriesContext.Provider
      value={{
        entries,
        addEntry,
        deleteEntry,
        persistEntries: persistEntriesFn,
        isEntriesLoaded,
      }}
    >
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries(): EntriesContextType {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error('useEntries must be used within EntriesProvider');
  return ctx;
}
