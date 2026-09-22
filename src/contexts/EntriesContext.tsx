import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Entry } from '../types';
import * as entryStorage from '../services/entryStorageService';
import { awardBonusXP } from '../services/gamificationService';
import { requestPersistenceOnce } from '../services/durabilityService';

interface EntriesContextType {
  entries: Entry[];
  addEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  persistEntries: (entries: Entry[]) => void;
  /** Tutorial XP only; nothing displays it. Goes with the tutorial in phase 3D. */
  awardXP: (amount: number) => void;
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
  // every change fed nothing on screen (docs/PHASE-3-SCOPE.md §1.3); phase 3D
  // replaces that service with learning tracks.

  // A failed write is logged, not swallowed: the service throws and there is
  // no plaintext copy to fall back on any more (3A.2). Surfacing it to the
  // person needs the in-app notice component from 3C.4.
  const persistEntriesFn = (next: Entry[]) => {
    setEntries(next);
    entryStorage.saveAllEntries(next).catch((e) => console.error('[entries] saveAll failed', e));
  };

  const addEntry = (entry: Entry) => {
    const updated = [entry, ...entries];
    setEntries(updated);
    entryStorage
      .saveEntry(entry)
      // The first thing worth keeping is the moment to ask the browser to
      // keep it (phase 3A.1). Asked once per device.
      .then(() => requestPersistenceOnce())
      .catch((e) => console.error('[entries] save failed', e));
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    entryStorage.deleteEntry(id).catch((e) => console.error('[entries] delete failed', e));
  };

  const awardXP = (amount: number) => {
    awardBonusXP(amount);
  };

  return (
    <EntriesContext.Provider
      value={{
        entries,
        addEntry,
        deleteEntry,
        persistEntries: persistEntriesFn,
        awardXP,
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
