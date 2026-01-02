import React, { useState } from 'react';
import { Check, Crown, Zap, Sparkles, X, Loader } from 'lucide-react';
import { getPricing, createCheckoutSession } from '../services/stripeService';
import { getTierFeatures } from '../services/subscriptionService';

interface CheckoutProps {
  onClose: () => void;
  preselectedPlan?: 'pro-monthly' | 'pro-annual' | 'lifetime';
}

export default function Checkout({ onClose, preselectedPlan }: CheckoutProps) {
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlan || 'pro-annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pricing = getPricing();
  const proFeatures = getTierFeatures('pro');

  const handleCheckout = async () => {
    const plan = pricing.find(p => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    setError(null);

    try {
      const { error: checkoutError } = await createCheckoutSession(
        plan.priceId,
        plan.mode
      );

      if (checkoutError) {
        setError(checkoutError);
        setLoading(false);
      }
      // If successful, user will be redirected to Stripe Checkout
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto custom-scrollbar">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-white/20 max-w-4xl w-full p-6 md:p-8 my-8 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            <X size={20} className="text-white" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center mx-auto mb-4">
              <Crown size={32} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Upgrade to Reflexia Pro
            </h1>
            <p className="text-white/60">
              Unlock unlimited reflections and all premium features
            </p>
          </div>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {pricing.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isRecommended = plan.recommended;

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id as 'pro-monthly' | 'pro-annual' | 'lifetime')}
                  className={`relative p-6 rounded-2xl border-2 transition text-left ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-xs font-bold">
                      Most Popular
                    </div>
                  )}

                  {/* Plan Badge */}
                  {plan.badge && !isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan Name */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      {plan.originalPrice && (
                        <span className="text-white/40 line-through text-sm">
                          {plan.originalPrice}
                        </span>
                      )}
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-white/60 text-sm">{plan.interval}</span>
                    </div>
                    {plan.savings && (
                      <p className="text-emerald-400 text-xs font-semibold mt-1">
                        {plan.savings}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* All Features List */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-cyan-400" />
              Everything included in Pro
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {proFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-lg hover:scale-[1.02] transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap size={20} />
                Continue to Checkout
              </>
            )}
          </button>

          {/* Trust Signals */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center space-y-2">
            <p className="text-sm text-white/60">
              ✓ Secure payment via Stripe • ✓ 14-day money-back guarantee
            </p>
            <p className="text-sm text-white/60">
              ✓ Cancel anytime • ✓ No hidden fees
            </p>
            <p className="text-xs text-white/40 mt-4">
              By continuing, you agree to our{' '}
              <a href="/terms" className="underline hover:text-white">Terms of Use</a>
              {' '}and{' '}
              <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
