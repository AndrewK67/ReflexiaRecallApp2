/**
 * Media Service
 * Handles camera, video, and audio capture for the app
 * Camera requests are serialized with long release delays to avoid conflicts
 */

import { saveMediaFile } from './fileStorageService';

// Track active camera stream
let activeCameraStream: MediaStream | null = null;

// Serialize camera requests to prevent concurrent access conflicts
let cameraRequestInProgress = false;
let cameraRequestQueue: Array<() => Promise<MediaStream>> = [];
let cameraRequestResolvers: Array<{ resolve: (stream: MediaStream) => void; reject: (error: Error) => void }> = [];

export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

export interface VideoRecordingOptions {
  maxDuration?: number; // in seconds
  mimeType?: string;
}

export interface AudioRecordingOptions {
  mimeType?: string;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
}

/**
 * Request camera access and return a MediaStream
 * Each request releases the old stream before requesting a new one
 * Requests are serialized to prevent concurrent getUserMedia calls
 */
export async function requestCameraAccess(options: CameraOptions = {}): Promise<MediaStream> {
  // Create a task that will be processed by the queue
  const task = async (): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: options.facingMode || 'user',
        width: options.width || { ideal: 1920 },
        height: options.height || { ideal: 1080 },
      },
      audio: false,
    };

    // Release any previously active stream to free up hardware resources
    if (activeCameraStream) {
      try {
        const streamToRelease = activeCameraStream;
        activeCameraStream = null;
        streamToRelease.getTracks().forEach((track) => track.stop());
      } catch (e) {
        // ignore cleanup errors
      }
      // Wait for hardware to fully release the old stream before requesting new one
      // 1500ms gives the camera hardware time to truly release
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    activeCameraStream = stream;
    return stream;
  };

  // Add task to queue and wait for it to complete
  return new Promise<MediaStream>((resolve, reject) => {
    cameraRequestQueue.push(task);
    cameraRequestResolvers.push({ resolve, reject });
    processCameraQueue();
  });
}

async function processCameraQueue() {
  if (cameraRequestInProgress || cameraRequestQueue.length === 0) {
    return;
  }

  cameraRequestInProgress = true;
  const task = cameraRequestQueue.shift();
  const handlers = cameraRequestResolvers.shift();

  if (task && handlers) {
    try {
      const stream = await task();
      handlers.resolve(stream);
    } catch (error) {
      console.error('requestCameraAccess error', error);
      let errorMsg = 'Unknown camera error occurred.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMsg = 'No camera found on this device.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMsg = 'Camera is already in use by another application.';
        } else {
          errorMsg = `Camera error: ${error.message}`;
        }
      }
      
      handlers.reject(new Error(errorMsg));
    }
  }

  cameraRequestInProgress = false;

  // Process next item in queue
  if (cameraRequestQueue.length > 0) {
    processCameraQueue();
  }
}

/**
 * Capture a photo from the video stream
 */
export function capturePhoto(stream: MediaStream, quality: number = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create a video element to capture the frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      const onReady = async () => {
        try {
          // Ensure the video has current frame data
          await video.play().catch(() => {});
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create image blob'));
              }
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      // Prefer ready state event but fallback to loadedmetadata
      if (video.readyState >= 2) {
        onReady();
      } else {
        video.onloadedmetadata = onReady;
        // Add a timeout to avoid hanging
        setTimeout(() => {
          if (video.readyState < 2) onReady();
        }, 500);
      }

      video.onerror = () => {
        reject(new Error('Failed to load video stream'));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Start video recording
 */
export async function startVideoRecording(
  stream: MediaStream,
  options: VideoRecordingOptions = {}
): Promise<MediaRecorder> {
  try {
    // Determine the best mime type supported
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];

    let mimeType = options.mimeType;
    if (!mimeType) {
      mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || 'video/webm';
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps
    });

    return mediaRecorder;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to start video recording: ${error.message}`);
    }
    throw new Error('Failed to start video recording');
  }
}

/**
 * Stop video recording and return the blob
 */
export function stopVideoRecording(recorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    };

    recorder.onerror = (event) => {
      reject(new Error(`Recording error: ${(event as any).error?.message || 'Unknown error'}`));
    };

    if (recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      // Already stopped, create blob immediately
      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
      resolve(blob);
    }
  });
}

/**
 * Request microphone access and start audio recording
 */
export async function startAudioRecording(
  options: AudioRecordingOptions = {}
): Promise<MediaRecorder> {
  try {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: options.echoCancellation ?? true,
        noiseSuppression: options.noiseSuppression ?? true,
        autoGainControl: true,
      },
      video: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Try audio/webm without codec specification - let the browser choose
    // Android WebView's MediaRecorder has issues with opus codec
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];

    let mimeType = options.mimeType;
    if (!mimeType) {
      mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 128000, // 128 kbps for good quality
    });
    
    // Store chunks as they arrive during recording (not just at stop)
    const recordedChunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    // Store chunks array and stream on the recorder object
    (mediaRecorder as any)._recordedChunks = recordedChunks;
    (mediaRecorder as any)._stream = stream;

    return mediaRecorder;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No microphone found on this device.');
      }
      throw new Error(`Audio recording error: ${error.message}`);
    }
    throw new Error('Failed to start audio recording');
  }
}

/**
 * Stop audio recording and return the blob
 */
export function stopAudioRecording(recorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Get chunks that were collected during recording
    const chunks: Blob[] = (recorder as any)._recordedChunks || [];

    // Keep capturing any remaining chunks
    const originalHandler = recorder.ondataavailable;
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      try {
        // Stop all tracks in the stream
        const stream = (recorder as any)._stream || recorder.stream;
        if (stream) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        }

        // Create blob with proper mime type
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: mimeType });

        // Add a small delay to ensure all data is flushed
        setTimeout(() => {
          resolve(blob);
        }, 100);
      } catch (error) {
        console.error('[stopAudioRecording] Error in onstop:', error);
        reject(error);
      }
    };

    recorder.onerror = (event) => {
      console.error('[stopAudioRecording] Recorder error:', event);
      reject(new Error(`Recording error: ${(event as any).error?.message || 'Unknown error'}`));
    };

    if (recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      // Already stopped, create blob immediately
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      resolve(blob);
    }
  });
}

/**
 * Generate a thumbnail from a video blob
 */
export function generateThumbnail(videoBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;

      video.onloadedmetadata = () => {
        // Seek to 1 second or 10% of duration, whichever is smaller
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          URL.revokeObjectURL(video.src);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      video.onerror = () => {
        reject(new Error('Failed to load video for thumbnail'));
      };

      video.src = URL.createObjectURL(videoBlob);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Compress an image blob
 */
export function compressImage(blob: Blob, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        try {
          // Calculate new dimensions (max 1920x1080)
          let width = img.width;
          let height = img.height;
          const maxWidth = 1920;
          const maxHeight = 1080;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (compressedBlob) => {
              URL.revokeObjectURL(url);
              if (compressedBlob) {
                resolve(compressedBlob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for compression'));
      };

      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Stop all tracks in a MediaStream
 */
export function stopMediaStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
  if (stream === activeCameraStream) activeCameraStream = null;
}

/**
 * Convert a Blob to a data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('File reader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Get available camera devices
 */
export async function getCameraDevices(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput');
  } catch (error) {
    console.error('Failed to enumerate camera devices:', error);
    return [];
  }
}

/**
 * Check if the browser supports media capture
 */
export function checkMediaSupport() {
  return {
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    videoRecording: typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm'),
    audioRecording: typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm'),
  };
}

/**
 * Save a photo blob to filesystem and return the file path
 */
export async function savePhotoToFile(blob: Blob): Promise<string> {
  return await saveMediaFile(blob, 'photo');
}

/**
 * Save a video blob to filesystem and return the file path
 */
export async function saveVideoToFile(blob: Blob): Promise<string> {
  return await saveMediaFile(blob, 'video');
}

/**
 * Save an audio blob to filesystem and return the file path
 */
export async function saveAudioToFile(blob: Blob): Promise<string> {
  return await saveMediaFile(blob, 'audio');
}

/**
 * Save a drawing blob to filesystem and return the file path
 */
export async function saveDrawingToFile(blob: Blob): Promise<string> {
  return await saveMediaFile(blob, 'drawing');
}
