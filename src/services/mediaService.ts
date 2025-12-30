/**
 * Media Service
 * Handles camera, video, and audio capture for the app
 */

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
 */
export async function requestCameraAccess(options: CameraOptions = {}): Promise<MediaStream> {
  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: options.facingMode || 'user',
        width: options.width || { ideal: 1920 },
        height: options.height || { ideal: 1080 },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No camera found on this device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('Camera is already in use by another application.');
      }
      throw new Error(`Camera error: ${error.message}`);
    }
    throw new Error('Unknown camera error occurred.');
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

      video.onloadedmetadata = () => {
        // Wait for video to be ready
        setTimeout(() => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            // Draw the current video frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to blob
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
        }, 100);
      };

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

    // Determine the best mime type supported
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    let mimeType = options.mimeType;
    if (!mimeType) {
      mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 128000, // 128 kbps
    });

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
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      try {
        // Stop all tracks in the stream
        const stream = recorder.stream;
        stream.getTracks().forEach((track) => track.stop());

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
