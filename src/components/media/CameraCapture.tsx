import React, { useEffect, useRef, useState } from 'react';
import { Camera, RotateCw, Zap, ZapOff, X, Check } from 'lucide-react';
import { requestCameraAccess, capturePhoto, stopMediaStream, blobToDataURL } from '../../services/mediaService';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Preview state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    };
  }, [facingMode]);

  const handleCapture = async () => {
    if (!stream) return;

    try {
      setIsProcessing(true);

      // Flash effect
      if (flashEnabled && videoRef.current) {
        const flashDiv = document.createElement('div');
        flashDiv.style.position = 'fixed';
        flashDiv.style.inset = '0';
        flashDiv.style.backgroundColor = 'white';
        flashDiv.style.zIndex = '9999';
        flashDiv.style.pointerEvents = 'none';
        document.body.appendChild(flashDiv);

        setTimeout(() => {
          document.body.removeChild(flashDiv);
        }, 100);
      }

      const photoBlob = await capturePhoto(stream, 0.92);
      const dataUrl = await blobToDataURL(photoBlob);

      setCapturedImage(dataUrl);
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture photo');
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleUse = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    setCapturedImage(null);
  };

  // Show preview if image is captured
  if (capturedImage) {
    return (
      <div className="h-full bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain rounded-lg"
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
              <Check size={18} /> Use Photo
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
                <Camera size={32} className="text-red-400" />
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
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition"
          >
            <X size={20} className="text-white" />
          </button>

          <button
            onClick={() => setFlashEnabled(!flashEnabled)}
            className={`w-10 h-10 rounded-full backdrop-blur-sm border flex items-center justify-center transition ${
              flashEnabled
                ? 'bg-yellow-500/30 border-yellow-500/50'
                : 'bg-black/40 border-white/10 hover:bg-black/60'
            }`}
          >
            {flashEnabled ? (
              <Zap size={20} className="text-yellow-300" />
            ) : (
              <ZapOff size={20} className="text-white/70" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="p-6 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800">
        <div className="flex items-center justify-between">
          {/* Flip camera button */}
          <button
            onClick={handleFlipCamera}
            disabled={isLoading || !!error}
            className="w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
          >
            <RotateCw size={20} className="text-white" />
          </button>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={isLoading || !!error || isProcessing}
            className="w-20 h-20 rounded-full border-4 border-white bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95"
          >
            {isProcessing ? (
              <div className="w-8 h-8 border-3 border-t-white border-white/30 rounded-full animate-spin" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white" />
            )}
          </button>

          {/* Spacer for symmetry */}
          <div className="w-14" />
        </div>

        <p className="text-center text-white/50 text-xs mt-3">
          Tap the button to capture
        </p>
      </div>
    </div>
  );
}
