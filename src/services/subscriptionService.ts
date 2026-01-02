/**
 * Subscription Service
 * Manages user tiers, feature access, and subscription status
 */

export type UserTier = 'free' | 'pro' | 'lifetime' | 'enterprise';

export interface SubscriptionStatus {
  tier: UserTier;
  status: 'active' | 'canceled' | 'expired' | 'trial' | 'none';
  subscriptionId?: string;
  customerId?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: string;
}

// Free tier limits
const FREE_TIER_LIMITS = {
  maxReflections: 30,
  maxRegulatoryBodies: 1,
  allowedFeatures: [
    'reflection',
    'quick-capture',
    'drive-mode',
    'basic-cpd',
    'grounding',
    'crisis-protocols',
  ],
};

// Trial configuration
const TRIAL_DURATION_DAYS = 7;

/**
 * Get current user tier from localStorage
 */
export function getUserTier(): UserTier {
  const tier = localStorage.getItem('userTier');
  if (tier === 'pro' || tier === 'lifetime' || tier === 'enterprise') {
    return tier as UserTier;
  }
  return 'free';
}

/**
 * Set user tier (called after successful payment)
 */
export function setUserTier(tier: UserTier, subscriptionData?: Partial<SubscriptionStatus>): void {
  localStorage.setItem('userTier', tier);

  if (subscriptionData) {
    localStorage.setItem('subscriptionStatus', JSON.stringify(subscriptionData));
  }
}

/**
 * Get full subscription status
 */
export function getSubscriptionStatus(): SubscriptionStatus {
  const tier = getUserTier();
  const saved = localStorage.getItem('subscriptionStatus');

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback
    }
  }

  return {
    tier,
    status: tier === 'free' ? 'none' : 'active',
  };
}

/**
 * Check if user can access a feature
 */
export function canAccessFeature(feature: string): boolean {
  const tier = getUserTier();

  // Pro, lifetime, enterprise get everything
  if (tier !== 'free') {
    return true;
  }

  // Active trial gets everything
  if (isOnActiveTrial()) {
    return true;
  }

  // Free tier - only certain features
  return FREE_TIER_LIMITS.allowedFeatures.includes(feature);
}

/**
 * Check if user can access a specific view
 */
export function canAccessView(view: string): boolean {
  const tier = getUserTier();

  if (tier !== 'free') return true;

  // Active trial gets everything
  if (isOnActiveTrial()) return true;

  // Free tier blocked views
  const proOnlyViews = [
    'MENTAL_ATLAS',
    'BIO_RHYTHM',
    'CANVAS_BOARD',
    'CANVAS',
    'GAMIFICATION',
    'REPORTS', // Advanced reports
  ];

  return !proOnlyViews.includes(view);
}

/**
 * Start Pro trial (called when user hits 30 reflection limit)
 */
export function startProTrial(): void {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);

  const subscriptionData: SubscriptionStatus = {
    tier: 'free',
    status: 'trial',
    trialEnd: trialEnd.toISOString(),
  };

  localStorage.setItem('subscriptionStatus', JSON.stringify(subscriptionData));
}

/**
 * Check if user is currently on active Pro trial
 */
export function isOnActiveTrial(): boolean {
  const status = getSubscriptionStatus();

  if (status.status !== 'trial') return false;

  if (status.trialEnd) {
    const trialEndDate = new Date(status.trialEnd);
    return trialEndDate > new Date();
  }

  return false;
}

/**
 * Get remaining reflections for free tier
 */
export function getRemainingReflections(): number | null {
  const tier = getUserTier();
  const onTrial = isOnActiveTrial();

  // Unlimited during trial or for paid tiers
  if (tier !== 'free' || onTrial) {
    return null;
  }

  const entries = JSON.parse(localStorage.getItem('entries') || '[]');
  const reflectionCount = entries.filter(
    (e: any) => e.type === 'REFLECTION' || e.type === 'reflection'
  ).length;

  return Math.max(0, FREE_TIER_LIMITS.maxReflections - reflectionCount);
}

/**
 * Check if user has hit free tier reflection limit
 */
export function hasHitReflectionLimit(): boolean {
  const remaining = getRemainingReflections();
  return remaining !== null && remaining <= 0;
}

/**
 * Get available regulatory bodies for current tier
 */
export function getAvailableRegulatoryBodies(): number {
  const tier = getUserTier();

  if (tier !== 'free') {
    return Infinity; // All 29 regulatory bodies
  }

  return FREE_TIER_LIMITS.maxRegulatoryBodies;
}

/**
 * Check if user is on trial
 */
export function isOnTrial(): boolean {
  const status = getSubscriptionStatus();
  if (status.status !== 'trial') return false;

  if (status.trialEnd) {
    return new Date(status.trialEnd) > new Date();
  }

  return false;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(): number {
  const status = getSubscriptionStatus();
  if (!status.trialEnd) return 0;

  const end = new Date(status.trialEnd);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Clear subscription data (for testing or logout)
 */
export function clearSubscriptionData(): void {
  localStorage.removeItem('userTier');
  localStorage.removeItem('subscriptionStatus');
  localStorage.removeItem('stripeCustomerId');
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: UserTier): string {
  const names: Record<UserTier, string> = {
    free: 'Free',
    pro: 'Pro',
    lifetime: 'Lifetime Pro',
    enterprise: 'Enterprise',
  };
  return names[tier];
}

/**
 * Get tier features list
 */
export function getTierFeatures(tier: UserTier): string[] {
  if (tier === 'free') {
    return [
      'All reflection models (Gibbs, SBAR, ERA, etc.)',
      'Up to 30 reflections',
      '1 regulatory body',
      'Basic CPD tracking',
      'Quick Capture & Drive Mode',
      'Offline support',
      'Crisis Protocols',
      'Basic CSV export',
      '7-day Pro trial after 30 reflections',
    ];
  }

  return [
    'Unlimited reflections',
    'All 29 regulatory bodies',
    'AI-powered insights (Oracle)',
    'Mental Atlas (pattern detection)',
    'Advanced analytics & reports',
    'BioRhythm tracking',
    'Canvas Board (mind mapping)',
    'Gamification (achievements, XP)',
    'Enhanced CPD exports',
    'Priority support',
    'No ads',
    ...(tier === 'enterprise' ? [
      'Team management',
      'Centralized reporting',
      'Custom branding',
      'SSO integration',
    ] : []),
  ];
}

/**
 * Feature availability check with reason
 */
export function checkFeatureAccess(feature: string): {
  allowed: boolean;
  reason?: string;
  upgradeMessage?: string;
} {
  const tier = getUserTier();

  if (tier !== 'free') {
    return { allowed: true };
  }

  const proOnlyFeatures: Record<string, string> = {
    'oracle': 'AI-powered insights',
    'mental-atlas': 'Mental Atlas pattern detection',
    'bio-rhythm': 'BioRhythm tracking',
    'canvas': 'Canvas Board mind mapping',
    'gamification': 'Achievements and gamification',
    'advanced-reports': 'Advanced analytics and reports',
    'enhanced-export': 'Enhanced CPD exports',
  };

  if (proOnlyFeatures[feature]) {
    return {
      allowed: false,
      reason: `${proOnlyFeatures[feature]} is a Pro feature`,
      upgradeMessage: 'Upgrade to Pro to unlock this feature',
    };
  }

  if (FREE_TIER_LIMITS.allowedFeatures.includes(feature)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'This feature requires Pro',
    upgradeMessage: 'Upgrade to unlock all features',
  };
}
