/**
 * Getting an audio attachment out of the app and onto the device.
 *
 * One copy of what App.tsx and Archive.tsx each used to carry (phase 3C.4),
 * with in-app notices instead of alert().
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { readMediaFile } from './fileStorageService';
import { notify } from './noticeService';

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Save an attachment's audio where the person can find it: Documents on Android, a download elsewhere. */
export async function saveAudioToDownloads(audioUrl: string): Promise<void> {
  try {
    if (audioUrl.startsWith('file://')) {
      if (Capacitor.getPlatform() === 'android') {
        try {
          // Keep the leading slash: Capacitor needs the full path
          const originalPath = audioUrl.replace('file://', '');
          const fileData = await Filesystem.readFile({ path: originalPath });
          const dataSize = typeof fileData.data === 'string' ? fileData.data.length : fileData.data.size;
          if (!fileData.data || dataSize === 0) {
            notify('That audio file is empty or could not be read.', 'error');
            return;
          }
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          const publicFileName = `Reflexia_Audio_${timestamp}.webm`;
          // Documents, because Downloads is not always accessible
          await Filesystem.writeFile({ path: publicFileName, data: fileData.data, directory: Directory.Documents });
          const verification = await Filesystem.readFile({ path: publicFileName, directory: Directory.Documents });
          const verifySize = typeof verification.data === 'string' ? verification.data.length : verification.data.size;
          notify(
            `Saved to Documents as ${publicFileName} (${Math.round(verifySize / 1024)} KB). Open it from your Files app; VLC or Chrome will play it.`,
            'success',
            12000,
          );
        } catch (err) {
          console.error('Error saving file:', err);
          notify(`Could not save the audio: ${err instanceof Error ? err.message : 'unknown error'}`, 'error');
        }
      } else {
        window.open(audioUrl, '_system');
      }
    } else if (audioUrl.startsWith('idb://')) {
      // Resolve the IndexedDB URL to a blob, then download it
      try {
        const resolvedUrl = await readMediaFile(audioUrl);
        const response = await fetch(resolvedUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        triggerDownload(blobUrl, `audio_${Date.now()}.${blob.type.split('/')[1] || 'webm'}`);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error('Error reading audio from IndexedDB:', err);
        notify('Could not read that audio file. It may have been deleted.', 'error');
      }
    } else if (audioUrl.startsWith('blob:')) {
      notify('This recording has not been saved yet. Use "Save to Device" on the capture screen first.', 'error');
    } else if (audioUrl.startsWith('data:')) {
      triggerDownload(audioUrl, `audio_${Date.now()}.webm`);
    } else {
      notify('Could not download that audio: unsupported format.', 'error');
    }
  } catch (error) {
    console.error('Error saving audio file:', error);
    notify('Could not save the audio file. Please try again.', 'error');
  }
}
