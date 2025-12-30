import React, { useState } from 'react';
import { Shield, Lock, Unlock, Settings, Eye, EyeOff } from 'lucide-react';
import PINPad from './PINPad';
import {
  isPINSetup,
  setupPIN,
  verifyPIN,
  changePIN,
  removePIN,
  getPrivacySettings,
  savePrivacySettings,
  getLockedEntriesCount,
  unlockAllEntries,
  setSessionAuthenticated,
  type PrivacySettings,
} from '../services/privacyService';

interface PrivacyLockProps {
  onUnlock: () => void;
  userName?: string; // Kept for backwards compatibility
}

export default function PrivacyLock({ onUnlock }: PrivacyLockProps) {
  const [showPINPad, setShowPINPad] = useState(false);
  const [pinMode, setPinMode] = useState<'setup' | 'verify' | 'change'>('verify');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>(getPrivacySettings());
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removePin, setRemovePin] = useState('');

  const pinSetup = isPINSetup();
  const lockedCount = getLockedEntriesCount();

  const handlePINSuccess = () => {
    setShowPINPad(false);
    setSessionAuthenticated();
    if (pinMode === 'verify') {
      onUnlock();
    }
  };

  const handleSetupPIN = (pin: string) => {
    setupPIN(pin);
    const updated = { ...settings, pinEnabled: true };
    setSettings(updated);
    savePrivacySettings(updated);
  };

  const handleChangePIN = (oldPIN: string, newPIN: string) => {
    return changePIN(oldPIN, newPIN);
  };

  const handleRemovePIN = () => {
    if (removePIN(removePin)) {
      const updated = { ...settings, pinEnabled: false };
      setSettings(updated);
      savePrivacySettings(updated);
      setShowRemoveConfirm(false);
      setRemovePin('');
    } else {
      alert('Incorrect PIN');
      setRemovePin('');
    }
  };

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean | number) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    savePrivacySettings(updated);
  };

  const handleUnlockAll = () => {
    const pin = prompt('Enter PIN to unlock all entries:');
    if (pin && unlockAllEntries(pin)) {
      alert(`Unlocked ${lockedCount} entries`);
    } else {
      alert('Incorrect PIN');
    }
  };

  return (
    <div className="h-full bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-500/30 mx-auto mb-4 flex items-center justify-center">
            <Shield size={40} className="text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Privacy & Security</h1>
          <p className="text-white/60 text-sm">
            Protect your reflections with a secure PIN
          </p>
        </div>

        {/* Status Cards */}
        <div className="space-y-3">
          {/* PIN Status */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lock size={18} className={pinSetup ? 'text-emerald-400' : 'text-white/40'} />
                <span className="font-semibold text-sm">PIN Protection</span>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-bold ${
                  pinSetup
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {pinSetup ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
            <p className="text-xs text-white/60 mb-3">
              {pinSetup
                ? 'Your entries are protected with a PIN'
                : 'Set up a PIN to lock your entries'}
            </p>
            {!pinSetup ? (
              <button
                onClick={() => {
                  setPinMode('setup');
                  setShowPINPad(true);
                }}
                className="w-full px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
              >
                Set Up PIN
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPinMode('verify');
                    setShowPINPad(true);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
                >
                  <Unlock size={16} className="inline mr-1" />
                  Unlock
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition"
                >
                  <Settings size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Locked Entries */}
          {pinSetup && lockedCount > 0 && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lock size={18} className="text-amber-400" />
                  <span className="font-semibold text-sm">Locked Entries</span>
                </div>
                <span className="text-xl font-bold text-white">{lockedCount}</span>
              </div>
              <p className="text-xs text-white/60 mb-3">
                {lockedCount} {lockedCount === 1 ? 'entry is' : 'entries are'} currently locked
              </p>
              <button
                onClick={handleUnlockAll}
                className="w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition"
              >
                Unlock All Entries
              </button>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && pinSetup && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-4 space-y-4">
            <h3 className="font-bold text-sm mb-3">Privacy Settings</h3>

            {/* Blur History */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.blurHistoryEnabled ? (
                  <EyeOff size={16} className="text-white/60" />
                ) : (
                  <Eye size={16} className="text-white/60" />
                )}
                <div>
                  <p className="text-sm font-semibold">Blur History</p>
                  <p className="text-xs text-white/50">Blur entry previews in Archive</p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleSettingChange('blurHistoryEnabled', !settings.blurHistoryEnabled)
                }
                className={`w-12 h-6 rounded-full transition ${
                  settings.blurHistoryEnabled ? 'bg-cyan-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.blurHistoryEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Auto-Lock */}
            <div>
              <label className="block text-sm font-semibold mb-2">Auto-Lock (minutes)</label>
              <select
                value={settings.autoLockMinutes}
                onChange={(e) =>
                  handleSettingChange('autoLockMinutes', parseInt(e.target.value, 10))
                }
                className="w-full px-3 py-2 rounded-xl border border-white/15 bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="0">Never</option>
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>

            {/* Require PIN for Export */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Require PIN for Export</p>
                <p className="text-xs text-white/50">Protect CSV/PDF exports</p>
              </div>
              <button
                onClick={() =>
                  handleSettingChange('requirePINForExport', !settings.requirePINForExport)
                }
                className={`w-12 h-6 rounded-full transition ${
                  settings.requirePINForExport ? 'bg-cyan-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.requirePINForExport ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Change PIN */}
            <button
              onClick={() => {
                setPinMode('change');
                setShowPINPad(true);
              }}
              className="w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition"
            >
              Change PIN
            </button>

            {/* Remove PIN */}
            {!showRemoveConfirm ? (
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="w-full px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-sm font-semibold transition"
              >
                Remove PIN Protection
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-amber-300">
                  This will unlock all entries and remove PIN protection. Enter your PIN to confirm:
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={removePin}
                    onChange={(e) => setRemovePin(e.target.value)}
                    placeholder="Enter PIN"
                    className="flex-1 px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleRemovePIN}
                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setShowRemoveConfirm(false);
                      setRemovePin('');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="text-center text-xs text-white/40">
          All privacy features work completely offline. Your PIN never leaves your device.
        </div>
      </div>

      {/* PIN Pad Modal */}
      {showPINPad && (
        <PINPad
          mode={pinMode}
          onSuccess={handlePINSuccess}
          onCancel={() => setShowPINPad(false)}
          onVerify={verifyPIN}
          onSetup={handleSetupPIN}
          onChange={handleChangePIN}
        />
      )}
    </div>
  );
}
