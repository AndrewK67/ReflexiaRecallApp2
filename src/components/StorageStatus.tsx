/**
 * Profile → Your data. One honest line about where entries live and whether
 * the browser has promised to keep them, plus Install when the browser
 * offers it (phase 3A.1).
 */

import React, { useEffect, useState } from 'react';
import { HardDrive, Download } from 'lucide-react';
import {
  persistenceState,
  storageUsage,
  formatBytes,
  canInstall,
  onInstallAvailabilityChange,
  promptInstall,
  isStandalone,
  requestPersistence,
  type PersistenceState,
  type StorageUsage,
} from '../services/durabilityService';
import { isPlaintextFallback } from '../services/entryStorageService';

interface StorageStatusProps {
  entryCount: number;
}

export default function StorageStatus({ entryCount }: StorageStatusProps) {
  const [state, setState] = useState<PersistenceState>('unknown');
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [installable, setInstallable] = useState(canInstall());
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setState(await persistenceState());
    setUsage(await storageUsage());
  };

  useEffect(() => {
    refresh();
    return onInstallAvailabilityChange(() => setInstallable(canInstall()));
  }, []);

  const plaintext = isPlaintextFallback();
  const installed = isStandalone();

  const line = plaintext
    ? 'This browser has no IndexedDB, so entries are kept unencrypted in its local storage. Export a backup and use another browser if you can.'
    : state === 'persisted'
      ? 'Stored encrypted on this device. The browser has agreed to keep it.'
      : state === 'best-effort'
        ? 'Stored encrypted on this device. The browser has not promised to keep it: if space runs short it may clear this app\'s data. Installing the app or exporting a backup protects it.'
        : 'Stored encrypted on this device.';

  const handleAskAgain = async () => {
    setBusy(true);
    await requestPersistence();
    await refresh();
    setBusy(false);
  };

  const handleInstall = async () => {
    setBusy(true);
    await promptInstall();
    setInstallable(canInstall());
    await refresh();
    setBusy(false);
  };

  return (
    <section
      aria-labelledby="storage-status-heading"
      className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15"
    >
      <h2 id="storage-status-heading" className="text-lg font-bold mb-2 flex items-center gap-2">
        <HardDrive size={18} className="text-cyan-300" /> Your data
      </h2>
      <p role="status" className="text-sm text-white/80">
        {line}
      </p>
      <p className="mt-2 text-xs text-white/60">
        {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
        {usage && usage.usageBytes > 0 ? ` · ${formatBytes(usage.usageBytes)} used` : ''}
        {installed ? ' · installed' : ''}
      </p>

      {(installable || (state === 'best-effort' && !plaintext)) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {installable && (
            <button
              onClick={handleInstall}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/30 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <Download size={16} /> Install the app
            </button>
          )}
          {state === 'best-effort' && !plaintext && (
            <button
              onClick={handleAskAgain}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold disabled:opacity-50"
            >
              Ask the browser to keep it
            </button>
          )}
        </div>
      )}
    </section>
  );
}
