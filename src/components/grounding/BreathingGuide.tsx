import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { BreathingPattern } from '../../services/groundingService';

interface BreathingGuideProps {
  pattern: BreathingPattern;
  onComplete: (cyclesCompleted: number) => void;
  onCancel: () => void;
}

export default function BreathingGuide({ pattern, onComplete, onCancel }: BreathingGuideProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentPhase = pattern.phases[currentPhaseIndex];
  const totalCycles = pattern.cycles || 1;
  const hasDuration = pattern.duration !== undefined;
  const targetDuration = pattern.duration || 0;

  // Calculate circle size based on phase
  const getCircleScale = () => {
    if (currentPhase.type === 'inhale') {
      return 0.5 + (phaseProgress / 100) * 0.5; // 50% to 100%
    } else if (currentPhase.type === 'exhale') {
      return 1 - (phaseProgress / 100) * 0.5; // 100% to 50%
    } else {
      // hold or pause
      return currentPhase.type === 'hold' ? 1 : 0.5;
    }
  };

  // Calculate circle color based on phase
  const getCircleColor = () => {
    switch (currentPhase.type) {
      case 'inhale':
        return 'from-cyan-400 to-blue-500';
      case 'exhale':
        return 'from-purple-400 to-pink-500';
      case 'hold':
        return 'from-emerald-400 to-teal-500';
      case 'pause':
        return 'from-slate-400 to-slate-600';
      default:
        return 'from-slate-400 to-slate-600';
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now() - (phaseProgress / 100) * currentPhase.duration * 1000;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      const progress = (elapsed / currentPhase.duration) * 100;

      if (progress >= 100) {
        // Move to next phase
        const nextPhaseIndex = currentPhaseIndex + 1;

        if (nextPhaseIndex >= pattern.phases.length) {
          // Completed one cycle
          const nextCycle = currentCycle + 1;

          if (hasDuration) {
            // Check if we've reached target duration
            const newTotalElapsed = totalElapsed + elapsed;
            setTotalElapsed(newTotalElapsed);

            if (newTotalElapsed >= targetDuration) {
              // Complete the session
              setIsPlaying(false);
              onComplete(nextCycle);
              return;
            }
          } else {
            // Check if we've completed all cycles
            if (nextCycle >= totalCycles) {
              setIsPlaying(false);
              onComplete(nextCycle);
              return;
            }
          }

          setCurrentCycle(nextCycle);
          setCurrentPhaseIndex(0);
          setPhaseProgress(0);
          startTimeRef.current = Date.now();
        } else {
          setCurrentPhaseIndex(nextPhaseIndex);
          setPhaseProgress(0);
          startTimeRef.current = Date.now();
        }
      } else {
        setPhaseProgress(progress);
        if (hasDuration) {
          setTotalElapsed((prev) => prev + 0.05);
        }
      }
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentPhaseIndex, currentCycle, currentPhase, pattern, totalCycles, hasDuration, targetDuration, onComplete, phaseProgress, totalElapsed]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentCycle(0);
    setCurrentPhaseIndex(0);
    setPhaseProgress(0);
    setTotalElapsed(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const circleScale = getCircleScale();
  const circleColor = getCircleColor();

  return (
    <div className="h-full flex flex-col items-center justify-between p-6 text-white">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition"
        >
          Back
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold">{pattern.name}</h2>
          {hasDuration ? (
            <p className="text-xs text-white/60">
              {formatTime(totalElapsed)} / {formatTime(targetDuration)}
            </p>
          ) : (
            <p className="text-xs text-white/60">
              Cycle {currentCycle + 1} of {totalCycles}
            </p>
          )}
        </div>
        <div className="w-16" />
      </div>

      {/* Breathing Circle */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-80 h-80 flex items-center justify-center">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />

          {/* Animated breathing circle */}
          <div
            className={`absolute rounded-full bg-gradient-to-br ${circleColor} shadow-2xl transition-all duration-1000 ease-in-out flex items-center justify-center`}
            style={{
              width: `${circleScale * 280}px`,
              height: `${circleScale * 280}px`,
              boxShadow: `0 0 ${circleScale * 60}px rgba(${currentPhase.type === 'inhale' ? '6, 182, 212' : currentPhase.type === 'exhale' ? '168, 85, 247' : '16, 185, 129'}, 0.6)`,
            }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold mb-2 capitalize">{currentPhase.type}</div>
              <div className="text-5xl font-black">{Math.ceil(currentPhase.duration - (phaseProgress / 100) * currentPhase.duration)}</div>
            </div>
          </div>

          {/* Phase dots */}
          <div className="absolute inset-0 flex items-center justify-center">
            {pattern.phases.map((phase, i) => {
              const angle = (i / pattern.phases.length) * 360 - 90;
              const x = Math.cos((angle * Math.PI) / 180) * 150;
              const y = Math.sin((angle * Math.PI) / 180) * 150;

              return (
                <div
                  key={i}
                  className={`absolute w-3 h-3 rounded-full transition-all ${
                    i === currentPhaseIndex
                      ? 'bg-white scale-150'
                      : i < currentPhaseIndex
                      ? 'bg-white/60'
                      : 'bg-white/20'
                  }`}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Instruction */}
        <div className="mt-8 text-center">
          <p className="text-xl font-semibold text-white/90">{currentPhase.instruction}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex items-center justify-center gap-4">
        <button
          onClick={handleReset}
          className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition"
          title="Reset"
        >
          <RotateCcw size={24} />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-6 rounded-2xl bg-white text-slate-900 hover:bg-white/90 shadow-xl transition active:scale-95"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </button>

        <div className="w-16" />
      </div>
    </div>
  );
}
