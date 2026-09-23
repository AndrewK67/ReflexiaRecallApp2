/**
 * PackBrowser - switch optional packs on and off (phase 3B.3).
 *
 * It used to open a "Try or Subscribe" sheet with a 7-day trial, Pro at
 * £9.99/month, Lifetime at £99 and Enterprise. None of that existed
 * (CLAUDE.md, decision 6): a pack is now a plain switch.
 */

import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { getOptionalPacks, isPackEnabled, togglePack, type PackId } from '../packs';

interface PackBrowserProps {
  onClose: () => void;
  onPacksChanged?: () => void;
}

export default function PackBrowser({ onClose, onPacksChanged }: PackBrowserProps) {
  const packs = getOptionalPacks();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(packs.map((p) => [p.id, isPackEnabled(p.id)])),
  );

  const handleToggle = (id: PackId) => {
    const now = togglePack(id);
    setEnabled((prev) => ({ ...prev, [id]: now }));
    onPacksChanged?.();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 text-white overflow-y-auto custom-scrollbar nav-safe">
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      <div className="sticky top-0 bg-slate-950/50 backdrop-blur border-b border-white/10 z-20 relative">
        <div className="flex items-center justify-between p-6">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Optional Packs</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 p-6 pb-24 relative">
        <div className="max-w-2xl mx-auto">
          <p className="text-white/80 text-sm leading-relaxed mb-6">
            Extra tools you can switch on if they help. Everything else — capture, reflect, spaces, archive — is always
            there. Switching a pack off hides it; nothing you wrote is removed.
          </p>

          <ul className="space-y-3">
            {packs.map((pack) => {
              const on = enabled[pack.id] === true;
              return (
                <li
                  key={pack.id}
                  className={`rounded-2xl border p-5 transition ${
                    on ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0" aria-hidden="true">
                      {pack.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-white">{pack.name}</h2>
                      <p className="mt-1 text-sm text-white/80 leading-relaxed">{pack.description}</p>
                      <ul className="mt-2 space-y-1">
                        {pack.features.map((f) => (
                          <li key={f} className="text-xs text-white/70 flex items-start gap-2">
                            <Check size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      role="switch"
                      aria-checked={on}
                      aria-label={pack.name}
                      onClick={() => handleToggle(pack.id)}
                      className={`flex-shrink-0 relative w-12 h-7 rounded-full border transition ${
                        on ? 'bg-cyan-500 border-cyan-400' : 'bg-white/10 border-white/20'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                          on ? 'left-6' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
