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
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-t-[2rem] border border-white/40 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-6">
        <div className="flex-shrink-0 p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Oracle</h2>
                <p className="text-xs text-slate-500">Ask about themes in your recent entries</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              title="Close"
            >
              <X size={18} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-7 space-y-3 custom-scrollbar nav-safe">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='Try: "What have I been writing about lately?"'
            className="w-full h-20 resize-none rounded-2xl p-4 bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-100 text-slate-800 placeholder:text-slate-300"
          />

          <button
            onClick={handleAsk}
            disabled={!question.trim() || isLoading}
            className={`w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              !question.trim() || isLoading
                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking…
              </>
            ) : (
              <>
                <Sparkles size={16} className="opacity-80" />
                Ask Oracle
              </>
            )}
          </button>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          {answer && (
            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Oracle Response
              </div>
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {answer}
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-400 pt-2">
            Uses only your local entries (no hidden data).
          </div>
        </div>
      </div>
    </div>
  );
};

export default Oracle;
