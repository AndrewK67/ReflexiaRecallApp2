import React, { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Wrench,
  User,
  X,
  Camera,
  Car,
  MessagesSquare,
  Box,
  Activity,
  Wind,
  ShieldAlert,
  Archive as ArchiveIcon,
} from "lucide-react";
import type { ViewState } from "../types";

interface NavigationProps {
  current: ViewState;
  onChange: (v: ViewState) => void;
}

export default function Navigation({ current, onChange }: NavigationProps) {
  const [toolsOpen, setToolsOpen] = useState(false);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--nav-space", "6.75rem");
  }, []);

  // Close tools modal on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toolsOpen) {
        setToolsOpen(false);
      }
    };

    if (toolsOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [toolsOpen]);

  const tools = useMemo(
    () => [
      { id: "QUICK_CAPTURE" as ViewState, label: "Quick Capture", icon: Camera },
      { id: "DRIVE_MODE" as ViewState, label: "Drive Mode", icon: Car },
      { id: "HOLODECK" as ViewState, label: "Holodeck", icon: Box },
      { id: "ORACLE" as ViewState, label: "Oracle", icon: MessagesSquare },
      { id: "BIO_RHYTHM" as ViewState, label: "BioRhythm", icon: Activity },
      { id: "GROUNDING" as ViewState, label: "Grounding", icon: Wind },
      { id: "CRISIS_PROTOCOLS" as ViewState, label: "Crisis Protocols", icon: ShieldAlert },
      { id: "CALENDAR" as ViewState, label: "Calendar", icon: CalendarIcon },
      { id: "LIBRARY" as ViewState, label: "Library", icon: User },
      { id: "CPD" as ViewState, label: "CPD Portfolio", icon: User },
      { id: "GAMIFICATION" as ViewState, label: "Achievements", icon: User },
    ],
    []
  );

  return (
    <>
      <div className="flex-shrink-0 flex justify-center p-4 bg-transparent">
        <div className="w-full">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => onChange("ARCHIVE")}
              className={`flex flex-col items-center gap-1 w-16 ${
                current === "ARCHIVE" ? "text-indigo-600" : "text-slate-500"
              }`}
              title="Archive"
              aria-label="View archive of past reflections"
              aria-current={current === "ARCHIVE" ? "page" : undefined}
            >
              <ArchiveIcon size={18} />
              <span className="text-[10px] font-bold">Archive</span>
            </button>

            <button
              onClick={() => onChange("REFLECTION")}
              className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-300 -mt-7 border-4 border-white"
              title="Reflect"
              aria-label="Start new reflection"
            >
              <Plus size={22} />
            </button>

            <button
              onClick={() => setToolsOpen(true)}
              className={`flex flex-col items-center gap-1 w-16 ${
                toolsOpen ? "text-indigo-600" : "text-slate-500"
              }`}
              title="Tools"
              aria-label="Open tools menu"
              aria-expanded={toolsOpen}
            >
              <Wrench size={18} />
              <span className="text-[10px] font-bold">Tools</span>
            </button>

            <button
              onClick={() => onChange("NEURAL_LINK")}
              className={`flex flex-col items-center gap-1 w-16 ${
                current === "NEURAL_LINK" ? "text-indigo-600" : "text-slate-500"
              }`}
              title="Profile"
              aria-label="View profile and settings"
              aria-current={current === "NEURAL_LINK" ? "page" : undefined}
            >
              <User size={18} />
              <span className="text-[10px] font-bold">Profile</span>
            </button>
          </div>
        </div>
      </div>

      {toolsOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tools-title"
        >
          <div className="w-full max-w-md bg-white rounded-t-3xl border border-slate-200 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div id="tools-title" className="text-sm font-extrabold text-slate-800">Tools</div>
              <button
                onClick={() => setToolsOpen(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                title="Close"
                aria-label="Close tools menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {tools.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setToolsOpen(false);
                      onChange(t.id);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left hover:border-indigo-400 transition"
                    aria-label={`Open ${t.label}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="text-slate-700" aria-hidden="true" />
                      <div className="text-xs font-bold text-slate-800">{t.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-[11px] text-slate-500">
              Tip: Crisis Protocols is available here anytime, and can be embedded inside Incident mode.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
