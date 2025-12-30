import React, { useEffect, useRef, useState } from 'react';
import { Video, Square, Circle, Play, RotateCw, X, Check } from 'lucide-react';
import {
  requestCameraAccess,
  startVideoRecording,
  stopVideoRecording,
  stopMediaStream,
  blobToDataURL,
} from '../../services/mediaService';

interface VideoCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
}

export default function VideoCapture({ onCapture, onCancel, maxDuration = 60 }: VideoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Preview state
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Initialize camera
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

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
      <div className="h-full bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 relative">
          <video
            ref={previewVideoRef}
            src={recordedVideo}
            controls
            className="max-w-full max-h-full rounded-lg"
            playsInline
          />
        </div>

        <div className="p-6 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800">
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-semibold flex items-center justify-center gap-2 transition"
            >
              <RotateCw size={18} /> Retake
            </button>
            <button
              onClick={handleUse}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition"
            >
              <Check size={18} /> Use Video
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black flex flex-col relative">
      {/* Video preview */}
      <div className="flex-1 relative overflow-hidden">
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

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent z-20">
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

      {/* Bottom controls */}
      <div className="p-6 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800">
        <div className="flex items-center justify-between">
          {/* Flip camera button */}
          <button
            onClick={handleFlipCamera}
            disabled={isLoading || !!error || isRecording}
            className="w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
          >
            <RotateCw size={20} className="text-white" />
          </button>

          {/* Record/Stop button */}
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={isLoading || !!error || isProcessing}
              className="w-20 h-20 rounded-full border-4 border-red-500 bg-black/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95"
            >
              {isProcessing ? (
                <div className="w-8 h-8 border-3 border-t-red-500 border-red-500/30 rounded-full animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-500" />
              )}
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              disabled={isProcessing}
              className="w-20 h-20 rounded-full border-4 border-red-500 bg-red-500/90 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95"
            >
              <Square size={32} className="text-white fill-white" />
            </button>
          )}

          {/* Spacer for symmetry */}
          <div className="w-14" />
        </div>

        <p className="text-center text-white/50 text-xs mt-3">
          {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </p>
      </div>
    </div>
  );
}
