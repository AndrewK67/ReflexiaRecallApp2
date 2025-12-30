import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface BodyScanProps {
  onComplete: () => void;
  onCancel: () => void;
}

const bodyParts = [
  {
    name: 'Feet and Toes',
    instruction: 'Notice your feet. Wiggle your toes. Feel the contact with the ground or your shoes.',
    duration: 30,
  },
  {
    name: 'Legs',
    instruction: 'Bring awareness to your calves and thighs. Notice any tension or relaxation.',
    duration: 30,
  },
  {
    name: 'Hips and Lower Back',
    instruction: 'Feel your hips and lower back. Notice the support beneath you.',
    duration: 30,
  },
  {
    name: 'Abdomen',
    instruction: 'Notice your belly. Feel it rise and fall with each breath.',
    duration: 30,
  },
  {
    name: 'Chest and Upper Back',
    instruction: 'Bring attention to your chest. Feel your heartbeat and breath.',
    duration: 30,
  },
  {
    name: 'Hands and Fingers',
    instruction: 'Notice your hands. Feel the temperature and any sensations in your fingers.',
    duration: 30,
  },
  {
    name: 'Arms and Shoulders',
    instruction: 'Scan your arms and shoulders. Let any tension melt away.',
    duration: 30,
  },
  {
    name: 'Neck and Throat',
    instruction: 'Gently notice your neck. Release any tightness you find.',
    duration: 30,
  },
  {
    name: 'Face and Head',
    instruction: 'Feel your face, jaw, and forehead. Soften any tension around your eyes.',
    duration: 30,
  },
  {
    name: 'Whole Body',
    instruction: 'Feel your entire body as one. Notice the wholeness of your being.',
    duration: 40,
  },
];

export default function BodyScan({ onComplete, onCancel }: BodyScanProps) {
  const [currentPart, setCurrentPart] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(bodyParts[0].duration);
  const [isPlaying, setIsPlaying] = useState(true);

  const isComplete = currentPart >= bodyParts.length;
  const part = !isComplete ? bodyParts[currentPart] : null;

  useEffect(() => {
    if (!isPlaying || isComplete) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (currentPart < bodyParts.length - 1) {
            setCurrentPart(currentPart + 1);
            return bodyParts[currentPart + 1].duration;
          } else {
            setCurrentPart(bodyParts.length);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentPart, isComplete]);

  const handleNext = () => {
    if (currentPart < bodyParts.length - 1) {
      setCurrentPart(currentPart + 1);
      setTimeRemaining(bodyParts[currentPart + 1].duration);
    } else {
      setCurrentPart(bodyParts.length);
    }
  };

  const progress = ((currentPart + 1) / bodyParts.length) * 100;

  return (
    <div className="h-full flex flex-col text-white">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition"
        >
          Back
        </button>
        <h1 className="text-lg font-bold">Body Scan Meditation</h1>
        <div className="w-16" />
      </div>

      {/* Progress Bar */}
      <div className="px-6">
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-white/60 mt-2 text-center">
          {currentPart + 1} of {bodyParts.length}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {isComplete ? (
          <div className="animate-in zoom-in duration-500 flex flex-col items-center">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
              <CheckCircle size={64} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Body Scan Complete</h2>
            <p className="text-white/60 mb-8 max-w-xs">
              You have completed the full body scan. Notice how your body feels now.
            </p>
            <button
              onClick={onComplete}
              className="px-8 py-3 bg-white text-slate-900 font-bold rounded-full hover:scale-105 transition-transform"
            >
              Complete Session
            </button>
          </div>
        ) : (
          part && (
            <div className="w-full max-w-md animate-in fade-in duration-500" key={currentPart}>
              {/* Timer Circle */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 58}`}
                    strokeDashoffset={`${2 * Math.PI * 58 * (1 - timeRemaining / part.duration)}`}
                    className="transition-all duration-1000"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{timeRemaining}s</span>
                </div>
              </div>

              {/* Body Part */}
              <h2 className="text-2xl font-bold mb-4 text-cyan-400">{part.name}</h2>
              <p className="text-white/80 text-lg leading-relaxed mb-8">{part.instruction}</p>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl font-semibold transition"
                >
                  {isPlaying ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-white text-slate-900 hover:bg-white/90 rounded-xl font-semibold transition"
                >
                  Next
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Body Outline Visual (optional enhancement) */}
      {!isComplete && (
        <div className="pb-8 px-8">
          <div className="flex items-center justify-center gap-1">
            {bodyParts.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all ${
                  i < currentPart
                    ? 'bg-cyan-400'
                    : i === currentPart
                    ? 'bg-white'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
