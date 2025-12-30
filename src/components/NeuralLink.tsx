import React, { useRef, useState, useEffect } from 'react';
import type { UserProfile, Entry, UserStats } from '../types';
import { PROFESSION_CONFIG } from '../constants';
import { storageService } from '../services/storageService';
import {
  Network, Briefcase, Check, Edit2, Download, Upload, Shield, EyeOff, Lock, Flame, LogOut
} from 'lucide-react';

interface NeuralLinkProps {
  entries: Entry[];
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onNavigateToWelcome: () => void;
}

const NeuralLink: React.FC<NeuralLinkProps> = ({ entries, profile, onUpdateProfile, onNavigateToWelcome }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(profile.name);
  const [stats, setStats] = useState<UserStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const s = await storageService.loadStats({
        level: 1,
        currentXP: 0,
        nextLevelXP: 100,
        streak: 0,
        totalReflections: 0,
        cpdMinutesTotal: 0,
        achievements: [],
      });
      setStats(s);
    };
    load();
  }, []);

  useEffect(() => {
    setNewName(profile.name);
  }, [profile.name]);

  const patchProfile = (patch: Partial<UserProfile>) => {
    const merged = storageService.saveProfile({ ...profile, ...patch });
    onUpdateProfile(merged);
  };

  const togglePrivacyLock = () => patchProfile({ privacyLockEnabled: !profile.privacyLockEnabled });
  const toggleBlurHistory = () => patchProfile({ blurHistory: !profile.blurHistory });

  const toggleAI = () => patchProfile({ aiEnabled: !profile.aiEnabled });
  const toggleGamification = () => patchProfile({ gamificationEnabled: !profile.gamificationEnabled });

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
    else alert('Backup import failed (file format not recognised).');
  };

  return (
    <div className="h-full text-white flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-6 pb-2 pt-10 flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-600/90 rounded-2xl flex items-center justify-center shadow-lg">
          <Network size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-white/60 text-xs font-mono uppercase tracking-widest">Neural Link</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-40 custom-scrollbar">
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

            <p className="text-sm text-white/70">
              {PROFESSION_CONFIG[profile.profession]?.label || '—'} •{' '}
              <span className="text-white/50">{PROFESSION_CONFIG[profile.profession]?.description || ''}</span>
            </p>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
          <h2 className="text-lg font-bold mb-4">Feature Switches</h2>

          <div className="space-y-3">
            <button
              onClick={toggleAI}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              <span className="font-bold">AI</span>
              <span className={`text-xs font-mono ${profile.aiEnabled ? 'text-emerald-300' : 'text-white/60'}`}>
                {profile.aiEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={toggleGamification}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              <span className="font-bold">Gamification</span>
              <span className={`text-xs font-mono ${profile.gamificationEnabled ? 'text-emerald-300' : 'text-white/60'}`}>
                {profile.gamificationEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={togglePrivacyLock}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              <span className="font-bold flex items-center gap-2"><Lock size={16} /> Privacy Lock</span>
              <span className={`text-xs font-mono ${profile.privacyLockEnabled ? 'text-emerald-300' : 'text-white/60'}`}>
                {profile.privacyLockEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={toggleBlurHistory}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              <span className="font-bold flex items-center gap-2"><EyeOff size={16} /> Blur History</span>
              <span className={`text-xs font-mono ${profile.blurHistory ? 'text-emerald-300' : 'text-white/60'}`}>
                {profile.blurHistory ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Gamification Summary (visible only if enabled) */}
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Flame size={18} className="text-orange-300" /> Progress
          </h2>

          {!profile.gamificationEnabled && (
            <p className="text-white/60 text-sm">
              Gamification is OFF (default). Turn it ON above to track XP, levels, streaks and achievements.
            </p>
          )}

          {profile.gamificationEnabled && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Level</span>
                <span className="font-mono">{stats?.level ?? 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">XP</span>
                <span className="font-mono">{stats?.currentXP ?? 0}/{stats?.nextLevelXP ?? 100}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Streak</span>
                <span className="font-mono">{stats?.streak ?? 0} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Entries</span>
                <span className="font-mono">{entries.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Backup */}
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield size={18} className="text-cyan-300" /> Backup
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

        {/* Account Actions */}
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
          <button
            onClick={onNavigateToWelcome}
            className="w-full px-4 py-3 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center gap-2 text-red-300 hover:text-red-200 transition"
          >
            <LogOut size={16} /> Switch User / Logout
          </button>
          <p className="mt-3 text-xs text-white/50 text-center">
            Return to the login screen to switch accounts or start fresh
          </p>
        </div>
      </div>
    </div>
  );
};

export default NeuralLink;
