/**
 * The one place notices and confirmations render (phase 3C.4). Mounted once
 * in App.tsx. Toasts live in a polite live region so a screen reader hears
 * them; errors are assertive and stay until dismissed. The confirm dialog is
 * modal, traps Tab, closes on Escape, and returns focus to the control that
 * opened it.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import {
  bindNoticeSink,
  notify as notifyService,
  confirmAction as confirmService,
  type Notice,
  type NoticeKind,
  type ConfirmOptions,
} from '../services/noticeService';

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (ok: boolean) => void;
}

let nextId = 1;

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setNotices((list) => list.filter((n) => n.id !== id));
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
  }, []);

  useEffect(() => {
    const unbind = bindNoticeSink({
      notify: (kind: NoticeKind, message: string, ttl: number | null) => {
        const id = nextId++;
        setNotices((list) => [...list.slice(-3), { id, kind, message, ttl }]);
        if (ttl) timers.current.set(id, setTimeout(() => dismiss(id), ttl));
      },
      confirm: (options: ConfirmOptions) =>
        new Promise<boolean>((resolve) => {
          openerRef.current = document.activeElement as HTMLElement | null;
          setPending({ options, resolve });
        }),
    });
    return unbind;
  }, [dismiss]);

  const settle = (ok: boolean) => {
    const p = pending;
    setPending(null);
    p?.resolve(ok);
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && document.contains(opener)) opener.focus();
  };

  return (
    <>
      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[95] flex flex-col items-center gap-2 px-4">
        <div aria-live="polite" className="sr-only">
          {notices.filter((n) => n.kind !== 'error').map((n) => n.message).join('. ')}
        </div>
        {notices.map((n) => (
          <div
            key={n.id}
            role={n.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-xl flex items-start gap-3 ${
              n.kind === 'error'
                ? 'bg-rose-950/90 border-rose-400/40 text-rose-50'
                : n.kind === 'success'
                  ? 'bg-emerald-950/90 border-emerald-400/40 text-emerald-50'
                  : 'bg-slate-900/95 border-white/15 text-white'
            }`}
          >
            {n.kind === 'error' ? (
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-rose-300" />
            ) : n.kind === 'success' ? (
              <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-emerald-300" />
            ) : (
              <Info size={18} className="flex-shrink-0 mt-0.5 text-cyan-300" />
            )}
            <div className="flex-1 leading-snug">{n.message}</div>
            <button
              onClick={() => dismiss(n.id)}
              aria-label="Dismiss"
              className="flex-shrink-0 rounded-lg p-1 text-white/70 hover:text-white hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {pending && <ConfirmDialog options={pending.options} onSettle={settle} />}
    </>
  );
}

function ConfirmDialog({ options, onSettle }: { options: ConfirmOptions; onSettle: (ok: boolean) => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    (options.destructive ? cancelRef : confirmRef).current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSettle(false);
      }
      if (e.key === 'Tab' && boxRef.current) {
        // keep Tab inside the dialog
        const focusables = boxRef.current.querySelectorAll<HTMLElement>('button');
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
  }, [options.destructive, onSettle]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={options.body ? 'confirm-body' : undefined}
        className="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900 p-6 text-white shadow-2xl"
      >
        <h2 id="confirm-title" className="text-lg font-bold">
          {options.title}
        </h2>
        {options.body && (
          <p id="confirm-body" className="mt-2 text-sm text-white/80 leading-relaxed">
            {options.body}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <button
            ref={cancelRef}
            onClick={() => onSettle(false)}
            className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15"
          >
            {options.cancelLabel ?? 'Cancel'}
          </button>
          <button
            ref={confirmRef}
            onClick={() => onSettle(true)}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white ${
              options.destructive ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {options.confirmLabel ?? 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Components call these; plain functions import them from the service. */
export function useNotices() {
  return { notify: notifyService, confirm: confirmService };
}
