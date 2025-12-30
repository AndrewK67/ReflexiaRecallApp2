# Deployment Guide - Reflexia App

## Quick Deploy Options

You have multiple options to deploy the Reflexia app. Choose the one that works best for you.

---

## Option 1: Netlify Drop (Easiest - No Account Required for Testing)

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Visit:** https://app.netlify.com/drop

3. **Drag and drop** the `dist/` folder onto the page

4. **Done!** You'll get a live URL instantly (e.g., `https://random-name-123456.netlify.app`)

---

## Option 2: Netlify CLI (Recommended)

You're already logged into Netlify CLI! Just follow these steps:

1. **Build the production app:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   ```bash
   netlify deploy --prod
   ```

3. **Follow the prompts:**
   - Choose "Create & configure a new project"
   - Site name: `reflexia-app` (or choose your own)
   - Publish directory: `dist`

4. **Your site will be live!** The URL will be shown in the terminal.

---

## Option 3: Netlify Dashboard (Most Control)

1. **Push to GitHub** (optional but recommended):
   ```bash
   # Create a new repository on GitHub first, then:
   git remote add origin https://github.com/YOUR_USERNAME/reflexia-app.git
   git push -u origin master
   ```

2. **Go to:** https://app.netlify.com/

3. **Click:** "Add new site" → "Import an existing project"

4. **Connect your Git provider** (GitHub, GitLab, etc.)

5. **Select** your repository

6. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - (These are pre-configured in `netlify.toml`)

7. **Deploy!** Netlify will build and deploy automatically.

### Continuous Deployment
Once connected to Git, Netlify will automatically redeploy when you push changes to the master branch.

---

## Option 4: Vercel (Alternative Platform)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Follow prompts** to link/create project

4. **Done!** Your site is live.

---

## Post-Deployment Configuration

### Custom Domain (Optional)

1. **In Netlify Dashboard:**
   - Site settings → Domain management
   - Add custom domain
   - Follow DNS configuration instructions

2. **HTTPS:** Automatically enabled by Netlify

### Environment Variables (If using AI features)

If you enable AI features in the app, set environment variables:

1. **In Netlify Dashboard:**
   - Site settings → Environment variables
   - Add: `VITE_GEMINI_API_KEY=your_key_here`

2. **Redeploy** after adding variables

---

## Deployment Status

✅ **Ready to deploy!**
- Git repository initialized
- Production build verified (252 KB, 79 KB gzipped)
- Netlify configuration (`netlify.toml`) created
- PWA service worker configured
- All files committed

---

## Recommended: Option 2 (Netlify CLI)

Since you're already logged in to Netlify CLI, here's the complete workflow:

```bash
# 1. Build the app
npm run build

# 2. Deploy to production
netlify deploy --prod

# When prompted:
# - Choose: "Create & configure a new project"
# - Site name: reflexia-app
# - Publish directory: dist

# 3. Your site is live! 🎉
```

---

## Testing Your Deployment

After deployment, test these features:

- [ ] App loads correctly
- [ ] Onboarding flow works
- [ ] Reflection creation works
- [ ] Data persists across refreshes
- [ ] PWA installable (Add to Home Screen)
- [ ] Works offline after first visit
- [ ] Navigation functions correctly
- [ ] All tools accessible
- [ ] Responsive on mobile devices

---

## Deployment URLs

After deploying, you'll get:

- **Netlify:** `https://your-site-name.netlify.app`
- **Vercel:** `https://your-project-name.vercel.app`

You can customize these with a custom domain later.

---

## Troubleshooting

### Build fails
- Ensure Node.js 18+ is installed
- Clear node_modules: `rm -rf node_modules && npm install`
- Try building locally first: `npm run build`

### App not working after deployment
- Check browser console for errors
- Verify all assets are loaded (no 404s)
- Clear cache and hard reload (Ctrl+Shift+R)

### PWA not installing
- Ensure site is served over HTTPS (automatic on Netlify/Vercel)
- Check service worker registration in DevTools

---

## Need Help?

- **Netlify Docs:** https://docs.netlify.com/
- **Vercel Docs:** https://vercel.com/docs
- **PWA Debugging:** Use Chrome DevTools → Application tab

---

**Your app is production-ready and waiting to be deployed! 🚀**
