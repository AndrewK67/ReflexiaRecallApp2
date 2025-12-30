import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Wind, Clock, Timer } from "lucide-react";
import Guide from "./Guide";

interface BioRhythmProps {
  onClose: () => void;
}

type BreathPattern = {
  name: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  desc: string;
};

const PATTERNS: BreathPattern[] = [
  { name: "Coherent", inhale: 6, hold1: 0, exhale: 6, hold2: 0, desc: "Balance + regulation" },
  { name: "Box", inhale: 4, hold1: 4, exhale: 4, hold2: 4, desc: "Focus + control" },
  { name: "Relax (4-7-8)", inhale: 4, hold1: 7, exhale: 8, hold2: 0, desc: "Downshift for sleep" },
  { name: "Triangle", inhale: 4, hold1: 4, exhale: 4, hold2: 0, desc: "Steady calm" },
  { name: "7-11", inhale: 7, hold1: 0, exhale: 11, hold2: 0, desc: "Anxiety relief" },
  { name: "Physiological Sigh", inhale: 2, hold1: 0, exhale: 6, hold2: 0, desc: "Fast reset" },
  { name: "Energy (4-4)", inhale: 4, hold1: 0, exhale: 4, hold2: 0, desc: "Wake up" },
  { name: "Long Exhale", inhale: 4, hold1: 0, exhale: 8, hold2: 0, desc: "Calm nervous system" },
  { name: "Equal 5", inhale: 5, hold1: 0, exhale: 5, hold2: 0, desc: "Simple rhythm" },
  { name: "Held Release", inhale: 4, hold1: 2, exhale: 6, hold2: 0, desc: "Let go tension" },
];

type Phase = "INHALE" | "HOLD1" | "EXHALE" | "HOLD2";

function mmss(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function BioRhythm({ onClose }: BioRhythmProps) {
  const [pattern, setPattern] = useState(PATTERNS[0]);
  const [isRunning, setIsRunning] = useState(false);

  const [sessionMinutes, setSessionMinutes] = useState<2 | 5 | 10>(5);
  const [sessionRemaining, setSessionRemaining] = useState(sessionMinutes * 60);

  const [phase, setPhase] = useState<Phase>("INHALE");
  const [phaseRemaining, setPhaseRemaining] = useState(pattern.inhale);

  const [scale, setScale] = useState(1);

  const tickRef = useRef<number | null>(null);

  const phaseDuration = (p: BreathPattern, ph: Phase) => {
    if (ph === "INHALE") return p.inhale;
    if (ph === "HOLD1") return p.hold1;
    if (ph === "EXHALE") return p.exhale;
    return p.hold2;
  };

  const nextPhase = (ph: Phase, p: BreathPattern): Phase => {
    if (ph === "INHALE") return p.hold1 > 0 ? "HOLD1" : "EXHALE";
    if (ph === "HOLD1") return "EXHALE";
    if (ph === "EXHALE") return p.hold2 > 0 ? "HOLD2" : "INHALE";
    return "INHALE";
  };

  // Reset timers when pattern changes (only if not running)
  useEffect(() => {
    if (isRunning) return;
    setPhase("INHALE");
    setPhaseRemaining(pattern.inhale);
    setScale(1);
  }, [pattern, isRunning]);

  // Session minutes change (only if not running)
  useEffect(() => {
    if (isRunning) return;
    setSessionRemaining(sessionMinutes * 60);
  }, [sessionMinutes, isRunning]);

  // Main loop (1-second tick)
  useEffect(() => {
    if (!isRunning) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }

    tickRef.current = window.setInterval(() => {
      setSessionRemaining((s) => (s <= 1 ? 0 : s - 1));
      setPhaseRemaining((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [isRunning]);

  // When session ends: stop and reset cleanly
  useEffect(() => {
    if (!isRunning) return;
    if (sessionRemaining > 0) return;

    setIsRunning(false);
    setSessionRemaining(sessionMinutes * 60);
    setPhase("INHALE");
    setPhaseRemaining(pattern.inhale);
    setScale(1);
  }, [sessionRemaining, isRunning, sessionMinutes, pattern]);

  // When phase ends: switch phase and reset its timer
  useEffect(() => {
    if (!isRunning) return;
    if (phaseRemaining > 0) return;

    const next = nextPhase(phase, pattern);
    setPhase(next);
    setPhaseRemaining(phaseDuration(pattern, next));

    // visuals
    if (next === "INHALE") setScale(1.45);
    if (next === "EXHALE") setScale(1.0);
    if (next === "HOLD1" || next === "HOLD2") setScale(1.25);
  }, [phaseRemaining, isRunning, phase, pattern]);

  const phaseLabel =
    phase === "INHALE" ? "Breathe In" :
    phase === "EXHALE" ? "Breathe Out" :
    "Hold";

  const phaseColor =
    phase === "INHALE" ? "#67e8f9" :
    phase === "EXHALE" ? "#818cf8" :
    "#c084fc";

  return (
    <div className="h-full bg-slate-950 text-white relative overflow-y-auto custom-scrollbar">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden"
        style={{ background: `radial-gradient(circle at center, ${phaseColor}40, transparent 70%)` }}
      />

      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700">
          <ArrowLeft />
        </button>
        <div className="text-xl font-bold flex items-center gap-2">
          <Wind className="text-cyan-400" /> Bio-Rhythm
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center pb-72 z-10">
        <div className="relative mb-8">
          {/* Circular Progress Timer */}
          <svg
            width="240"
            height="240"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ transform: 'translate(-50%, -50%) rotate(-90deg)' }}
          >
            {/* Background circle */}
            <circle
              cx="120"
              cy="120"
              r="110"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
              cx="120"
              cy="120"
              r="110"
              fill="none"
              stroke={phaseColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 110}`}
              strokeDashoffset={`${2 * Math.PI * 110 * (1 - phaseRemaining / phaseDuration(pattern, phase))}`}
              style={{
                filter: `drop-shadow(0 0 8px ${phaseColor})`,
                transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease'
              }}
            />
          </svg>

          {/* Guide orb with scale animation */}
          <div
            className="transition-all ease-in-out"
            style={{
              transform: `scale(${scale})`,
              transitionDuration: `${Math.max(0.6, phaseDuration(pattern, phase))}s`,
            }}
          >
            <Guide stageId={null} state="idle" customColor={phaseColor} />
          </div>
        </div>

        <div className="text-4xl font-bold tracking-wide">{phaseLabel}</div>

        <div className="mt-4 flex items-center gap-6 text-slate-200/90">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span className="font-mono text-lg">{mmss(sessionRemaining)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Timer size={16} />
            <span className="font-mono text-lg font-bold text-2xl" style={{ color: phaseColor }}>
              {phaseRemaining}s
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 w-full p-6 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 z-30 flex flex-col gap-4">
        <div>
          <div className="flex justify-between items-end mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Session length</p>
            <p className="text-[10px] text-cyan-400 font-mono">{sessionMinutes} min</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[2, 5, 10].map((m) => (
              <button
                key={m}
                disabled={isRunning}
                onClick={() => setSessionMinutes(m as 2 | 5 | 10)}
                className={`py-2 rounded-xl text-xs font-bold border ${
                  sessionMinutes === m
                    ? "bg-cyan-600 text-white border-cyan-500"
                    : "bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600"
                } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {m} min
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exercise</p>
            <p className="text-[10px] text-cyan-400 font-mono">
              {pattern.inhale}-{pattern.hold1}-{pattern.exhale}-{pattern.hold2}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
            {PATTERNS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setIsRunning(false);
                  setPattern(p);
                }}
                className={`p-3 rounded-2xl border text-left ${
                  pattern.name === p.name
                    ? "bg-indigo-600/90 border-indigo-400 text-white"
                    : "bg-slate-800/70 border-slate-700 text-slate-200 hover:border-slate-600"
                }`}
              >
                <div className="text-sm font-bold">{p.name}</div>
                <div className="text-[10px] text-slate-300/80">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            if (!isRunning) {
              setSessionRemaining(sessionMinutes * 60);
              setPhase("INHALE");
              setPhaseRemaining(pattern.inhale);
              setScale(1.45);
            }
            setIsRunning((v) => !v);
          }}
          className={`w-full py-4 rounded-2xl font-bold text-sm ${
            isRunning ? "bg-red-600 hover:bg-red-500" : "bg-cyan-600 hover:bg-cyan-500"
          }`}
        >
          {isRunning ? "Stop Session" : "Start Session"}
        </button>
      </div>
    </div>
  );
}
