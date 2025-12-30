# GitHub Setup & Continuous Deployment Guide

This guide will walk you through pushing your Reflexia app to GitHub and setting up automatic deployment with Netlify.

---

## Step 1: Create a GitHub Repository

### Option A: Using GitHub Website (Recommended for beginners)

1. **Go to GitHub:** https://github.com/new

2. **Fill in repository details:**
   - **Repository name:** `reflexia-app` (or your preferred name)
   - **Description:** `Personal reflection and well-being companion - A comprehensive PWA with reflection models, gamification, and wellness tools`
   - **Visibility:** Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Click "Create repository"**

4. **Copy the repository URL** shown on the next page (it will look like: `https://github.com/YOUR-USERNAME/reflexia-app.git`)

### Option B: Using GitHub CLI (Advanced)

```bash
# Install GitHub CLI if you don't have it
# Windows: winget install GitHub.cli
# Mac: brew install gh

# Login to GitHub
gh auth login

# Create repository
gh repo create reflexia-app --public --description "Personal reflection and well-being companion"
```

---

## Step 2: Connect Your Local Repository to GitHub

Open your terminal in the project directory and run:

```bash
cd C:\Users\andre\reflexia-app

# Add GitHub as remote origin (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/reflexia-app.git

# Verify the remote was added
git remote -v
```

You should see:
```
origin  https://github.com/YOUR-USERNAME/reflexia-app.git (fetch)
origin  https://github.com/YOUR-USERNAME/reflexia-app.git (push)
```

---

## Step 3: Push Your Code to GitHub

```bash
# Push to GitHub (first time)
git push -u origin master

# If you prefer 'main' instead of 'master':
# git branch -M main
# git push -u origin main
```

**If prompted for credentials:**
- **Username:** Your GitHub username
- **Password:** Use a Personal Access Token (not your GitHub password)
  - Create token at: https://github.com/settings/tokens
  - Permissions needed: `repo` (full control of private repositories)

---

## Step 4: Verify Upload

1. Go to your GitHub repository: `https://github.com/YOUR-USERNAME/reflexia-app`
2. You should see all your files uploaded
3. The README.md will be displayed on the repository homepage

---

## Step 5: Set Up Netlify Continuous Deployment

### Option A: Netlify Dashboard (Easiest)

1. **Go to Netlify:** https://app.netlify.com/

2. **Click:** "Add new site" → "Import an existing project"

3. **Choose:** "Deploy with GitHub"
   - You'll be asked to authorize Netlify to access your GitHub account
   - Click "Authorize Netlify"

4. **Select your repository:** `YOUR-USERNAME/reflexia-app`

5. **Configure build settings:**
   - **Branch to deploy:** `master` (or `main`)
   - **Build command:** `npm run build` (should be pre-filled from netlify.toml)
   - **Publish directory:** `dist` (should be pre-filled from netlify.toml)

6. **Click "Deploy site"**

7. **Wait for build to complete** (~2-3 minutes)

8. **Your site is live!** You'll get a URL like: `https://random-name-123456.netlify.app`

### Option B: Netlify CLI

```bash
cd C:\Users\andre\reflexia-app

# Link to GitHub-connected site
netlify link

# Deploy
netlify deploy --prod
```

---

## Step 6: Customize Your Deployment

### Change Site Name

1. In Netlify Dashboard, go to: **Site settings** → **General** → **Site details**
2. Click "Change site name"
3. Enter: `reflexia-app` (or your preferred name)
4. Your new URL: `https://reflexia-app.netlify.app`

### Add Custom Domain (Optional)

1. Go to: **Site settings** → **Domain management**
2. Click "Add custom domain"
3. Follow instructions to configure DNS

### Enable Deploy Previews

Netlify automatically enables:
- ✅ **Deploy Previews** - Every pull request gets a preview URL
- ✅ **Branch Deploys** - Deploy other branches for testing
- ✅ **Auto Deploys** - Every push to master triggers a new deploy

---

## Step 7: Update Badge in README (Optional)

After deployment, update the Netlify badge in README.md:

1. Go to: **Site settings** → **Status badges**
2. Copy the markdown code
3. Replace the badge in README.md line 3

---

## Workflow: Making Updates

After initial setup, your workflow becomes:

```bash
# 1. Make changes to your code
# ... edit files ...

# 2. Commit changes
git add .
git commit -m "Description of changes"

# 3. Push to GitHub
git push

# 4. Netlify automatically deploys! 🚀
# - Build starts within seconds
# - Usually completes in 1-2 minutes
# - Site updates automatically
```

Check deployment status:
- Netlify Dashboard: https://app.netlify.com/
- Or add the status badge to your README

---

## Environment Variables (If using AI features)

If you enable AI features in the app:

### Step 1: Create .env file locally (don't commit!)

```bash
# In project root
echo "VITE_GEMINI_API_KEY=your_actual_api_key_here" > .env.local
```

### Step 2: Add to Netlify

1. **Netlify Dashboard** → **Site settings** → **Environment variables**
2. Click "Add a variable"
3. **Key:** `VITE_GEMINI_API_KEY`
4. **Value:** Your API key
5. **Scopes:** Production and Deploy Previews
6. Click "Create variable"
7. **Redeploy** the site (Settings → Deploys → Trigger deploy)

---

## Troubleshooting

### Push rejected: "Updates were rejected"
```bash
# Pull latest changes first
git pull origin master --rebase
git push origin master
```

### Authentication failed
- Use Personal Access Token instead of password
- Create at: https://github.com/settings/tokens
- Or use SSH keys: https://docs.github.com/en/authentication

### Build fails on Netlify
1. Check build logs in Netlify Dashboard
2. Ensure Node.js version matches (18+)
3. Try building locally: `npm run build`
4. Check that `netlify.toml` is committed

### Site shows old version
- Clear browser cache (Ctrl+Shift+R)
- Check deploy status in Netlify
- Verify latest commit hash matches

---

## Repository Settings (Recommended)

### Protect Main Branch

1. GitHub repo → **Settings** → **Branches**
2. Add branch protection rule for `master`/`main`
3. Enable:
   - ✅ Require pull request reviews
   - ✅ Require status checks (Netlify deploy)
   - ✅ Include administrators (optional)

### Enable GitHub Pages (Optional)

If you want GitHub-hosted version too:
1. **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `master` → `/dist`
4. Your site: `https://YOUR-USERNAME.github.io/reflexia-app/`

---

## Summary

✅ **What you've accomplished:**
1. Created a Git repository with all code
2. Uploaded to GitHub
3. Connected GitHub to Netlify
4. Enabled continuous deployment
5. Got a live production URL

✅ **What happens now:**
- Every `git push` triggers automatic deployment
- Changes go live in ~2 minutes
- Old versions are kept as rollback points
- Pull requests get preview URLs

---

## Next Steps

1. **Share your app:** Send the Netlify URL to others
2. **Custom domain:** Add your own domain name
3. **Collaborate:** Invite contributors on GitHub
4. **Monitor:** Check Netlify analytics and logs

---

## Quick Reference

### Repository URL
```
https://github.com/YOUR-USERNAME/reflexia-app
```

### Deployment URLs
- **Netlify:** https://your-site-name.netlify.app
- **GitHub Pages:** https://YOUR-USERNAME.github.io/reflexia-app/ (if enabled)

### Useful Links
- **GitHub Repo:** https://github.com/YOUR-USERNAME/reflexia-app
- **Netlify Dashboard:** https://app.netlify.com/
- **Build Logs:** Netlify Dashboard → Deploys → [Latest deploy]

---

**Your app is now set up for continuous deployment! 🎉**

Every code change you push will automatically go live within minutes.
