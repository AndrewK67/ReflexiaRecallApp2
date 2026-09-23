/**
 * Reading an entry back (phase 3B.4).
 *
 * Replaces the modal that lived inline in App.tsx, and the unused
 * EntryDetailModal.tsx. What changed for a person:
 *  - a reflection's own attachments (sketches, voice notes from the
 *    composer) are shown; before, only a capture's media was, and anything
 *    stored as idb:// (all audio, every composer sketch) was never resolved
 *    to something a browser can display;
 *  - audio plays in place, with "Save a copy" beside it;
 *  - answers are headed by their question, the mood reads as a word, and a
 *    space wears its colour;
 *  - Delete, behind a confirmation that says a backup file keeps its copy.
 * Keyboard: Close has focus on open, Tab stays inside, Escape closes (unless
 * the delete confirmation is open, which takes Escape itself).
 */

import { useEffect, useRef, useState } from 'react';
import { Trash2, X, Download } from 'lucide-react';
import type { Entry, MediaItem } from '../types';
import { isCapture } from '../utils/entryKind';
import { getFramework } from '../frameworks';
import { readMediaFile, deleteMediaFile } from '../services/fileStorageService';
import { saveAudioToDownloads } from '../services/audioExport';
import { confirmAction, notify } from '../services/noticeService';

interface EntryModalProps {
  entry: Entry;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const MOOD_WORDS: Record<number, string> = { 1: 'Rough 😣', 2: 'Down 😕', 3: 'Okay 😐', 4: 'Good 🙂', 5: 'Great 😁' };

type StoredMedia = MediaItem & { url: string };

function mediaOf(entry: Entry): StoredMedia[] {
  const own = isCapture(entry) ? entry.media ?? [] : [];
  const attached = entry.attachments ?? [];
  return [...own, ...attached].filter((m): m is StoredMedia => !!m && typeof m.url === 'string' && m.url.length > 0);
}

/** Turn a stored media reference (data:, idb://, file://) into something the browser can show. */
function useResolvedUrl(url: string): string | null {
  const [resolved, setResolved] = useState<string | null>(url.startsWith('data:') ? url : null);
  useEffect(() => {
    if (url.startsWith('data:')) return;
    let revoked: string | null = null;
    let cancelled = false;
    readMediaFile(url)
      .then((u) => {
        if (cancelled) return;
        if (u.startsWith('blob:')) revoked = u;
        setResolved(u);
      })
      .catch(() => !cancelled && setResolved(null));
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [url]);
  return resolved;
}

function MediaView({ item }: { item: StoredMedia }) {
  const src = useResolvedUrl(item.url);
  const type = String(item.type).toUpperCase();
  const missing = (
    <p className="p-4 text-sm text-white/70">This {type === 'AUDIO' ? 'recording' : 'file'} could not be found on this device.</p>
  );

  if (type === 'PHOTO' || type === 'SKETCH' || type === 'DRAWING') {
    return src ? (
      <img src={src} alt={type === 'PHOTO' ? 'Photo' : 'Sketch'} className="w-full h-auto max-h-96 object-contain bg-black/20" />
    ) : (
      missing
    );
  }
  if (type === 'VIDEO') {
    return src ? <video src={src} controls playsInline preload="metadata" className="w-full h-auto max-h-96 bg-black" /> : missing;
  }
  if (type === 'AUDIO') {
    return (
      <div className="p-4 flex flex-col gap-3">
        {src ? <audio src={src} controls preload="metadata" className="w-full" aria-label={item.name || 'Voice note'} /> : missing}
        <button
          onClick={() => saveAudioToDownloads(item.url)}
          className="self-start px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-semibold flex items-center gap-2"
        >
          <Download size={16} aria-hidden="true" /> Save a copy
        </button>
      </div>
    );
  }
  return null;
}

export default function EntryModal({ entry, onClose, onDelete }: EntryModalProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const capture = isCapture(entry);
  const answers = !capture ? entry.answers ?? {} : {};
  const framework = !capture ? getFramework(entry.model ?? entry.modelId, Object.keys(answers)) : null;
  const accent = framework?.space?.color;
  const media = mediaOf(entry);
  const title = capture ? 'Capture' : `Reflection • ${framework!.name}`;
  const date = new Date(entry.date);
  const when = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Answers in the framework's own order, then any keys it does not know.
  const order = framework ? framework.stages.map((s) => s.id) : [];
  const keys = [...order.filter((k) => k in answers), ...Object.keys(answers).filter((k) => !order.includes(k))].filter(
    (k) => (answers[k] ?? '').trim(),
  );
  const labelFor = (k: string) => framework?.stages.find((s) => s.id === k)?.label ?? k;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.getElementById('confirm-title')) return; // the delete confirmation handles its own keys
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && boxRef.current) {
        const focusables = Array.from(
          boxRef.current.querySelectorAll<HTMLElement>('button, audio[controls], video[controls], [href], [tabindex]:not([tabindex="-1"])'),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleDelete = async () => {
    const ok = await confirmAction({
      title: 'Delete this entry?',
      body: 'It is removed from this device, with its photos and recordings. A backup file you have already saved keeps its own copy.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    onDelete(entry.id);
    // Stored media goes too; inline data: URLs went with the entry itself.
    for (const m of media) {
      if (!m.url.startsWith('data:')) deleteMediaFile(m.url).catch(() => {});
    }
    onClose();
    notify('Entry deleted.', 'success');
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
        className="w-full max-w-md bg-slate-900 text-white rounded-t-3xl sm:rounded-3xl border border-white/15 shadow-2xl max-h-[90vh] flex flex-col"
        style={accent ? { borderTop: `4px solid ${accent}` } : undefined}
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div className="min-w-0">
            <p className="text-xs text-white/70">{when}</p>
            <h2 id="entry-modal-title" className="text-lg font-bold" style={accent ? { color: accent } : undefined}>
              {title}
            </h2>
          </div>
          <button
            autoFocus
            onClick={onClose}
            aria-label="Close entry details"
            className="flex-shrink-0 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold flex items-center gap-1.5"
          >
            <X size={16} aria-hidden="true" /> Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-5 space-y-4">
          {capture && (
            <p className="whitespace-pre-line text-base leading-relaxed text-white/90">{entry.notes?.trim() || '(No notes)'}</p>
          )}

          {!capture && keys.length === 0 && <p className="text-sm text-white/70">(Nothing written)</p>}
          {!capture &&
            keys.map((k) => (
              <section key={k}>
                <h3 className="text-sm font-bold text-white/80 mb-1">{labelFor(k)}</h3>
                <p className="whitespace-pre-line text-base leading-relaxed text-white/90">{answers[k]}</p>
              </section>
            ))}

          {!capture && typeof entry.mood === 'number' && MOOD_WORDS[entry.mood] && (
            <p className="text-sm text-white/80">
              <span className="font-bold text-white/80">Mood:</span> {MOOD_WORDS[entry.mood]}
            </p>
          )}

          {!capture && entry.aiInsight && (
            <section className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-4">
              <h3 className="text-sm font-bold text-indigo-200 mb-1">Insight</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">{entry.aiInsight}</p>
            </section>
          )}

          {capture && entry.guardianBadge && (
            <section className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
              <h3 className="text-sm font-bold text-rose-100 mb-1">{entry.guardianBadge.summary || 'Support'}</h3>
              {entry.guardianBadge.suggestedActions?.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 text-sm text-white/90">
                  {entry.guardianBadge.suggestedActions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {media.length > 0 && (
            <div className="space-y-3">
              {media.map((m) => (
                <div key={m.id} className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
                  <MediaView item={m} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-200 hover:bg-rose-500/15 border border-rose-400/30 flex items-center gap-2"
          >
            <Trash2 size={16} aria-hidden="true" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
