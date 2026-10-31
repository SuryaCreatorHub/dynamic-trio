# SentinelTrust AI — Production Deployment Guide

This guide walks you through deploying **SentinelTrust AI** to production across **Supabase** (PostgreSQL & Auth & Realtime), **Render** (Express Backend), and **Vercel** (Vite + React Frontend).

---

## Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │             Vercel Frontend             │
                      │  React 18 + Vite + Tailwind + Recharts │
                      └────────────────────┬────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
           Direct Auth & Realtime Subscriptions       Secure REST API (Bearer JWT)
                        │                                     │
                        ▼                                     ▼
      ┌───────────────────────────────────┐    ┌───────────────────────────────────┐
      │             Supabase              │    │          Render Backend           │
      │   PostgreSQL + Realtime + Auth    │◄───┤ Express.js + @google/genai (v2.5) │
      │   Profiles, Scans, Conversations  │    │  DLP Pre-Scanner, Zod Validation  │
      └───────────────────────────────────┘    └─────────────────┬─────────────────┘
                                                                 │
                                                                 ▼
                                                ┌─────────────────────────────────┐
                                                │        Google Gemini API        │
                                                │         gemini-2.5-flash        │
                                                └─────────────────────────────────┘
```

---

## 1. Supabase Setup (Database, Auth & Realtime)

1. Create a project at [https://supabase.com](https://supabase.com).
2. Go to **Project Settings** -> **API**:
   - Copy `Project URL` (e.g. `https://your-project.supabase.co`).
   - Copy `anon` `public` key.
   - Copy `service_role` `secret` key (**never expose this to the frontend**).
3. Open the **SQL Editor** in your Supabase dashboard:
   - Copy and paste the entire contents of `supabase/migrations/0001_init.sql`.
   - Run the script. This creates `profiles`, `conversations`, `messages`, `security_scans`, activates RLS policies, defines trigger functions, and enables `supabase_realtime` publications.
4. Go to **Authentication** -> **Providers** -> **Email**:
   - Ensure Email provider is enabled.
   - (Optional for development) Disable "Confirm email" if you want instant login upon sign-up without email verification delays.

---

## 2. Google Gemini API Setup

1. Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Note the key for the `GEMINI_API_KEY` environment variable on the Render backend.

---

## 3. Backend Deployment (Render)

1. Connect your Git repository to [Render](https://render.com).
2. Create a **New Web Service**:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add the following **Environment Variables**:
   | Key | Value | Description |
   | --- | --- | --- |
   | `PORT` | `5000` | Server listening port |
   | `NODE_ENV` | `production` | Production mode |
   | `FRONTEND_URL` | `https://your-app.vercel.app` | Vercel production frontend domain (or local `http://localhost:5173`) |
   | `SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
   | `SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Anon Key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Supabase Service Role Secret Key |
   | `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API Key |
4. Deploy the service and note the live URL (e.g., `https://sentineltrust-api.onrender.com`).
5. Verify health: visit `https://sentineltrust-api.onrender.com/api/health` -> should return `{"ok":true,"service":"sentineltrust-backend"}`.

---

## 4. Frontend Deployment (Vercel)

1. Connect your Git repository to [Vercel](https://vercel.com).
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add the following **Environment Variables**:
   | Key | Value | Description |
   | --- | --- | --- |
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase URL |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Anon Public Key |
   | `VITE_API_BASE_URL` | `https://sentineltrust-api.onrender.com` | Live Render backend URL |
4. Deploy. The repository includes `frontend/vercel.json` configured with SPA rewrites (`"destination": "/index.html"`) so refreshing routes like `/dashboard`, `/scanner`, and `/copilot` works seamlessly.

---

## 5. Post-Deployment Verification Checklist

1. Navigate to your Vercel URL (`https://your-app.vercel.app`).
2. Test **Registration**: Create a new account with the password visibility toggle (`👁`). Confirm instant redirect to `/dashboard`.
3. Check the **Dashboard**: Confirm all 4 KPI stats initialize to 0 for the new user.
4. Run a **Security Scan**:
   - Go to `/scanner`.
   - Select Preset 1 (Prompt Injection & Secret Leak).
   - Click "Run AI Security Audit".
   - Watch the status badge transition: `sending` -> `generating` -> `completed`.
   - Check risk score, trust score, side-by-side redacted diff, threats detected, and compliance checklist.
5. Launch **AI Security Copilot**:
   - Go to `/copilot`.
   - Ask an AI governance question or paste suspicious code.
   - Verify real-time status updates and markdown formatted response with clickable follow-up chips.
6. Verify **Audit Trail**:
   - Navigate to `/history`.
   - Confirm past scans and chats are present.
   - Delete a record and verify instant UI removal.
7. Test **Logout & Route Protection**:
   - Click Log Out in the Navbar.
   - Attempt to manually visit `/dashboard` -> Verify automatic redirect to `/login`.

