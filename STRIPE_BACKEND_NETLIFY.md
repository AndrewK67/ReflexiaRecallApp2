# Stripe Backend Implementation (Netlify Functions)
## Serverless Stripe Integration

**Time to implement: 20-30 minutes**

This guide shows you how to create a simple serverless backend for Stripe payments using Netlify Functions.

---

## WHY YOU NEED A BACKEND

Stripe **requires a backend** to create checkout sessions securely. Your Stripe **secret key** must NEVER be exposed in frontend code.

**What the backend does:**
1. Accepts request from frontend (create checkout)
2. Uses secret key to talk to Stripe API
3. Returns session ID to frontend
4. Frontend redirects user to Stripe Checkout

**Why Netlify Functions:**
- ✅ Serverless (no server to maintain)
- ✅ Already set up (your app is on Netlify)
- ✅ Free for low volume
- ✅ Easy to deploy

---

## STEP 1: Install Stripe for Backend

In your project:

```bash
cd reflexia-app
npm install stripe --save
```

**Not** `@stripe/stripe-js` (that's frontend). This is the Node.js `stripe` package.

---

## STEP 2: Create Netlify Functions Directory

```bash
mkdir -p netlify/functions
```

---

## STEP 3: Create Checkout Function

Create `netlify/functions/create-checkout-session.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { priceId, mode, successUrl, cancelUrl, customerEmail } = JSON.parse(event.body);

    // Validate input
    if (!priceId || !mode || !successUrl || !cancelUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: mode, // 'subscription' or 'payment'
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      // Allow promo codes
      allow_promotion_codes: true,
      // Collect billing address
      billing_address_collection: 'required',
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: session.id }),
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

---

## STEP 4: Create Verify Session Function

Create `netlify/functions/verify-session.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const sessionId = event.queryStringParameters.session_id;

    if (!sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing session_id' }),
      };
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Get subscription details if applicable
    let subscriptionDetails = null;
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      subscriptionDetails = {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        mode: session.mode,
        customerId: session.customer,
        subscriptionId: session.subscription,
        currentPeriodEnd: subscriptionDetails?.currentPeriodEnd,
        ...subscriptionDetails,
      }),
    };
  } catch (error) {
    console.error('Verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

---

## STEP 5: Create Customer Portal Function

Create `netlify/functions/create-portal-session.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { customerId, returnUrl } = JSON.parse(event.body);

    if (!customerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing customerId' }),
      };
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'https://reflexia-recall.netlify.app',
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('Portal error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

---

## STEP 6: Create Webhook Handler (Optional but Recommended)

Create `netlify/functions/stripe-webhook.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: 'Webhook Error' };
  }

  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      const session = stripeEvent.data.object;
      console.log('Payment successful:', session.id);
      // TODO: Send confirmation email to customer
      break;

    case 'customer.subscription.updated':
      const subscription = stripeEvent.data.object;
      console.log('Subscription updated:', subscription.id);
      break;

    case 'customer.subscription.deleted':
      const deletedSub = stripeEvent.data.object;
      console.log('Subscription cancelled:', deletedSub.id);
      break;

    case 'invoice.payment_failed':
      const invoice = stripeEvent.data.object;
      console.log('Payment failed:', invoice.id);
      // TODO: Send payment failure email
      break;

    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
```

---

## STEP 7: Update netlify.toml

Create or update `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

This makes your functions accessible at `/api/function-name`.

---

## STEP 8: Add Environment Variables to Netlify

1. Go to **Netlify Dashboard** → Your Site → Site Settings
2. Go to **Environment Variables** (in sidebar)
3. Add:

**STRIPE_SECRET_KEY** (Test)
- Key: `STRIPE_SECRET_KEY`
- Value: `sk_test_YOUR_TEST_SECRET_KEY`
- (Get from Stripe Dashboard → Developers → API keys)

**STRIPE_WEBHOOK_SECRET** (Optional)
- Key: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_YOUR_WEBHOOK_SECRET`
- (Get from Stripe Dashboard → Developers → Webhooks)

**IMPORTANT:** When you go live, update `STRIPE_SECRET_KEY` to your **live** secret key (`sk_live_...`).

---

## STEP 9: Update stripeService.ts

Update your frontend to use the Netlify functions:

```typescript
// src/services/stripeService.ts

export async function createCheckoutSession(
  priceId: string,
  mode: 'subscription' | 'payment' = 'subscription'
): Promise<{ error?: string; sessionId?: string }> {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      return { error: 'Stripe failed to load' };
    }

    // Call your Netlify function
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        mode,
        customerEmail: localStorage.getItem('userEmail') || undefined,
        successUrl: `${window.location.origin}?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}?canceled=true`,
      }),
    });

    const session = await response.json();

    if (session.error) {
      return { error: session.error };
    }

    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (error) {
      return { error: error.message };
    }

    return { sessionId: session.id };
  } catch (error: any) {
    console.error('Checkout error:', error);
    return { error: error.message || 'Failed to create checkout session' };
  }
}
```

---

## STEP 10: Test Locally (Optional)

Install Netlify CLI:

```bash
npm install -g netlify-cli
```

Test functions locally:

```bash
netlify dev
```

This runs your app at `http://localhost:8888` with functions at `http://localhost:8888/.netlify/functions/...`

Test checkout:
```bash
curl -X POST http://localhost:8888/.netlify/functions/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_YOUR_PRICE_ID",
    "mode": "subscription",
    "successUrl": "http://localhost:8888?session_id={CHECKOUT_SESSION_ID}",
    "cancelUrl": "http://localhost:8888?canceled=true"
  }'
```

Should return: `{"id":"cs_test_..."}`

---

## STEP 11: Deploy

```bash
git add .
git commit -m "Add Stripe backend functions"
git push
```

Netlify will automatically deploy your functions!

---

## STEP 12: Test on Production

1. Go to your deployed app
2. Click "Upgrade to Pro"
3. Fill in Stripe checkout (use test card: `4242 4242 4242 4242`)
4. Complete payment
5. Should redirect back with session ID
6. Features should unlock

---

## TESTING CHECKLIST

- [ ] Functions deploy without errors
- [ ] Can create checkout session
- [ ] Redirects to Stripe Checkout
- [ ] Can complete payment with test card
- [ ] Redirects back to app after payment
- [ ] Session verification works
- [ ] Features unlock after payment
- [ ] Customer portal link works (for subscriptions)

---

## WEBHOOKS (Optional but Recommended)

Webhooks notify you when subscription changes happen (renewal, cancellation, payment failure).

### Setup:

1. **Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint:** `https://reflexia-recall.netlify.app/.netlify/functions/stripe-webhook`
3. **Select events:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. **Copy webhook secret** → Add to Netlify environment as `STRIPE_WEBHOOK_SECRET`
5. **Deploy** (functions will now handle webhooks)

### Test Webhooks:

Use Stripe CLI:
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

---

## TROUBLESHOOTING

### "Function not found"

- Check `netlify.toml` exists and specifies functions directory
- Check function files are in `netlify/functions/`
- Redeploy

### "Stripe error: No such price"

- Price ID is wrong
- Using test price ID with live key (or vice versa)
- Create products in Stripe Dashboard first

### "CORS error"

- Add `'Access-Control-Allow-Origin': '*'` to headers in functions
- Already included in code above

### "Cannot read secret key"

- Environment variable not set in Netlify
- Typo in variable name
- Need to redeploy after adding env vars

---

## GOING LIVE

When ready for real payments:

1. **Activate Stripe account** (verify business, add bank)
2. **Get live secret key** from Stripe Dashboard
3. **Update Netlify environment variable:**
   - Change `STRIPE_SECRET_KEY` from `sk_test_...` to `sk_live_...`
4. **Update webhook** endpoint (if using) to live mode
5. **Update frontend** publishable key to `pk_live_...`
6. **Test with real card** (use small amount first!)
7. **Launch!**

---

## COSTS

**Netlify Functions:**
- Free: 125,000 requests/month
- Paid: $25/mo for 2M requests
- **Your usage:** Probably free tier (unless you get HUGE)

**Stripe:**
- 1.5% + 20p per successful UK card charge
- 2.9% + 20p for international cards
- No monthly fees
- No setup fees

---

## SUMMARY

You now have a complete serverless Stripe backend!

**Files created:**
- `netlify/functions/create-checkout-session.js`
- `netlify/functions/verify-session.js`
- `netlify/functions/create-portal-session.js`
- `netlify/functions/stripe-webhook.js`
- `netlify.toml`

**Next:**
- Deploy and test
- Update frontend to use functions
- Test payment flow end-to-end
- Go live when ready!

---

**Total implementation time: 20-30 minutes**

**Questions?** Check Stripe docs: https://stripe.com/docs/checkout/quickstart
