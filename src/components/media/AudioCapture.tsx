import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Pause, RotateCw, X, Check, Volume2 } from 'lucide-react';
import {
  startAudioRecording,
  stopAudioRecording,
} from '../../services/mediaService';

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
  const isRecordingRef = useRef(false);
  const exportedUrlRef = useRef<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Clean up blob URL on unmount — but NOT if it was passed to parent
  useEffect(() => {
    return () => {
      if (displayUrl && displayUrl.startsWith('blob:') && displayUrl !== exportedUrlRef.current) {
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

  // Visualize audio levels (uses ref to avoid stale closure)
  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (!isRecordingRef.current) return;

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

      // Check secure context (getUserMedia requires HTTPS)
      if (!window.isSecureContext) {
        setError('Microphone requires a secure connection (HTTPS). Please access this app via HTTPS.');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Your browser does not support audio recording. Please try Chrome or Safari.');
        return;
      }

      const recorder = await startAudioRecording();

      // Set up audio analysis for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(recorder.stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      analyserRef.current = analyser;

      // Start recording — no timeslice for better mobile Chrome compatibility
      recorder.start();
      setMediaRecorder(recorder);
      isRecordingRef.current = true;
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
      isRecordingRef.current = false;
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

      // Create blob URL for playback and passing back to parent
      const blobUrl = URL.createObjectURL(audioBlob);

      setAudioBlob(audioBlob);
      setDisplayUrl(blobUrl);
      setRecordedAudio(blobUrl);
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
      exportedUrlRef.current = displayUrl;
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
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col z-50">
        {/* Audio visualization and player */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 min-h-0">
          <div className="w-16 h-16 rounded-full bg-emerald-600/20 border-4 border-emerald-500/30 flex items-center justify-center mb-3">
            <Check size={32} className="text-emerald-400" />
          </div>

          <p className="text-white text-2xl font-bold font-mono mb-1">{formatTime(recordingTime)}</p>
          <p className="text-emerald-400 text-sm font-semibold mb-4">Recording complete</p>

          {/* Audio player */}
          {displayUrl && (
            <div className="w-full max-w-md px-2">
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 border border-slate-700">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayPause}
                    className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center transition active:scale-95 flex-shrink-0"
                  >
                    {isPlaying ? (
                      <Pause size={24} className="text-white" />
                    ) : (
                      <Play size={24} className="text-white ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">Audio Recording</p>
                    <p className="text-white/70 text-xs">Duration: {formatTime(recordingTime)}</p>
                  </div>
                  <Volume2 size={20} className="text-emerald-400 flex-shrink-0" />
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

        {/* Controls */}
        <div className="p-2 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handleRetake}
              className="flex-1 py-2.5 px-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <RotateCw size={16} /> Retake
            </button>
            <button
              onClick={handleUse}
              className="flex-1 py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/30"
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

      {/* Visualization area */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 min-h-0">
        {/* Microphone icon with pulsing effect */}
        <div className="relative mb-2">
          <div
            className={`w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-500/40 flex items-center justify-center transition-all duration-300 ${
              isRecording ? 'animate-pulse' : ''
            }`}
            style={{
              transform: isRecording ? `scale(${1 + audioLevel * 0.3})` : 'scale(1)',
            }}
          >
            <Mic size={32} className="text-red-400" />
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
          )}
        </div>

        {/* Timer */}
        <p className="text-white text-2xl font-bold font-mono mb-0.5">{formatTime(recordingTime)}</p>

        {/* Status text */}
        {isRecording ? (
          <p className="text-white/70 text-[10px]">Recording in progress...</p>
        ) : (
          <p className="text-white/50 text-[10px]">Ready to record</p>
        )}

        {/* Audio level bars */}
        {isRecording && (
          <div className="flex items-end gap-0.5 mt-2 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-red-500 to-red-300 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.random() * audioLevel * 100 + 10}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="p-2 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-center">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={isProcessing}
              className="w-14 h-14 rounded-full border-4 border-red-500 bg-black/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-3 border-t-red-500 border-red-500/30 rounded-full animate-spin" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <Mic size={20} className="text-white" />
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              disabled={isProcessing}
              className="w-14 h-14 rounded-full border-4 border-red-500 bg-red-500/90 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95"
            >
              <Square size={20} className="text-white fill-white" />
            </button>
          )}
        </div>

        <p className="text-center text-white/50 text-[10px] mt-1">
          {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </p>
      </div>
    </div>
  );
}
