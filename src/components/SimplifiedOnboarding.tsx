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

  const handleSkip = () => {
    onComplete({ name: name || 'User', isOnboarded: true });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    } else {
      onComplete({ name: name || 'User', isOnboarded: true });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      {/* Skip Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 text-white/60 hover:text-white text-sm font-medium transition"
        >
          <X size={16} />
          Skip
        </button>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mb-8">
        {[1, 2, 3].map((dot) => (
          <div
            key={dot}
            className={`h-2 rounded-full transition-all ${
              dot === step
                ? 'w-8 bg-cyan-400'
                : dot < step
                ? 'w-2 bg-cyan-400/50'
                : 'w-2 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-7xl mb-4">📸</div>
            <h1 className="text-3xl font-bold">Capture Anything</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Text, voice, photos, or video. Capture moments that matter in seconds.
              Everything stays private on your device.
            </p>
            <div className="bg-white/5 rounded-xl p-4 text-sm text-white/60">
              <p><strong className="text-white">Quick:</strong> No complex forms</p>
              <p className="mt-1"><strong className="text-white">Safe:</strong> Local-only storage</p>
              <p className="mt-1"><strong className="text-white">Rich:</strong> Multimedia support</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-7xl mb-4">💭</div>
            <h1 className="text-3xl font-bold">Reflect Deeply</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Simple prompts guide your thinking. Process experiences, learn from them,
              and grow through reflection.
            </p>
            <div className="bg-white/5 rounded-xl p-4 text-sm text-white/60">
              <p><strong className="text-white">Simple:</strong> 3 focused questions</p>
              <p className="mt-1"><strong className="text-white">Flexible:</strong> Optional advanced models</p>
              <p className="mt-1"><strong className="text-white">Personal:</strong> Your insights, your growth</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-7xl mb-4">🔍</div>
            <h1 className="text-3xl font-bold">Retrieve & Export</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Find past reflections instantly. Search, filter, and export your data.
              You always own your information.
            </p>
            <div className="bg-white/5 rounded-xl p-4 text-sm text-white/60">
              <p><strong className="text-white">Fast:</strong> Instant search</p>
              <p className="mt-1"><strong className="text-white">Organized:</strong> Timeline & filters</p>
              <p className="mt-1"><strong className="text-white">Portable:</strong> Export to PDF/ZIP</p>
            </div>

            {/* Name Input */}
            <div className="mt-8">
              <label className="block text-sm font-medium text-white/80 mb-2 text-left">
                What should we call you?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8">
        <button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:from-cyan-500 hover:to-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {step === 3 ? (
            <>
              <span>Start Capturing</span>
              <ChevronRight size={20} />
            </>
          ) : (
            <>
              <span>Next</span>
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>

      {/* Footer Notice */}
      {step === 3 && (
        <p className="text-center text-white/40 text-xs mt-4">
          By continuing, you acknowledge that this app assists your reflection process
          but does not replace professional judgment or advice.
        </p>
      )}
    </div>
  );
}
