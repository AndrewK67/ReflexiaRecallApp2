# Setting Up Netlify Deploy Notifications

Follow these steps to get notified when your Reflexia app deploys to Netlify.

## Quick Setup (5 minutes)

### Step 1: Access Netlify Dashboard
1. Go to https://app.netlify.com
2. Log in to your account
3. Click on your **Reflexia site** (ReflexiaRecallApp2 or similar)

### Step 2: Open Deploy Notifications
1. Click **"Site settings"** (left sidebar or top menu)
2. Scroll down to **"Build & deploy"** section
3. Click **"Deploy notifications"**

### Step 3: Add Email Notifications

#### ✅ Deploy Succeeded Notification
1. Click **"Add notification"**
2. Select **"Email notification"**
3. Choose event: **"Deploy succeeded"**
4. Enter your email address
5. Click **"Save"**

Now you'll get an email every time a deploy completes successfully!

#### 🔴 Deploy Failed Notification (Recommended)
1. Click **"Add notification"** again
2. Select **"Email notification"**
3. Choose event: **"Deploy failed"**
4. Enter your email address
5. Click **"Save"**

You'll be notified immediately if a build fails.

#### 🟡 Deploy Started Notification (Optional)
1. Click **"Add notification"**
2. Select **"Email notification"**
3. Choose event: **"Deploy started"**
4. Enter your email address
5. Click **"Save"**

Useful if you want to know when builds begin.

---

## Advanced Options

### Slack Notifications (If you use Slack)
1. Click **"Add notification"**
2. Select **"Slack notification"**
3. Choose event (Deploy succeeded/failed/started)
4. Click **"Authorize with Slack"**
5. Select your Slack channel
6. Click **"Save"**

### Webhook Notifications (For developers)
1. Click **"Add notification"**
2. Select **"Outgoing webhook"**
3. Choose event
4. Enter webhook URL (your custom endpoint)
5. Click **"Save"**

### GitHub Commit Status (Automatic)
Netlify automatically updates GitHub commit status, so you'll see:
- ✅ Green checkmark on commits when deploy succeeds
- ❌ Red X when deploy fails

---

## What Notifications Look Like

### Email - Deploy Succeeded
```
Subject: Deploy succeeded for reflexia-app

Your site reflexia-app has been successfully deployed!

Deploy URL: https://reflexia-app.netlify.app
Deploy ID: 64f8b2a1...
Branch: master
Commit: 27b1cb6 - Add pack trial system...

View deploy details: [Link]
```

### Email - Deploy Failed
```
Subject: Deploy failed for reflexia-app

Build failed for reflexia-app

Error: Build command failed
Exit code: 1

View build log: [Link]
```

---

## Testing Your Notifications

### Quick Test
1. Make a small change to any file (e.g., add a comment to README.md)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test deploy notification"
   git push
   ```
3. Check your email in 2-5 minutes
4. You should receive a "Deploy succeeded" email!

---

## Notification Settings Overview

| Notification Type | When to Use | Priority |
|------------------|-------------|----------|
| Deploy Succeeded | Always | ⭐⭐⭐ High |
| Deploy Failed | Always | ⭐⭐⭐ High |
| Deploy Started | If you want to track timing | ⭐⭐ Medium |
| Deploy Locked/Unlocked | For team workflows | ⭐ Low |
| Form Submissions | If you have contact forms | ⭐⭐ Medium |

---

## Recommended Setup

For a solo developer, I recommend:
- ✅ **Deploy Succeeded** - Know when updates go live
- ✅ **Deploy Failed** - Fix issues immediately
- ❌ **Deploy Started** - Usually not needed (creates too many emails)

For a team:
- ✅ All of the above
- ✅ Slack notifications to team channel
- ✅ GitHub commit status (automatic)

---

## Troubleshooting

### Not Receiving Emails?
1. Check spam/junk folder
2. Verify email address in Netlify settings
3. Check Netlify notification settings are enabled
4. Wait 5-10 minutes (notifications can be delayed)

### Too Many Emails?
- Remove "Deploy Started" notifications
- Use Slack instead for less intrusive updates
- Set up filters in your email client

### Email Going to Spam?
- Add noreply@netlify.com to your contacts
- Mark Netlify emails as "Not Spam"
- Create email filter to always go to inbox

---

## Quick Reference

**Access Deploy Notifications:**
Dashboard → Site Settings → Build & Deploy → Deploy Notifications

**Netlify Support:**
https://docs.netlify.com/configure-builds/notifications/

**Your Current Deploy:**
https://app.netlify.com/sites/YOUR-SITE-NAME/deploys

---

## Next Steps After Setup

1. ✅ Make a test commit to trigger notification
2. ✅ Verify you receive the email
3. ✅ Bookmark your Netlify deploys page
4. ✅ Consider adding Netlify status badge to README

You're all set! You'll now know immediately when your Reflexia app updates go live on Netlify.
