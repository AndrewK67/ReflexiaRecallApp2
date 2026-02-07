// src/components/QuickCapture.tsx
import React, { useMemo, useState } from "react";
import type { Entry, GuardianBadge, IncidentEntry, MediaItem } from "../types";
import CanvasBoard from "./CanvasBoard";
import CanvasBoardBasic from "./CanvasBoardBasic";
import CameraCapture from "./media/CameraCapture";
import VideoCapture from "./media/VideoCapture";
import AudioCapture from "./media/AudioCapture";
import { Capacitor } from '@capacitor/core';
import { savePhotoToFile, saveVideoToFile, saveAudioToFile } from '../services/mediaService';

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
        "Samaritans: 116 123 (24/7, free from any phone).",
        "Shout crisis text line: text 'SHOUT' to 85258.",
        "NHS urgent help: call 111, option 2 for mental health crisis.",
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
  const [useAdvancedCanvas, setUseAdvancedCanvas] = useState(false);

  const hasMedia = !!(photoDataUrl || videoDataUrl || audioDataUrl || drawingDataUrl);

  // Camera transition state to prevent race conditions
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);

  const guardianBadge = useMemo(() => {
    return localGuardianCheck(notes);
  }, [notes]);

  const save = async () => {
    const trimmed = notes.trim();

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

  // Helper: convert dataURL to Blob
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(',');
    const meta = parts[0];
    const base64 = parts[1];
    const m = meta.match(/data:(.*);base64/);
    const contentType = m ? m[1] : 'application/octet-stream';
    const binary = atob(base64);
    const len = binary.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
    return new Blob([u8], { type: contentType });
  };

  const handleSaveMedia = async (item: { type: string; url: string }) => {
    try {
      if (!item.url) return;
      
      // Handle file:// paths - read the file to get the blob
      let blob: Blob;
      if (item.url.startsWith('file://')) {
        // Read the file from native filesystem
        const { Filesystem } = await import('@capacitor/filesystem');
        const result = await Filesystem.readFile({ path: item.url.replace('file://', '') });
        const contentType = 
          item.type === 'PHOTO' ? 'image/jpeg' :
          item.type === 'VIDEO' ? 'video/webm' :
          item.type === 'AUDIO' ? 'audio/webm' : 'application/octet-stream';
        const base64Data = typeof result.data === 'string' ? result.data : '';
        const binary = atob(base64Data);
        const u8 = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
        blob = new Blob([u8], { type: contentType });
      } else {
        // Handle data URLs
        blob = dataUrlToBlob(item.url);
      }
      
      if (item.type === 'PHOTO') {
        if (Capacitor.isNativePlatform()) {
          const path = await savePhotoToFile(blob);
          alert(`Saved photo: ${path}`);
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `photo_${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
      } else if (item.type === 'VIDEO') {
        if (Capacitor.isNativePlatform()) {
          const path = await saveVideoToFile(blob);
          alert(`Saved video: ${path}`);
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `video_${Date.now()}.${blob.type.split('/')[1] || 'webm'}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
      } else if (item.type === 'AUDIO') {
        if (Capacitor.isNativePlatform()) {
          const path = await saveAudioToFile(blob);
          alert(`Saved audio: ${path}`);
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `audio_${Date.now()}.${blob.type.split('/')[1] || 'webm'}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
      }
    } catch (e) {
      console.error('Save media failed', e);
      alert('Failed to save media: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <>
      {/* Camera/Video overlays - render outside normal flow for proper full-screen positioning */}
      {tab === "PHOTO" && cameraReady && (
        <CameraCapture
          key={`camera-${cameraKey}`}
          onCapture={(dataUrl) => {
            setPhotoDataUrl(dataUrl);
            setCameraReady(false);
            setTab("TEXT");
          }}
          onCancel={() => {
            setCameraReady(false);
            setTab("TEXT");
          }}
        />
      )}

      {tab === "VIDEO" && cameraReady && (
        <VideoCapture
          key={`video-${cameraKey}`}
          onCapture={(dataUrl) => {
            setVideoDataUrl(dataUrl);
            setCameraReady(false);
            setTab("TEXT");
          }}
          onCancel={() => {
            setCameraReady(false);
            setTab("TEXT");
          }}
          maxDuration={60}
        />
      )}

      <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 text-white relative">
        {/* Animated Background */}
        <div className="animated-backdrop-dark overflow-hidden">
          <div className="orb one" />
          <div className="orb two" />
          <div className="orb three" />
          <div className="grain" />
        </div>

        {/* Header with tabs and back button */}
        <div className="flex-shrink-0 p-6 border-b border-white/10 bg-slate-950/50 backdrop-blur relative z-10">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h1 className="text-xl landscape:text-lg font-bold">Quick Capture</h1>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
            aria-label="Go back"
          >
            <span className="text-white text-lg">×</span>
          </button>
        </div>
        
        {/* Tabs - horizontal in both orientations */}
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setCameraReady(false);
              setTab("TEXT");
            }}
            className={`py-2 px-4 landscape:py-1.5 landscape:px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === "TEXT"
                ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/15"
            }`}
          >
            Text
          </button>
          <button
            onClick={() => {
              if (tab === "PHOTO") return;
              setCameraReady(false);
              setCameraKey(prev => prev + 1);
              setTab("PHOTO");
              setTimeout(() => setCameraReady(true), 50);
            }}
            className={`py-2 px-4 landscape:py-1.5 landscape:px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === "PHOTO"
                ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/15"
            }`}
          >
            Photo
          </button>
          <button
            onClick={() => {
              if (tab === "VIDEO") return;
              setCameraReady(false);
              setCameraKey(prev => prev + 1);
              setTab("VIDEO");
              setTimeout(() => setCameraReady(true), 50);
            }}
            className={`py-2 px-4 landscape:py-1.5 landscape:px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === "VIDEO"
                ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/15"
            }`}
          >
            Video
          </button>
          <button
            onClick={() => {
              setCameraReady(false);
              setTab("AUDIO");
            }}
            className={`py-2 px-4 landscape:py-1.5 landscape:px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === "AUDIO"
                ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/15"
            }`}
          >
            Audio
          </button>
          <button
            onClick={() => {
              setCameraReady(false);
              setTab("DRAW");
            }}
            className={`py-2 px-4 landscape:py-1.5 landscape:px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === "DRAW"
                ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/15"
            }`}
          >
            Draw
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content area - full height for media tabs */}
        {(tab === "PHOTO" || tab === "VIDEO" || tab === "AUDIO") ? (
        <div className="flex-1 relative overflow-hidden">
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

          {/* Loading state during camera transition */}
          {(tab === "PHOTO" || tab === "VIDEO") && !cameraReady && (
            <div className="flex-1 bg-black flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-12 h-12 border-4 border-t-white/80 border-white/20 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Preparing camera...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 landscape:px-6 pt-4 landscape:pt-6 pb-4">
            {tab === "TEXT" && (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe what happened. No filter. No judgement."
                  className="w-full min-h-[300px] landscape:min-h-[200px] p-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />

                {hasMedia && (
                  <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-400/30 text-white text-xs font-semibold">
                    Save buttons for your captured media are just below the thumbnails.
                  </div>
                )}

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
                {hasMedia && (
                  <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/5">
                    <p className="text-xs text-white/70 font-bold mb-3">Attached Media</p>
                    <div className="flex flex-wrap gap-3">
                      {photoDataUrl && (
                        <div className="relative group w-24">
                          <img src={photoDataUrl} alt="Photo" className="w-24 h-24 object-cover rounded-lg border border-white/20" />
                          <button
                            onClick={() => setPhotoDataUrl(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                          <div className="mt-1 flex flex-col gap-1">
                            <button
                              onClick={() => handleSaveMedia({ type: 'PHOTO', url: photoDataUrl })}
                              className="w-full py-1 rounded-md bg-blue-600 text-white text-xs"
                            >
                              Save to device
                            </button>
                            <p className="text-[10px] text-white/50 text-center">Photo</p>
                          </div>
                        </div>
                      )}
                      {videoDataUrl && (
                        <div className="relative group w-24">
                          <video src={videoDataUrl} className="w-24 h-24 object-cover rounded-lg border border-white/20" />
                          <button
                            onClick={() => setVideoDataUrl(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                          <div className="mt-1 flex flex-col gap-1">
                            <button
                              onClick={() => handleSaveMedia({ type: 'VIDEO', url: videoDataUrl })}
                              className="w-full py-1 rounded-md bg-blue-600 text-white text-xs"
                            >
                              Save to device
                            </button>
                            <p className="text-[10px] text-white/50 text-center">Video</p>
                          </div>
                        </div>
                      )}
                      {audioDataUrl && (
                        <div className="relative group w-24">
                          <div className="w-24 h-24 rounded-lg border border-white/20 bg-indigo-600/20 flex items-center justify-center">
                            <span className="text-2xl">🎵</span>
                          </div>
                          <button
                            onClick={() => setAudioDataUrl(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                          <div className="mt-1 flex flex-col gap-1">
                            <button
                              onClick={() => handleSaveMedia({ type: 'AUDIO', url: audioDataUrl })}
                              className="w-full py-1 rounded-md bg-blue-600 text-white text-xs"
                            >
                              Save to device
                            </button>
                            <p className="text-[10px] text-white/50 text-center">Audio</p>
                          </div>
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
              <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                {useAdvancedCanvas ? (
                  <CanvasBoard
                    height={window.innerHeight > window.innerWidth ? 400 : 280}
                    onExport={(dataUrl) => {
                      setDrawingDataUrl(dataUrl);
                      setTab("TEXT");
                      setUseAdvancedCanvas(false);
                    }}
                    initialDataUrl={drawingDataUrl ?? undefined}
                    onCancel={() => {
                      setTab("TEXT");
                      setUseAdvancedCanvas(false);
                    }}
                  />
                ) : (
                  <CanvasBoardBasic
                    height={window.innerHeight > window.innerWidth ? 400 : 280}
                    onExport={(dataUrl) => {
                      setDrawingDataUrl(dataUrl);
                      setTab("TEXT");
                    }}
                    initialDataUrl={drawingDataUrl ?? undefined}
                    onCancel={() => setTab("TEXT")}
                    onUpgrade={(dataUrl) => {
                      setDrawingDataUrl(dataUrl);
                      setUseAdvancedCanvas(true);
                    }}
                  />
                )}
                <div className="p-2 landscape:p-1.5 flex items-center justify-between text-xs landscape:text-[10px]">
                  <div className="text-white/70">
                    Tip: export saves your sketch
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

          <div className="flex-shrink-0 p-6 border-t border-white/10 bg-slate-950/50 backdrop-blur relative z-10">
            <button
              onClick={save}
              disabled={isSaving || (!notes.trim() && !photoDataUrl && !videoDataUrl && !audioDataUrl && !drawingDataUrl)}
              className={`w-full py-3 landscape:py-2.5 rounded-xl font-bold text-base landscape:text-sm shadow-xl transition-all ${
                isSaving || (!notes.trim() && !photoDataUrl && !videoDataUrl && !audioDataUrl && !drawingDataUrl)
                  ? "bg-white/10 text-white/30"
                  : "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white active:scale-95"
              }`}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      )}
      </div>
    </div>
    </>
  );
}
