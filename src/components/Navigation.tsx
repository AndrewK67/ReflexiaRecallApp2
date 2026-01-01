import React from "react";
import {
  Home,
  User,
  Archive as ArchiveIcon,
} from "lucide-react";
import type { ViewState } from "../types";

interface NavigationProps {
  current: ViewState;
  onChange: (v: ViewState) => void;
}

export default function Navigation({ current, onChange }: NavigationProps) {
  React.useEffect(() => {
    document.documentElement.style.setProperty("--nav-space", "6.75rem");
  }, []);

  return (
    <div className="flex-shrink-0 flex justify-center p-4 bg-transparent">
      <div className="w-full">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl px-4 py-3 flex items-center justify-around">
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
            onClick={() => onChange("DASHBOARD")}
            className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-300 -mt-7 border-4 border-white"
            title="Home"
            aria-label="Go to dashboard"
          >
            <Home size={22} />
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
  );
}
