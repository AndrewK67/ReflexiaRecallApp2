import React, { useMemo, useState, useEffect } from "react";
import type { Entry, ReflectionEntry } from "../types";
import { storageService } from "../services/storageService";

interface CalendarViewProps {
  entries: Entry[];
  onOpenEntry: (entry: Entry) => void;
}

type ViewMode = "MONTH" | "YEAR" | "DAY";

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function moodToLevel(avgMood: number | null, hasIncident: boolean): number {
  // Levels: 0 none, 1..5 scale.
  if (hasIncident) return 1; // incident = critical at a glance
  if (avgMood === null) return 2; // neutral-ish when no mood data
  if (avgMood <= 1.5) return 1;
  if (avgMood <= 2.5) return 2;
  if (avgMood <= 3.5) return 3;
  if (avgMood <= 4.5) return 4;
  return 5;
}

function levelClass(level: number): string {
  switch (level) {
    case 1: return "bg-rose-500";
    case 2: return "bg-amber-400";
    case 3: return "bg-yellow-300";
    case 4: return "bg-emerald-400";
    case 5: return "bg-teal-400";
    default: return "bg-slate-200";
  }
}

function monthLabel(y: number, m: number) {
  return new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}

function shortMonthName(y: number, m: number) {
  return new Date(y, m, 1).toLocaleString(undefined, { month: "short" });
}

function buildMonthCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const startDow = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: Array<{ day: number | null; date: Date | null; key: string }> = [];
  for (let i = 0; i < startDow; i++) cells.push({ day: null, date: null, key: `pad-${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    cells.push({ day: d, date, key: `day-${d}` });
  }
  // pad to full weeks (optional, keeps grids tidy)
  while (cells.length % 7 !== 0) cells.push({ day: null, date: null, key: `tail-${cells.length}` });

  return cells;
}

export default function CalendarView({ entries, onOpenEntry }: CalendarViewProps) {
  const now = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("MONTH");
  const [cursorYear, setCursorYear] = useState(now.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(now.getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Load user profile for blur setting
  const [blurEnabled, setBlurEnabled] = useState(false);

  useEffect(() => {
    const profile = storageService.loadProfile();
    setBlurEnabled(profile.blurHistory ?? false);
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const key = toISODate(new Date(e.date));
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [entries]);

  const daySummary = useMemo(() => {
    const summary = new Map<string, { level: number; count: number }>();

    for (const [day, arr] of byDay.entries()) {
      const hasIncident = arr.some((e) => e.type === "INCIDENT");

      const moods = arr
        .filter((e) => e.type === "REFLECTION")
        .map((e) => (e as ReflectionEntry).mood)
        .filter((m): m is number => typeof m === "number");

      const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
      const level = moodToLevel(avgMood, hasIncident);

      summary.set(day, { level, count: arr.length });
    }

    return summary;
  }, [byDay]);

  // MONTH VIEW helpers
  const monthFirst = new Date(cursorYear, cursorMonth, 1);
  const startDay = monthFirst.getDay(); // 0-6
  const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate();

  const monthCells = useMemo(() => {
    const cells: Array<{ day: number | null; key: string }> = [];
    for (let i = 0; i < startDay; i++) cells.push({ day: null, key: `pad-${i}` });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `day-${d}` });
    return cells;
  }, [startDay, daysInMonth]);

  const selectedEntries = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="h-full bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col overflow-y-auto custom-scrollbar animate-in fade-in duration-300 nav-safe relative">
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      <div className="p-4 pt-12 border-b border-white/10 relative z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Calendar</h1>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (viewMode === "MONTH") {
                  const prev = new Date(cursorYear, cursorMonth - 1, 1);
                  setCursorYear(prev.getFullYear());
                  setCursorMonth(prev.getMonth());
                } else {
                  setCursorYear((y) => y - 1);
                }
              }}
              className="px-3 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/15 border border-white/15 transition"
            >
              Prev
            </button>

            <button
              onClick={() => {
                if (viewMode === "MONTH") {
                  const next = new Date(cursorYear, cursorMonth + 1, 1);
                  setCursorYear(next.getFullYear());
                  setCursorMonth(next.getMonth());
                } else {
                  setCursorYear((y) => y + 1);
                }
              }}
              className="px-3 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/15 border border-white/15 transition"
            >
              Next
            </button>
          </div>
        </div>

        <div className="text-xs text-white/60 font-semibold mt-2">
          {viewMode === "MONTH" ? monthLabel(cursorYear, cursorMonth) : String(cursorYear)}
        </div>

        <div className="mt-4 flex gap-2 justify-center bg-white/5 p-1 rounded-xl border border-white/10">
          {(["MONTH", "YEAR", "DAY"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === m ? "bg-white text-slate-900" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] text-white/60 font-bold">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4, 5].map((lvl) => (
              <div key={lvl} className={`w-3 h-3 rounded ${levelClass(lvl)}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-20 custom-scrollbar relative z-10">
        {/* MONTH */}
        {viewMode === "MONTH" && (
          <div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-center text-xs font-bold text-white/60 py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {monthCells.map((c) => {
                if (!c.day) return <div key={c.key} />;

                const dateObj = new Date(cursorYear, cursorMonth, c.day);
                const iso = toISODate(dateObj);
                const info = daySummary.get(iso);
                const level = info?.level ?? 0;

                return (
                  <button
                    key={c.key}
                    onClick={() => {
                      setSelectedDay(iso);
                      setViewMode("DAY");
                    }}
                    className="aspect-square bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-2 flex flex-col justify-between text-left hover:bg-white/15 hover:border-cyan-500/50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{c.day}</span>
                      {info && <span className={`w-2 h-2 rounded-full ${levelClass(level)}`} />}
                    </div>
                    <div className="text-[10px] text-white/60 font-semibold">{info ? `${info.count}` : ""}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* YEAR (12 months nicely split) */}
        {viewMode === "YEAR" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 12 }).map((_, monthIdx) => {
              const cells = buildMonthCells(cursorYear, monthIdx);

              return (
                <div key={monthIdx} className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/15 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-extrabold text-white">
                      {shortMonthName(cursorYear, monthIdx)}
                    </div>
                    <button
                      onClick={() => {
                        setCursorMonth(monthIdx);
                        setViewMode("MONTH");
                      }}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition"
                      title="Open month"
                    >
                      Open
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="text-[9px] font-bold text-white/60 text-center">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((c) => {
                      if (!c.date) return <div key={c.key} className="w-4 h-4" />;

                      const iso = toISODate(c.date);
                      const info = daySummary.get(iso);
                      const level = info?.level ?? 0;

                      return (
                        <button
                          key={c.key}
                          onClick={() => {
                            setSelectedDay(iso);
                            setViewMode("DAY");
                          }}
                          title={`${iso}${info ? ` (${info.count} entries)` : ""}`}
                          className={`w-4 h-4 rounded ${levelClass(level)} hover:opacity-80 transition`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DAY */}
        {viewMode === "DAY" && (
          <div>
            {!selectedDay ? (
              <div className="text-center py-10 text-white/60">Select a day from Month or Year.</div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setViewMode("MONTH")}
                    className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white hover:bg-white/15 transition"
                  >
                    Back to Month
                  </button>
                  <div className="text-xs font-bold text-white/60">{selectedDay}</div>
                </div>

                {selectedEntries.length === 0 ? (
                  <div className="p-8 text-center text-white/60">No entries on this day.</div>
                ) : (
                  <div className="space-y-3">
                    {selectedEntries.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => onOpenEntry(e)}
                        className="w-full text-left p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 hover:bg-white/15 hover:border-cyan-500/50 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold text-white ${blurEnabled ? 'blur-sm' : ''}`}>
                            {e.type === "INCIDENT" ? "Incident" : (e as any).model}
                          </span>
                          <span className="text-[10px] text-white/60 font-semibold">
                            {new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${levelClass(daySummary.get(selectedDay)?.level ?? 0)}`} />
                          <span className="text-[11px] text-white/60 font-semibold">Tap to open</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
