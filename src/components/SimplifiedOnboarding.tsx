/**
 * Onboarding: one screen (phase 3B.1).
 *
 * It used to be three slides that promised video capture, "advanced
 * models" and PDF/ZIP export, none of which exist. This says three things
 * that are true of the build, asks for a name it does not need, and gets
 * out of the way. Every sentence here is checked by
 * tests/e2e/first-run.spec.ts; if you add a promise, build it first.
 */

import { useState } from 'react';
import { ArrowRight, PenLine, Compass, Lock } from 'lucide-react';
import type { UserProfile } from '../types';

interface SimplifiedOnboardingProps {
  onComplete: (profile: Partial<UserProfile>) => void;
  /** A returning user who chose "Return to onboarding" sees their own name here. */
  initialName?: string;
}

export default function SimplifiedOnboarding({ onComplete, initialName = '' }: SimplifiedOnboardingProps) {
  const [name, setName] = useState(initialName);

  // Only send what the user actually typed. completeOnboarding() merges this
  // over the stored profile, so an empty field never erases a saved name
  // (bug B1, docs/PHASE-1-SCOPE.md §1.2). Renaming lives in Profile.
  const finish = () => {
    const trimmed = name.trim();
    onComplete(trimmed ? { name: trimmed, isOnboarded: true } : { isOnboarded: true });
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6">
      <form
        className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto"
        onSubmit={(e) => {
          e.preventDefault();
          finish();
        }}
      >
        <div className="mb-8">
          <img src="/icon-192.png" alt="" width={56} height={56} className="rounded-2xl mb-5" />
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Reflexia</h1>
          <p className="mt-2 text-white/80 text-base leading-relaxed">A quiet place to think things through.</p>
        </div>

        <ul className="space-y-4 mb-8">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 w-9 h-9 flex-shrink-0 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
              <PenLine size={18} className="text-cyan-300" aria-hidden="true" />
            </span>
            <p className="text-sm text-white/90 leading-relaxed">
              <strong className="text-white">Write down what happened.</strong> A sentence is enough. Add a photo or a
              voice note if that's easier.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 w-9 h-9 flex-shrink-0 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center">
              <Compass size={18} className="text-indigo-300" aria-hidden="true" />
            </span>
            <p className="text-sm text-white/90 leading-relaxed">
              <strong className="text-white">Come back to it when you're ready.</strong> Three short questions help
              you make sense of it, and there are spaces for the harder things — a difficult conversation, a
              decision, a loss.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 w-9 h-9 flex-shrink-0 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
              <Lock size={18} className="text-emerald-300" aria-hidden="true" />
            </span>
            <p className="text-sm text-white/90 leading-relaxed">
              <strong className="text-white">It stays on this device.</strong> No account, and nothing is uploaded
              unless you choose to turn on AI.
            </p>
          </li>
        </ul>

        <label htmlFor="onboarding-name" className="block text-sm font-semibold text-white/90 mb-2">
          What should we call you? <span className="font-normal text-white/60">(optional)</span>
        </label>
        <input
          id="onboarding-name"
          type="text"
          autoComplete="given-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-base text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
        />

        <button
          type="submit"
          className="mt-6 w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-base shadow-xl hover:from-cyan-500 hover:to-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>Start</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>

        <p className="mt-6 text-center text-white/60 text-xs leading-relaxed px-2">
          Reflexia is a space to think. It is not a substitute for advice from someone qualified to give it.
        </p>
      </form>
    </div>
  );
}
