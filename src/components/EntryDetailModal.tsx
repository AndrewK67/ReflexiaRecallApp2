import { X, Printer, Star, StarOff } from "lucide-react";
import type { Entry, ReflectionEntry, IncidentEntry } from "../types";

interface EntryDetailModalProps {
  entry: Entry | null;
  onClose: () => void;
  onToggleBookmark?: (entryId: string) => void;
}

function isReflection(e: Entry): e is ReflectionEntry {
  return e.type === "REFLECTION";
}

function isIncident(e: Entry): e is IncidentEntry {
  return e.type === "INCIDENT";
}

export default function EntryDetailModal({ entry, onClose, onToggleBookmark }: EntryDetailModalProps) {
  if (!entry) return null;

  const bookmarked = (entry as any).bookmarked === true;

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      // no-op
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur p-5 text-white">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs text-slate-300/70">{entry.type}</div>
            <div className="text-lg font-extrabold">{new Date(entry.date).toLocaleString()}</div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleBookmark && (
              <button
                onClick={() => onToggleBookmark(entry.id)}
                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                title={bookmarked ? "Remove bookmark" : "Bookmark"}
              >
                {bookmarked ? <StarOff size={16} /> : <Star size={16} />}
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
              title="Print"
            >
              <Printer size={16} />
            </button>

            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {isReflection(entry) && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-300/70">Model</div>
              <div className="text-base font-bold">{entry.model}</div>
              {typeof entry.mood === "number" && (
                <div className="mt-2 text-sm text-slate-200/80">Mood: {entry.mood}/5</div>
              )}
              {Array.isArray(entry.keywords) && entry.keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.keywords.map((k) => (
                    <span key={k} className="px-2 py-1 rounded-lg text-xs bg-white/10 border border-white/10">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-300/70 mb-2">Answers</div>
              <div className="space-y-3">
                {Object.entries(entry.answers || {}).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs text-slate-300/70 mb-1">{k}</div>
                    <div className="whitespace-pre-wrap text-sm">{v || ""}</div>
                  </div>
                ))}
              </div>
            </div>

            {typeof entry.aiInsight === "string" && entry.aiInsight.trim().length > 0 && (
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                <div className="text-sm font-bold mb-2">AI Insight</div>
                <div className="whitespace-pre-wrap text-sm text-slate-100/90">{entry.aiInsight}</div>
              </div>
            )}
          </div>
        )}

        {isIncident(entry) && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-300/70 mb-2">Notes</div>
              <div className="whitespace-pre-wrap text-sm">{entry.notes || ""}</div>
            </div>

            {Array.isArray(entry.keywords) && entry.keywords.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-slate-300/70 mb-2">Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {entry.keywords.map((k) => (
                    <span key={k} className="px-2 py-1 rounded-lg text-xs bg-white/10 border border-white/10">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(entry.media) && entry.media.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-slate-300/70 mb-2">Media</div>
                <ul className="space-y-2 text-sm">
                  {entry.media.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                      <span className="truncate">{m.name || m.type}</span>
                      <span className="text-xs text-slate-300/70">{m.timestamp ? new Date(m.timestamp).toLocaleString() : 'N/A'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
