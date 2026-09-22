/**
 * Simplified Onboarding - Max 3 screens, skippable, no quizzes
 * Focus: Show value of Capture → Reflect → Retrieve
 */

import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import type { UserProfile } from '../types';

interface SimplifiedOnboardingProps {
  onComplete: (profile: Partial<UserProfile>) => void;
}

export default function SimplifiedOnboarding({ onComplete }: SimplifiedOnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');

  // Only send what the user actually typed. completeOnboarding() merges this
  // over the stored profile, so a returning user who skips keeps their name
  // instead of having it overwritten (bug B1, docs/PHASE-1-SCOPE.md §1.2).
  const finish = () => {
    const trimmed = name.trim();
    onComplete(trimmed ? { name: trimmed, isOnboarded: true } : { isOnboarded: true });
  };

  const handleSkip = finish;

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    } else {
      finish();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-6">
      {/* Skip Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 text-white/60 hover:text-white text-sm font-medium transition"
        >
          <X size={16} />
          Skip
        </button>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3].map((dot) => (
          <div
            key={dot}
            className={`h-1.5 rounded-full transition-all ${
              dot === step
                ? 'w-6 bg-cyan-400'
                : dot < step
                ? 'w-1.5 bg-cyan-400/50'
                : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto px-2">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-5xl mb-2">📸</div>
            <h1 className="text-2xl font-bold">Capture Anything</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Text, voice, photos, or video. Capture moments that matter in seconds.
              Everything stays private on your device.
            </p>
            <div className="bg-white/5 rounded-xl p-3 text-xs text-white/60">
              <p><strong className="text-white">Quick:</strong> No complex forms</p>
              <p className="mt-1"><strong className="text-white">Safe:</strong> Local-only storage</p>
              <p className="mt-1"><strong className="text-white">Rich:</strong> Multimedia support</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-5xl mb-2">💭</div>
            <h1 className="text-2xl font-bold">Reflect Deeply</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Simple prompts guide your thinking. Process experiences, learn from them,
              and grow through reflection.
            </p>
            <div className="bg-white/5 rounded-xl p-3 text-xs text-white/60">
              <p><strong className="text-white">Simple:</strong> 3 focused questions</p>
              <p className="mt-1"><strong className="text-white">Flexible:</strong> Optional advanced models</p>
              <p className="mt-1"><strong className="text-white">Personal:</strong> Your insights, your growth</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-5xl mb-2">🔍</div>
            <h1 className="text-2xl font-bold">Retrieve & Export</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Find past reflections instantly. Search, filter, and export your data.
              You always own your information.
            </p>
            <div className="bg-white/5 rounded-xl p-3 text-xs text-white/60">
              <p><strong className="text-white">Fast:</strong> Instant search</p>
              <p className="mt-1"><strong className="text-white">Organized:</strong> Timeline & filters</p>
              <p className="mt-1"><strong className="text-white">Portable:</strong> Export to PDF/ZIP</p>
            </div>

            {/* Name Input */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-white/80 mb-1.5 text-left">
                What should we call you?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-4 mb-2">
        <button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-base shadow-xl hover:from-cyan-500 hover:to-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {step === 3 ? (
            <>
              <span>Start Capturing</span>
              <ChevronRight size={18} />
            </>
          ) : (
            <>
              <span>Next</span>
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>

      {/* Footer Notice */}
      {step === 3 && (
        <p className="text-center text-white/60 text-xs mt-2 leading-tight px-4">
          Reflexia is a space to think. It is not a substitute for advice from
          someone qualified to give it.
        </p>
      )}
    </div>
  );
}
