/**
 * PackGate - Shows "Enable Pack" screen when trying to access gated features
 */

import { ArrowLeft } from 'lucide-react';
import type { PackId } from '../packs';
import { getPack, enablePack } from '../packs';

interface PackGateProps {
  requiredPack: PackId;
  featureName: string;
  onClose: () => void;
  onEnable: () => void;
}

export default function PackGate({ requiredPack, featureName, onClose, onEnable }: PackGateProps) {
  const pack = getPack(requiredPack);

  if (!pack) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center text-white">
          <p>Pack not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleEnable = () => {
    enablePack(requiredPack);
    onEnable();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 transition"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Optional Pack</h1>
        <div className="w-10" />
      </div>

      {/* Pack Info */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
        <div className="text-6xl mb-4">{pack.icon}</div>

        <div>
          <h2 className="text-2xl font-bold mb-2">{pack.name}</h2>
          <p className="text-white/70 text-sm">{pack.description}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 w-full text-left">
          <div className="text-xs font-bold text-white/60 mb-2">INCLUDES:</div>
          <ul className="space-y-1">
            {pack.features.map((feature, idx) => (
              <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 w-full">
          <p className="text-xs text-cyan-200">
            <strong>{featureName}</strong> is part of the <strong>{pack.name}</strong> pack.
            Enable it to access this feature.
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/10 rounded-xl hover:bg-white/15 font-semibold transition"
          >
            Maybe Later
          </button>
          <button
            onClick={handleEnable}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl hover:from-cyan-500 hover:to-indigo-500 font-semibold shadow-lg transition"
          >
            Enable Pack
          </button>
        </div>

        <p className="text-xs text-white/50">
          You can disable this pack anytime in Settings
        </p>
      </div>
    </div>
  );
}
