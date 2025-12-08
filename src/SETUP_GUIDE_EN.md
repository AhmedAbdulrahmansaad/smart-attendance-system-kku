# 🚀 Complete Setup Guide - KKU Smart Attendance System

<div align="center">

![GitHub Ready](https://img.shields.io/badge/GitHub-Ready-success?style=for-the-badge&logo=github)
![Supabase](https://img.shields.io/badge/Supabase-Configured-blue?style=for-the-badge&logo=supabase)
![Production](https://img.shields.io/badge/Production-Ready-brightgreen?style=for-the-badge)

**Complete guide for deploying KKU Smart Attendance System**

[Quick Start](#-quick-start) •
[Supabase Setup](#-supabase-setup) •
[Deployment](#-deployment) •
[Troubleshooting](#-troubleshooting)

</div>

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#-quick-start)
3. [Supabase Setup](#-supabase-setup)
4. [GitHub Upload](#-github-upload)
5. [Deployment](#-deployment)
6. [Testing](#-testing)
7. [Troubleshooting](#-troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

```
✅ Node.js 18 or higher
✅ npm or yarn
✅ Git installed
✅ GitHub account
✅ Supabase account (free)
✅ Vercel account (optional, for deployment)
```

---

## 🚀 Quick Start

### Step 1: Download Project

1. Click **Download** button in Figma Make
2. Extract the ZIP file to your desired location

### Step 2: Install Dependencies

```bash
# Navigate to project directory
cd kku-smart-attendance-system

# Install dependencies
npm install

# Copy environment example
cp .env.example .env.local
```

### Step 3: Configure Supabase Keys

Edit `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run Locally

```bash
npm run dev
```

Open http://localhost:5173 in your browser 🎉

---

## 🗄️ Supabase Setup

### Creating a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. Fill in the details:
   ```
   Name: KKU Attendance System
   Database Password: [Choose a strong password and save it!]
   Region: Choose the closest to you
   ```
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup to complete

### Getting API Keys

1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL** (Example: `https://abcdefgh.supabase.co`)
   - **anon public** key (under "Project API keys")
   - **service_role** key (for backend only - keep secret!)

### Database Structure

This system uses **Supabase KV Store** (Key-Value Store), which is:
- ✅ **Flexible** - stores any data structure
- ✅ **Zero configuration** - ready to use
- ✅ **Perfect for prototyping**

**Important Note:** Per Figma Make limitations:
- The system uses the default `kv_store_90ad488b` table
- No migration files or DDL statements are needed
- Everything works out of the box!

If you want to create custom SQL tables (optional):
1. Go to Supabase Dashboard → **Table Editor**
2. Create tables manually as needed

---

## 📤 GitHub Upload

### Step 1: Initialize Git

```bash
# Initialize repository
git init

# Add all files
git add .

# Create first commit
git commit -m "🎉 Initial commit: KKU Smart Attendance System v3.0"
```

### Step 2: Create GitHub Repository

**Option A: Via GitHub Website**
1. Go to [GitHub.com](https://github.com)
2. Click **"+"** → **"New repository"**
3. Fill in:
   ```
   Repository name: kku-smart-attendance-system
   Description: Smart Attendance System for King Khalid University with Live Streaming
   Visibility: Public or Private
   
   ⚠️ Do NOT check:
   ❌ Add a README file
   ❌ Add .gitignore
   ❌ Choose a license
   ```
4. Click **"Create repository"**

**Option B: Via GitHub CLI**
```bash
gh repo create kku-smart-attendance-system --public --description "KKU Smart Attendance System"
```

### Step 3: Connect and Push

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/kku-smart-attendance-system.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

---

## 🛠️ Deploying Backend (Supabase Edge Functions)

### Install Supabase CLI

```bash
npm install -g supabase
```

### Login to Supabase

```bash
supabase login
```

### Link Your Project

```bash
# Get your project ID from Supabase Dashboard
supabase link --project-ref YOUR_PROJECT_ID
```

### Deploy Edge Functions

```bash
# Deploy the server function
supabase functions deploy server
```

**Note:** Environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are automatically available in Edge Functions!

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

#### Step 1: Import from GitHub

1. Go to [Vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select `kku-smart-attendance-system`
5. Click **"Import"**

#### Step 2: Configure Environment Variables

In Vercel project settings, add:

```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key-here
```

**Get these from:** Supabase Dashboard → Settings → API

#### Step 3: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. 🎉 **Your app is live!**

Your URL will be like: `https://kku-smart-attendance-system.vercel.app`

---

## 🧪 Testing

### Test Locally

```bash
npm install
npm run dev
```

Open: http://localhost:5173

### Test Supabase Connection

1. Open the app in browser
2. Open Developer Tools (F12)
3. Check Console tab
4. You should see: **"✅ Supabase connection successful"**

### Create Test Accounts

```typescript
// Admin Account
Email: admin@kku.edu.sa
Password: Admin@2025
Full Name: System Admin
Role: Admin

// Instructor Account
Email: instructor@kku.edu.sa
Password: Inst@2025
Full Name: Dr. Mohammed Ahmed
Role: Instructor

// Student Account
Email: student@kku.edu.sa
Password: Stud@2025
Full Name: Abdullah Ali
University ID: 441234567
Role: Student
```

### Test Features Checklist

- ✅ Login/Signup
- ✅ Dashboard access
- ✅ Create course (Admin/Instructor)
- ✅ Create attendance session (Instructor)
- ✅ Record attendance (Student)
- ✅ Start live stream (Instructor)
- ✅ Join live stream (Student)
- ✅ Generate reports

---

## 🔒 Security

### Secrets Management

**✅ Secure by default:**
- All secret keys are in `.gitignore`
- Example files provided (`.example` suffix)
- Environment variables for production

**Files protected:**
```
config/supabase.config.ts
utils/supabase/info.tsx
.env.local
```

**Files committed (safe):**
```
config/supabase.config.example.ts
utils/supabase/info.example.tsx
.env.example
```

### Best Practices

1. **Never commit real API keys**
2. **Use environment variables in production**
3. **Keep `service_role` key secret** (backend only)
4. **Rotate keys if exposed**

---

## ✨ Features Overview

### 🔐 Authentication & Authorization
- Secure login/signup
- University email validation (@kku.edu.sa)
- University ID validation (9 digits starting with 44)
- Session management
- Prevent concurrent logins
- Role-based access control

### 📊 Dashboards
- **Admin:** Full system management
- **Instructor:** Course & session management, live streaming
- **Student:** Attendance recording, live stream viewing
- **Supervisor:** Monitoring & reports

### ✅ Smart Attendance
- QR code generation
- GPS verification
- Automatic recording on live stream join
- Comprehensive reports

### 🎥 Live Streaming
- HD audio/video streaming
- Supports 100+ concurrent viewers
- Text chat
- Real-time viewer count
- Camera/mic controls
- Fullscreen mode

### 📈 Reports & Analytics
- Comprehensive attendance reports
- Per-course statistics
- Export to Excel/PDF
- Interactive charts

### 🌍 Multi-language
- Arabic (RTL)
- English (LTR)
- Smooth language switching

### 🎨 Modern Design
- King Khalid University colors
- Clean, professional interface
- Responsive design
- Dark/Light mode support

---

## 🔧 Customization

### Change Colors

Edit `/styles/globals.css`:

```css
:root {
  --kku-green: #006747;      /* Primary green */
  --kku-green-dark: #004d33; /* Dark green */
  --kku-green-light: #00a86b; /* Light green */
}
```

### Add New Features

1. Create component in `/components`
2. Import in appropriate dashboard
3. Add backend endpoint in `/supabase/functions/server/index.tsx`

### Develop Backend

Open `/supabase/functions/server/index.tsx`:

```typescript
app.post("/make-server-90ad488b/your-endpoint", async (c) => {
  // Your code here
});
```

---

## 🆘 Troubleshooting

### ❌ "git is not recognized"

**Solution:**
1. Install Git from [git-scm.com](https://git-scm.com)
2. Restart terminal
3. Run `git --version` to verify

### ❌ "Module not found"

**Solution:**
```bash
# Remove and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### ❌ "Supabase connection failed"

**Solution:**
1. Verify keys in `.env.local`
2. Check if Supabase project is active (not paused)
3. Visit: Supabase Dashboard → Settings → API

### ❌ "401 Unauthorized"

**Solution:**
1. Deploy Edge Functions: `supabase functions deploy server`
2. Check access token
3. Logout and login again

### ❌ "Failed to push to GitHub"

**Solution:**
```bash
# Pull first
git pull origin main --allow-unrelated-histories

# Then push
git push -u origin main
```

### ❌ Live Stream not working

**Solution:**
1. Use a modern browser (Chrome, Firefox, Edge)
2. Allow camera/microphone permissions
3. Check if Supabase Realtime is enabled
4. Verify Edge Functions are deployed

---

## 📚 Documentation

| File | Description |
|------|-------------|
| [README.md](/README.md) | Main documentation (Arabic) |
| [QUICK_START.md](/QUICK_START.md) | Quick start guide |
| [DEPLOYMENT_GUIDE_AR.md](/DEPLOYMENT_GUIDE_AR.md) | Deployment guide (Arabic) |
| [LIVE_STREAMING_GUIDE_AR.md](/LIVE_STREAMING_GUIDE_AR.md) | Live streaming guide (Arabic) |
| [TROUBLESHOOTING_AR.md](/TROUBLESHOOTING_AR.md) | Troubleshooting (Arabic) |

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 🎓 Project Team

**Graduation Project - King Khalid University**  
Faculty of Computer Science  
Academic Year: 2024-2025

---

## 📞 Support

If you encounter any issues:

1. ✅ Check the documentation files listed above
2. ✅ Open browser Console (F12) for error messages
3. ✅ Check Supabase logs in Dashboard
4. ✅ Open an Issue on GitHub

---

<div align="center">

## 🎉 Congratulations! Your System is Now on GitHub

**Ready to Deploy and Share with the World** 🌍

---

### Next Steps:

✅ Upload to GitHub - **Done!**  
⬜ Connect to Supabase  
⬜ Deploy to Vercel  
⬜ Test all features  
⬜ Add demo data  
⬜ Share the link  

---

**Made with ❤️ for King Khalid University**

صُنع بكل ❤️ لجامعة الملك خالد

</div>

---

**Last Updated:** December 2025  
**Version:** 3.0  
**Status:** ✅ Production Ready
