/**
 * PackBrowser - Browse and manage optional feature packs with trial system
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Clock, X, Zap, Crown, Building2 } from 'lucide-react';
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
    advanced: optionalPacks.filter(p => p.category === 'advanced'),
  };

  const categoryLabels = {
    wellbeing: 'Wellbeing',
    productivity: 'Productivity',
    advanced: 'Advanced',
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 text-white overflow-y-auto custom-scrollbar nav-safe">
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      {/* Header */}
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

      {/* Trial Picker Modal */}
      {showTrialPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border-2 border-cyan-500/30 max-w-md w-full max-h-[90vh] landscape:max-h-[85vh] flex flex-col relative">
            <button
              onClick={() => setShowTrialPicker(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/15 transition z-10"
            >
              <X size={16} />
            </button>

            <div className="p-6 pb-4">
              <h2 className="text-xl font-bold mb-2">Try or Subscribe</h2>
              <p className="text-white/70 text-sm">
                Start with a free 7-day trial or unlock permanently with a subscription
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-3">
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
                      <div className="font-bold text-white">7-Day Free Trial</div>
                      <div className="text-xs text-white/60">Try before you commit</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">FREE</div>
                </div>
              </button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-xs text-white/40 bg-slate-900">or unlock permanently</span>
                </div>
              </div>

              {/* Pro Subscription */}
              <button
                onClick={() => alert('Pro subscription coming soon!')}
                className="w-full p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 hover:border-cyan-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Zap size={20} className="text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">Pro</div>
                      <div className="text-xs text-white/60">Monthly subscription</div>
                    </div>
                  </div>
                  <div className="text-cyan-400 font-bold">£9.99/mo</div>
                </div>
              </button>

              {/* Lifetime Purchase */}
              <button
                onClick={() => alert('Lifetime purchase coming soon!')}
                className="w-full p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 hover:border-amber-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Crown size={20} className="text-amber-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">Lifetime</div>
                      <div className="text-xs text-white/60">One-time payment</div>
                    </div>
                  </div>
                  <div className="text-amber-400 font-bold">£99</div>
                </div>
              </button>

              {/* Enterprise */}
              <button
                onClick={() => alert('Contact us for Enterprise pricing')}
                className="w-full p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Building2 size={20} className="text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">Enterprise</div>
                      <div className="text-xs text-white/60">Teams & organizations</div>
                    </div>
                  </div>
                  <div className="text-purple-400 font-bold text-xs">CONTACT</div>
                </div>
              </button>
              
              <p className="text-xs text-white/50 text-center mt-4">
                All packs available with Pro or higher subscription
              </p>
            </div>
          </div>
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
                                        <Check size={12} />
                                        <span>Enabled</span>
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
              Your data stays on your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
