# Deployment & Migration Plan

This document explains how to move web application from a computer to a live server so everyone can use it.

---

## 1. What needs to be moved?

### Backend:
- `backend/main.py` - the main FastAPI app
- `backend/models.py` - database tables
- `backend/routes/` - all the API endpoints
- `backend/requirements.txt` - Python packages needed
- `backend/.env` - secret keys and API keys (IMPORTANT!)
- `backend/finance.db` - the database file

### Frontend:
- `src/` - all React components
- `package.json` - Node packages
- `vite.config.js` - build settings
- `.env.production` - production API URL

### Database:
- `finance.db` - SQLite file with all user data

---

## 2. Where to deploy?

### Backend: Railway
- Free tier available
- Good for Python/FastAPI
- Auto-deploys from GitHub
- URL: something like `https://finance-production-xyz.up.railway.app`

### Frontend: Vercel
- Free for React/Vite projects
- Super easy to use
- URL: something like `https://finance-hub.vercel.app`

---

## 3. How to deploy backend

### Step 1: Prepare files
```bash
cd backend

# Make sure requirements.txt exists
pip freeze > requirements.txt

# Create .env file for production
# - SECRET_KEY (random long string)
# - FINNHUB_API_KEY (get from Finnhub)
# - DATABASE_URL
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Ready to deploy"
git push
```

### Step 3: Connect to Railway
1. Go to railway.app
2. Sign in with GitHub
3. Create new project
4. Select "Deploy from GitHub"
5. Choose your repo
6. Add environment variables from .env
7. It should deploy automatically

### Step 4: Get the URL
After deployment, Railway gives you a URL. Copy it.
Example: `https://finance-production.up.railway.app`

---

## 4. How to deploy frontend

### Step 1: Update environment
Create `.env.production`:
```
VITE_API_URL=https://finance-production.up.railway.app
```

Update `src/services/api.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

### Step 2: Build and push
```bash
npm run build
git add .
git commit -m "Add production env"
git push
```

### Step 3: Deploy on Vercel
1. Go to vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Select your repository
5. Add environment variable: `VITE_API_URL=your-railway-url`
6. Click Deploy

Done! Vercel gives you a URL to share.

---

## 5. What to test after deployment

### Check 1: Can you login?
- Go to the Vercel URL
- Try to register
- Try to login
- Should work without errors

### Check 2: Can you add data?
- Add a transaction
- Refresh the page
- Transaction should still be there (means database working)

### Check 3: Can you add assets?
- Add a stock or crypto
- Should show the price from Finnhub
- Delete it to make sure delete works

### Check 4: Is logout working?
- Click logout
- Try to change URL to `/portfolio`
- Should redirect back to login

### Check 5: Portfolio chart
- Add some assets
- Portfolio page should load
- Chart should show data

---

## 6. Common problems & fixes

| Problem | Fix |
|---------|-----|
| "Cannot connect to API" | Check CORS in backend - make sure frontend URL is allowed |
| "Login not working" | Check SECRET_KEY is same in production |
| "Assets not loading prices" | Check FINNHUB_API_KEY is in Railway env vars |
| "Page shows 404" | Check Vercel build settings |
| "Database errors" | Maybe the SQLite file didn't copy - check Railway filesystem |

---

