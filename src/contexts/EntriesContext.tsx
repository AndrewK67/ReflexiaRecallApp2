import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { Entry } from '../types';
import * as entryStorage from '../services/entryStorageService';
import { buildGamificationData, getGamificationStats, getHolodeckSessionCount, awardBonusXP } from '../services/gamificationService';
import { getGroundingSessions } from '../services/groundingService';

interface EntriesContextType {
  entries: Entry[];
  addEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  persistEntries: (entries: Entry[]) => void;
  stats: ReturnType<typeof getGamificationStats>;
  currentXP: number;
  setCurrentXP: React.Dispatch<React.SetStateAction<number>>;
  awardXP: (amount: number) => void;
  isEntriesLoaded: boolean;
}

const EntriesContext = createContext<EntriesContextType | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentXP, setCurrentXP] = useState(0);
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

  const gamificationData = useMemo(() => {
    const groundingSessions = getGroundingSessions().filter((s) => s.completed).length;
    const holodeckSessions = getHolodeckSessionCount();
    return buildGamificationData(entries, groundingSessions, holodeckSessions);
  }, [entries]);

  const stats = useMemo(() => getGamificationStats(gamificationData), [gamificationData]);

  useEffect(() => {
    setCurrentXP(stats.totalPoints);
  }, [stats.totalPoints]);

  const persistEntriesFn = (next: Entry[]) => {
    setEntries(next);
    entryStorage.saveAllEntries(next);
  };

  const addEntry = (entry: Entry) => {
    const updated = [entry, ...entries];
    setEntries(updated);
    entryStorage.saveEntry(entry);
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    entryStorage.deleteEntry(id);
  };

  const awardXP = (amount: number) => {
    awardBonusXP(amount);
    setCurrentXP((prev) => prev + amount);
  };

  return (
    <EntriesContext.Provider
      value={{
        entries,
        addEntry,
        deleteEntry,
        persistEntries: persistEntriesFn,
        stats,
        currentXP,
        setCurrentXP,
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
