# Reflexia Pro Implementation Guide
## How to Wire Everything Together

**Time to implement: 2-4 hours**

This guide shows you exactly how to integrate all the payment, legal, and feature-gating components into your existing Reflexia app.

---

## QUICK START CHECKLIST

Before you begin, you need:

- [ ] **Stripe account** - Sign up at https://stripe.com (free, instant)
- [ ] **Stripe test keys** - Get from Stripe Dashboard → Developers → API keys
- [ ] **Stripe products created** - Pro Monthly (£4.99/mo), Pro Annual (£49/yr), Lifetime (£99)
- [ ] **Stripe SDK installed** - Run: `npm install @stripe/stripe-js`
- [ ] **Contact info** - Your support@ and refunds@ email addresses

---

## STEP 1: Install Dependencies

```bash
cd reflexia-app
npm install @stripe/stripe-js
```

That's it! All other components are already created.

---

## STEP 2: Configure Stripe

### A. Get Your Stripe Keys

1. Sign up at https://stripe.com
2. Go to Dashboard → Developers → API keys
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)

### B. Update Stripe Service

Edit `src/services/stripeService.ts`:

```typescript
// Line 13-14: Replace with your actual keys
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE'; // ← Replace this

// After creating products in Stripe, update these price IDs:
export const STRIPE_PRICES = {
  proMonthly: 'price_YOUR_MONTHLY_PRICE_ID',    // ← Replace
  proAnnual: 'price_YOUR_ANNUAL_PRICE_ID',      // ← Replace
  lifetime: 'price_YOUR_LIFETIME_PRICE_ID',     // ← Replace
};
```

### C. Create Products in Stripe Dashboard

1. Go to Stripe Dashboard → Products
2. Click "Add Product"
3. Create three products:

**Product 1: Pro Monthly**
- Name: "Reflexia Pro Monthly"
- Price: £4.99
- Billing: Recurring monthly
- Copy the Price ID (price_xxx...)

**Product 2: Pro Annual**
- Name: "Reflexia Pro Annual"
- Price: £49
- Billing: Recurring yearly
- Copy the Price ID

**Product 3: Lifetime**
- Name: "Reflexia Lifetime Pro"
- Price: £99
- Billing: One time
- Copy the Price ID

4. Paste these Price IDs into `stripeService.ts` (step B above)

---

## STEP 3: Update App.tsx

Add the new components and logic to your main App.tsx file.

### A. Add Imports (top of file)

```typescript
// Add these imports to existing ones
import { CookieConsent } from './components/CookieConsent';
import { LegalAcceptance, hasAcceptedLegal } from './components/LegalAcceptance';
import Checkout from './components/Checkout';
import { Paywall, ReflectionLimitPaywall } from './components/Paywall';
import {
  getUserTier,
  canAccessView,
  hasHitReflectionLimit,
  getRemainingReflections,
} from './services/subscriptionService';
import { handlePaymentSuccess } from './services/stripeService';
```

### B. Add State Variables (in App component)

```typescript
export default function App() {
  // ... existing state ...

  // Add these new state variables:
  const [showLegalAcceptance, setShowLegalAcceptance] = useState(!hasAcceptedLegal());
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaywall, setShowPaywall] = useState<{
    show: boolean;
    feature: string;
    reason: string;
  }>({ show: false, feature: '', reason: '' });
  const [userTier, setUserTier] = useState(getUserTier());

  // ... rest of component ...
}
```

### C. Add Payment Success Handler (in useEffect)

```typescript
useEffect(() => {
  // Check for Stripe redirect (payment success)
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  if (sessionId) {
    handlePaymentSuccess(sessionId).then(() => {
      setUserTier(getUserTier());
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Show success message
      alert('Welcome to Reflexia Pro! 🎉');
    });
  }
}, []);
```

### D. Update View Change Handler

Replace your existing `handleViewChange` or add this logic:

```typescript
const handleViewChange = (newView: ViewState) => {
  // Check if user can access this view (feature gating)
  if (!canAccessView(newView)) {
    setShowPaywall({
      show: true,
      feature: newView,
      reason: `${newView.replace('_', ' ')} is a Pro feature`,
    });
    return;
  }

  setView(newView);
};
```

### E. Add Reflection Limit Check

Before creating a new reflection, add this check:

```typescript
const handleStartReflection = (model: string) => {
  // Check reflection limit for free tier
  if (hasHitReflectionLimit()) {
    setShowPaywall({
      show: true,
      feature: 'unlimited-reflections',
      reason: 'You\'ve reached the 50 reflection limit on the Free tier',
    });
    return;
  }

  // Continue with reflection
  setView('REFLECTION');
  // ... rest of your logic ...
};
```

### F. Add Components to Render (in return statement)

```typescript
return (
  <div className="App">
    {/* Legal Acceptance (first-time users) */}
    {showLegalAcceptance && (
      <LegalAcceptance
        onAccept={() => setShowLegalAcceptance(false)}
      />
    )}

    {/* Cookie Consent Banner */}
    <CookieConsent />

    {/* Checkout Modal */}
    {showCheckout && (
      <Checkout onClose={() => setShowCheckout(false)} />
    )}

    {/* Paywall Modal */}
    {showPaywall.show && (
      showPaywall.feature === 'unlimited-reflections' ? (
        <ReflectionLimitPaywall
          remaining={getRemainingReflections() || 0}
          onUpgrade={() => {
            setShowPaywall({ show: false, feature: '', reason: '' });
            setShowCheckout(true);
          }}
          onClose={() => setShowPaywall({ show: false, feature: '', reason: '' })}
        />
      ) : (
        <Paywall
          feature={showPaywall.feature}
          reason={showPaywall.reason}
          onUpgrade={() => {
            setShowPaywall({ show: false, feature: '', reason: '' });
            setShowCheckout(true);
          }}
          onClose={() => setShowPaywall({ show: false, feature: '', reason: '' })}
        />
      )
    )}

    {/* Rest of your app */}
    {/* ... existing components ... */}
  </div>
);
```

---

## STEP 4: Add "Upgrade to Pro" Button to Dashboard

In your Dashboard component, add an upgrade button:

```typescript
// In Dashboard.tsx or wherever you render the dashboard

import { getUserTier } from '../services/subscriptionService';

// In component:
const userTier = getUserTier();

// In render (add to header or top of dashboard):
{userTier === 'free' && (
  <button
    onClick={() => setView('CHECKOUT')} // or setShowCheckout(true)
    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold hover:scale-105 transition flex items-center gap-2"
  >
    <Crown size={16} />
    Upgrade to Pro
  </button>
)}
```

---

## STEP 5: Add Free Tier Indicator

Show users how many reflections they have left:

```typescript
// In Dashboard or Profile:
import { getRemainingReflections } from '../services/subscriptionService';

const remaining = getRemainingReflections();

// In render:
{remaining !== null && (
  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
    <p className="text-amber-200 text-sm text-center">
      {remaining > 0
        ? `${remaining} reflections remaining on Free tier`
        : 'Reflection limit reached. Upgrade to Pro for unlimited reflections.'}
    </p>
  </div>
)}
```

---

## STEP 6: Add Profile Subscription Section

In your Profile/Settings component:

```typescript
import { getUserTier, getTierDisplayName, getSubscriptionStatus } from '../services/subscriptionService';
import { createPortalSession } from '../services/stripeService';

// In component:
const tier = getUserTier();
const tierName = getTierDisplayName(tier);
const status = getSubscriptionStatus();

// In render:
<div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-4">
  <h3 className="text-lg font-bold text-white mb-2">Subscription</h3>

  <div className="flex items-center justify-between mb-4">
    <div>
      <p className="text-white/60 text-sm">Current Plan</p>
      <p className="text-white font-bold text-xl">{tierName}</p>
    </div>

    {tier === 'free' && (
      <button
        onClick={() => setShowCheckout(true)}
        className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition"
      >
        Upgrade
      </button>
    )}
  </div>

  {(tier === 'pro' || tier === 'enterprise') && (
    <button
      onClick={async () => {
        const { url, error } = await createPortalSession();
        if (url) window.location.href = url;
        else if (error) alert(error);
      }}
      className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15 transition"
    >
      Manage Subscription
    </button>
  )}
</div>
```

---

## STEP 7: Update Legal Docs with Contact Info

Replace placeholders in all legal documents:

**Files to update:**
- `TERMS_OF_USE.md`
- `PRIVACY_POLICY.md`
- `REFUND_POLICY.md`
- `DISCLAIMER.md`

**Replace:**
- `[YOUR EMAIL]` → `support@reflexia.app` (or your actual email)
- `[YOUR NAME/COMPANY]` → Your legal entity name
- `[YOUR ADDRESS]` → Your business address
- `[YOUR WEBSITE]` → Your domain

**Quick find & replace:**
```bash
# macOS/Linux:
find . -name "*.md" -exec sed -i '' 's/\[YOUR EMAIL\]/support@reflexia.app/g' {} +

# Windows (PowerShell):
Get-ChildItem -Recurse -Filter *.md | ForEach-Object {
  (Get-Content $_.FullName) -replace '\[YOUR EMAIL\]', 'support@reflexia.app' | Set-Content $_.FullName
}
```

Or manually edit each file.

---

## STEP 8: Create Backend for Stripe (REQUIRED)

Stripe requires a backend to create checkout sessions securely. You have three options:

### Option A: Netlify Functions (EASIEST - Recommended)

Create `netlify/functions/create-checkout-session.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { priceId, mode, successUrl, cancelUrl } = JSON.parse(event.body);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

**Setup:**
1. Install Stripe for backend: `npm install stripe --save-dev`
2. Add `STRIPE_SECRET_KEY` to Netlify environment variables
3. Deploy!

See `STRIPE_BACKEND_NETLIFY.md` for complete guide (creating next).

### Option B: Vercel Functions

Similar to Netlify, create `/api/create-checkout-session.js`

### Option C: Simple Express Server

Host a tiny Node.js server with the Stripe endpoints.

**I'll create a detailed guide for Netlify Functions next** (most common for static sites).

---

## STEP 9: Test Everything

### A. Test Mode (Free)

1. Use Stripe test mode (test keys start with `pk_test_`)
2. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
3. Test checkout flow
4. Verify features unlock after "payment"

### B. Test Flows

- [ ] First-time legal acceptance shows
- [ ] Cookie consent banner appears
- [ ] Free tier: Try to create 51st reflection (should show paywall)
- [ ] Free tier: Try to access Mental Atlas (should show paywall)
- [ ] Click "Upgrade to Pro" button
- [ ] Complete checkout (test mode)
- [ ] Features unlock after payment
- [ ] Profile shows "Pro" tier
- [ ] Manage Subscription link works

### C. Test Edge Cases

- [ ] Cancel checkout (should return to app)
- [ ] Clear localStorage and reload (legal acceptance again)
- [ ] Reject cookies (app still works)

---

## STEP 10: Go Live

When ready to accept real payments:

### A. Activate Stripe Account

1. Complete Stripe business verification
2. Add bank details
3. Provide tax information

### B. Switch to Live Mode

1. Get **live** publishable key (starts with `pk_live_`)
2. Replace test key in `stripeService.ts`
3. Update Netlify environment with **live** secret key
4. Test with real card (use small amount first!)

### C. Update Pricing (Optional)

- Early bird: £99 lifetime
- Later: Increase to £149

### D. Launch!

- Remove "BETA" labels
- Announce on social media
- Post to Product Hunt
- Reach out to professional communities

---

## TROUBLESHOOTING

### "Stripe failed to load"

- Check publishable key is correct
- Check internet connection
- Check browser console for errors

### Checkout redirects but nothing happens

- Backend not set up correctly
- Check Netlify Functions logs
- Verify secret key in environment

### Features don't unlock after payment

- Check `handlePaymentSuccess` is called
- Check subscription saved to localStorage
- Try refreshing page

### Free tier limit not enforced

- Check `hasHitReflectionLimit()` is called before creating reflection
- Verify entries are being counted correctly

---

## QUICK REFERENCE

**User Tiers:**
- `free` - 50 reflections, 1 regulatory body, basic features
- `pro` - Unlimited everything
- `lifetime` - Same as Pro, one-time payment
- `enterprise` - Pro + team features (future)

**Key Functions:**
- `getUserTier()` - Get current tier
- `canAccessFeature(feature)` - Check if feature allowed
- `canAccessView(view)` - Check if view allowed
- `hasHitReflectionLimit()` - Check if at 50 reflection limit
- `getRemainingReflections()` - Get reflections left (or null if unlimited)

**Prices:**
- Pro Monthly: £4.99/month
- Pro Annual: £49/year (17% off)
- Lifetime: £99 (early bird) → £149

---

## NEXT STEPS

1. **Set up Stripe account** (10 minutes)
2. **Install dependencies** (1 minute)
3. **Update stripeService.ts** with keys (2 minutes)
4. **Update App.tsx** with new components (30 minutes)
5. **Create Netlify Functions** for backend (20 minutes)
6. **Update legal docs** with contact info (10 minutes)
7. **Test thoroughly** in test mode (30 minutes)
8. **Deploy** (5 minutes)
9. **Go live** when ready!

**Total implementation time: 2-4 hours**

---

**Ready to implement?** Follow this guide step-by-step and you'll have a fully functional paid tier system!

See also:
- `STRIPE_BACKEND_NETLIFY.md` - Complete backend implementation
- `MONETIZATION_STRATEGY.md` - Pricing and revenue projections
- `LAUNCH_CHECKLIST.md` - Full launch plan
