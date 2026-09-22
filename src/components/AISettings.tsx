/**
 * Profile → AI. The only place AI can be turned on (phase 3E).
 *
 * Two things have to be true before anything leaves the device: a key the
 * person pasted here, and the toggle. Turning the toggle on shows exactly what
 * each feature sends, and needs a second tap. aiService.ts is the gate that
 * enforces it; this screen just tells the truth about it.
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, KeyRound, Trash2, Check, X } from 'lucide-react';
import { AI_DATA_SENT, GEMINI_MODEL, setAIKey, aiStatus } from '../services/aiService';
import { loadAIKey, saveAIKey, clearAIKey, looksLikeAIKey, keyHint } from '../services/aiKeyService';

interface AISettingsProps {
  aiEnabled: boolean;
  onSetEnabled: (enabled: boolean) => void;
}

export default function AISettings({ aiEnabled, onSetEnabled }: AISettingsProps) {
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [showConsent, setShowConsent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadAIKey().then((k) => setStoredKey(k));
  }, []);

  const hasKey = looksLikeAIKey(storedKey);
  const persistent = typeof indexedDB !== 'undefined';

  const handleSaveKey = async () => {
    if (!looksLikeAIKey(draft)) {
      setNotice('That does not look like a key — it is too short.');
      return;
    }
    await saveAIKey(draft);
    setAIKey(draft);
    setStoredKey(draft.trim());
    setDraft('');
    setNotice(persistent ? 'Key saved on this device.' : 'Key kept for this session only — this browser has no storage for it.');
  };

  const handleRemoveKey = async () => {
    await clearAIKey();
    setAIKey(null);
    setStoredKey(null);
    setNotice('Key removed. AI features now run offline.');
    if (aiEnabled) onSetEnabled(false);
  };

  const handleToggle = () => {
    setNotice(null);
    if (aiEnabled) {
      onSetEnabled(false);
      setShowConsent(false);
      return;
    }
    if (!hasKey) {
      setNotice('Add your key first. Without one, everything runs offline.');
      return;
    }
    setShowConsent(true);
  };

  const confirmOn = () => {
    onSetEnabled(true);
    setShowConsent(false);
  };

  const active = aiStatus().active || (aiEnabled && hasKey);

  return (
    <section
      aria-labelledby="ai-settings-heading"
      className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15"
    >
      <h2 id="ai-settings-heading" className="text-lg font-bold mb-1 flex items-center gap-2">
        <Sparkles size={18} className="text-indigo-300" /> AI
      </h2>
      <p className="text-sm text-white/70 mb-4">
        Off by default and off without a key. When it is on, Coach, Insight and the Oracle send text to
        Google's Gemini API using your own key. Nothing else in the app ever leaves this device.
      </p>

      {/* Key */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="font-bold flex items-center gap-2 text-sm">
            <KeyRound size={16} /> Your Gemini key
          </span>
          <span className="text-xs font-mono px-2 py-1 rounded bg-white/10 text-white/70">
            {hasKey ? `ending …${keyHint(storedKey)}` : 'none'}
          </span>
        </div>

        {hasKey ? (
          <button
            onClick={handleRemoveKey}
            className="w-full px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> Remove key
          </button>
        ) : (
          <div className="flex gap-2">
            <label htmlFor="ai-key-input" className="sr-only">
              Gemini API key
            </label>
            <input
              id="ai-key-input"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste your key"
              className="flex-1 min-w-0 bg-black/20 text-white p-3 rounded-xl border border-white/15 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={handleSaveKey}
              disabled={!draft.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/30 text-sm font-semibold disabled:opacity-40"
            >
              Save
            </button>
          </div>
        )}

        <p className="mt-2 text-xs text-white/60">
          Stored in this app's keystore on this device, never in a backup file and never in the app itself.
          It is only ever sent to Google, with the text below, when AI is on.
        </p>
      </div>

      {/* Toggle */}
      <button
        onClick={handleToggle}
        aria-pressed={aiEnabled}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10"
      >
        <span className="font-bold">AI features</span>
        <span
          className={`text-xs font-mono px-2 py-1 rounded ${
            active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'
          }`}
        >
          {aiEnabled ? (hasKey ? 'ON' : 'ON · no key') : 'OFF'}
        </span>
      </button>

      {notice && (
        <p role="status" className="mt-3 text-sm text-white/80">
          {notice}
        </p>
      )}

      {/* Consent */}
      {showConsent && (
        <div
          role="region"
          aria-labelledby="ai-consent-heading"
          className="mt-3 rounded-2xl bg-indigo-950/60 border border-indigo-400/30 p-4"
        >
          <h3 id="ai-consent-heading" className="font-bold mb-2">
            Before you turn this on
          </h3>
          <p className="text-sm text-white/80 mb-3">
            With AI on, these features send text from this device to Google's Gemini API ({GEMINI_MODEL}),
            under your key and Google's terms. Each sends only what it needs, only when you use it:
          </p>
          <dl className="text-sm space-y-2 mb-4">
            <div className="flex gap-2">
              <dt className="font-bold w-24 flex-shrink-0">Coach</dt>
              <dd className="text-white/80">{AI_DATA_SENT.coach}.</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold w-24 flex-shrink-0">Insight</dt>
              <dd className="text-white/80">{AI_DATA_SENT.insight}.</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold w-24 flex-shrink-0">Oracle</dt>
              <dd className="text-white/80">{AI_DATA_SENT.oracle}.</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold w-24 flex-shrink-0">Daily prompt</dt>
              <dd className="text-white/80">{AI_DATA_SENT.dailyPrompt}.</dd>
            </div>
          </dl>
          <p className="text-xs text-white/60 mb-4">
            Your entries are never sent in the background, and turning AI off stops all of this at once.
            AI answers can be wrong; they are suggestions, not advice.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmOn}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              <Check size={16} /> Turn AI on
            </button>
            <button
              onClick={() => setShowConsent(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <X size={16} /> Not now
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
