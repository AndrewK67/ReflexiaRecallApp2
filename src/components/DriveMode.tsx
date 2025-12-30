import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mic, StopCircle, X, Volume2, VolumeX, Play, RotateCcw } from "lucide-react";
import type { IncidentEntry, MediaItem } from "../types";
import Guide from "./Guide";

/**
 * DriveMode
 * - High-contrast, hands-free capture loop.
 * - Speaks prompt -> listens -> saves answer -> speaks next prompt.
 * - Voice commands: "stop", "exit", "close" end the session.
 *
 * Produces a standard IncidentEntry so it stores alongside other entries.
 */

interface DriveModeProps {
  onComplete: (entry: IncidentEntry) => void;
  onClose: () => void;
}

type EngineState = "idle" | "speaking" | "listening" | "processing" | "paused" | "done";

const DEFAULT_PROMPTS: string[] = [
  "What just happened?",
  "Where are you right now?",
  "Is anyone in immediate danger?",
  "What do you need to do next?",
  "What evidence should you capture or remember?",
  "What support do you need (person, service, resource)?",
];

function pickHighContrastColor(step: number) {
  const colors = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#fb7185", "#60a5fa"];
  return colors[step % colors.length];
}

function normalizeCommand(text: string) {
  return text.trim().toLowerCase();
}

function looksLikeStopCommand(text: string) {
  const t = normalizeCommand(text);
  return (
    t === "stop" ||
    t === "exit" ||
    t === "close" ||
    t.includes("stop drive") ||
    t.includes("exit drive") ||
    t.includes("close drive")
  );
}

const DriveMode: React.FC<DriveModeProps> = ({ onComplete, onClose }) => {
  const prompts = useMemo(() => DEFAULT_PROMPTS, []);

  const [step, setStep] = useState(0);
  const [engine, setEngine] = useState<EngineState>("idle");
  const [isMuted, setIsMuted] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const prompt = prompts[step] ?? "Capture complete.";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      try {
        window.speechSynthesis?.cancel();
      } catch {}
      try {
        recognitionRef.current?.stop?.();
      } catch {}
    };
  }, []);

  const speak = (text: string) =>
    new Promise<void>((resolve) => {
      try {
        if (!window.speechSynthesis || isMuted) return resolve();
        window.speechSynthesis.cancel();

        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.0;
        u.pitch = 1.05;
        u.onend = () => resolve();
        u.onerror = () => resolve();

        window.speechSynthesis.speak(u);
      } catch {
        resolve();
      }
    });

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    recognitionRef.current = null;
    setEngine((prev) => (prev === "listening" ? "processing" : prev));
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice dictation isn't supported in this browser.");
      return;
    }

    try {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = "en-GB";

      let finalText = "";

      recog.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const piece = e.results[i][0]?.transcript ?? "";
          if (e.results[i].isFinal) finalText += piece + " ";
          else interim += piece + " ";
        }
        const combined = (finalText + interim).trim();
        if (isMountedRef.current) setTranscript(combined);
      };

      recog.onerror = (e: any) => {
        if (isMountedRef.current) {
          setError(e?.error ? `Voice error: ${e.error}` : "Voice recognition error.");
          setEngine("paused");
        }
      };

      recog.onend = () => {
        if (!isMountedRef.current) return;
        setEngine("processing");

        const text = transcript.trim();

        if (looksLikeStopCommand(text)) {
          finishAndExit();
          return;
        }

        if (text) {
          setAnswers((prev) => {
            const next = [...prev];
            next[step] = text;
            return next;
          });
        }

        setTimeout(() => {
          if (!isMountedRef.current) return;
          goNext();
        }, 200);
      };

      recognitionRef.current = recog;
      setTranscript("");
      setError(null);
      setEngine("listening");
      recog.start();
    } catch {
      setError("Unable to start voice recognition.");
      setEngine("paused");
    }
  };

  const runLoop = async () => {
    setError(null);
    setEngine("speaking");
    await speak(prompt);
    if (!isMountedRef.current) return;
    startListening();
  };

  const begin = async () => {
    if (engine === "listening") return;
    await runLoop();
  };

  const goNext = async () => {
    const nextStep = step + 1;
    if (nextStep >= prompts.length) {
      setEngine("done");
      return;
    }
    setStep(nextStep);
    setTranscript("");
    setTimeout(() => runLoop(), 150);
  };

  const restart = async () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    stopListening();
    setStep(0);
    setAnswers([]);
    setTranscript("");
    setError(null);
    setEngine("idle");
  };

  const finishAndExit = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    stopListening();

    const notes = prompts
      .map((p, idx) => {
        const a = (answers[idx] ?? "").trim();
        return a ? `• ${p}\n${a}` : null;
      })
      .filter(Boolean)
      .join("\n\n");

    const entry: IncidentEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: "INCIDENT",
      notes: notes || "Drive Mode capture.",
      media: [] as MediaItem[],
      keywords: ["drive-mode"],
      location: undefined,
    };

    onComplete(entry);
    onClose();
  };

  const tint = pickHighContrastColor(step);

  return (
    <div className="h-full bg-black text-white flex flex-col relative overflow-y-auto custom-scrollbar">
      <div
        className="absolute inset-0 opacity-25 pointer-events-none overflow-hidden"
        style={{ background: `radial-gradient(circle at 30% 20%, ${tint}55, transparent 55%)` }}
      />

      <div className="flex items-center justify-between px-5 pt-6 pb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 bg-white/5">
            <span className="text-[10px] font-mono opacity-70">
              {step + 1}/{prompts.length}
            </span>
          </div>
          <div>
            <div className="text-sm font-bold">Drive Mode</div>
            <div className="text-[11px] text-white/60">hands-free capture</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted((v) => !v)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
            title="Exit"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10">
        <div className="mb-8 scale-150">
          <Guide
            stageId={null}
            customColor={tint}
            state={
              engine === "listening"
                ? "listening"
                : engine === "speaking"
                ? "speaking"
                : engine === "processing"
                ? "thinking"
                : "idle"
            }
          />
        </div>

        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
            <span className="text-[10px] font-bold tracking-widest uppercase text-white/70">Prompt</span>
          </div>

          <h2 className="text-2xl font-bold leading-tight mb-4">{prompt}</h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
            <div className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2">Live transcript</div>
            <div className="min-h-[2.25rem] text-sm leading-relaxed text-white/85">
              {transcript ? transcript : (
                <span className="text-white/30">{engine === "listening" ? "Listening..." : "Press Start to begin."}</span>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
              {error}
            </div>
          )}

          <div className="mt-5 text-[11px] text-white/50">
            Say <span className="text-white/70 font-bold">“stop”</span> or{" "}
            <span className="text-white/70 font-bold">“exit”</span> to end.
          </div>
        </div>
      </div>

      <div className="px-6 pb-10 pt-4 z-10 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="w-full max-w-md mx-auto flex items-center gap-3">
          {engine === "idle" || engine === "paused" ? (
            <button
              onClick={begin}
              className="flex-1 h-14 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition"
            >
              <Play size={18} /> Start
            </button>
          ) : engine === "listening" ? (
            <button
              onClick={stopListening}
              className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-400 active:scale-95 transition"
            >
              <StopCircle size={18} /> Stop Listening
            </button>
          ) : engine === "done" ? (
            <button
              onClick={finishAndExit}
              className="flex-1 h-14 rounded-2xl bg-emerald-400 text-black font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition"
            >
              Finish & Save
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="flex-1 h-14 rounded-2xl bg-white/10 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/15 active:scale-95 transition"
            >
              <Mic size={18} /> Listening…
            </button>
          )}

          <button
            onClick={restart}
            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition"
            title="Restart"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={finishAndExit}
            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition"
            title="Save & Exit"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriveMode;
