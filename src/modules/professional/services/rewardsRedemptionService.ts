// Rewards Redemption Service - Handle reward claiming and tracking
// Manages redemption history, delivery details, and XP deductions

import { Reward, getRewardById, canAfford } from './rewardsCatalogService';

export interface RedemptionRecord {
  id: string; // Unique redemption ID
  rewardId: string;
  rewardName: string;
  xpSpent: number;
  redeemedAt: string; // ISO timestamp
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'downloaded';
  type: 'digital' | 'physical' | 'experience';
  deliveryDetails?: DeliveryDetails;
  downloadUrl?: string;
  notes?: string;
}

export interface DeliveryDetails {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country: string;
  email: string;
  phone?: string;
  shippingCost: number;
  trackingNumber?: string;
}

const STORAGE_KEY = 'reflexia_redemptions';

// Get all redemptions from localStorage
export function getAllRedemptions(): RedemptionRecord[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save redemptions to localStorage
function saveRedemptions(redemptions: RedemptionRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(redemptions));
}

// Generate unique redemption ID
function generateRedemptionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `RDM-${timestamp}-${random}`.toUpperCase();
}

// Redeem a digital reward
export function redeemDigitalReward(
  rewardId: string,
  currentXP: number,
  email: string
): {
  success: boolean;
  message: string;
  redemption?: RedemptionRecord;
  newXP?: number;
} {
  const reward = getRewardById(rewardId);

  if (!reward) {
    return { success: false, message: 'Reward not found' };
  }

  if (reward.type !== 'digital') {
    return { success: false, message: 'This is not a digital reward' };
  }

  if (!canAfford(currentXP, reward.xpCost)) {
    return {
      success: false,
      message: `Insufficient XP. You need ${reward.xpCost} XP but only have ${currentXP} XP.`
    };
  }

  // Create redemption record
  const redemption: RedemptionRecord = {
    id: generateRedemptionId(),
    rewardId: reward.id,
    rewardName: reward.name,
    xpSpent: reward.xpCost,
    redeemedAt: new Date().toISOString(),
    status: 'downloaded',
    type: 'digital',
    downloadUrl: reward.fileUrl || '/downloads/' + reward.id.toLowerCase(),
    notes: `Digital download sent to ${email}`
  };

  // Save redemption
  const redemptions = getAllRedemptions();
  redemptions.push(redemption);
  saveRedemptions(redemptions);

  // Calculate new XP
  const newXP = currentXP - reward.xpCost;

  return {
    success: true,
    message: `Success! ${reward.name} has been unlocked. Check your email for download link.`,
    redemption,
    newXP
  };
}

// Redeem a physical reward
export function redeemPhysicalReward(
  rewardId: string,
  currentXP: number,
  deliveryDetails: DeliveryDetails
): {
  success: boolean;
  message: string;
  redemption?: RedemptionRecord;
  newXP?: number;
} {
  const reward = getRewardById(rewardId);

  if (!reward) {
    return { success: false, message: 'Reward not found' };
  }

  if (reward.type !== 'physical') {
    return { success: false, message: 'This is not a physical reward' };
  }

  if (!canAfford(currentXP, reward.xpCost)) {
    return {
      success: false,
      message: `Insufficient XP. You need ${reward.xpCost} XP but only have ${currentXP} XP.`
    };
  }

  // Validate delivery details
  if (!deliveryDetails.fullName || !deliveryDetails.addressLine1 ||
      !deliveryDetails.city || !deliveryDetails.postcode || !deliveryDetails.email) {
    return {
      success: false,
      message: 'Please provide complete delivery details (name, address, city, postcode, email)'
    };
  }

  // Create redemption record
  const redemption: RedemptionRecord = {
    id: generateRedemptionId(),
    rewardId: reward.id,
    rewardName: reward.name,
    xpSpent: reward.xpCost,
    redeemedAt: new Date().toISOString(),
    status: 'pending',
    type: 'physical',
    deliveryDetails: deliveryDetails,
    notes: `Physical item to be shipped to ${deliveryDetails.city}, ${deliveryDetails.country}`
  };

  // Save redemption
  const redemptions = getAllRedemptions();
  redemptions.push(redemption);
  saveRedemptions(redemptions);

  // Calculate new XP
  const newXP = currentXP - reward.xpCost;

  return {
    success: true,
    message: `Success! Your ${reward.name} order has been placed. You'll receive shipping confirmation at ${deliveryDetails.email}.`,
    redemption,
    newXP
  };
}

// Redeem an experience reward
export function redeemExperienceReward(
  rewardId: string,
  currentXP: number,
  contactEmail: string,
  preferredTimes?: string
): {
  success: boolean;
  message: string;
  redemption?: RedemptionRecord;
  newXP?: number;
} {
  const reward = getRewardById(rewardId);

  if (!reward) {
    return { success: false, message: 'Reward not found' };
  }

  if (reward.type !== 'experience') {
    return { success: false, message: 'This is not an experience reward' };
  }

  if (!canAfford(currentXP, reward.xpCost)) {
    return {
      success: false,
      message: `Insufficient XP. You need ${reward.xpCost} XP but only have ${currentXP} XP.`
    };
  }

  // Create redemption record
  const redemption: RedemptionRecord = {
    id: generateRedemptionId(),
    rewardId: reward.id,
    rewardName: reward.name,
    xpSpent: reward.xpCost,
    redeemedAt: new Date().toISOString(),
    status: 'pending',
    type: 'experience',
    notes: `Scheduling ${reward.name} with ${contactEmail}. Preferred times: ${preferredTimes || 'Not specified'}`
  };

  // Save redemption
  const redemptions = getAllRedemptions();
  redemptions.push(redemption);
  saveRedemptions(redemptions);

  // Calculate new XP
  const newXP = currentXP - reward.xpCost;

  return {
    success: true,
    message: `Success! We'll contact you at ${contactEmail} within 48 hours to schedule your ${reward.name}.`,
    redemption,
    newXP
  };
}

// Get redemption history for a user
export function getRedemptionHistory(): RedemptionRecord[] {
  return getAllRedemptions().sort(
    (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
  );
}

// Get total XP spent on rewards
export function getTotalXPSpent(): number {
  const redemptions = getAllRedemptions();
  return redemptions.reduce((total, r) => total + r.xpSpent, 0);
}

// Get redemption by ID
export function getRedemptionById(id: string): RedemptionRecord | undefined {
  return getAllRedemptions().find(r => r.id === id);
}

// Update redemption status (for admin or tracking updates)
export function updateRedemptionStatus(
  redemptionId: string,
  newStatus: RedemptionRecord['status'],
  trackingNumber?: string
): boolean {
  const redemptions = getAllRedemptions();
  const index = redemptions.findIndex(r => r.id === redemptionId);

  if (index === -1) return false;

  redemptions[index].status = newStatus;
  if (trackingNumber && redemptions[index].deliveryDetails) {
    redemptions[index].deliveryDetails!.trackingNumber = trackingNumber;
  }

  saveRedemptions(redemptions);
  return true;
}

// Check if user has already redeemed a specific reward
export function hasRedeemedReward(rewardId: string): boolean {
  const redemptions = getAllRedemptions();
  return redemptions.some(r => r.rewardId === rewardId);
}

// Get count of redeemed rewards
export function getRedemptionCount(): number {
  return getAllRedemptions().length;
}

// Get rewards by status
export function getRedemptionsByStatus(
  status: RedemptionRecord['status']
): RedemptionRecord[] {
  return getAllRedemptions().filter(r => r.status === status);
}

// Clear all redemptions (for testing or reset)
export function clearAllRedemptions(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Export redemption history as JSON (for backup)
export function exportRedemptionHistory(): string {
  return JSON.stringify(getAllRedemptions(), null, 2);
}
