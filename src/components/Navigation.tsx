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
    <div className="flex-shrink-0 flex justify-center p-4 landscape:p-0 landscape:py-0 bg-transparent landscape:fixed landscape:left-0 landscape:top-0 landscape:bottom-0 landscape:w-16 landscape:flex-col landscape:justify-center landscape:z-50">
      <div className="w-full landscape:h-auto">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-3xl landscape:rounded-2xl px-4 landscape:px-2 py-3 landscape:py-4 flex items-center justify-around landscape:flex-col landscape:gap-3">
          <button
            onClick={() => onChange("ARCHIVE")}
            className={`flex flex-col landscape:flex-col items-center gap-1 landscape:gap-0.5 w-16 landscape:w-auto landscape:px-0 ${
              current === "ARCHIVE" ? "text-indigo-600" : "text-slate-500"
            }`}
            title="Archive"
            aria-label="View archive of past reflections"
            aria-current={current === "ARCHIVE" ? "page" : undefined}
          >
            <ArchiveIcon size={18} className="landscape:w-5 landscape:h-5" />
            <span className="text-[10px] landscape:text-[7px] font-bold landscape:hidden">Archive</span>
          </button>

          <button
            onClick={() => onChange("DASHBOARD")}
            className="w-14 h-14 landscape:w-12 landscape:h-12 rounded-2xl landscape:rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-300 -mt-7 landscape:mt-0 border-4 landscape:border-2 border-white"
            title="Home"
            aria-label="Go to dashboard"
          >
            <Home size={22} className="landscape:w-6 landscape:h-6" />
          </button>

          <button
            onClick={() => onChange("NEURAL_LINK")}
            className={`flex flex-col landscape:flex-col items-center gap-1 landscape:gap-0.5 w-16 landscape:w-auto landscape:px-0 ${
              current === "NEURAL_LINK" ? "text-indigo-600" : "text-slate-500"
            }`}
            title="Profile"
            aria-label="View profile and settings"
            aria-current={current === "NEURAL_LINK" ? "page" : undefined}
          >
            <User size={18} className="landscape:w-5 landscape:h-5" />
            <span className="text-[10px] landscape:text-[7px] font-bold landscape:hidden">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
