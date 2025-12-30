import React, { useState, useEffect } from "react";
import type { ProfessionType, UserProfile } from "../types";
import { PROFESSION_CONFIG } from "../constants";
import { storageService } from "../services/storageService";
import { ArrowRight, Check } from "lucide-react";
import Guide from "./Guide";

interface OnboardingProps {
  onComplete: (profile: Partial<UserProfile>) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [profession, setProfession] = useState<ProfessionType>("NONE");
  const [recentNames, setRecentNames] = useState<string[]>([]);

  useEffect(() => setRecentNames(storageService.getRecentNames()), []);

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      storageService.saveRecentName(name.trim());
      setRecentNames(storageService.getRecentNames());
      setStep(2);
      return;
    }

    if (step === 2) {
      onComplete({
        name: name.trim(),
        profession,
        isOnboarded: true,
        // Defaults: people can change later in Profile/Settings
        gamificationEnabled: true,
        aiEnabled: true,
      });
    }
  };

  const disabled = step === 1 && !name.trim();

  return (
    <div className="h-full bg-slate-950 flex flex-col relative overflow-hidden text-white">
      {/* ✅ BG animation (very visible) */}
      <div className="animated-backdrop-dark">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
        <div className="mb-8 transform scale-125 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          <Guide stageId={null} state="idle" />
        </div>

        {step === 1 ? (
          <div className="w-full max-w-sm text-center">
            <h1 className="text-3xl font-bold mb-2">Reflexia Recall</h1>
            <p className="text-slate-300/70 mb-6 text-sm">
              A private space to clear your mind. No pressure.
            </p>

            <label className="block text-sm text-slate-300/70 mb-2">
              What should I call you?
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full p-4 rounded-xl border border-slate-700 bg-slate-900/70 backdrop-blur text-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3 text-center"
              autoFocus
            />

            {!name.trim() && recentNames.length > 0 && (
              <div className="mb-6 flex flex-wrap justify-center gap-2">
                {recentNames.map((n, i) => (
                  <button
                    key={`${n}-${i}`}
                    onClick={() => setName(n)}
                    className="px-3 py-1.5 rounded-lg text-sm border border-slate-800 text-slate-200 bg-slate-900/40 hover:border-slate-600"
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-center mb-6">Professional Context</h1>

            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2 mb-6">
              {(Object.keys(PROFESSION_CONFIG) as ProfessionType[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setProfession(key)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between ${
                    profession === key
                      ? "bg-indigo-600/90 border-indigo-400 text-white"
                      : "bg-slate-900/60 border-slate-700 text-slate-200 hover:border-slate-600"
                  }`}
                >
                  <span className="font-medium text-sm">{PROFESSION_CONFIG[key].label}</span>
                  {profession === key && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={disabled}
          className={`w-full max-w-sm py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg ${
            disabled ? "bg-slate-700 text-slate-400" : "bg-cyan-600 hover:bg-cyan-500 text-white"
          }`}
        >
          {step === 1 ? "Continue" : "Begin"} <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
