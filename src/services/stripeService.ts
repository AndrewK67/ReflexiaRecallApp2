/**
 * Stripe Service
 * Handles payment processing, subscriptions, and customer management
 *
 * SETUP REQUIRED:
 * 1. Sign up for Stripe: https://stripe.com
 * 2. Get your publishable key from Stripe Dashboard
 * 3. Create products in Stripe Dashboard:
 *    - Pro Monthly (£2.99/month)
 *    - Pro Annual (£25/year)
 *    - Lifetime (£75 one-time)
 * 4. Replace STRIPE_PUBLISHABLE_KEY below with your actual key
 * 5. Install Stripe: npm install @stripe/stripe-js
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { setUserTier, type UserTier } from './subscriptionService';

// REPLACE THIS with your actual Stripe publishable key
// Get it from: https://dashboard.stripe.com/apikeys
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE'; // TODO: Replace with your key

// Product Price IDs (create these in Stripe Dashboard, then paste IDs here)
export const STRIPE_PRICES = {
  proMonthly: 'price_YOUR_MONTHLY_PRICE_ID',    // £2.99/month
  proAnnual: 'price_YOUR_ANNUAL_PRICE_ID',      // £25/year
  lifetime: 'price_YOUR_LIFETIME_PRICE_ID',     // £75 one-time
};

let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe instance (lazy loaded)
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

/**
 * Create checkout session for subscription or one-time payment
 */
export async function createCheckoutSession(
  priceId: string,
  mode: 'subscription' | 'payment' = 'subscription'
): Promise<{ error?: string; sessionId?: string }> {
  try {
    // In production, this should call your backend API
    // For now, we'll use Stripe Checkout directly

    const stripe = await getStripe();
    if (!stripe) {
      return { error: 'Stripe failed to load' };
    }

    // Get or create customer ID
    const customerId = localStorage.getItem('stripeCustomerId');
    const customerEmail = localStorage.getItem('userEmail') || undefined;

    // Create checkout session via your backend
    // IMPORTANT: You need to create a backend endpoint for this
    // See implementation guide below

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        mode,
        customerId,
        customerEmail,
        successUrl: `${window.location.origin}?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}?canceled=true`,
      }),
    });

    const session = await response.json();

    if (session.error) {
      return { error: session.error };
    }

    // Redirect to Stripe Checkout
    // Modern approach: redirect to session.url returned from backend
    // If backend doesn't return URL, fallback to client-side redirect with session ID
    if (session.url) {
      window.location.href = session.url;
      return { sessionId: session.id };
    } else {
      // Fallback to client-side redirect (requires session ID)
      window.location.href = `https://checkout.stripe.com/c/pay/${session.id}`;
      return { sessionId: session.id };
    }
  } catch (error: any) {
    console.error('Checkout error:', error);
    return { error: error.message || 'Failed to create checkout session' };
  }
}

/**
 * Handle successful payment (called after redirect from Stripe)
 */
export async function handlePaymentSuccess(sessionId: string): Promise<void> {
  try {
    // Verify session with your backend
    const response = await fetch(`/api/verify-session?session_id=${sessionId}`);
    const data = await response.json();

    if (data.success) {
      // Update user tier based on purchase
      const tier: UserTier = data.mode === 'payment' ? 'lifetime' : 'pro';

      setUserTier(tier, {
        tier,
        status: 'active',
        subscriptionId: data.subscriptionId,
        customerId: data.customerId,
        currentPeriodEnd: data.currentPeriodEnd,
      });

      // Store customer ID for future use
      if (data.customerId) {
        localStorage.setItem('stripeCustomerId', data.customerId);
      }
    }
  } catch (error) {
    console.error('Payment verification error:', error);
  }
}

/**
 * Create customer portal session (for managing subscriptions)
 */
export async function createPortalSession(): Promise<{ url?: string; error?: string }> {
  try {
    const customerId = localStorage.getItem('stripeCustomerId');

    if (!customerId) {
      return { error: 'No customer ID found' };
    }

    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        returnUrl: window.location.origin,
      }),
    });

    const session = await response.json();

    if (session.error) {
      return { error: session.error };
    }

    return { url: session.url };
  } catch (error: any) {
    console.error('Portal error:', error);
    return { error: error.message || 'Failed to create portal session' };
  }
}

/**
 * Get subscription details
 */
export async function getSubscriptionDetails(): Promise<any> {
  try {
    const customerId = localStorage.getItem('stripeCustomerId');

    if (!customerId) {
      return null;
    }

    const response = await fetch(`/api/subscription?customer_id=${customerId}`);
    return await response.json();
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return null;
  }
}

/**
 * Cancel subscription (at period end)
 */
export async function cancelSubscription(): Promise<{ success: boolean; error?: string }> {
  try {
    const subscriptionId = JSON.parse(
      localStorage.getItem('subscriptionStatus') || '{}'
    ).subscriptionId;

    if (!subscriptionId) {
      return { success: false, error: 'No active subscription' };
    }

    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    });

    const data = await response.json();

    if (data.success) {
      // Update local status
      const currentStatus = JSON.parse(localStorage.getItem('subscriptionStatus') || '{}');
      currentStatus.cancelAtPeriodEnd = true;
      localStorage.setItem('subscriptionStatus', JSON.stringify(currentStatus));
    }

    return data;
  } catch (error: any) {
    console.error('Cancel error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get pricing for display
 */
export function getPricing() {
  return [
    {
      id: 'pro-monthly',
      name: 'Pro Monthly',
      price: '£2.99',
      interval: '/month',
      priceId: STRIPE_PRICES.proMonthly,
      mode: 'subscription' as const,
      features: [
        'Unlimited reflections',
        'All 29 regulatory bodies',
        'AI-powered insights',
        'Mental Atlas',
        'Advanced analytics',
        'No ads',
      ],
      recommended: false,
    },
    {
      id: 'pro-annual',
      name: 'Pro Annual',
      price: '£25',
      interval: '/year',
      savings: 'Save £10.88 (30% off)',
      priceId: STRIPE_PRICES.proAnnual,
      mode: 'subscription' as const,
      features: [
        'Everything in Pro Monthly',
        'Save 30% vs monthly',
        'Billed annually',
      ],
      recommended: true,
    },
    {
      id: 'lifetime',
      name: 'Lifetime Pro',
      price: '£75',
      interval: 'one-time',
      originalPrice: '£150',
      savings: 'Early Bird Special',
      priceId: STRIPE_PRICES.lifetime,
      mode: 'payment' as const,
      features: [
        'Everything in Pro',
        'Pay once, use forever',
        'All future updates included',
        'No recurring fees',
      ],
      recommended: false,
      badge: 'Best Value',
    },
  ];
}

// ============================================================
// BACKEND IMPLEMENTATION REQUIRED
// ============================================================
//
// You need to create a simple backend with these endpoints:
//
// 1. POST /api/create-checkout-session
//    - Creates Stripe Checkout session
//    - Returns session ID
//
// 2. GET /api/verify-session?session_id=xxx
//    - Verifies payment success
//    - Returns customer and subscription details
//
// 3. POST /api/create-portal-session
//    - Creates Stripe Customer Portal session
//    - Returns portal URL
//
// 4. GET /api/subscription?customer_id=xxx
//    - Gets subscription details
//
// 5. POST /api/cancel-subscription
//    - Cancels subscription at period end
//
// See STRIPE_BACKEND_GUIDE.md for implementation examples
//
// OPTIONS FOR BACKEND:
// - Netlify Functions (serverless, easiest)
// - Vercel Functions
// - Simple Node/Express server
// - AWS Lambda
//
// ============================================================
