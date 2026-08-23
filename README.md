# 🚀 SIH TeamHub — $0 Free Production Deployment & Developer Guide

**SIH TeamHub** is a production-ready, full-stack collaborative workspace application engineered specifically for teams competing in hackathons such as the **Smart India Hackathon (SIH)**.

---

## 🎨 1. Palette & Design Tokens

| Palette Swatch | Tone | Hex Code | UI Component Implementation |
| :--- | :--- | :--- | :--- |
| **Cream Background** | Warm Soft Cream | `#FAF5E8` / `#FFFFFF` | Application background, header bar, sidebar, and container cards |
| **Mint Teal** | Mint Turquoise Teal | `#58C4C4` / `#37A3A3` | Primary brand accent, active navigation, primary CTAs |
| **Coral Salmon** | Coral / Salmon Orange | `#F48B67` / `#D86B47` | Critical priority badges, Leader badges, overdue alerts |
| **Golden Butter** | Golden Butter Yellow | `#FCD575` / `#FFF9E8` | Highlight cards, milestone indicators, code boxes |
| **Typography** | Deep Espresso Brown | `#2B2523` / `#6B615C` | High-contrast readable typography |

---

## 📁 2. Project Component Breakdown

- **Frontend Folder**: `client/` (React 18 + Vite + Tailwind CSS v4 + Lucide Icons)
- **Backend Folder**: `server/` (Express REST API) & `api/index.js` (Vercel Serverless Function entrypoint)
- **Database**: 
  - *Local*: SQLite3 (`sih_teamhub.db`)
  - *Vercel $0 Cloud*: **Turso Cloud SQLite** (9 GB Free DB, 0sleep pauses)
- **Configuration**: Root `vercel.json` & `.env` file (template in `.env.example`).

---

## ⚙️ 3. Environment Variables Configuration

Copy `.env.example` to `.env` and fill in values for local or cloud production:

```env
# Server Port (Default: 5000)
PORT=5000

# Environment Mode ('production' or 'development')
NODE_ENV=production

# Secret Key for JWT Token Generation (Use a strong random string in production)
JWT_SECRET=your_jwt_secret_key_here

# 100% FREE Turso Cloud SQLite Database (Required for Vercel $0 persistence)
# Create a free DB at https://turso.tech (9 GB Free DB, 0-second sleep delays)
TURSO_DATABASE_URL=libsql://your-db-name-your-user.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here

# Frontend API URL Base (Leave as '/api' for single-repo Vercel deployment)
VITE_API_URL=/api

# Optional External AI API Key (Gemini / OpenAI API)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🌐 4. Step-by-Step $0 Vercel Deployment Guide

Deploying **SIH TeamHub** to Vercel is **100% FREE ($0/month)** with zero subscription costs and **instant load times (no sleep delays)**!

### Step 1: Create a Free Cloud SQLite Database on Turso (2 minutes)
1. Go to **[Turso.tech](https://turso.tech)** and sign up for a free account (No credit card needed!).
2. Create a new free database:
   ```bash
   turso db create sih-teamhub
   turso db show sih-teamhub
   ```
3. Copy your **Database URL** (e.g. `libsql://sih-teamhub-user.turso.io`) and generate an **Auth Token**:
   ```bash
   turso db tokens create sih-teamhub
   ```

### Step 2: Deploy to Vercel for $0
1. Go to **[Vercel.com](https://vercel.com)** and sign in with your GitHub account.
2. Click **Add New...** -> **Project**.
3. Import your repository: **`Rishiboy18m/sih-teamhub`**.
4. Leave Framework Preset as **Other** (Vercel automatically detects `vercel.json`).
5. Open the **Environment Variables** section and add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `sih_super_secret_jwt_key_2026_x`
   - `TURSO_DATABASE_URL` = `libsql://sih-teamhub-user.turso.io`
   - `TURSO_AUTH_TOKEN` = `(Your Turso Token)`
6. Click **Deploy**!

🎉 Your website is live with **$0 cost forever** at:
👉 **`https://sih-teamhub.vercel.app`**

---

## 🔑 5. Default Demo Credentials

| Role | Email | Password | Team Code |
| :--- | :--- | :--- | :--- |
| 🛡️ **Team Leader** | `leader@cyberknights.com` | `password123` | `SIH-2026-X` |
| 👤 **Team Member** | `dev@cyberknights.com` | `password123` | `SIH-2026-X` |
