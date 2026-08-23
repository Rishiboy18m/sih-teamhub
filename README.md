# 🚀 SIH TeamHub — Production Deployment & Developer Guide

**SIH TeamHub** is a production-ready, full-stack collaborative workspace application engineered specifically for teams competing in hackathons such as the **Smart India Hackathon (SIH)**.

---

## 📁 1. Project Folder & Component Structure

- **Frontend Folder**: `client/` (React 18 + Vite + Tailwind CSS v4 + Lucide Icons)
- **Backend Folder**: `server/` (Node.js + Express REST API + Multer File Storage)
- **Database**: Relational SQLite3 database (`sih_teamhub.db`) managed via `server/db.js` with `DATABASE_PATH` support.
- **Environment Configuration**: Root `.env` file (see `.env.example` for variable template).

---

## 🛠️ 2. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide React, Recharts, React Router v6
- **Backend**: Node.js, Express.js, Cors, Multer, Dotenv
- **Database**: SQLite3 (18 Relational Tables with `team_id` data isolation)
- **Security**: JWT Bearer Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`), File Extension Filters
- **AI Integration**: Context-Aware Server-Side AI Assistant (`server/routes/ai.js`)

---

## ⚙️ 3. Environment Variables Configuration

Copy `.env.example` to `.env` in the project root and configure your production values:

```env
# Server Port (Default: 5000)
PORT=5000

# Environment Mode ('production' or 'development')
NODE_ENV=production

# Secret Key for JWT Token Generation (Use a strong random string in production)
JWT_SECRET=your_jwt_secret_key_here

# Database File Path (Default: ./server/sih_teamhub.db)
DATABASE_PATH=./server/sih_teamhub.db

# Frontend API URL Base (Leave as '/api' for single-port deployment)
VITE_API_URL=/api

# Optional External AI API Key (Gemini / OpenAI API)
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **SECURITY WARNING**: Never commit real `.env` files or API secrets to public repositories!

---

## 💻 4. Local Development vs Production Commands

### Local Development Setup
```bash
# 1. Install root dependencies
npm install

# 2. Install client dependencies
cd client
npm install
cd ..

# 3. Start development client (Vite dev server)
cd client
npm run dev

# 4. Start backend API server (Node.js Express)
node server/index.js
```

### Production Build & Execution Commands
```bash
# 1. Build the production React client bundle into client/dist
cd client
npm run build
cd ..

# 2. Start the single-port production server (Hosts both API and Client static assets)
node server/index.js
```

---

## 🌐 5. Production Deployment Architecture & Hosting Options

### Recommended Architecture: **Single-Service Full-Stack Deployment**
The Express backend is pre-configured to automatically host static production files from `client/dist` when built. This means you can deploy the entire application (Frontend + Backend + SQLite DB + Uploads) on a single web service.

### Option A: Deploy on **Render.com** (Recommended for Beginners ⭐)

1. **Push Code to GitHub**: Push your project repository to GitHub.
2. **Create New Web Service on Render**:
   - Log in to [Render.com](https://render.com) and click **New +** -> **Web Service**.
   - Connect your GitHub repository.
3. **Configure Build & Start Settings**:
   - **Environment**: Node
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `node server/index.js`
4. **Add Environment Variables in Render Dashboard**:
   - Add `NODE_ENV` = `production`
   - Add `JWT_SECRET` = `(Generate a long random string)`
   - Add `PORT` = `10000` (or leave default)
5. **Attach Persistent Disk (Optional for File Uploads & SQLite persistence)**:
   - In Render Web Service settings, add a **Persistent Disk** mounted at `/var/data`.
   - Set environment variable `DATABASE_PATH` = `/var/data/sih_teamhub.db`.
6. **Deploy**: Click **Create Web Service**. Your app will be live at `https://your-app-name.onrender.com`!

---

### Option B: Separate Frontend (Vercel) + Backend (Railway / Render)

If you prefer deploying the frontend and backend on separate services:

1. **Backend Deployment (Railway / Render)**:
   - Deploy `server/` with Start Command `node server/index.js`.
   - Set `JWT_SECRET` and `DATABASE_PATH`.
   - Copy your live backend URL (e.g., `https://sih-backend.up.railway.app`).

2. **Frontend Deployment (Vercel)**:
   - Connect repository to Vercel.
   - Set Root Directory to `client`.
   - Set Environment Variable `VITE_API_URL` = `https://sih-backend.up.railway.app/api`.
   - Click **Deploy**.

---

## 🔑 6. Default Demo Credentials

| Role | Email | Password | Team Code |
| :--- | :--- | :--- | :--- |
| 🛡️ **Team Leader** | `leader@cyberknights.com` | `password123` | `SIH-2026-X` |
| 👤 **Team Member** | `dev@cyberknights.com` | `password123` | `SIH-2026-X` |

---

## 🧪 7. Production Verification Checklist

- [x] Relative `/api` paths used (No hardcoded `localhost` URLs)
- [x] Single-port production Express static file hosting enabled (`client/dist`)
- [x] File extension security filter & 50MB upload size limit enforced
- [x] Password hashes stripped from JSON API responses
- [x] Multi-tenant team data isolation verified across 18 SQLite tables
- [x] Frontend compiled into production bundle (`npm run build`: 0 errors)
