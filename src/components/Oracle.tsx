import React, { useMemo, useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import type { Entry } from "../types";
import { askOracle } from "../services/aiService";
import { storageService } from "../services/storageService";

interface OracleProps {
  entries: Entry[];
  onClose: () => void;
}

const Oracle: React.FC<OracleProps> = ({ entries, onClose }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Keep payload small-ish (Oracle only needs "recent" context to answer “lately” questions)
  const recentEntries = useMemo(() => entries.slice(0, 40), [entries]);

  const handleAsk = async () => {
    setError(null);
    setAnswer(null);

    const q = question.trim();
    if (!q) return;

    setIsLoading(true);
    try {
      // Try to pull profile so we can pass profession context (optional)
      const profile = await storageService.loadProfile();

      const text = await askOracle({
        question: q,
        entriesJson: JSON.stringify(recentEntries),
        profession: (profile as any)?.profession ?? "NONE",
      });

      setAnswer(text);
    } catch (e: any) {
      const msg = String(e?.message || e || "");
      if (msg.includes("NO_API_KEY")) {
        setError("Oracle is locked — no API key found. Add VITE_GEMINI_API_KEY to your .env file.");
      } else {
        setError("Oracle couldn’t respond just now. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex-shrink-0 p-6 flex items-center gap-3 border-b border-white/10">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <Sparkles size={24} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Oracle</h1>
            <p className="text-white/60 text-xs uppercase tracking-widest font-mono">Pattern Analysis</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="flex-shrink-0 px-6 pt-4 pb-2">
        <p className="text-white/70 text-sm leading-relaxed">
          Ask about patterns, themes, or insights from your recent reflections. The Oracle analyzes your entries to help you see the bigger picture.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32 custom-scrollbar space-y-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder='Try: "What have I been writing about lately?"'
          className="w-full h-24 resize-none rounded-2xl p-4 bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 text-white placeholder:text-white/40 transition-all"
        />

        <button
          onClick={handleAsk}
          disabled={!question.trim() || isLoading}
          className={`w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
            !question.trim() || isLoading
              ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
              : "bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 active:scale-95"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Thinking…
            </>
          ) : (
            <>
              <Sparkles size={20} className="opacity-80" />
              Ask Oracle
            </>
          )}
        </button>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {answer && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-3">
              Oracle Response
            </div>
            <div className="text-white/90 text-sm leading-relaxed whitespace-pre-line">
              {answer}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-6 border-t border-white/10 bg-slate-950/80 backdrop-blur">
        <p className="text-xs text-white/40 text-center">
          Uses only your local entries • No data sent to cloud
        </p>
      </div>
    </div>
  );
};

export default Oracle;
