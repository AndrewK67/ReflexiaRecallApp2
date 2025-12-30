import React from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import Guide from '../Guide';

interface HolodeckSpaceProps {
  title: string;
  purpose: string;
  currentPrompt: string;
  answer: string;
  onAnswer: (text: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onExit: () => void;
  onSave?: () => void;
  guideState?: 'idle' | 'listening' | 'thinking' | 'speaking';
  progress: number; // 0 to 1
  color?: string;
  showNext?: boolean;
  showPrevious?: boolean;
  showSave?: boolean;
  isSafetyCritical?: boolean;
  nextLabel?: string;
}

export default function HolodeckSpace({
  title,
  purpose,
  currentPrompt,
  answer,
  onAnswer,
  onNext,
  onPrevious,
  onExit,
  onSave,
  guideState = 'idle',
  progress,
  color = '#22d3ee',
  showNext = true,
  showPrevious = false,
  showSave = false,
  isSafetyCritical = false,
  nextLabel = 'Next',
}: HolodeckSpaceProps) {
  return (
    <div className="h-full bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{title}</h1>
            <p className="text-white/60 text-sm leading-relaxed">{purpose}</p>
          </div>
          <button
            onClick={onExit}
            className="ml-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
            title="Exit"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: color,
            }}
          />
        </div>

        {/* Safety warning for critical spaces */}
        {isSafetyCritical && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200">
              You can exit at any time. Go at your own pace. You're in control.
            </p>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {/* Guide */}
        <div className="flex justify-center mb-6">
          <div className="scale-125">
            <Guide stageId={null} state={guideState} customColor={color} />
          </div>
        </div>

        {/* Current prompt */}
        <div className="mb-6">
          <div
            className="inline-block px-4 py-2 rounded-full mb-3 text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${color}20`, color }}
          >
            Prompt
          </div>
          <p className="text-xl font-medium leading-relaxed">{currentPrompt || 'Take a moment...'}</p>
        </div>

        {/* Answer textarea */}
        <div className="flex-1 min-h-[200px]">
          <textarea
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Take your time. Write what comes up..."
            className="w-full h-full min-h-[200px] p-4 rounded-2xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 resize-none focus:outline-none focus:ring-2 transition"
          />
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex-shrink-0 p-6 border-t border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="flex gap-3">
          {showPrevious && onPrevious && (
            <button
              onClick={onPrevious}
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold transition"
            >
              Previous
            </button>
          )}

          <div className="flex-1" />

          {showSave && onSave && (
            <button
              onClick={onSave}
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold flex items-center gap-2 transition"
            >
              <Save size={18} /> Save
            </button>
          )}

          {showNext && onNext && (
            <button
              onClick={onNext}
              className="px-8 py-3 rounded-2xl font-semibold flex items-center gap-2 transition active:scale-95"
              style={{
                backgroundColor: color,
                color: '#ffffff',
              }}
            >
              {nextLabel}
            </button>
          )}
        </div>

        {/* Helper text */}
        <p className="text-center text-white/40 text-xs mt-3">
          You can exit this space at any time using the × button above
        </p>
      </div>
    </div>
  );
}
