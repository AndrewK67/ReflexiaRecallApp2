import React from 'react';
import { Lock, Sparkles, Zap, Crown } from 'lucide-react';
import { getTierFeatures, isOnActiveTrial, getTrialDaysRemaining } from '../services/subscriptionService';

interface PaywallProps {
  feature: string;
  reason: string;
  onUpgrade: () => void;
  onClose?: () => void;
}

/**
 * Paywall - Shown when user tries to access Pro features
 */
export function Paywall({ feature, reason, onUpgrade, onClose }: PaywallProps) {
  const proFeatures = getTierFeatures('pro');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-white/20 max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center mx-auto mb-4">
            <Crown size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
          <p className="text-white/60">{reason}</p>
        </div>

        {/* Feature List */}
        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold text-white/80 mb-3">Pro includes:</p>
          {proFeatures.slice(0, 6).map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Sparkles size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-white/80">{feat}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="text-3xl font-bold text-white">£2.99</span>
              <span className="text-white/60">/month</span>
            </div>
            <p className="text-center text-xs text-white/50">or £25/year (save 30%)</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-lg hover:scale-105 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap size={20} />
            Upgrade Now
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-semibold hover:bg-white/10 transition"
            >
              Maybe Later
            </button>
          )}
        </div>

        {/* Trust Signals */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">
            ✓ 14-day money-back guarantee • ✓ Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Reflection Limit Paywall - Specific for free tier limit
 */
export function ReflectionLimitPaywall({ remaining, onUpgrade, onClose, onStartTrial }: {
  remaining: number;
  onUpgrade: () => void;
  onClose?: () => void;
  onStartTrial?: () => void;
}) {
  const onTrial = isOnActiveTrial();
  const trialDaysLeft = getTrialDaysRemaining();

  // Trial expired - must upgrade
  if (onTrial === false && remaining === null) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-white/20 max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Trial Ended
            </h2>
            <p className="text-white/60">
              Your 7-day Pro trial has ended. Upgrade to continue using Pro features.
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
            <p className="text-sm text-red-200 text-center font-semibold">
              You must upgrade to Pro to continue creating reflections
            </p>
          </div>

          <div className="mb-6">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                Unlimited Reflections
              </div>
              <p className="text-white/60 text-sm">+ all Pro features</p>
              <div className="mt-3">
                <span className="text-lg text-white/80">from </span>
                <span className="text-3xl font-bold text-white">£2.99</span>
                <span className="text-white/60">/month</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-lg hover:scale-105 transition active:scale-95"
            >
              Upgrade to Pro
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-white/40">
              ✓ 14-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 30 reflections reached - offer trial
  if (remaining === 0 && !onTrial && onStartTrial) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-white/20 max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              30 Reflections Complete!
            </h2>
            <p className="text-white/60">
              You've reached your free limit. Start your 7-day Pro trial to continue.
            </p>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-2xl p-4 mb-6">
            <p className="text-sm text-cyan-200 text-center font-semibold">
              🎁 Try all Pro features FREE for 7 days
            </p>
          </div>

          <div className="mb-6 space-y-3">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
              <div className="text-xs font-bold text-white/60 mb-2">7-DAY TRIAL INCLUDES:</div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/80">Unlimited reflections</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/80">All 29 regulatory bodies</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/80">AI-powered insights</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/80">Mental Atlas & Analytics</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onStartTrial}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-lg hover:scale-105 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Zap size={20} />
              Start Free Trial
            </button>

            <button
              onClick={onUpgrade}
              className="w-full py-3 px-6 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-semibold hover:bg-white/10 transition"
            >
              Skip Trial - Upgrade Now
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-white/40">
              No payment required • Cancel anytime during trial
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Warning - approaching limit
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-white/20 max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {remaining} Reflections Left
          </h2>
          <p className="text-white/60">
            You're on the Free tier with a 30 reflection limit
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
          <p className="text-sm text-amber-200 text-center">
            After 30 reflections, you'll get a 7-day Pro trial
          </p>
        </div>

        <div className="mb-6">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              Skip the Wait
            </div>
            <p className="text-white/60 text-sm">Upgrade now for unlimited reflections</p>
            <div className="mt-3">
              <span className="text-lg text-white/80">from </span>
              <span className="text-3xl font-bold text-white">£2.99</span>
              <span className="text-white/60">/month</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-lg hover:scale-105 transition active:scale-95"
          >
            Upgrade to Pro
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-semibold hover:bg-white/10 transition"
            >
              Continue ({remaining} left)
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-white/40">
            ✓ 14-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature Locked Badge - Small inline upgrade prompt
 */
export function FeatureLockedBadge({ feature, onClick }: {
  feature: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:scale-105 transition"
    >
      <Crown size={12} />
      <span>Pro</span>
    </button>
  );
}
