# Reflexia Update Tracking Guide

## How to Know When the App is Updated

### 1. **For Users (In-App Notifications)**

#### Automatic Update Banner
When a new version is deployed to Netlify, users will see:
- A **cyan/indigo banner** at the top of the screen
- Message: "Update Available - A new version of Reflexia is ready"
- Two options:
  - **"Update Now"** - Refreshes the app immediately with the new version
  - **Dismiss (X)** - Hides the banner but keeps using current version

#### Version Display in Settings
Users can check their current version:
1. Go to **Neural Link** (Settings/Profile page)
2. Scroll to the bottom
3. See version info card showing:
   - Version number (e.g., "1.0.0")
   - Build date (e.g., "2026-01-02")

### 2. **For You (Developer - Netlify Notifications)**

#### A. Netlify Deploy Notifications
Set up notifications in Netlify:
1. Go to **Netlify Dashboard** → Your Site → **Site Settings**
2. **Build & Deploy** → **Deploy notifications**
3. Add notifications for:
   - **Deploy succeeded** - Email/Slack when builds complete
   - **Deploy failed** - Get alerted if build fails
   - **Deploy started** - Know when deployment begins

#### B. Netlify Status Badge
Add a deploy status badge to your README:
```markdown
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE-NAME/deploys)
```
- Shows real-time deploy status
- Green = deployed successfully
- Yellow = building
- Red = failed

#### C. Netlify Deploy Previews
- Every git push triggers a build
- Check **Deploys** tab in Netlify dashboard
- See deploy log, preview URL, and timestamp

### 3. **How the Update System Works**

#### PWA Service Worker
- App uses **Progressive Web App (PWA)** technology
- Service worker checks for updates periodically
- When new version detected → shows update banner

#### Update Flow
1. You push code to GitHub
2. Netlify builds and deploys new version
3. Service worker detects new files
4. Banner appears for users on **next visit or reload**
5. User clicks "Update Now" → app refreshes with new version

#### Update Detection Settings
Located in `vite.config.ts`:
```typescript
VitePWA({
  registerType: 'prompt',  // Shows banner (not auto-update)
  workbox: {
    skipWaiting: false,    // Wait for user confirmation
    clientsClaim: false    // Don't claim clients immediately
  }
})
```

### 4. **Version Management**

#### Updating the Version Number
When releasing a new version:
1. Edit `package.json`:
   ```json
   "version": "1.0.0"  // Increment this
   ```
2. Edit `src/constants.ts`:
   ```typescript
   export const APP_VERSION = '1.0.0';  // Keep in sync
   ```
3. Commit and push to trigger deploy

#### Build Date
- Automatically set during build
- Injected via Vite at build time
- Shows when the current build was created

### 5. **Testing Updates Locally**

#### Development Mode
```bash
npm run dev
```
- Changes reload automatically
- No service worker in dev mode

#### Production Preview
```bash
npm run build
npm run preview
```
- Simulates production build
- Tests service worker behavior
- Update banner appears when you build twice

### 6. **Troubleshooting**

#### Users Not Seeing Updates
- **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Clear cache**: Browser settings → Clear cache and reload
- **Check network**: Service worker requires internet connection

#### Update Banner Not Showing
- Only appears when new version is actually deployed
- May take a few minutes after deploy for detection
- Users must revisit app (not leave tab open)

### 7. **Best Practices**

#### Version Numbering (Semantic Versioning)
- **1.0.0** → **1.0.1**: Bug fixes, small changes
- **1.0.0** → **1.1.0**: New features, no breaking changes
- **1.0.0** → **2.0.0**: Major changes, breaking changes

#### Deploy Timing
- Deploy during low-traffic hours if possible
- Test in Netlify deploy preview first
- Check build logs for errors

#### User Communication
- For major updates, consider adding release notes
- Could add a "What's New" modal after update
- Users can always check version in settings

## Quick Reference

| What | Where | How |
|------|-------|-----|
| Current version | Neural Link → Bottom | Scroll to see version card |
| Check for updates | Automatic | Banner appears when available |
| Deploy status | Netlify Dashboard | Deploys tab |
| Build logs | Netlify | Click on specific deploy |
| Force check | Reload page | Ctrl+R or F5 |
| Clear updates | Browser | Hard refresh (Ctrl+Shift+R) |

## Support

If users report not seeing updates:
1. Check Netlify deploy status
2. Verify build succeeded
3. Check browser console for errors
4. Have user try hard refresh
5. Verify service worker is registered (DevTools → Application → Service Workers)
