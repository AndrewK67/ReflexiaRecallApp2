import { useState, useMemo } from 'react';
import { Gift, Star, Package, Download, Calendar, ShoppingCart, Check, Sparkles, TrendingUp } from 'lucide-react';
import {
  REWARDS_CATALOG,
  Reward,
  RewardCategory,
  RewardType,
  formatXP,
  getRewardsByCategory,
  getRewardsByType,
  getAffordableRewards,
  getTotalCost
} from '../services/rewardsCatalogService';
import {
  redeemDigitalReward,
  redeemPhysicalReward,
  redeemExperienceReward,
  hasRedeemedReward,
  DeliveryDetails
} from '../services/rewardsRedemptionService';

interface RewardsStoreProps {
  currentXP: number;
  onXPChange: (newXP: number) => void;
  userEmail?: string;
}

type FilterType = 'all' | RewardCategory;
type SortType = 'xp-low' | 'xp-high' | 'name' | 'type';

export default function RewardsStore({ currentXP, onXPChange, userEmail }: RewardsStoreProps) {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('xp-low');
  const [showOnlyAffordable, setShowOnlyAffordable] = useState(false);

  // Filtered and sorted rewards
  const displayedRewards = useMemo(() => {
    let filtered = [...REWARDS_CATALOG];

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = getRewardsByCategory(filterCategory as RewardCategory);
    }

    // Apply affordability filter
    if (showOnlyAffordable) {
      filtered = filtered.filter(r => r.xpCost <= currentXP);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'xp-low':
          return a.xpCost - b.xpCost;
        case 'xp-high':
          return b.xpCost - a.xpCost;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [filterCategory, sortBy, showOnlyAffordable, currentXP]);

  const handleRewardClick = (reward: Reward) => {
    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const closeModal = () => {
    setSelectedReward(null);
    setShowRedeemModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Gift className="text-purple-600" size={32} />
                Rewards Store
              </h1>
              <p className="text-gray-600 mt-1">Redeem your hard-earned XP for valuable resources</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Your Balance</div>
              <div className="text-4xl font-bold text-purple-600 flex items-center gap-2">
                <Star className="text-yellow-500" size={32} />
                {formatXP(currentXP)} XP
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{REWARDS_CATALOG.length}</div>
              <div className="text-sm text-gray-600">Total Rewards</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {getAffordableRewards(currentXP).length}
              </div>
              <div className="text-sm text-gray-600">Affordable Now</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {REWARDS_CATALOG.filter(r => r.type === 'digital').length}
              </div>
              <div className="text-sm text-gray-600">Digital Items</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {REWARDS_CATALOG.filter(r => r.type === 'physical').length}
              </div>
              <div className="text-sm text-gray-600">Physical Items</div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as FilterType)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="guides">Guides</option>
                <option value="checklists">Checklists</option>
                <option value="cards">Cards</option>
                <option value="tools">Tools</option>
                <option value="experiences">Experiences</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="xp-low">XP: Low to High</option>
                <option value="xp-high">XP: High to Low</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
              </select>
            </div>

            {/* Affordable Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyAffordable}
                onChange={(e) => setShowOnlyAffordable(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Show only affordable</span>
            </label>

            <div className="ml-auto text-sm text-gray-500">
              Showing {displayedRewards.length} reward{displayedRewards.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              currentXP={currentXP}
              onClick={() => handleRewardClick(reward)}
              alreadyRedeemed={hasRedeemedReward(reward.id)}
            />
          ))}
        </div>

        {displayedRewards.length === 0 && (
          <div className="text-center py-16">
            <Gift className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No rewards found</h3>
            <p className="text-gray-500">
              Try adjusting your filters or keep earning XP to unlock more rewards!
            </p>
          </div>
        )}
      </div>

      {/* Redemption Modal */}
      {showRedeemModal && selectedReward && (
        <RedemptionModal
          reward={selectedReward}
          currentXP={currentXP}
          userEmail={userEmail}
          onClose={closeModal}
          onSuccess={(newXP) => {
            onXPChange(newXP);
            closeModal();
          }}
        />
      )}
    </div>
  );
}

// Reward Card Component
interface RewardCardProps {
  reward: Reward;
  currentXP: number;
  onClick: () => void;
  alreadyRedeemed: boolean;
}

function RewardCard({ reward, currentXP, onClick, alreadyRedeemed }: RewardCardProps) {
  const canAfford = currentXP >= reward.xpCost;
  const totalCost = getTotalCost(reward);

  const typeIcon = {
    digital: <Download size={20} />,
    physical: <Package size={20} />,
    experience: <Calendar size={20} />
  };

  const typeColor = {
    digital: 'text-blue-600 bg-blue-50',
    physical: 'text-orange-600 bg-orange-50',
    experience: 'text-purple-600 bg-purple-50'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${
        canAfford ? 'border-green-200 hover:border-green-400' : 'border-gray-200 hover:border-gray-300'
      } ${!canAfford && 'opacity-70'}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-lg ${typeColor[reward.type]}`}>
            {typeIcon[reward.type]}
          </div>
          {alreadyRedeemed && (
            <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Check size={12} />
              Redeemed
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{reward.name}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{reward.description}</p>

        {/* Highlights */}
        {reward.highlights.slice(0, 3).map((highlight, idx) => (
          <div key={idx} className="flex items-start gap-2 mb-1">
            <Sparkles size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-700">{highlight}</span>
          </div>
        ))}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600 flex items-center gap-1">
                <Star size={20} className="text-yellow-500" />
                {formatXP(reward.xpCost)}
              </div>
              {reward.shippingCost && reward.shippingCost > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  + £{reward.shippingCost.toFixed(2)} shipping
                </div>
              )}
            </div>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                canAfford
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!canAfford}
            >
              {canAfford ? 'Redeem' : 'Locked'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Redemption Modal Component
interface RedemptionModalProps {
  reward: Reward;
  currentXP: number;
  userEmail?: string;
  onClose: () => void;
  onSuccess: (newXP: number) => void;
}

function RedemptionModal({ reward, currentXP, userEmail, onClose, onSuccess }: RedemptionModalProps) {
  const [step, setStep] = useState<'confirm' | 'details' | 'success'>('confirm');
  const [email, setEmail] = useState(userEmail || '');
  const [deliveryDetails, setDeliveryDetails] = useState<Partial<DeliveryDetails>>({
    email: userEmail || '',
    country: 'United Kingdom',
    shippingCost: reward.shippingCost || 0
  });
  const [preferredTimes, setPreferredTimes] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleConfirm = () => {
    if (reward.type === 'digital') {
      setStep('details');
    } else if (reward.type === 'physical') {
      setStep('details');
    } else if (reward.type === 'experience') {
      setStep('details');
    }
  };

  const handleRedeem = () => {
    setError('');

    if (reward.type === 'digital') {
      if (!email) {
        setError('Please provide your email address');
        return;
      }
      const result = redeemDigitalReward(reward.id, currentXP, email);
      if (result.success && result.newXP !== undefined) {
        setSuccessMessage(result.message);
        setStep('success');
        setTimeout(() => onSuccess(result.newXP!), 2000);
      } else {
        setError(result.message);
      }
    } else if (reward.type === 'physical') {
      const result = redeemPhysicalReward(reward.id, currentXP, deliveryDetails as DeliveryDetails);
      if (result.success && result.newXP !== undefined) {
        setSuccessMessage(result.message);
        setStep('success');
        setTimeout(() => onSuccess(result.newXP!), 2000);
      } else {
        setError(result.message);
      }
    } else if (reward.type === 'experience') {
      if (!email) {
        setError('Please provide your email address');
        return;
      }
      const result = redeemExperienceReward(reward.id, currentXP, email, preferredTimes);
      if (result.success && result.newXP !== undefined) {
        setSuccessMessage(result.message);
        setStep('success');
        setTimeout(() => onSuccess(result.newXP!), 2000);
      } else {
        setError(result.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {step === 'confirm' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Redemption</h2>

            <div className="bg-purple-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{reward.name}</h3>
              <p className="text-gray-700 mb-4">{reward.longDescription}</p>

              <div className="space-y-2 mb-4">
                {reward.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>

              {reward.includes && (
                <div className="border-t border-purple-200 pt-4">
                  <div className="font-semibold text-gray-900 mb-2">Includes:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {reward.includes.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">XP Cost:</span>
                <span className="text-2xl font-bold text-purple-600">{formatXP(reward.xpCost)} XP</span>
              </div>
              {reward.shippingCost && reward.shippingCost > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Shipping:</span>
                  <span className="text-lg font-semibold text-gray-800">£{reward.shippingCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-700">Your Balance After:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatXP(currentXP - reward.xpCost)} XP
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {reward.type === 'digital' && 'Email Address'}
              {reward.type === 'physical' && 'Delivery Details'}
              {reward.type === 'experience' && 'Contact Details'}
            </h2>

            {reward.type === 'digital' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Download link will be sent to this email</p>
                </div>
              </div>
            )}

            {reward.type === 'physical' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={deliveryDetails.fullName || ''}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                  <input
                    type="text"
                    value={deliveryDetails.addressLine1 || ''}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, addressLine1: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                  <input
                    type="text"
                    value={deliveryDetails.addressLine2 || ''}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, addressLine2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Apt 4B (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      value={deliveryDetails.city || ''}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="London"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postcode *</label>
                    <input
                      type="text"
                      value={deliveryDetails.postcode || ''}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, postcode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="SW1A 1AA"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={deliveryDetails.email || ''}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone (optional)</label>
                  <input
                    type="tel"
                    value={deliveryDetails.phone || ''}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="+44 7123 456789"
                  />
                </div>
              </div>
            )}

            {reward.type === 'experience' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Times (optional)
                  </label>
                  <textarea
                    value={preferredTimes}
                    onChange={(e) => setPreferredTimes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="e.g., Weekday evenings after 6pm, or Saturday mornings"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleRedeem}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Redeem Now
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check size={48} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-700">{successMessage}</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 mb-6">
              <div className="text-sm text-gray-600 mb-2">XP Spent:</div>
              <div className="text-3xl font-bold text-purple-600 mb-4">
                -{formatXP(reward.xpCost)} XP
              </div>
              <div className="text-sm text-gray-600 mb-2">New Balance:</div>
              <div className="text-2xl font-bold text-green-600">
                {formatXP(currentXP - reward.xpCost)} XP
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Redirecting...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
