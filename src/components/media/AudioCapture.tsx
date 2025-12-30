import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Pause, RotateCw, X, Check } from 'lucide-react';
import {
  startAudioRecording,
  stopAudioRecording,
  blobToDataURL,
} from '../../services/mediaService';

interface AudioCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
}

export default function AudioCapture({ onCapture, onCancel, maxDuration = 300 }: AudioCaptureProps) {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Preview state
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Waveform visualization
  const [audioLevel, setAudioLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      visualizeAudio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!mediaRecorder) return;

    try {
      setIsProcessing(true);

      // Stop visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const audioBlob = await stopAudioRecording(mediaRecorder);
      const dataUrl = await blobToDataURL(audioBlob);

      setRecordedAudio(dataUrl);
      setIsRecording(false);
      setMediaRecorder(null);
      setAudioLevel(0);
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setRecordedAudio(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const handleUse = () => {
    if (recordedAudio) {
      onCapture(recordedAudio);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Show preview if audio is recorded
  if (recordedAudio) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-32 h-32 rounded-full bg-indigo-600/20 border-4 border-indigo-500/30 flex items-center justify-center mb-6 relative overflow-hidden">
            <div
              className="absolute inset-0 bg-indigo-500/30 transition-all duration-300"
              style={{
                transform: `scaleY(${isPlaying ? 1 : 0})`,
                transformOrigin: 'bottom',
              }}
            />
            <Mic size={48} className="text-indigo-400 relative z-10" />
          </div>

          <p className="text-white text-2xl font-bold font-mono mb-2">{formatTime(recordingTime)}</p>
          <p className="text-white/50 text-sm mb-8">Audio recorded successfully</p>

          <button
            onClick={handlePlayPause}
            className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition shadow-lg shadow-indigo-500/30"
          >
            {isPlaying ? (
              <Pause size={24} className="text-white fill-white" />
            ) : (
              <Play size={24} className="text-white fill-white ml-1" />
            )}
          </button>

          <audio
            ref={audioRef}
            src={recordedAudio}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
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
              <Check size={18} /> Use Audio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col relative">
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
      <div className="p-4 flex justify-between items-start">
        <button
          onClick={onCancel}
          disabled={isRecording}
          className="w-10 h-10 rounded-full bg-slate-800/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <X size={20} className="text-white" />
        </button>

        <div className="px-4 py-2 rounded-full bg-slate-800/60 backdrop-blur-sm border border-white/10">
          <span className="text-white/70 text-xs">Max: {formatTime(maxDuration)}</span>
        </div>
      </div>

      {/* Visualization area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Microphone icon with pulsing effect */}
        <div className="relative mb-8">
          <div
            className={`w-40 h-40 rounded-full bg-red-500/20 border-4 border-red-500/40 flex items-center justify-center transition-all duration-300 ${
              isRecording ? 'animate-pulse' : ''
            }`}
            style={{
              transform: isRecording ? `scale(${1 + audioLevel * 0.3})` : 'scale(1)',
            }}
          >
            <Mic size={64} className="text-red-400" />
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
          )}
        </div>

        {/* Timer */}
        <p className="text-white text-4xl font-bold font-mono mb-2">{formatTime(recordingTime)}</p>

        {/* Status text */}
        {isRecording ? (
          <p className="text-white/70 text-sm">Recording in progress...</p>
        ) : (
          <p className="text-white/50 text-sm">Ready to record</p>
        )}

        {/* Audio level bars */}
        {isRecording && (
          <div className="flex items-end gap-1 mt-6 h-16">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-red-500 to-red-300 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.random() * audioLevel * 100 + 10}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="p-6 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800">
        <div className="flex items-center justify-center">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={isProcessing}
              className="w-20 h-20 rounded-full border-4 border-red-500 bg-black/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95"
            >
              {isProcessing ? (
                <div className="w-8 h-8 border-3 border-t-red-500 border-red-500/30 rounded-full animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                  <Mic size={32} className="text-white" />
                </div>
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
        </div>

        <p className="text-center text-white/50 text-xs mt-3">
          {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </p>
      </div>
    </div>
  );
}
