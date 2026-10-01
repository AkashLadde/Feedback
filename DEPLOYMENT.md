# 🌐 Free Live Hosting Guide: GNDEC CSE-ICB LabGuard Platform

This guide provides step-by-step instructions to host the complete application (Frontend + Backend + SQLite Database + Geofencing + 1-Min Dynamic QR) **100% Free** on **Render** (or **Railway / Render + Vercel**).

---

## 🚀 Option 1: Render (Recommended — 100% Free & Simplest)

Render provides a **free web service tier** with automatic SSL (`https://`), continuous deployment from GitHub, and support for Node.js + SQLite.

### Step 1: Push Code to GitHub
1. Create a free account at [github.com](https://github.com).
2. Open PowerShell or Terminal in this folder (`feedback`):
   ```bash
   git init
   git add .
   git commit -m "GNDEC CSE-ICB LabGuard Platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/gndec-feedback.git
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com) and sign in (using GitHub).
2. Click **"New +"** → **"Web Service"**.
3. Select your GitHub repository (`gndec-feedback`).
4. Configure the settings:
   - **Name**: `gndec-cse-feedback` (or your chosen name)
   - **Region**: `Singapore` (Fastest for India)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run install:all && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: **Free** ($0/month)
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `gndec_labguard_secure_jwt_secret_2026_key`
6. Click **"Create Web Service"**.

Render will automatically install dependencies, build the React frontend, compile the TypeScript backend, initialize the SQLite database with official GNDEC data, and give you a live URL like:
👉 `https://gndec-cse-feedback.onrender.com`

---

## ⚡ Option 2: Instant Local Tunnel (For Live Demonstrations in College)
If you want to demo the system live to teachers or students right now from your laptop:

1. Open PowerShell in the project root:
   ```bash
   npm run tunnel
   ```
2. You will receive a public HTTPS URL (e.g. `https://cool-campus-app.loca.lt`).
3. Anyone on campus can scan the QR codes or log in directly from their mobile phones!

---

## 🔑 Default Production Credentials
* **Administrator**: `admin@gndec.ac.in` | Password: `Admin@123`
* **Faculty Login**: Institutional Email (e.g. `harish.joshi@gndec.ac.in`, `aarti.pawar@gndec.ac.in`, `ashok.bawge@gndec.ac.in`) | Password: `Faculty@123` (or password provisioned by Admin)
* **Students**: Self-register via the **"Create Student Account"** tab on the login screen.
