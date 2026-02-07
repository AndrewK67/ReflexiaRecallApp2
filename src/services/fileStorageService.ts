/**
 * File Storage Service
 * Handles persistent storage of media files using Capacitor Filesystem
 * Falls back to IndexedDB for web platform
 */

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'reflexia-media';
const DB_VERSION = 1;
const STORE_NAME = 'media-files';

/**
 * Initialize IndexedDB for web platform
 */
function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Check if running on native platform
 */
function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Generate a unique filename for media
 */
function generateFilename(type: 'photo' | 'video' | 'audio' | 'drawing'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extensions: Record<string, string> = {
    photo: 'jpg',
    video: 'webm',
    audio: 'webm',
    drawing: 'png',
  };
  return `${type}_${timestamp}_${random}.${extensions[type]}`;
}

/**
 * Convert base64 to blob
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = atob(parts[1]);
  const array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return new Blob([array], { type: contentType });
}

/**
 * Save a media file and return its storage path/ID
 */
export async function saveMediaFile(
  blob: Blob,
  type: 'photo' | 'video' | 'audio' | 'drawing'
): Promise<string> {
  // Derive extension from blob MIME type when possible (ensures correct playable type)
  const mime = blob.type || '';
  const baseMime = mime.split(';')[0];
  let ext = '';
  if (baseMime) {
    ext = baseMime.split('/')[1] || '';
  }

  const defaultExt: Record<string, string> = {
    photo: 'jpg',
    video: 'webm',
    audio: 'webm',
    drawing: 'png',
  };

  if (!ext) ext = defaultExt[type];

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `${type}_${timestamp}_${random}.${ext}`;

  if (isNative()) {
    // Use Capacitor Filesystem on native platforms
    try {
      // Convert blob to base64
      const base64Data = await blobToBase64(blob);
      
      if (base64Data.length === 0 || base64Data === 'data:') {
        console.error('[saveMediaFile] ERROR: Base64 conversion resulted in empty data!');
        throw new Error('Failed to convert blob to base64 - empty result');
      }

      // Save to filesystem
      const result = await Filesystem.writeFile({
        path: `media/${filename}`,
        data: base64Data,
        directory: Directory.Data,
        recursive: true,
      });

      // Verify the file was written
      const verifyRead = await Filesystem.readFile({
        path: `media/${filename}`,
        directory: Directory.Data,
      });
      const verifySize = typeof verifyRead.data === 'string' ? verifyRead.data.length : verifyRead.data.size;
      
      if (verifySize === 0) {
        console.error('[saveMediaFile] ERROR: Verification failed - file is empty!');
      }

      // Return the file URI
      return result.uri;
    } catch (error) {
      console.error('Failed to save file to filesystem:', error);
      throw new Error(`Failed to save ${type} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // Use IndexedDB on web
    try {
      const db = await initIndexedDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(blob, filename);

        request.onsuccess = () => {
          resolve(`idb://${filename}`);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to save file to IndexedDB:', error);
      throw new Error(`Failed to save ${type} file to IndexedDB`);
    }
  }
}

/**
 * Convert blob to base64 (for Capacitor Filesystem)
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Read a media file and return it as a data URL or blob URL
 */
export async function readMediaFile(path: string): Promise<string> {
  // Handle old base64 data URLs (backwards compatibility)
  if (path.startsWith('data:')) {
    return path;
  }

  // Handle IndexedDB paths
  if (path.startsWith('idb://')) {
    const filename = path.replace('idb://', '');
    try {
      const db = await initIndexedDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(filename);

        request.onsuccess = () => {
          const blob = request.result as Blob;
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error('File not found in IndexedDB'));
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to read file from IndexedDB:', error);
      throw new Error('Failed to read file from IndexedDB');
    }
  }

  // Handle Capacitor Filesystem paths
  if (isNative()) {
    // For audio files on Android, convert file:// URI to web-accessible format
    // Use Capacitor's convertFileSrc to make file accessible to WebView
    if (path.includes('/audio_')) {
      const webPath = Capacitor.convertFileSrc(path);
      return webPath;
    }
    
    try {
      const result = await Filesystem.readFile({
        path: path.replace('file://', ''),
      });

      // Determine a sensible MIME type from the filename prefix/extension
      const filename = path.replace('file://', '').split('/').pop() || '';
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      let mimeType = 'application/octet-stream';

      // Check filename prefix first for accurate type detection
      if (filename.startsWith('photo_')) {
        if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'png') mimeType = 'image/png';
      } else if (filename.startsWith('audio_')) {
        if (ext === 'mp4' || ext === 'm4a') mimeType = 'audio/mp4';
        else if (ext === 'webm') mimeType = 'audio/webm';
        else if (ext === 'ogg') mimeType = 'audio/ogg';
      } else if (filename.startsWith('video_')) {
        if (ext === 'mp4') mimeType = 'video/mp4';
        else if (ext === 'webm') mimeType = 'video/webm';
      } else {
        // Fallback: infer from extension only
        if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'mp4') mimeType = 'video/mp4';
        else if (ext === 'webm') mimeType = 'video/webm';
      }

      // Convert to data URL with correct MIME
      return `data:${mimeType};base64,${result.data}`;
    } catch (error) {
      console.error('Failed to read file from filesystem:', error);
      throw new Error('Failed to read file from filesystem');
    }
  }

  // Fallback: return the path as-is (might be a blob URL)
  return path;
}

/**
 * Delete a media file
 */
export async function deleteMediaFile(path: string): Promise<void> {
  // Skip deletion for old base64 data URLs
  if (path.startsWith('data:')) {
    return;
  }

  // Handle IndexedDB paths
  if (path.startsWith('idb://')) {
    const filename = path.replace('idb://', '');
    try {
      const db = await initIndexedDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(filename);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to delete file from IndexedDB:', error);
    }
    return;
  }

  // Handle Capacitor Filesystem paths
  if (isNative()) {
    try {
      await Filesystem.deleteFile({
        path: path.replace('file://', ''),
      });
    } catch (error) {
      console.error('Failed to delete file from filesystem:', error);
    }
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  fileCount: number;
  platform: 'native' | 'web';
}> {
  const platform = isNative() ? 'native' : 'web';

  if (isNative()) {
    try {
      const result = await Filesystem.readdir({
        path: 'media',
        directory: Directory.Data,
      });
      return {
        fileCount: result.files.length,
        platform,
      };
    } catch (error) {
      // Directory might not exist yet
      return { fileCount: 0, platform };
    }
  } else {
    try {
      const db = await initIndexedDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();

        request.onsuccess = () => {
          resolve({ fileCount: request.result, platform });
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      return { fileCount: 0, platform };
    }
  }
}

/**
 * Migrate a base64 data URL to filesystem storage
 */
export async function migrateBase64ToFile(
  dataUrl: string,
  type: 'photo' | 'video' | 'audio' | 'drawing'
): Promise<string> {
  // Skip if already a file path
  if (!dataUrl.startsWith('data:')) {
    return dataUrl;
  }

  try {
    const blob = base64ToBlob(dataUrl);
    const filePath = await saveMediaFile(blob, type);
    return filePath;
  } catch (error) {
    console.error('Failed to migrate base64 to file:', error);
    // Return original on error to maintain backwards compatibility
    return dataUrl;
  }
}

/**
 * Clear all media files (use with caution!)
 */
export async function clearAllMediaFiles(): Promise<void> {
  if (isNative()) {
    try {
      const result = await Filesystem.readdir({
        path: 'media',
        directory: Directory.Data,
      });

      for (const file of result.files) {
        await Filesystem.deleteFile({
          path: `media/${file.name}`,
          directory: Directory.Data,
        });
      }
    } catch (error) {
      console.error('Failed to clear media files:', error);
    }
  } else {
    try {
      const db = await initIndexedDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }
  }
}
