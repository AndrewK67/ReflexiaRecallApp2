import { useMemo } from 'react';
import { Check, Compass } from 'lucide-react';
import type { Entry } from '../types';
import { TRACKS, triedTracks, loadFlags } from '../services/learningService';

/** The heading "Show me around" moves focus to. */
export const TRIED_HEADING_ID = 'what-youve-tried';

interface Props {
  entries: Entry[];
  privacyLockEnabled: boolean;
}

/**
 * Profile → "What you've tried" (phase 3D.3). A checklist of what the app
 * can do, each ticked the first time it is really done
 * (services/learningService.ts). No numbers, no levels, no rewards; the
 * untried ones say where to find them, which is the whole tour.
 */
export default function WhatYouveTried({ entries, privacyLockEnabled }: Props) {
  const tried = useMemo(() => triedTracks(entries, { privacyLockEnabled }, loadFlags()), [entries, privacyLockEnabled]);

  return (
    <section aria-labelledby={TRIED_HEADING_ID} className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
      <h2 id={TRIED_HEADING_ID} tabIndex={-1} className="text-lg font-bold mb-1 flex items-center gap-2 outline-none">
        <Compass size={18} className="text-cyan-300" aria-hidden="true" /> What you've tried
      </h2>
      <p className="text-white/60 text-sm mb-4">
        The things Reflexia can do. Each is ticked the first time you do it for real.
      </p>

      <ul className="space-y-3">
        {TRACKS.map((track) => {
          const done = tried.has(track.id);
          return (
            <li key={track.id} className="flex items-start gap-3" data-track={track.id} data-done={done}>
              <span
                aria-hidden="true"
                className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center border ${
                  done ? 'bg-emerald-500/30 border-emerald-400/60 text-emerald-200' : 'border-white/30'
                }`}
              >
                {done && <Check size={12} />}
              </span>
              <div>
                <p className={`text-sm ${done ? 'text-white' : 'text-white/80'}`}>
                  <span className="sr-only">{done ? 'Done: ' : 'Not yet: '}</span>
                  {track.label}
                </p>
                {!done && <p className="text-xs text-white/60 mt-0.5">{track.how}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
