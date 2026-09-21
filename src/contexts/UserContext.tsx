import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserProfile } from '../types';
import { storageService } from '../services/storageService';

interface UserContextType {
  profile: UserProfile;
  updateProfile: (p: UserProfile) => void;
  completeOnboarding: (partial: Partial<UserProfile>) => void;
  isProfileLoaded: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  profession: 'NONE',
  guidePersonality: 'ZEN',
  aiEnabled: false,
  gamificationEnabled: false,
  themeMode: 'DARK',
  isOnboarded: false,
  privacyLockEnabled: false,
  blurHistory: false,
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  useEffect(() => {
    const loaded = storageService.loadProfile();
    const merged: UserProfile = {
      name: loaded?.name ?? '',
      profession: loaded?.profession ?? 'NONE',
      guidePersonality: loaded?.guidePersonality ?? 'ZEN',
      isOnboarded: (loaded as any)?.isOnboarded ?? false,
      privacyLockEnabled: (loaded as any)?.privacyLockEnabled ?? false,
      blurHistory: (loaded as any)?.blurHistory ?? false,
      aiEnabled: (loaded as any)?.aiEnabled ?? false,
      gamificationEnabled: (loaded as any)?.gamificationEnabled ?? false,
      themeMode: (loaded as any)?.themeMode ?? 'DARK',
    };
    setProfile(merged);
    setIsProfileLoaded(true);
  }, []);

  const updateProfile = (p: UserProfile) => {
    setProfile(p);
    storageService.saveProfile(p);
  };

  const completeOnboarding = (partial: Partial<UserProfile>) => {
    const newProfile: UserProfile = { ...profile, ...partial, isOnboarded: true };
    storageService.saveProfile(newProfile);
    setProfile(newProfile);
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile, completeOnboarding, isProfileLoaded }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
