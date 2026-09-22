import React, { useEffect, useRef, useState } from 'react';
import { Video, Square, Circle, Play, RotateCw, X, Check } from 'lucide-react';
import {
  requestCameraAccess,
  startVideoRecording,
  stopVideoRecording,
  stopMediaStream,
  blobToDataURL,
  saveVideoToFile,
} from '../../services/mediaService';
import { Capacitor } from '@capacitor/core';
import { notify } from '../../services/noticeService';

interface VideoCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
}

const VIDEO_CONTAINER_CLASS = "fixed inset-0 bg-black flex flex-col relative z-50";

export default function VideoCapture({ onCapture, onCancel, maxDuration = 60 }: VideoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Preview state
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Initialize camera
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // IMPORTANT: Stop existing stream BEFORE requesting new one
        if (stream) {
          stopMediaStream(stream);
          setStream(null);
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
          // Delay to ensure camera is released
          await new Promise(resolve => setTimeout(resolve, 800));
        } else {
          // Even on first mount, give time for any previous components to clean up
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        const mediaStream = await requestCameraAccess({ facingMode });

        if (!mounted) {
          stopMediaStream(mediaStream);
          return;
        }

        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        setIsLoading(false);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to access camera');
        setIsLoading(false);
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (stream) {
        stopMediaStream(stream);
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [facingMode]);

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            handleStopRecording();
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, isPaused, maxDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    if (!stream) return;

    try {
      const recorder = await startVideoRecording(stream);

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!mediaRecorder) return;

    try {
      setIsProcessing(true);

      const videoBlob = await stopVideoRecording(mediaRecorder);
      const dataUrl = await blobToDataURL(videoBlob);

      setLastVideoBlob(videoBlob);
      setRecordedVideo(dataUrl);
      setIsRecording(false);
      setMediaRecorder(null);
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setRecordedVideo(null);
    setRecordingTime(0);
  };

  const handleUse = () => {
    if (recordedVideo) {
      onCapture(recordedVideo);
    }
  };

  const handleFlipCamera = () => {
    if (isRecording) return;
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    setRecordedVideo(null);
  };

  // Show preview if video is recorded
  if (recordedVideo) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col landscape:flex-row z-50">
        {/* Video player - larger in landscape */}
        <div className="flex-1 flex items-center justify-center p-2 landscape:p-4 relative overflow-hidden min-h-0 landscape:w-3/4">
          <video
            ref={previewVideoRef}
            src={recordedVideo}
            controls
            className="w-full h-full object-contain rounded-lg"
            playsInline
          />
        </div>

        {/* Controls - portrait bottom, landscape right sidebar */}
        <div className="flex-shrink-0 p-2 sm:p-4 landscape:p-6 bg-red-900 border-t-4 landscape:border-l-4 landscape:border-t-0 border-yellow-400 shadow-2xl landscape:w-1/4 landscape:flex landscape:flex-col landscape:justify-center">
          <p className="text-yellow-300 text-base landscape:text-lg font-black mb-1 animate-pulse text-center">🎥 VIDEO RECORDED!</p>
          <p className="text-white text-xs landscape:text-sm mb-2 landscape:mb-4 font-semibold text-center">Choose an option:</p>
          <div className="flex flex-col gap-2 landscape:gap-3">
            <button
              onClick={handleUse}
              className="w-full py-2 landscape:py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <Check size={16} /> Use Video
            </button>
            <button
              onClick={async () => {
                if (!lastVideoBlob) return;
                try {
                  if (Capacitor.isNativePlatform()) {
                    const path = await saveVideoToFile(lastVideoBlob);
                    notify(`Video saved to ${path}`, 'success');
                  } else {
                    const url = URL.createObjectURL(lastVideoBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `video_${Date.now()}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }
                } catch (e) {
                  console.error('Save video failed', e);
                  notify('Could not save the video.', 'error');
                }
              }}
              className="w-full py-2 landscape:py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              💾 Save to Device
            </button>
            <button
              onClick={handleRetake}
              className="w-full py-2 landscape:py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <RotateCw size={16} /> Retake
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${VIDEO_CONTAINER_CLASS} landscape:flex-row`}>
      {/* Video preview - 75% in landscape with max width */}
      <div className="flex-1 relative overflow-hidden min-h-0 max-w-full landscape:max-w-[75%]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-white text-center">
              <div className="w-12 h-12 border-4 border-t-white/80 border-white/20 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Initializing camera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Video size={32} className="text-red-400" />
              </div>
              <p className="text-red-400 font-semibold mb-2">Camera Error</p>
              <p className="text-white/70 text-sm max-w-xs">{error}</p>
              <button
                onClick={onCancel}
                className="mt-4 px-6 py-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Top controls - only in portrait */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent z-20 landscape:hidden">
          <button
            onClick={onCancel}
            disabled={isRecording}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <X size={20} className="text-white" />
          </button>

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/90 backdrop-blur-sm">
              <Circle size={8} className="text-white fill-white animate-pulse" />
              <span className="text-white font-mono font-bold text-sm">{formatTime(recordingTime)}</span>
              <span className="text-white/70 text-xs">/ {formatTime(maxDuration)}</span>
            </div>
          )}

          {!isRecording && (
            <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
              <span className="text-white/70 text-xs">Max: {formatTime(maxDuration)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls - portrait bottom, landscape right sidebar */}
      <div className="bg-slate-900/90 backdrop-blur-xl border-t landscape:border-l landscape:border-t-0 border-slate-800 flex-shrink-0 landscape:flex landscape:flex-col landscape:justify-between landscape:h-full w-full landscape:w-[25%]">
        {/* Top section - Close button and status in landscape */}
        <div className="hidden landscape:flex landscape:flex-col gap-3 p-4">
          <button
            onClick={onCancel}
            disabled={isRecording}
            className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            <X size={16} /> Close
          </button>
          
          {/* Recording indicator in landscape */}
          {isRecording && (
            <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-red-500/90">
              <div className="flex items-center gap-2">
                <Circle size={10} className="text-white fill-white animate-pulse" />
                <span className="text-white font-bold text-xs">RECORDING</span>
              </div>
              <span className="text-white font-mono font-bold text-lg">{formatTime(recordingTime)}</span>
              <span className="text-white/70 text-xs">Max: {formatTime(maxDuration)}</span>
            </div>
          )}

          {!isRecording && (
            <div className="px-4 py-3 rounded-xl bg-slate-700/50 text-center">
              <span className="text-white/70 text-xs">Ready to Record</span>
              <div className="text-white/50 text-[10px] mt-1">Max: {formatTime(maxDuration)}</div>
            </div>
          )}
        </div>

        {/* Smart Toggle: Self/Scene */}
        <div className="px-3 sm:px-6 landscape:px-4 pt-3 sm:pt-4 landscape:pt-0 pb-1 sm:pb-2 landscape:pb-0">
          <button
            onClick={handleFlipCamera}
            disabled={isLoading || !!error || isRecording}
            className="w-full py-2 sm:py-2.5 landscape:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 transition flex items-center justify-center gap-1 sm:gap-2"
          >
            <RotateCw size={14} className="text-white/80 sm:w-4 sm:h-4" />
            <span className="text-white font-semibold text-xs sm:text-sm">
              {facingMode === 'environment' ? '🎬 Scene' : '🤳 Self'}
            </span>
            <span className="text-white/50 text-[10px] sm:text-xs hidden sm:inline landscape:hidden">
              (Tap to switch to {facingMode === 'environment' ? 'Self' : 'Scene'})
            </span>
          </button>
        </div>

        <div className="px-3 sm:px-6 landscape:px-4 py-3 sm:py-4 landscape:py-6 flex landscape:flex-col items-center justify-between landscape:gap-4">
          {/* Spacer for symmetry in portrait */}
          <div className="w-12 sm:w-14 landscape:hidden" />

          {/* Record/Stop button */}
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={isLoading || !!error || isProcessing}
              className="w-16 h-16 sm:w-20 sm:h-20 landscape:w-20 landscape:h-20 rounded-full border-4 border-red-500 bg-black/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95"
            >
              {isProcessing ? (
                <div className="w-6 h-6 sm:w-8 sm:h-8 landscape:w-10 landscape:h-10 border-3 border-t-red-500 border-red-500/30 rounded-full animate-spin" />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-14 landscape:h-14 rounded-full bg-red-500" />
              )}
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              disabled={isProcessing}
              className="w-16 h-16 sm:w-20 sm:h-20 landscape:w-20 landscape:h-20 rounded-full border-4 border-red-500 bg-red-500/90 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95"
            >
              <Square size={28} className="text-white fill-white sm:w-8 sm:h-8" />
            </button>
          )}

          {/* Spacer for symmetry in portrait */}
          <div className="w-12 sm:w-14 landscape:hidden" />
        </div>

        <div className="px-3 sm:px-6 landscape:px-4 pb-3 sm:pb-4 landscape:pb-4 space-y-1">
          <p className="text-center text-white/50 text-[10px] sm:text-xs">
            {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
          </p>
          <p className="text-center text-white/40 text-[9px] sm:text-[10px]">
            🔒 Stored on this device
          </p>
        </div>
      </div>
    </div>
  );
}
