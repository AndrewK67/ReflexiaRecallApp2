import React, { useRef, useState, useEffect } from 'react';
import type { UserProfile, Entry } from '../types';
import { APP_VERSION, APP_BUILD_DATE } from '../constants';
import { storageService } from '../services/storageService';
import { downloadTerms, downloadPrivacy, downloadDisclaimer } from '../utils/legalDownloads';
import AISettings from './AISettings';
import StorageStatus from './StorageStatus';
import WhatYouveTried, { TRIED_HEADING_ID } from './WhatYouveTried';
import { notify, confirmAction } from '../services/noticeService';
import {
  Network,
  Briefcase,
  Check,
  Edit2,
  Download,
  Upload,
  Shield,
  EyeOff,
  Lock,
  RotateCcw,
  Home,
  Camera,
  Compass,
  HelpCircle,
} from 'lucide-react';

interface NeuralLinkProps {
  entries: Entry[];
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onNavigateToWelcome: () => void;
  onShowPermissionsHelp?: () => void;
}

const NeuralLink: React.FC<NeuralLinkProps> = ({ entries, profile, onUpdateProfile, onNavigateToWelcome, onShowPermissionsHelp }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(profile.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNewName(profile.name);
  }, [profile.name]);

  const patchProfile = (patch: Partial<UserProfile>) => {
    const merged = storageService.saveProfile({ ...profile, ...patch });
    onUpdateProfile(merged);
  };

  const togglePrivacyLock = () => patchProfile({ privacyLockEnabled: !profile.privacyLockEnabled });
  const toggleBlurHistory = () => patchProfile({ blurHistory: !profile.blurHistory });
  const setAIEnabled = (enabled: boolean) => patchProfile({ aiEnabled: enabled });

  const handleSave = () => {
    patchProfile({ name: newName });
    setIsEditing(false);
  };

  const handleBackup = () => storageService.exportBackup();

  const handleRestorePick = () => fileInputRef.current?.click();

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ok = await storageService.importBackup(f);
    if (ok) window.location.reload();
    else notify('That file is not a Reflexia backup, so nothing was changed.', 'error');
  };

  const handleReturnToOnboarding = async () => {
    const ok = await confirmAction({
      title: 'See the welcome screen again?',
      body: 'Your entries and settings stay exactly as they are.',
      confirmLabel: 'Show it',
    });
    if (ok) {
      storageService.setOnboarded(false);
      onNavigateToWelcome();
    }
  };

  const handleResetToggles = async () => {
    const ok = await confirmAction({
      title: 'Turn every switch off?',
      body: 'AI, Privacy Lock and Blur History all go to OFF.',
      confirmLabel: 'Turn them off',
    });
    if (ok) {
      const updated = storageService.resetToggles();
      onUpdateProfile(updated);
      notify('All switches are off.', 'success');
    }
  };

  // "Show me around": the checklist is the tour - each untried thing says
  // where to find it (phase 3D.4, replacing the old click-through tutorial).
  const handleShowMeAround = () => {
    const heading = document.getElementById(TRIED_HEADING_ID);
    heading?.scrollIntoView({ block: 'start' });
    heading?.focus({ preventScroll: true });
  };

  const handleResetAI = async () => {
    const ok = await confirmAction({ title: 'Turn AI off?', confirmLabel: 'Turn off' });
    if (ok) {
      patchProfile({ aiEnabled: false });
      notify('AI is off. Everything runs on this device.', 'success');
    }
  };

  return (
    <div className="h-full bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col overflow-y-auto custom-scrollbar nav-safe relative">
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      <div className="p-6 pb-2 pt-10 flex items-center gap-3 relative z-10">
        <div className="w-12 h-12 bg-indigo-600/90 rounded-2xl flex items-center justify-center shadow-lg">
          <Network size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-white/60 text-xs font-mono uppercase tracking-widest">Neural Link</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-20 custom-scrollbar relative z-10">
        {/* Identity */}
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Briefcase size={18} className="text-emerald-300" /> Identity
            </h2>
            <button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              className="p-2 rounded-full bg-white/10 hover:bg-white/15"
              title={isEditing ? 'Save' : 'Edit'}
              aria-label={isEditing ? 'Save name' : 'Edit name'}
            >
              {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
            </button>
          </div>

          <div className="space-y-3">
            {isEditing ? (
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-black/20 text-white p-3 rounded-xl border border-white/15"
                placeholder="Your name"
              />
            ) : (
              <p className="text-xl font-extrabold">{profile.name || '—'}</p>
            )}
          </div>
        </div>

        {/* What you've tried (phase 3D.3) */}
        <WhatYouveTried entries={entries} privacyLockEnabled={profile.privacyLockEnabled === true} />

        {/* Feature Switches */}
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
          <h2 className="text-lg font-bold mb-4">Feature Switches</h2>

          <div className="space-y-3">
            <button
              onClick={togglePrivacyLock}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              <span className="font-bold flex items-center gap-2">
                <Lock size={16} /> Privacy Lock
              </span>
              <span
                className={`text-xs font-mono px-2 py-1 rounded ${
                  profile.privacyLockEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'
                }`}
              >
                {profile.privacyLockEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={toggleBlurHistory}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              <span className="font-bold flex items-center gap-2">
                <EyeOff size={16} /> Blur History
              </span>
              <span
                className={`text-xs font-mono px-2 py-1 rounded ${
                  profile.blurHistory ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'
                }`}
              >
                {profile.blurHistory ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* AI: the key, the toggle and what is sent (phase 3E) */}
        <AISettings aiEnabled={profile.aiEnabled === true} onSetEnabled={setAIEnabled} />

        {/* Where the data lives and whether the browser will keep it (phase 3A.1) */}
        <StorageStatus entryCount={entries.length} />

        {/* Backup */}
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield size={18} className="text-cyan-300" /> Backup & Restore
          </h2>

          <div className="flex gap-3">
            <button
              onClick={handleBackup}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2"
            >
              <Download size={16} /> Export
            </button>
            <button
              onClick={handleRestorePick}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2"
            >
              <Upload size={16} /> Import
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleRestore} className="hidden" />
          </div>
        </div>

        {/* Help & Support */}
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <HelpCircle size={18} className="text-cyan-300" /> Help & Support
          </h2>

          <div className="space-y-3">
            <button
              onClick={handleShowMeAround}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 transition"
            >
              <Compass size={16} /> Show me around
            </button>

            <button
              onClick={onShowPermissionsHelp}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 transition"
            >
              <Camera size={16} /> Camera & Mic Permissions
            </button>
          </div>

          <p className="mt-3 text-xs text-white/50 text-center">
            Get help with using Reflexia
          </p>
        </div>

        {/* Control Actions */}
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <RotateCcw size={18} className="text-purple-300" /> Reset Options
          </h2>

          <div className="space-y-3">
            <button
              onClick={handleReturnToOnboarding}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 transition"
            >
              <Home size={16} /> Show the welcome screen again
            </button>

            <button
              onClick={handleResetToggles}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw size={16} /> Reset All Toggles
            </button>

            <button
              onClick={handleResetAI}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw size={16} /> Turn OFF AI
            </button>
          </div>

          <p className="mt-3 text-xs text-white/50 text-center">These actions help you manage your app state safely.</p>
        </div>

        {/* Legal Documents */}
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield size={18} className="text-cyan-300" /> Legal
          </h2>

          <div className="space-y-2">
            <button
              onClick={downloadTerms}
              className="w-full px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition text-left"
            >
              Terms of Use
            </button>

            <button
              onClick={downloadPrivacy}
              className="w-full px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition text-left"
            >
              Privacy Policy
            </button>

            <button
              onClick={downloadDisclaimer}
              className="w-full px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition text-left"
            >
              Disclaimer
            </button>
          </div>

          <p className="mt-3 text-xs text-white/50 text-center">
            Legal documents will download when clicked
          </p>
        </div>

        {/* App Version Info */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 text-center">
          <div className="text-white/60 text-xs mb-1">Reflexia Version</div>
          <div className="font-mono text-white/70 text-sm font-bold">{APP_VERSION}</div>
          <div className="text-white/30 text-xs mt-1">Built: {APP_BUILD_DATE}</div>
        </div>
      </div>
    </div>
  );
};

export default NeuralLink;
