import React, { useRef, useState, useEffect } from 'react';
import type { UserProfile, Entry, UserStats } from '../types';
import { PROFESSION_CONFIG } from '../constants';
import { storageService } from '../services/storageService';
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
  Flame,
  LogOut,
  RotateCcw,
  Trophy,
  Home,
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

  const handleReturnToOnboarding = () => {
    if (confirm('Return to onboarding screen? Your entries will remain safe.')) {
      storageService.setOnboarded(false);
      onNavigateToWelcome();
    }
  };

  const handleResetStats = () => {
    if (confirm('Reset all stats (XP, level, streak, achievements)? This cannot be undone.')) {
      const reset = storageService.resetStats();
      setStats(reset);
    }
  };

  const handleResetToggles = () => {
    if (confirm('Reset all feature toggles to OFF (AI, Gamification, Privacy, Blur)?')) {
      const updated = storageService.resetToggles();
      onUpdateProfile(updated);
    }
  };

  const handleResetAI = () => {
    if (confirm('Turn OFF AI features?')) {
      patchProfile({ aiEnabled: false });
    }
  };

  // Calculate XP progress percentage
  const xpProgress = stats
    ? Math.min(100, ((stats.currentXP || 0) / (stats.nextLevelXP || 100)) * 100)
    : 0;

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
              {PROFESSION_CONFIG[profile.profession]?.label || '—'}
            </p>
            {PROFESSION_CONFIG[profile.profession]?.description && (
              <p className="text-xs text-white/50">{PROFESSION_CONFIG[profile.profession].description}</p>
            )}
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
              <span
                className={`text-xs font-mono px-2 py-1 rounded ${
                  profile.aiEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'
                }`}
              >
                {profile.aiEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={toggleGamification}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              <span className="font-bold">Gamification</span>
              <span
                className={`text-xs font-mono px-2 py-1 rounded ${
                  profile.gamificationEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'
                }`}
              >
                {profile.gamificationEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

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

        {/* Progress Hub (visible only if gamification enabled) */}
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/15">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Flame size={18} className="text-orange-300" /> Progress & Growth
          </h2>

          {!profile.gamificationEnabled && (
            <p className="text-white/60 text-sm">
              Gamification is OFF (default). Turn it ON above to track XP, levels, streaks and achievements.
            </p>
          )}

          {profile.gamificationEnabled && (
            <div className="space-y-4">
              {/* XP Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">Level {stats?.level ?? 1}</span>
                  <span className="font-mono text-white/90">
                    {stats?.currentXP ?? 0} / {stats?.nextLevelXP ?? 100} XP
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-xl">
                  <div className="text-2xl font-bold">{stats?.streak ?? 0}</div>
                  <div className="text-xs text-white/60">Day Streak</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <div className="text-2xl font-bold">{entries.length}</div>
                  <div className="text-xs text-white/60">Total Entries</div>
                </div>
              </div>

              {/* Achievements */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={16} className="text-yellow-400" />
                  <span className="text-sm font-bold">Achievements</span>
                  <span className="text-xs text-white/60">({stats?.achievements?.length ?? 0})</span>
                </div>
                {stats?.achievements && stats.achievements.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {stats.achievements.slice(0, 6).map((achievement) => (
                      <div
                        key={achievement.id}
                        className="bg-white/5 p-2 rounded-lg text-center"
                        title={achievement.description}
                      >
                        <div className="text-2xl mb-1">{achievement.icon || achievement.iconName || '🏆'}</div>
                        <div className="text-[10px] text-white/70 truncate">{achievement.title}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/50">No achievements unlocked yet. Keep reflecting!</p>
                )}
              </div>
            </div>
          )}
        </div>

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
              <Home size={16} /> Return to Onboarding
            </button>

            <button
              onClick={handleResetStats}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw size={16} /> Reset Stats Only
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
