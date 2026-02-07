import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  Layers,
  Loader2,
  Mic,
  Music,
  Music4,
  PenTool,
  Sparkles,
  StopCircle,
  Volume2,
  VolumeX,
  Info,
} from "lucide-react";

import { MODEL_CONFIG, PROFESSION_CONFIG } from "../constants";
import { StageId } from "../types";
import type { MediaItem, ProfessionType, ReflectionEntry, ReflectionModel } from "../types";

// Guide character removed for cleaner UX
import CanvasBoard from "./CanvasBoard";
import { storageService } from "../services/storageService";

import { analyzeReflection, getStageCoaching } from "../services/aiService";
import { migrateBase64ToFile } from "../services/fileStorageService";
import { startAudioRecording, stopAudioRecording, saveAudioToFile } from "../services/mediaService";
import { getOfflineStagePrompt } from "../data/offlinePrompts";

interface ReflectionFlowProps {
  onComplete: (entry: ReflectionEntry) => void;
  onCancel: () => void;
  profession: ProfessionType;
  aiEnabled?: boolean;
}

const MOODS = [
  { value: 1, label: "Rough", emoji: "😣" },
  { value: 2, label: "Down", emoji: "😕" },
  { value: 3, label: "Okay", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Great", emoji: "😁" },
] as const;

class AudioEngine {
  ctx: AudioContext | null = null;
  oscillators: OscillatorNode[] = [];
  gainNodes: GainNode[] = [];
  isMuted = false;

  init() {
    if (this.ctx) return;
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!Ctx) return;
    this.ctx = new Ctx();
  }

  resumeIfNeeded() {
    if (this.ctx?.state === "suspended") this.ctx.resume();
  }

  playTone(stageIndex: number) {
    this.init();
    this.resumeIfNeeded();
    if (!this.ctx || this.isMuted) return;

    const freqs = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
    const freq = freqs[stageIndex % freqs.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.value = 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  muteAll() {
    this.isMuted = true;
    this.stopAll();
  }

  unmuteAll() {
    this.isMuted = false;
  }

  stopAll() {
    this.oscillators.forEach((o) => {
      try {
        o.stop();
      } catch {}
    });
    this.oscillators = [];
    this.gainNodes = [];
  }
}

const audioEngine = new AudioEngine();

// Simple mode stages (3 prompts)
const SIMPLE_MODE_STAGES = [
  {
    id: "what_happened",
    label: "What happened?",
    prompt: "Describe the situation or event.",
  },
  {
    id: "what_mattered",
    label: "What stood out or mattered?",
    prompt: "What feelings, thoughts, or details caught your attention?",
  },
  {
    id: "what_forward",
    label: "What will you carry forward?",
    prompt: "What insight or action will you take with you?",
  },
];

const NMC_CODE_THEMES = [
  { id: 'prioritise-people', label: 'Prioritise people' },
  { id: 'practise-effectively', label: 'Practise effectively' },
  { id: 'preserve-safety', label: 'Preserve safety' },
  { id: 'promote-professionalism', label: 'Promote professionalism and trust' },
] as const;

// Professions regulated by the NMC (Nursing and Midwifery Council)
const NMC_PROFESSIONS = new Set(['NURSING', 'MENTAL_HEALTH']);

export default function ReflectionFlow({ onComplete, onCancel, profession, aiEnabled }: ReflectionFlowProps) {
  const [useSimpleMode, setUseSimpleMode] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ReflectionModel | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mood, setMood] = useState<number | undefined>();
  const [attachments, setAttachments] = useState<MediaItem[]>([]);

  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [coachTip, setCoachTip] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showInsight, setShowInsight] = useState(false);

  const [showCanvas, setShowCanvas] = useState(false);
  const [nmcCodeThemes, setNmcCodeThemes] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const AI_ON = aiEnabled === true;

  function safeModelLabel(model: string) {
    return (MODEL_CONFIG as any)?.[model]?.title ?? model;
  }

  function safeModelStages(model: string) {
    return (MODEL_CONFIG as any)?.[model]?.stages ?? [];
  }

  const allModels: ReflectionModel[] = [
    "GIBBS",
    "SBAR",
    "ERA",
    "ROLFE",
    "STAR",
    "SOAP",
    "MORNING",
    "EVENING",
    "FREE",
  ];

  const profModels = PROFESSION_CONFIG?.[profession]?.modelsAllowed;
  const models = profModels && profModels.length > 0 ? profModels : allModels;

  // Use simple mode stages or model stages
  const stages = useSimpleMode
    ? SIMPLE_MODE_STAGES
    : (selectedModel ? safeModelStages(selectedModel) : []);
  const stageData = stages[currentStageIndex];

  // Auto-start reflection in simple mode
  const isReflecting = useSimpleMode || selectedModel !== null;

  const currentAnswer = stageData?.id ? answers[stageData.id] ?? "" : "";

  const profPromptPrefix = PROFESSION_CONFIG?.[profession]?.reflectionPromptPrefix ?? "";

  const handleTextChange = (val: string) => {
    if (!stageData?.id) return;
    setAnswers((prev) => ({ ...prev, [stageData.id]: val }));
  };

  const handleStageNext = () => {
    audioEngine.playTone(currentStageIndex + 1);
    if (currentStageIndex < stages.length - 1) {
      setCurrentStageIndex((i) => i + 1);
      setCoachTip(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleStagePrev = () => {
    audioEngine.playTone(Math.max(0, currentStageIndex - 1));
    if (currentStageIndex > 0) {
      setCurrentStageIndex((i) => i - 1);
      setCoachTip(null);
    }
  };

  const handleVoiceStart = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Voice recording not supported in your browser.");
      return;
    }

    try {
      const recorder = await startAudioRecording();
      mediaRecorderRef.current = recorder;

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Voice error:", err);
      alert("Could not access microphone.");
    }
  };

  const handleVoiceStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      const mr = mediaRecorderRef.current;
      // Use mediaService helper to stop and get blob
      stopAudioRecording(mr)
        .then(async (blob) => {
          try {
            const filePath = await saveAudioToFile(blob);
            const media: MediaItem = {
              id: `audio_${Date.now()}`,
              type: 'AUDIO',
              url: filePath,
              createdAt: Date.now(),
              name: `Voice ${new Date().toLocaleTimeString()}`,
            };
            setAttachments((prev) => [...prev, media]);
          } catch (e) {
            console.error('Failed to save audio file', e);
          }
        })
        .catch((err) => {
          console.error('Stop audio error', err);
        })
        .finally(() => {
          setIsRecording(false);
          mediaRecorderRef.current = null;
        });
    } else {
      setIsRecording(false);
    }
  };

  const handleCoaching = async () => {
    if (!stageData) return;

    setCoachTip(null);
    

    const prompt = AI_ON
      ? await getStageCoaching(stageData.id, currentAnswer, profession)
      : getOfflineStagePrompt(selectedModel!, stageData.id, profession).prompt;

    setCoachTip(prompt);
    

    setTimeout(() => {
      
    }, 2000);
  };

  const handleDrawingSave = (dataUrl: string) => {
    (async () => {
      try {
        const filePath = await migrateBase64ToFile(dataUrl, 'drawing');
        setAttachments((prev) => [
          ...prev,
          { id: Date.now().toString(), type: 'SKETCH', url: filePath, timestamp: new Date().toISOString(), createdAt: Date.now(), name: 'Sketch' },
        ]);
      } catch (e) {
        // Fallback to inline dataUrl if save fails
        setAttachments((prev) => [
          ...prev,
          { id: Date.now().toString(), type: 'SKETCH', url: dataUrl, timestamp: new Date().toISOString(), createdAt: Date.now(), name: 'Sketch' },
        ]);
      } finally {
        setShowCanvas(false);
      }
    })();
  };

  const handleUnlockInsight = async () => {
    if (showInsight || !selectedModel) return;

    
    setShowInsight(true);

    try {
      const result = await analyzeReflection(answers, profession, selectedModel);
      setAnalysisResult(result);
    } catch {
      setAnalysisResult("Reflection saved. Insights can appear here when AI is enabled.");
    }

    
  };

  const handleSave = async () => {
    if (isSaving || (!selectedModel && !useSimpleMode)) return;

    setIsSaving(true);

    const modelToSave = useSimpleMode ? "SIMPLE" : selectedModel!;

    const entry: ReflectionEntry = {
      id: `reflection_${Date.now()}`,
      type: "REFLECTION",
      date: new Date().toISOString(),
      modelId: modelToSave,
      model: modelToSave,
      answers,
      mood,
      attachments,
      aiInsight: analysisResult ?? undefined,
      nmcCodeThemes: nmcCodeThemes.length > 0 ? nmcCodeThemes : undefined,
      createdAt: Date.now(),
    };

    await onComplete(entry);
    setIsSaving(false);
  };

  useEffect(() => {
    const profile = storageService.loadProfile();
    if (stageData?.id && textareaRef.current && profile.autoOpenKeyboard) {
      textareaRef.current.focus();
    }
  }, [currentStageIndex, stageData]);

  if (!selectedModel && !useSimpleMode) {
    return (
      <div className="h-full bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col overflow-y-auto custom-scrollbar animate-in fade-in duration-300 nav-safe relative">
        <div className="animated-backdrop-dark overflow-hidden">
          <div className="orb one" />
          <div className="orb two" />
          <div className="orb three" />
          <div className="grain" />
        </div>

        <div className="p-6 pt-10 border-b border-white/10 relative z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
              title="Back"
            >
              <ChevronLeft className="text-white" size={22} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Layers className="text-indigo-400" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Select Framework</h1>
                <p className="text-white/60 text-xs uppercase tracking-widest font-mono">Reflection</p>
              </div>
            </div>

            <div className="w-10" />
          </div>

          <div className="mt-4 text-xs text-white/60">
            Profession: <span className="font-bold text-white/90">{PROFESSION_CONFIG?.[profession]?.label ?? "Unknown"}</span>
            <span className="mx-2">•</span>
            AI: <span className={`font-bold ${AI_ON ? "text-emerald-400" : "text-white/60"}`}>{AI_ON ? "ON" : "OFF"}</span>
          </div>
        </div>

        {/* INSTRUCTIONS AT TOP - CLEANER UI */}
        <div className="px-6 pt-4 relative z-10">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-start gap-3">
            <Info className="text-indigo-400 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-white/90">
              <span className="font-bold">How it works:</span> Tap any framework to start. You can use voice dictation and get optional coaching tips {AI_ON ? "powered by AI" : "with offline prompts"}.
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-40 custom-scrollbar relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setSelectedModel(m);
                  setCurrentStageIndex(0);
                  setAnswers({});
                  setMood(undefined);
                  setCoachTip(null);
                  setAnalysisResult(null);
                  setShowInsight(false);
                  audioEngine.playTone(0);
                }}
                className="text-left bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 hover:bg-white/10 hover:border-indigo-500/30 transition group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-extrabold text-white group-hover:text-indigo-400 transition">
                    {safeModelLabel(m)}
                  </div>
                  <div className="text-[10px] font-bold text-white/60 bg-white/10 px-2 py-1 rounded-full">
                    {safeModelStages(m).length} stages
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-400 group-hover:translate-x-1 transition">
                  Start <ArrowRight size={16} />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={18} /> Tip
            </div>
            <div className="mt-2 text-xs text-white/70">
              If AI is OFF, the app uses built-in prompts for each stage (no internet required).
              Turn AI ON in <span className="font-bold">Profile → Neural Link</span>.
            </div>
          </div>

          {/* Back to Simple Mode Button */}
          <div className="mt-4">
            <button
              onClick={() => setUseSimpleMode(true)}
              className="w-full px-4 py-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 font-semibold text-sm transition"
            >
              ← Back to Simple Mode (3 questions)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 to-slate-900 animate-in fade-in duration-300 nav-safe relative">
        <div className="animated-backdrop-dark overflow-hidden">
          <div className="orb one" />
          <div className="orb two" />
          <div className="orb three" />
          <div className="grain" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center custom-scrollbar pb-24 relative z-10">
          <div className="mb-4 scale-75">
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-light text-white mb-1">Complete</h2>
            <p className="text-white/60 text-sm">Your reflection is ready to save.</p>
          </div>

          <div className="w-full max-w-md space-y-4">
            {!showInsight ? (
              <button
                onClick={handleUnlockInsight}
                className="w-full py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              >
                <Sparkles size={18} className="text-indigo-400" />
                Unlock Insight {AI_ON ? "" : "(Offline)"}
              </button>
            ) : (
              <div className="w-full bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" /> Insight
                  </h3>

                  {!analysisResult && (
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  )}
                </div>

                <div className="text-sm text-white/90 leading-relaxed whitespace-pre-line">
                  {analysisResult || "Generating..."}
                </div>
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
              <div className="text-xs font-bold text-white mb-3">How are you feeling?</div>
              <div className="flex justify-between gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`flex-1 aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition ${
                      mood === m.value
                        ? "border-indigo-500 bg-indigo-500/20 shadow-md"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="text-2xl mb-1">{m.emoji}</div>
                    <div className="text-[10px] font-bold text-white/90">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* NMC Code Themes - only for NMC-regulated professions */}
            {NMC_PROFESSIONS.has(profession) && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <div className="text-xs font-bold text-white mb-1">NMC Code Themes</div>
                <p className="text-[10px] text-white/50 mb-3">Which themes does this reflection relate to? (Optional)</p>
                <div className="space-y-2">
                  {NMC_CODE_THEMES.map((theme) => (
                    <label
                      key={theme.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition ${
                        nmcCodeThemes.includes(theme.id)
                          ? "border-indigo-500/50 bg-indigo-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={nmcCodeThemes.includes(theme.id)}
                        onChange={() =>
                          setNmcCodeThemes((prev) =>
                            prev.includes(theme.id)
                              ? prev.filter((t) => t !== theme.id)
                              : [...prev, theme.id]
                          )
                        }
                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-white/90">{theme.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all ${
                isSaving
                  ? "bg-white/10 text-white/50"
                  : "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white active:scale-95"
              }`}
            >
              {isSaving ? "Saving..." : "Save Reflection"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showCanvas) {
    return (
      <CanvasBoard
        onSave={handleDrawingSave}
        onCancel={() => setShowCanvas(false)}
        showSizeSelector={true}
      />
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col overflow-y-auto custom-scrollbar nav-safe relative">
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      <div className="p-5 border-b border-white/10 relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={currentStageIndex === 0 ? (useSimpleMode ? onCancel : () => setSelectedModel(null)) : handleStagePrev}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
            title="Back"
          >
            <ChevronLeft className="text-white" size={20} />
          </button>

          <div className="flex-1 text-center">
            <div className="text-xs text-white/60 font-bold uppercase tracking-wide mb-1">
              {useSimpleMode ? "Simple Mode" : (selectedModel ? safeModelLabel(selectedModel) : "Reflection")} • Step {currentStageIndex + 1} of {stages.length}
            </div>
            <div className="text-sm font-bold text-white">{stageData?.label}</div>
          </div>

          <button
            onClick={() => audioEngine.isMuted ? audioEngine.unmuteAll() : audioEngine.muteAll()}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
            title={audioEngine.isMuted ? "Unmute" : "Mute"}
          >
            {audioEngine.isMuted ? <VolumeX className="text-white" size={20} /> : <Volume2 className="text-white" size={20} />}
          </button>
        </div>

        {/* Advanced Models Toggle - Only in Simple Mode */}
        {useSimpleMode && currentStageIndex === 0 && (
          <div className="mt-3">
            <button
              onClick={() => {
                setUseSimpleMode(false);
                setCurrentStageIndex(0);
              }}
              className="w-full px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <Layers size={14} />
              <span>Switch to Advanced Models</span>
            </button>
          </div>
        )}

        <div className="mt-2 text-center scale-75">
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-40 custom-scrollbar relative z-10">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-3">
          <div className="text-xs font-bold text-indigo-400 mb-2">Reflection Prompt</div>
          <div className="text-sm text-white/90 leading-relaxed">
            {stageData?.prompt}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={currentAnswer}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={stageData?.placeholder || "Write your thoughts here..."}
          className="w-full h-64 p-4 rounded-2xl border border-white/20 bg-white/10 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-xl"
        />

        {coachTip && (
          <div className="mt-4 bg-white/5 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-white/90 leading-relaxed">{coachTip}</div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleCoaching}
            disabled={isRecording}
            className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/15 disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles size={16} />
            Coach {AI_ON ? "" : "(Offline)"}
          </button>

          <button
            onClick={() => setShowCanvas(true)}
            className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/15 flex items-center gap-2"
          >
            <PenTool size={16} />
            Sketch
          </button>

          {!isRecording ? (
            <button
              onClick={handleVoiceStart}
              className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/15 flex items-center gap-2"
            >
              <Mic size={16} />
              Voice
            </button>
          ) : (
            <button
              onClick={handleVoiceStop}
              className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 flex items-center gap-2 animate-pulse"
            >
              <StopCircle size={16} />
              Stop Recording
            </button>
          )}
        </div>

        {attachments.length > 0 && (
          <div className="mt-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <div className="text-xs font-bold text-white mb-2">Attachments ({attachments.length})</div>
            <div className="space-y-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 text-xs text-white/90 bg-white/5 p-2 rounded-lg">
                  <span className="font-medium">{att.type}</span>
                  <span className="text-white/40">•</span>
                  <span>{att.name || "Untitled"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-[4.75rem] left-0 right-0 p-4 pointer-events-none z-10">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button
            onClick={handleStageNext}
            disabled={isSaving}
            className={`w-full py-3 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
              isSaving
                ? "bg-white/10 text-white/50"
                : "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white active:scale-95"
            }`}
          >
            {currentStageIndex < stages.length - 1 ? (
              <>
                Next Stage <ArrowRight size={16} />
              </>
            ) : (
              <>
                Complete <CheckCircle size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
