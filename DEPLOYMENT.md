# 🌐 Free Live Hosting Guide: GNDEC CSE-ICB LabGuard Platform

This guide provides step-by-step instructions to host the complete application (Frontend + Backend + SQLite Database + Geofencing + 1-Min Dynamic QR) **100% Free** on **Render** (or **Render + Vercel**).

---

## 🚀 Option 1: Full-Stack on Render (Recommended — 100% Free & Simplest)

Render hosts the complete full-stack app (Vite React UI + Express Backend + SQLite) with automatic SSL (`https://`).

### Step 1: Deploy on Render
1. Go to **[render.com](https://render.com)** and sign in using your GitHub account.
2. Click **"New +"** (top right) → **"Web Service"**.
3. Select your GitHub repository: `AkashLadde/Feedback`.
4. Configure the settings:
   - **Name**: `gndec-cse-feedback` (or any name you choose)
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
   - `NODE_VERSION` = `22`
   - `JWT_SECRET` = `gndec_labguard_secure_jwt_secret_2026_key`
   *(Do NOT hardcode PORT; Render automatically binds dynamically to `0.0.0.0`)*
6. Click **"Create Web Service"**.

Render will install dependencies, build the React frontend, launch the server on `0.0.0.0:$PORT`, and give you a live URL:
👉 `https://gndec-cse-feedback.onrender.com`

---

## ⚡ Option 2: Split Deployment (Vercel Frontend + Render Backend)

If you prefer using Vercel for the frontend:

1. **Deploy Backend on Render**:
   - Follow Option 1 above, but set **Root Directory** to `server`.
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Copy the backend URL (e.g. `https://feedback-backend.onrender.com`).

2. **Deploy Frontend on Vercel**:
   - Import `AkashLadde/Feedback` into **Vercel**.
   - Root Directory: `client`
   - Add Environment Variable:
     - `VITE_API_URL` = `https://feedback-backend.onrender.com`
   - Click **Deploy**.

---

## 🔑 Default Production Credentials
* **Administrator**: `admin@gndec.ac.in` | Password: `Admin@123`
* **Faculty Login**: Institutional Email (e.g. `harish.joshi@gndec.ac.in`, `aarti.pawar@gndec.ac.in`, `ashok.bawge@gndec.ac.in`) | Password: `Faculty@123`
* **Students**: Self-register via the **"Create Student Account"** tab on the login screen.
