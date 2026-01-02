/**
 * PackBrowser - Browse and manage optional feature packs with trial system
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Clock, Infinity as InfinityIcon, X } from 'lucide-react';
import {
  getOptionalPacks,
  getPackInfo,
  enablePack,
  disablePack,
  getRemainingTrialDays,
  isTrialExpired,
  type PackId,
  type TrialDuration
} from '../packs';

interface PackBrowserProps {
  onClose: () => void;
  onPacksChanged?: () => void;
}

export default function PackBrowser({ onClose, onPacksChanged }: PackBrowserProps) {
  const [packInfos, setPackInfos] = useState<Map<PackId, ReturnType<typeof getPackInfo>>>(new Map());
  const [showTrialPicker, setShowTrialPicker] = useState<PackId | null>(null);

  const optionalPacks = getOptionalPacks();

  // Load pack info on mount
  useEffect(() => {
    const infos = new Map();
    optionalPacks.forEach(pack => {
      infos.set(pack.id, getPackInfo(pack.id));
    });
    setPackInfos(infos);
  }, []);

  const refreshPackInfos = () => {
    const infos = new Map();
    optionalPacks.forEach(pack => {
      infos.set(pack.id, getPackInfo(pack.id));
    });
    setPackInfos(infos);
    onPacksChanged?.();
  };

  const handleEnable = (packId: PackId, duration: TrialDuration) => {
    enablePack(packId, duration);
    setShowTrialPicker(null);
    refreshPackInfos();
  };

  const handleDisable = (packId: PackId) => {
    disablePack(packId);
    refreshPackInfos();
  };

  const handleToggle = (packId: PackId) => {
    const info = packInfos.get(packId);

    if (info?.enabled && !isTrialExpired(info)) {
      // Already enabled - disable it
      handleDisable(packId);
    } else {
      // Not enabled - show trial picker
      setShowTrialPicker(packId);
    }
  };

  // Group packs by category
  const categories = {
    wellbeing: optionalPacks.filter(p => p.category === 'wellbeing'),
    productivity: optionalPacks.filter(p => p.category === 'productivity'),
    professional: optionalPacks.filter(p => p.category === 'professional'),
    advanced: optionalPacks.filter(p => p.category === 'advanced'),
  };

  const categoryLabels = {
    wellbeing: 'Wellbeing',
    productivity: 'Productivity',
    professional: 'Professional',
    advanced: 'Advanced',
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-y-auto custom-scrollbar nav-safe">
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 z-20 relative">
        <div className="flex items-center justify-between p-6">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 transition"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Optional Packs</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Trial Picker Modal */}
      {showTrialPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border-2 border-cyan-500/30 max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowTrialPicker(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
            >
              <X size={16} />
            </button>

            <h2 className="text-xl font-bold mb-2">Choose Trial Duration</h2>
            <p className="text-white/70 text-sm mb-6">
              Try this pack for free, or enable it forever
            </p>

            <div className="space-y-3">
              {/* Forever */}
              <button
                onClick={() => handleEnable(showTrialPicker, 'forever')}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border-2 border-cyan-500/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <InfinityIcon size={20} className="text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">Enable Forever</div>
                      <div className="text-xs text-white/60">Full access, no expiry</div>
                    </div>
                  </div>
                  <div className="text-cyan-400 font-bold">FREE</div>
                </div>
              </button>

              {/* 7 Day Trial */}
              <button
                onClick={() => handleEnable(showTrialPicker, 7)}
                className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Clock size={20} className="text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">7-Day Trial</div>
                      <div className="text-xs text-white/60">Try before you commit</div>
                    </div>
                  </div>
                  <div className="text-purple-400 font-bold">7d</div>
                </div>
              </button>

              {/* 3 Day Trial */}
              <button
                onClick={() => handleEnable(showTrialPicker, 3)}
                className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Clock size={20} className="text-orange-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">3-Day Trial</div>
                      <div className="text-xs text-white/60">Quick test run</div>
                    </div>
                  </div>
                  <div className="text-orange-400 font-bold">3d</div>
                </div>
              </button>

              {/* 1 Day Trial */}
              <button
                onClick={() => handleEnable(showTrialPicker, 1)}
                className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Clock size={20} className="text-yellow-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">1-Day Trial</div>
                      <div className="text-xs text-white/60">Just a taste</div>
                    </div>
                  </div>
                  <div className="text-yellow-400 font-bold">1d</div>
                </div>
              </button>
            </div>

            <p className="text-xs text-white/50 text-center mt-4">
              All options are completely free. Trials can be converted to forever anytime.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-6 space-y-8 pb-24 relative">
        <div className="max-w-2xl mx-auto">
          {/* Description */}
          <div className="text-center mb-8">
            <p className="text-white/70 text-sm leading-relaxed">
              Reflexia uses a modular pack system. Try packs for free before enabling them permanently.
            </p>
          </div>

          {/* Packs by Category */}
          {Object.entries(categories).map(([categoryKey, packs]) => {
            if (packs.length === 0) return null;

            return (
              <div key={categoryKey} className="mb-8">
                <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">
                  {categoryLabels[categoryKey as keyof typeof categoryLabels]}
                </h2>
                <div className="space-y-3">
                  {packs.map((pack) => {
                    const info = packInfos.get(pack.id);
                    const isEnabled = info?.enabled && !isTrialExpired(info);
                    const isExpired = info?.enabled && isTrialExpired(info);
                    const remainingDays = info ? getRemainingTrialDays(info) : 0;

                    return (
                      <div
                        key={pack.id}
                        className={`
                          bg-white/5 backdrop-blur-xl rounded-2xl border transition-all
                          ${isEnabled
                            ? 'border-cyan-500/50 bg-cyan-500/10'
                            : isExpired
                            ? 'border-red-500/30 bg-red-500/5'
                            : 'border-white/10 hover:border-white/20'
                          }
                        `}
                      >
                        <div className="p-5">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="text-4xl flex-shrink-0">{pack.icon}</div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">
                                  {pack.name}
                                </h3>
                                <p className="text-sm text-white/70 leading-relaxed mb-2">
                                  {pack.description}
                                </p>

                                {/* Status Badge */}
                                {isEnabled && info && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    {info.isPermanent ? (
                                      <>
                                        <InfinityIcon size={12} />
                                        <span>Enabled Forever</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock size={12} />
                                        <span>{remainingDays} day{remainingDays !== 1 ? 's' : ''} left</span>
                                      </>
                                    )}
                                  </div>
                                )}

                                {isExpired && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                    <X size={12} />
                                    <span>Trial Expired</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Toggle */}
                            <button
                              onClick={() => handleToggle(pack.id)}
                              className={`
                                px-4 py-2 rounded-xl font-bold text-sm transition-all flex-shrink-0
                                ${isEnabled
                                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                                  : 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white'
                                }
                              `}
                            >
                              {isEnabled ? 'Disable' : isExpired ? 'Re-enable' : 'Enable'}
                            </button>
                          </div>

                          {/* Features */}
                          <div className="bg-white/5 rounded-xl p-3">
                            <div className="text-xs font-bold text-white/50 mb-2">INCLUDES:</div>
                            <ul className="space-y-1">
                              {pack.features.map((feature, idx) => (
                                <li key={idx} className="text-xs text-white/70 flex items-start gap-2">
                                  <span className="text-cyan-400 mt-0.5 flex-shrink-0">•</span>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Info Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-white/50 leading-relaxed">
              All packs are completely free. Try them with no commitment.
              <br />
              Your data stays on your device. Enable or disable packs anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
