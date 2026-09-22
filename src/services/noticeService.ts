/**
 * In-app notices and confirmations (phase 3C.4).
 *
 * Replaces the browser's alert() and confirm(): those block the whole page,
 * cannot be styled or read reliably by assistive tech on a PWA, and on iOS
 * they interrupt the service worker's update prompt. Components use the
 * useNotices() hook; plain functions (the audio-export helpers in App.tsx and
 * Archive.tsx) call notify() / confirmAction() from here, which forward to
 * the mounted <Notices> provider. Before the provider mounts, or in tests
 * without one, a notice is logged and a confirmation resolves false, so a
 * destructive action never proceeds without a person's answer.
 */

export type NoticeKind = 'info' | 'success' | 'error';

export interface Notice {
  id: number;
  kind: NoticeKind;
  message: string;
  /** Milliseconds before it goes away on its own; errors stay until dismissed. */
  ttl: number | null;
}

export interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive and focuses Cancel first. */
  destructive?: boolean;
}

interface Sink {
  notify: (kind: NoticeKind, message: string, ttl: number | null) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

let sink: Sink | null = null;

/** Called by the <Notices> provider on mount; returns the unbind. */
export function bindNoticeSink(next: Sink): () => void {
  sink = next;
  return () => {
    if (sink === next) sink = null;
  };
}

export function notify(message: string, kind: NoticeKind = 'info', ttl?: number | null): void {
  const life = ttl === undefined ? (kind === 'error' ? null : 5000) : ttl;
  if (sink) sink.notify(kind, message, life);
  else console[kind === 'error' ? 'error' : 'log'](`[notice:${kind}] ${message}`);
}

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (sink) return sink.confirm(options);
  console.warn(`[confirm] no provider mounted; "${options.title}" answered No`);
  return Promise.resolve(false);
}
