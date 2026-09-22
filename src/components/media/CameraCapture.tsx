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

        // Check secure context (getUserMedia requires HTTPS)
        if (!window.isSecureContext) {
          setError('Camera requires a secure connection (HTTPS). Please access this app via HTTPS.');
          setIsLoading(false);
          return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Your browser does not support camera access. Please try Chrome or Safari.');
          setIsLoading(false);
          return;
        }

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
      <div className="absolute inset-0 bg-black flex flex-col z-50">
        {/* Preview image */}
        <div className="flex-1 flex items-center justify-center p-2 overflow-hidden min-h-0">
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 p-2 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800">
          <div className="flex gap-2">
            <button
              onClick={handleRetake}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <RotateCw size={16} /> Retake
            </button>
            <button
              onClick={handleUse}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <Check size={16} /> Use Photo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black flex flex-col z-50">
      {/* Video preview */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-white text-center">
              <div className="w-10 h-10 border-4 border-t-white/80 border-white/20 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Initializing camera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10 p-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <Camera size={24} className="text-red-400" />
              </div>
              <p className="text-red-400 font-semibold text-sm mb-1">Camera Error</p>
              <p className="text-white/70 text-xs max-w-xs">{error}</p>
              <button aria-label="Close camera"
                onClick={onCancel}
                className="mt-3 px-5 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition"
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

        {/* Top controls overlay */}
        <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent z-20">
          <button
            onClick={onCancel}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition"
          >
            <X size={18} className="text-white" />
          </button>

          <button
            onClick={() => setFlashEnabled(!flashEnabled)}
            aria-label={flashEnabled ? 'Turn flash off' : 'Turn flash on'}
            aria-pressed={flashEnabled}
            className={`w-9 h-9 rounded-full backdrop-blur-sm border flex items-center justify-center transition ${
              flashEnabled
                ? 'bg-yellow-500/30 border-yellow-500/50'
                : 'bg-black/40 border-white/10 hover:bg-black/60'
            }`}
          >
            {flashEnabled ? (
              <Zap size={18} className="text-yellow-300" />
            ) : (
              <ZapOff size={18} className="text-white/70" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="p-2 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Flip camera button */}
          <button aria-label="Switch camera"
            onClick={handleFlipCamera}
            disabled={isLoading || !!error}
            className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
          >
            <RotateCw size={16} className="text-white" />
          </button>

          {/* Capture button */}
          <button aria-label="Take photo"
            onClick={handleCapture}
            disabled={isLoading || !!error || isProcessing}
            className="w-14 h-14 rounded-full border-4 border-white bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-3 border-t-white border-white/30 rounded-full animate-spin" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white" />
            )}
          </button>

          {/* Spacer for symmetry */}
          <div className="w-10" />
        </div>
      </div>
    </div>
  );
}
