# 🚀 TGM Ventures - Local Development Setup

## Quick Start

```bash
# 1. Install dependencies
npm install
cd functions && npm install && cd ..

# 2. Start Firebase emulators
firebase emulators:start --only firestore,auth,functions

# 3. In a new terminal, start the development server
./scripts/start-local.sh
```

## 🌐 Local Access Points

- **Main Website**: http://localhost:3000
- **Firebase Emulators UI**: http://localhost:4000
- **Firestore Emulator**: http://localhost:8080
- **Auth Emulator**: http://localhost:9099
- **Functions Emulator**: http://localhost:5001

## 🔐 Security Setup

We use Google Secret Manager for secure credential management:
- **Firebase API Key**: Fetched at runtime from Secret Manager
- **SendGrid API Key**: Stored in Firebase Functions config
- **No hardcoded secrets** in the codebase

### Required Setup:
1. Install Google Cloud CLI: `brew install google-cloud-sdk`
2. Authenticate: `gcloud auth login`
3. Set project: `gcloud config set project tgm-ventures-site`
4. Verify access: `gcloud secrets versions access latest --secret="FIREBASE_API_KEY"`

## 📋 Testing Checklist

### Public Pages
- [ ] **Homepage** (http://localhost:3000)
  - Black background with warehouse image
  - TGM Ventures logo and tagline
  - "Team Login" button in header

- [ ] **Contact Form** (http://localhost:3000/contact)
  - All inquiry types in dropdown
  - reCAPTCHA displays
  - Form submission works
  - Success/error messages appear

### Authentication & Dashboard
- [ ] **Login** (http://localhost:3000/login)
  - Google OAuth button works
  - Redirects to dashboard after login
  - Domain restriction message for non-@tgmventures.com

- [ ] **Dashboard** (http://localhost:3000/dashboard)
  - Header shows "Welcome back, [Name]"
  - Profile picture dropdown works
  - Three columns: Asset Management, Real Estate, Ventures
  - Tax Filings section below

### Dashboard Features
- [ ] **Asset Management Tasks**
  - 7 standard monthly tasks display
  - Checkboxes save state
  - Progress bar updates
  - Tasks reset on 1st of month

- [ ] **Real Estate & Ventures**
  - Add new tasks with "+" button
  - Click task text to edit inline
  - Drag tasks to reorder (6-dot handle)
  - Delete tasks with "×" button

- [ ] **Tax Filings**
  - Prior year tax returns display
  - Property tax H1/H2 checkboxes
  - Progress tracking
  - State persists on refresh

## 🛠️ Common Development Tasks

### Start Fresh Database
```bash
# Clear all Firestore data (emulator must be running)
curl -X DELETE "http://localhost:8080/emulator/v1/projects/tgm-ventures-site/databases/(default)/documents"
```

### Test Email Functionality
```bash
# Submit contact form and check Functions logs
firebase functions:log --only submitContactForm
```

### Build for Production
```bash
# Test production build locally
npm run build
npm start
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill processes on common ports
lsof -ti:3000 | xargs kill -9  # Next.js
lsof -ti:4000,5001,8080,9099 | xargs kill -9  # Firebase
```

### Secret Manager Issues
```bash
# Re-authenticate
gcloud auth application-default login
gcloud auth login

# Verify project
gcloud config get-value project
# Should output: tgm-ventures-site
```

### Firebase Emulator Issues
```bash
# Install/update Firebase tools
npm install -g firebase-tools

# Check Java installation (required for emulators)
java -version
# If missing: brew install java
```

### Next.js Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```

## 📁 Key Files & Directories

```
src/
├── app/
│   ├── dashboard/page.tsx    # Main dashboard component
│   ├── contact/page.tsx      # Contact form
│   └── login/page.tsx        # Authentication
├── lib/
│   ├── firebase.ts           # Firebase initialization
│   ├── firebase-taxes.ts     # Tax management
│   ├── firebase/
│   │   ├── compat-service.ts # Database compatibility
│   │   └── asset-management-init.ts
│   └── firebase-division-tasks.ts
└── types/
    └── goal.ts               # TypeScript interfaces
```

## 🚀 Next Steps

After local testing is complete:
1. Commit changes: `git add . && git commit -m "Description"`
2. Push to GitHub: `git push origin main`
3. Deploy to production: See [DEPLOYMENT.md](DEPLOYMENT.md)

---

*For security practices, see [SECURITY.md](SECURITY.md). For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).*