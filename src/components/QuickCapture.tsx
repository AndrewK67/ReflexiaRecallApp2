// src/components/QuickCapture.tsx
import React, { useMemo, useState } from "react";
import type { Entry, GuardianBadge, IncidentEntry, MediaItem } from "../types";
import CanvasBoard from "./CanvasBoard";
import CameraCapture from "./media/CameraCapture";
import VideoCapture from "./media/VideoCapture";
import AudioCapture from "./media/AudioCapture";

type QuickCaptureProps = {
  aiEnabled: boolean;
  onComplete: (e: Entry) => void | Promise<void>;
  onCancel: () => void;
};

// Lightweight, offline-safe "guardian".
// (This is NOT clinical advice — just a safety nudge when text looks high-risk.)
function localGuardianCheck(text: string): GuardianBadge | null {
  const t = (text || "").toLowerCase();

  const highSignals = [
    "suicide",
    "kill myself",
    "end it",
    "self harm",
    "can't go on",
    "overdose",
    "hurt myself",
  ];

  const medSignals = ["panic", "can't breathe", "hopeless", "worthless", "breakdown"];

  const hitHigh = highSignals.some((k) => t.includes(k));
  const hitMed = !hitHigh && medSignals.some((k) => t.includes(k));

  if (hitHigh) {
    return {
      label: "High Risk",
      riskLevel: "HIGH",
      summary: "This sounds urgent. Please don't carry it alone.",
      suggestedActions: [
        "If you're in immediate danger, call your local emergency number now.",
        "Reach out to a trusted person and stay with someone if possible.",
        "If you're in the UK & Ireland: Samaritans 116 123 (24/7).",
      ],
    };
  }

  if (hitMed) {
    return {
      label: "Medium Risk",
      riskLevel: "MED",
      summary: "This sounds heavy. A small support step could help.",
      suggestedActions: [
        "Do 60 seconds of slow breathing (4 in, 6 out).",
        "Message someone you trust: 'Can you talk for 5 mins?'",
        "Write the next small step you can take today.",
      ],
    };
  }

  return null;
}

export default function QuickCapture({ aiEnabled, onComplete, onCancel }: QuickCaptureProps) {
  const [notes, setNotes] = useState("");
  const [tab, setTab] = useState<"TEXT" | "PHOTO" | "VIDEO" | "AUDIO" | "DRAW">("TEXT");
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [videoDataUrl, setVideoDataUrl] = useState<string | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const guardianBadge = useMemo(() => {
    if (!aiEnabled) return null;
    return localGuardianCheck(notes);
  }, [aiEnabled, notes]);

  const save = async () => {
    const trimmed = notes.trim();
    const hasMedia = !!(drawingDataUrl || photoDataUrl || videoDataUrl || audioDataUrl);

    if (!trimmed && !hasMedia) return;

    setIsSaving(true);
    try {
      const media: MediaItem[] = [];

      if (photoDataUrl) {
        media.push({
          id: `photo_${Date.now()}`,
          type: "PHOTO",
          url: photoDataUrl,
          createdAt: Date.now(),
        });
      }

      if (videoDataUrl) {
        media.push({
          id: `video_${Date.now()}`,
          type: "VIDEO",
          url: videoDataUrl,
          createdAt: Date.now(),
        });
      }

      if (audioDataUrl) {
        media.push({
          id: `audio_${Date.now()}`,
          type: "AUDIO",
          url: audioDataUrl,
          createdAt: Date.now(),
        });
      }

      if (drawingDataUrl) {
        media.push({
          id: `draw_${Date.now()}`,
          type: "DRAWING",
          url: drawingDataUrl,
          createdAt: Date.now(),
        });
      }

      const entry: IncidentEntry = {
        id: `incident_${Date.now()}`,
        type: "INCIDENT",
        date: new Date().toISOString(),
        notes: trimmed,
        media,
        createdAt: Date.now(),
        guardianBadge: guardianBadge ?? undefined,
      };

      await onComplete(entry);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="flex-shrink-0 p-6 flex items-center justify-between border-b border-white/10">
        <h1 className="text-2xl font-bold">Quick Capture</h1>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/5 text-sm font-semibold"
        >
          Back
        </button>
      </div>

      <div className="flex-shrink-0 px-6 pt-4">
        <div className="grid grid-cols-5 gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setTab("TEXT")}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              tab === "TEXT"
                ? "bg-white text-slate-900 shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setTab("PHOTO")}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              tab === "PHOTO"
                ? "bg-white text-slate-900 shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Photo
          </button>
          <button
            onClick={() => setTab("VIDEO")}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              tab === "VIDEO"
                ? "bg-white text-slate-900 shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Video
          </button>
          <button
            onClick={() => setTab("AUDIO")}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              tab === "AUDIO"
                ? "bg-white text-slate-900 shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Audio
          </button>
          <button
            onClick={() => setTab("DRAW")}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              tab === "DRAW"
                ? "bg-white text-slate-900 shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            Draw
          </button>
        </div>
      </div>

      {/* Content area - full height for media tabs */}
      {(tab === "PHOTO" || tab === "VIDEO" || tab === "AUDIO") ? (
        <div className="flex-1 overflow-hidden">
          {tab === "PHOTO" && (
            <CameraCapture
              onCapture={(dataUrl) => {
                setPhotoDataUrl(dataUrl);
                setTab("TEXT");
              }}
              onCancel={() => setTab("TEXT")}
            />
          )}

          {tab === "VIDEO" && (
            <VideoCapture
              onCapture={(dataUrl) => {
                setVideoDataUrl(dataUrl);
                setTab("TEXT");
              }}
              onCancel={() => setTab("TEXT")}
              maxDuration={60}
            />
          )}

          {tab === "AUDIO" && (
            <AudioCapture
              onCapture={(dataUrl) => {
                setAudioDataUrl(dataUrl);
                setTab("TEXT");
              }}
              onCancel={() => setTab("TEXT")}
              maxDuration={300}
            />
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-40">
            {tab === "TEXT" && (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe what happened. No filter. No judgement."
                  className="w-full h-64 p-4 rounded-2xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />

                {guardianBadge && (
                  <div className="mt-4 p-5 rounded-3xl border-2 border-rose-500/50 bg-rose-950/30 shadow-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <div className="text-sm font-extrabold text-rose-200">{guardianBadge.riskLevel}</div>
                    </div>
                    <div className="text-white/90 mb-4 text-sm leading-relaxed">{guardianBadge.summary}</div>
                    {guardianBadge.suggestedActions && guardianBadge.suggestedActions.length > 0 && (
                      <ul className="space-y-2">
                        {guardianBadge.suggestedActions.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/80">
                            <span className="text-rose-400 font-bold">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Media preview thumbnails */}
                {(photoDataUrl || videoDataUrl || audioDataUrl || drawingDataUrl) && (
                  <div className="mt-4 p-4 rounded-2xl border border-white/15 bg-white/5">
                    <p className="text-xs text-white/70 font-bold mb-3">Attached Media</p>
                    <div className="flex flex-wrap gap-3">
                      {photoDataUrl && (
                        <div className="relative group">
                          <img src={photoDataUrl} alt="Photo" className="w-20 h-20 object-cover rounded-lg border border-white/20" />
                          <button
                            onClick={() => setPhotoDataUrl(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                          <p className="text-[10px] text-white/50 mt-1 text-center">Photo</p>
                        </div>
                      )}
                      {videoDataUrl && (
                        <div className="relative group">
                          <video src={videoDataUrl} className="w-20 h-20 object-cover rounded-lg border border-white/20" />
                          <button
                            onClick={() => setVideoDataUrl(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                          <p className="text-[10px] text-white/50 mt-1 text-center">Video</p>
                        </div>
                      )}
                      {audioDataUrl && (
                        <div className="relative group">
                          <div className="w-20 h-20 rounded-lg border border-white/20 bg-indigo-600/20 flex items-center justify-center">
                            <span className="text-2xl">🎵</span>
                          </div>
                          <button
                            onClick={() => setAudioDataUrl(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                          <p className="text-[10px] text-white/50 mt-1 text-center">Audio</p>
                        </div>
                      )}
                      {drawingDataUrl && (
                        <div className="relative group">
                          <img src={drawingDataUrl} alt="Drawing" className="w-20 h-20 object-cover rounded-lg border border-white/20" />
                          <button
                            onClick={() => setDrawingDataUrl(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                          <p className="text-[10px] text-white/50 mt-1 text-center">Drawing</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "DRAW" && (
              <div className="rounded-3xl border border-white/15 bg-white/5 overflow-hidden">
                <CanvasBoard
                  height={520}
                  onExport={(dataUrl) => {
                    setDrawingDataUrl(dataUrl);
                    setTab("TEXT");
                  }}
                  initialDataUrl={drawingDataUrl ?? undefined}
                  onCancel={() => setTab("TEXT")}
                />
                <div className="p-3 flex items-center justify-between">
                  <div className="text-white/70 text-xs">
                    Tip: export saves your sketch into the capture.
                  </div>
                  <button
                    onClick={() => setDrawingDataUrl(null)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 p-6 border-t border-white/10 bg-slate-950/80 backdrop-blur">
            <button
              onClick={save}
              disabled={isSaving || (!notes.trim() && !photoDataUrl && !videoDataUrl && !audioDataUrl && !drawingDataUrl)}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all ${
                isSaving || (!notes.trim() && !photoDataUrl && !videoDataUrl && !audioDataUrl && !drawingDataUrl)
                  ? "bg-white/10 text-white/30"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95"
              }`}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
