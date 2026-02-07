import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Pause, RotateCw, X, Check, Volume2 } from 'lucide-react';
import {
  startAudioRecording,
  stopAudioRecording,
  saveAudioToFile,
} from '../../services/mediaService';
import { readMediaFile } from '../../services/fileStorageService';
import { Capacitor } from '@capacitor/core';

interface AudioCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
}

const AUDIO_CONTAINER_CLASS = "absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col z-50";

export default function AudioCapture({ onCapture, onCancel, maxDuration = 300 }: AudioCaptureProps) {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Preview state
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Waveform visualization
  const [audioLevel, setAudioLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (displayUrl && displayUrl.startsWith('blob:')) {
        URL.revokeObjectURL(displayUrl);
      }
    };
  }, [displayUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
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
  }, [isRecording, maxDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Visualize audio levels
  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (!isRecording) return;

      analyser.getByteFrequencyData(dataArray);

      // Calculate average level
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255); // Normalize to 0-1

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  const handleStartRecording = async () => {
    try {
      setError(null);

      const recorder = await startAudioRecording();

      // Set up audio analysis for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(recorder.stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      analyserRef.current = analyser;

      // Use timeslice for Android WebView - request chunks every 1000ms
      // This ensures ondataavailable fires regularly during recording
      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      visualizeAudio();
    } catch (err) {
      console.error('[AudioCapture] Start recording error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!mediaRecorder) return;

    try {
      setIsProcessing(true);
      setIsRecording(false); // Immediately stop UI state

      // Stop visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const audioBlob = await stopAudioRecording(mediaRecorder);

      if (audioBlob.size === 0) {
        console.error('[AudioCapture] WARNING: Audio blob is empty (0 bytes)!');
        setError('Recording failed - no audio data captured. Please check microphone permissions.');
        setIsProcessing(false);
        setMediaRecorder(null);
        return;
      }

      // Create blob URL for playback (Android WebView compatible)
      const blobUrl = URL.createObjectURL(audioBlob);

      const filePath = await saveAudioToFile(audioBlob);

      setAudioBlob(audioBlob);
      setDisplayUrl(blobUrl);
      setRecordedAudio(filePath);
      setMediaRecorder(null);
      setAudioLevel(0);
      setIsProcessing(false);
    } catch (err) {
      console.error('[AudioCapture] Stop recording error:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setIsRecording(false);
      setIsProcessing(false);
      // Still clear the recorder even on error
      setMediaRecorder(null);
    }
  };

  const handleRetake = () => {
    // Clean up blob URL
    if (displayUrl && displayUrl.startsWith('blob:')) {
      URL.revokeObjectURL(displayUrl);
    }
    setRecordedAudio(null);
    setAudioBlob(null);
    setDisplayUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const handleUse = () => {
    if (recordedAudio) {
      onCapture(recordedAudio);
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) {
      console.error('[AudioCapture] No audio element ref');
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('[AudioCapture] Play error:', err);
        setError('Failed to play audio: ' + (err instanceof Error ? err.message : String(err)));
        setIsPlaying(false);
      }
    }
  };

  // Show preview if audio is recorded
  if (recordedAudio) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col landscape:flex-row z-50">
        {/* Audio visualization and player - larger in landscape */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 landscape:p-8 overflow-y-auto custom-scrollbar pb-safe min-h-0 landscape:w-3/4">
          <div className="w-32 h-32 landscape:w-40 landscape:h-40 rounded-full bg-emerald-600/20 border-4 border-emerald-500/30 flex items-center justify-center mb-6 relative overflow-hidden">
            <Check size={64} className="landscape:w-20 landscape:h-20 text-emerald-400 relative z-10" />
          </div>

          {/* Show recording time prominently */}
          <p className="text-white text-4xl landscape:text-5xl font-bold font-mono mb-2">{formatTime(recordingTime)}</p>
          <p className="text-emerald-400 text-base landscape:text-lg font-semibold mb-8">✓ Recording complete</p>
          
          {/* Audio player */}
          {displayUrl && (
            <div className="w-full max-w-md">
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePlayPause}
                    className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center transition active:scale-95 flex-shrink-0"
                  >
                    {isPlaying ? (
                      <Pause size={32} className="text-white" />
                    ) : (
                      <Play size={32} className="text-white ml-1" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-white text-lg font-semibold mb-1">Audio Recording</p>
                    <p className="text-white/70 text-sm">Duration: {formatTime(recordingTime)}</p>
                  </div>
                  <Volume2 size={28} className="text-emerald-400 flex-shrink-0" />
                </div>
              </div>
              <audio
                ref={audioRef}
                src={displayUrl}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error('[AudioCapture] Audio playback error:', e);
                  setError('Playback error. Audio saved successfully.');
                }}
                preload="metadata"
              />
            </div>
          )}
        </div>

        {/* Controls - portrait bottom, landscape right sidebar */}
        <div className="p-3 sm:p-4 landscape:p-6 pb-safe bg-slate-900/90 backdrop-blur-xl border-t landscape:border-l landscape:border-t-0 border-slate-800 flex-shrink-0 landscape:w-1/4 landscape:flex landscape:flex-col landscape:justify-center">
          <div className="flex landscape:flex-col gap-2 landscape:gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 py-2 landscape:py-3 px-2 rounded-lg landscape:rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <RotateCw size={16} /> Retake
            </button>
            <button
              onClick={handleUse}
              className="flex-1 py-2 landscape:py-3 px-2 rounded-lg landscape:rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/30"
            >
              <Check size={16} /> Use Audio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={AUDIO_CONTAINER_CLASS}>
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Mic size={32} className="text-red-400" />
            </div>
            <p className="text-red-400 font-semibold mb-2">Microphone Error</p>
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

      {/* Top controls */}
      <div className="p-2 sm:p-3 flex justify-between items-start flex-shrink-0">
        <button
          onClick={onCancel}
          disabled={isRecording}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <X size={18} className="text-white sm:w-5 sm:h-5" />
        </button>

        <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800/60 backdrop-blur-sm border border-white/10">
          <span className="text-white/70 text-[10px] sm:text-xs">Max: {formatTime(maxDuration)}</span>
        </div>
      </div>

      {/* Visualization area - scrollable */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto custom-scrollbar pb-safe min-h-0">
        {/* Microphone icon with pulsing effect */}
        <div className="relative mb-3 sm:mb-4">
          <div
            className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-red-500/20 border-4 border-red-500/40 flex items-center justify-center transition-all duration-300 ${
              isRecording ? 'animate-pulse' : ''
            }`}
            style={{
              transform: isRecording ? `scale(${1 + audioLevel * 0.3})` : 'scale(1)',
            }}
          >
            <Mic size={36} className="text-red-400 sm:w-12 sm:h-12" />
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white" />
            </div>
          )}
        </div>

        {/* Timer */}
        <p className="text-white text-2xl sm:text-3xl font-bold font-mono mb-1">{formatTime(recordingTime)}</p>

        {/* Status text */}
        {isRecording ? (
          <p className="text-white/70 text-[10px] sm:text-xs">Recording in progress...</p>
        ) : (
          <p className="text-white/50 text-[10px] sm:text-xs">Ready to record</p>
        )}

        {/* Audio level bars */}
        {isRecording && (
          <div className="flex items-end gap-0.5 sm:gap-1 mt-3 sm:mt-4 h-10 sm:h-12">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 sm:w-1.5 bg-gradient-to-t from-red-500 to-red-300 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.random() * audioLevel * 100 + 10}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="p-3 sm:p-4 pb-safe bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-center">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={isProcessing}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-red-500 bg-black/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95"
            >
              {isProcessing ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-t-red-500 border-red-500/30 rounded-full animate-spin" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500 flex items-center justify-center">
                  <Mic size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              disabled={isProcessing}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-red-500 bg-red-500/90 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95"
            >
              <Square size={20} className="text-white fill-white sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        <p className="text-center text-white/50 text-[10px] sm:text-xs mt-1.5 sm:mt-2">
          {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </p>
      </div>
    </div>
  );
}
