import React, { useEffect, useRef, useState } from 'react';
import { Camera, RotateCw, Zap, ZapOff, X, Check } from 'lucide-react';
import { requestCameraAccess, capturePhoto, stopMediaStream, blobToDataURL, savePhotoToFile } from '../../services/mediaService';
import { Capacitor } from '@capacitor/core';

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
  const [lastPhotoBlob, setLastPhotoBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

      setLastPhotoBlob(photoBlob);
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
      <div className="fixed inset-0 bg-black flex flex-col landscape:flex-row z-50">
        {/* Preview image - larger in landscape */}
        <div className="flex-1 flex items-center justify-center p-2 landscape:p-4 overflow-hidden min-h-0 landscape:w-3/4">
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        {/* Controls - portrait bottom, landscape right sidebar */}
        <div className="flex-shrink-0 p-2 sm:p-4 landscape:p-6 bg-red-900 border-t-4 landscape:border-l-4 landscape:border-t-0 border-yellow-400 shadow-2xl landscape:w-1/4 landscape:flex landscape:flex-col landscape:justify-center">
          <p className="text-yellow-300 text-base landscape:text-lg font-black mb-1 animate-pulse text-center">📸 PHOTO CAPTURED!</p>
          <p className="text-white text-xs landscape:text-sm mb-2 landscape:mb-4 font-semibold text-center">Choose an option:</p>
          <div className="flex flex-col gap-2 landscape:gap-3">
            <button
              onClick={handleUse}
              className="w-full py-2 landscape:py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <Check size={16} /> Use Photo
            </button>
            <button
              onClick={async () => {
                if (!lastPhotoBlob) return;
                try {
                  if (Capacitor.isNativePlatform()) {
                    const path = await savePhotoToFile(lastPhotoBlob);
                    alert(`Saved photo: ${path}`);
                  } else {
                    const url = URL.createObjectURL(lastPhotoBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `photo_${Date.now()}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }
                } catch (e) {
                  console.error('Save photo failed', e);
                  alert('Failed to save photo');
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
    <div className="fixed inset-0 bg-black flex flex-col landscape:flex-row relative z-50">
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

        {/* Top controls - only show in portrait */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent z-20 landscape:hidden">
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

      {/* Bottom controls - portrait bottom bar, landscape right sidebar */}
      <div className="p-3 sm:p-6 bg-slate-900/90 backdrop-blur-xl border-t landscape:border-l landscape:border-t-0 border-slate-800 flex-shrink-0 landscape:flex landscape:flex-col landscape:justify-between landscape:h-full w-full landscape:w-[25%]">
        {/* Top section - Close and Flash in landscape */}
        <div className="hidden landscape:flex landscape:flex-col gap-3 mb-6">
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            <X size={16} /> Close
          </button>
          <button
            onClick={() => setFlashEnabled(!flashEnabled)}
            className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${
              flashEnabled
                ? 'bg-yellow-500/30 border-2 border-yellow-500/50 text-yellow-300'
                : 'bg-slate-700 hover:bg-slate-600 text-white/70'
            }`}
          >
            {flashEnabled ? (
              <><Zap size={16} /> Flash On</>
            ) : (
              <><ZapOff size={16} /> Flash Off</>
            )}
          </button>
        </div>

        {/* Middle section - Main controls */}
        <div className="flex landscape:flex-col items-center justify-between landscape:gap-6">
          {/* Flip camera button */}
          <button
            onClick={handleFlipCamera}
            disabled={isLoading || !!error}
            className="w-12 h-12 landscape:w-full landscape:h-auto landscape:py-4 rounded-full landscape:rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center landscape:gap-2 transition"
          >
            <RotateCw size={18} className="text-white" />
            <span className="hidden landscape:inline text-white font-semibold text-sm">Flip Camera</span>
          </button>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={isLoading || !!error || isProcessing}
            className="w-16 h-16 landscape:w-20 landscape:h-20 rounded-full border-4 border-white bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95 landscape:my-4"
          >
            {isProcessing ? (
              <div className="w-6 h-6 landscape:w-10 landscape:h-10 border-3 border-t-white border-white/30 rounded-full animate-spin" />
            ) : (
              <div className="w-12 h-12 landscape:w-14 landscape:h-14 rounded-full bg-white" />
            )}
          </button>

          {/* Spacer for symmetry in portrait */}
          <div className="w-12 landscape:hidden" />
        </div>

        {/* Bottom section - Help text */}
        <p className="text-center text-white/50 text-xs mt-2 landscape:mt-0 landscape:mb-4">
          Tap the button to capture
        </p>
      </div>
    </div>
  );
}
