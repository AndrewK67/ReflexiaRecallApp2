/**
 * Dashboard: four doors (phase 3B.2).
 *
 * Capture, Reflect, Spaces, Archive — each with one line saying what it is
 * for, because a first-time user has no reason to know. Spaces were behind
 * an optional pack called "Scenario Practice"; they are the differentiator
 * (CLAUDE.md, decision 3) and live here now. Instead of an entry count the
 * dashboard says when you last wrote (decision 4: nothing rewards volume).
 *
 * Phase 3D adds at most one quiet suggestion under the doors, for something
 * obvious not yet tried (services/learningService.ts pickNudge: none before
 * three entries, one at a time, put away with ×).
 */

import { PenLine, Compass, Archive as ArchiveIcon, ChevronRight, X } from 'lucide-react';
import { isPackEnabled } from '../packs';
import { lastWrittenLabel } from '../utils/lastWritten';
import type { Nudge } from '../services/learningService';

interface SimplifiedDashboardProps {
  userName: string;
  dailyPrompt: string;
  onNavigate: (view: string) => void;
  onShowPackSettings?: () => void;
  /** ISO date of the newest entry; undefined before the first one. */
  lastEntryDate?: string;
  /** The one suggestion, if any (learningService.pickNudge). */
  nudge?: Nudge | null;
  onDismissNudge?: () => void;
}

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const DOORS = [
  {
    view: 'REFLECTION',
    name: 'Reflect',
    hint: 'Three short questions to make sense of something',
    icon: PenLine,
    tint: 'text-indigo-300 bg-indigo-500/15 border-indigo-400/30',
  },
  {
    view: 'HOLODECK', // the view id is internal; people see "Spaces"
    name: 'Spaces',
    hint: 'For a hard conversation, a decision, a loss',
    icon: Compass,
    tint: 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-400/30',
  },
  {
    view: 'ARCHIVE',
    name: 'Archive',
    hint: 'Everything you have written, searchable',
    icon: ArchiveIcon,
    tint: 'text-cyan-300 bg-cyan-500/15 border-cyan-400/30',
  },
] as const;

export default function SimplifiedDashboard({
  userName,
  dailyPrompt,
  onNavigate,
  onShowPackSettings,
  lastEntryDate,
  nudge,
  onDismissNudge,
}: SimplifiedDashboardProps) {
  const firstName = userName.trim().split(' ')[0];
  const lastWritten = lastWrittenLabel(lastEntryDate);

  const hasWellbeing = isPackEnabled('wellbeing');
  const hasAI = isPackEnabled('aiReflectionCoach');
  const hasReports = isPackEnabled('reports');
  const hasAnyPacks = hasWellbeing || hasAI || hasReports;

  return (
    <div className="h-full overflow-y-auto flex flex-col items-center p-4 pt-6 nav-safe relative">
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      {/* Greeting */}
      <div className="text-center mb-5 max-w-xs mx-auto relative z-10">
        <h1 className="text-xl font-light text-white tracking-tight mb-1">
          {firstName ? `${greeting()}, ${firstName}.` : `${greeting()}.`}
        </h1>
        {dailyPrompt && <p className="text-white/80 font-medium text-sm leading-relaxed mt-2">"{dailyPrompt}"</p>}
        <p className="mt-3 text-xs text-white/60">
          {lastWritten ?? 'Try capturing one thing. It can be a sentence.'}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-2.5 relative z-10">
        {/* The first door: Capture */}
        <button
          onClick={() => onNavigate('QUICK_CAPTURE')}
          className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white h-14 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:from-cyan-500 hover:to-indigo-500 active:scale-95 transition-all"
        >
          📸 Capture
        </button>

        {/* The other three, each saying what it is for */}
        <ul className="space-y-2">
          {DOORS.map((d) => {
            const Icon = d.icon;
            const hintId = `door-hint-${d.name.toLowerCase()}`;
            return (
              <li key={d.view}>
                <button
                  onClick={() => onNavigate(d.view)}
                  aria-label={d.name}
                  aria-describedby={hintId}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 active:scale-[0.98] transition"
                >
                  <span className={`w-10 h-10 flex-shrink-0 rounded-xl border flex items-center justify-center ${d.tint}`}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-white">{d.name}</span>
                    <span id={hintId} className="block text-xs text-white/70 leading-snug">
                      {d.hint}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-white/50 flex-shrink-0" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>

        {/* At most one suggestion (phase 3D.3) */}
        {nudge && (
          <div
            role="note"
            aria-label="Suggestion"
            data-nudge={nudge.id}
            className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl p-3 mt-3"
          >
            <p className="flex-1 text-xs text-white/80 leading-snug">
              {nudge.text}{' '}
              <button
                onClick={() => onNavigate(nudge.action.view)}
                className="font-semibold text-cyan-200 underline underline-offset-2 hover:text-white"
              >
                {nudge.action.label}
              </button>
            </p>
            <button
              onClick={() => onDismissNudge?.()}
              aria-label="Hide this suggestion"
              className="p-1 -m-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Optional packs the person switched on */}
        {hasAnyPacks && (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-2.5 mt-3">
            <div className="text-xs font-bold text-white/60 mb-1.5">ENABLED PACKS</div>
            <div className="grid grid-cols-2 gap-1.5">
              {hasWellbeing && (
                <>
                  <button
                    onClick={() => onNavigate('BIO_RHYTHM')}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 transition flex items-center gap-2"
                  >
                    <span className="text-base" aria-hidden="true">🫁</span>
                    <span className="text-xs font-semibold text-white/90">BioRhythm</span>
                  </button>
                  <button
                    onClick={() => onNavigate('GROUNDING')}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 transition flex items-center gap-2"
                  >
                    <span className="text-base" aria-hidden="true">🌊</span>
                    <span className="text-xs font-semibold text-white/90">Grounding</span>
                  </button>
                </>
              )}
              {hasAI && (
                <button
                  onClick={() => onNavigate('ORACLE')}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 transition flex items-center gap-2"
                >
                  <span className="text-base" aria-hidden="true">💬</span>
                  <span className="text-xs font-semibold text-white/90">Oracle</span>
                </button>
              )}
              {hasReports && (
                <button
                  onClick={() => onNavigate('REPORTS')}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 transition flex items-center gap-2"
                >
                  <span className="text-base" aria-hidden="true">📊</span>
                  <span className="text-xs font-semibold text-white/90">Reports</span>
                </button>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => onShowPackSettings?.()}
          className="w-full mt-2 text-white/70 hover:text-white text-xs font-medium py-2 transition"
        >
          ✨ Explore Optional Packs
        </button>
      </div>

      <div className="mt-3 max-w-xs text-center text-white/60 text-xs relative z-10 leading-snug">
        <p>Everything is stored on this device.</p>
        <p className="mt-0.5">Make a backup from Profile now and then.</p>
      </div>
    </div>
  );
}
