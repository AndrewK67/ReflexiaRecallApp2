# 🔒 Security Notice - API Key

## ⚠️ IMPORTANT: API Key Security

Your `.env` file containing a Gemini API key was **removed from git tracking** before pushing to GitHub.

However, the API key was included in the **initial commit** (commit `a872fd2`).

---

## 🛡️ What You Need to Do

### Before Pushing to GitHub:

**Option 1: Regenerate API Key (Recommended)**
1. Go to Google AI Studio: https://aistudio.google.com/app/apikey
2. Delete the old API key: `AIzaSyD9lRnmyih39UWFCHe4ESyycTx_BCJ8g6Y`
3. Create a new API key
4. Update your local `.env` file with the new key
5. **Do NOT commit the new .env file**

**Option 2: Rewrite Git History (Advanced)**

If you want to completely remove the API key from git history:

```bash
# WARNING: This rewrites commit history
# Use with caution

# Remove .env from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force garbage collection
git gc --aggressive --prune=now
```

**After rewriting history, you'll need to force push:**
```bash
git push -u origin master --force
```

---

## ✅ What's Already Done

- ✅ `.env` removed from git tracking (commit `430730e`)
- ✅ `.gitignore` updated to prevent future `.env` commits
- ✅ `.env.example` created as template (without real keys)

---

## 🔐 Best Practices Going Forward

### 1. Never Commit API Keys

API keys, passwords, and secrets should NEVER be in git.

### 2. Use Environment Variables

**Local Development:**
- Create `.env` file (already gitignored)
- Add your API keys there
- Example:
  ```
  VITE_GEMINI_API_KEY=your_actual_key_here
  ```

**Production (Netlify):**
- Add environment variables in Netlify Dashboard
- Site Settings → Environment variables
- Add: `VITE_GEMINI_API_KEY` with your key

### 3. Use .env.example

We've included `.env.example` as a template:

```bash
# Copy template
cp .env.example .env

# Edit with your actual keys
nano .env  # or open in your editor
```

### 4. Check Before Committing

Always check what you're committing:

```bash
git status
git diff --staged
```

If you see `.env` or any file with secrets, DON'T commit!

---

## 🚨 If You've Already Pushed to GitHub

If you accidentally pushed the API key to GitHub:

1. **Immediately regenerate the API key** at https://aistudio.google.com/app/apikey
2. Delete the compromised key
3. Update your local `.env` with the new key
4. Consider using `git filter-branch` to remove the key from history (see Option 2 above)

---

## 📋 Checklist Before Pushing

- [ ] `.env` is NOT tracked by git (run `git status` to verify)
- [ ] Old API key has been regenerated (if pushing to GitHub)
- [ ] New API key is only in local `.env` file (not in git)
- [ ] `.gitignore` includes `.env` (already done ✅)

---

## 📚 Resources

- **Google AI Studio API Keys:** https://aistudio.google.com/app/apikey
- **Git Filter Branch:** https://git-scm.com/docs/git-filter-branch
- **GitHub Secret Scanning:** https://docs.github.com/en/code-security/secret-scanning

---

## ✅ Ready to Push

Once you've regenerated the API key (or rewritten history), you're safe to push to GitHub:

```bash
git remote add origin https://github.com/YOUR-USERNAME/reflexia-app.git
git push -u origin master
```

---

**Stay secure! 🔒**
