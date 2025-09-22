# TGM Ventures Website

A modern Next.js application for TGM Ventures, Inc., a Washington state corporation specializing in building, buying, and managing businesses and real estate.

## 🚨 CRITICAL PRESERVATION RULES

### Core Pages - DO NOT MODIFY WITHOUT EXPLICIT PERMISSION
The following pages must maintain their simple, elegant design and content:

- **Homepage** (`/src/app/page.tsx`) - Simple black background with warehouse image, TGM logo, and tagline
- **Privacy Policy** (`/src/app/privacy-policy/page.tsx`) - Comprehensive legal document 
- **Terms of Service** (`/src/app/terms-of-service/page.tsx`) - Comprehensive legal document

**⚠️ IMPORTANT**: These pages are intentionally minimal and professional. Any changes to their design, content, or functionality require explicit user approval before implementation.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase CLI: `npm install -g firebase-tools`
- Google Cloud CLI: `brew install google-cloud-sdk`
- Access to `tgm-ventures-site` Firebase project

### Local Development

```bash
# 1. Install dependencies
npm install
cd functions && npm install && cd ..

# 2. Setup Google Cloud authentication
gcloud auth login
gcloud config set project tgm-ventures-site
gcloud auth application-default login

# 3. Start Firebase emulators (in one terminal)
firebase emulators:start --only firestore,auth,functions

# 4. Start development server (in another terminal)
./scripts/start-local.sh

# Access points:
# - Main site: http://localhost:3000
# - Firebase Emulator UI: http://localhost:4000
```

### Testing Checklist
- [ ] Homepage loads with correct design
- [ ] Contact form submits and shows success message
- [ ] Login with @tgmventures.com Google account works
- [ ] Dashboard displays all three divisions
- [ ] Tasks can be added, edited, deleted, and reordered
- [ ] Monthly/annual task resets work correctly

## 📦 Production Deployment

```bash
# Full deployment (hosting + functions)
NEXT_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret="FIREBASE_API_KEY") firebase deploy

# Deploy only hosting (for UI changes)
NEXT_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret="FIREBASE_API_KEY") firebase deploy --only hosting

# Deploy only functions (for backend changes)
firebase deploy --only functions
```

### Post-Deployment Verification
1. Check https://tgmventures.com loads correctly
2. Test contact form submission
3. Verify dashboard authentication and features
4. Monitor Firebase Console for errors

### Rollback if Needed
```bash
firebase hosting:releases:list
firebase hosting:rollback
```

## 🏗️ Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── api/              # API endpoints
│   ├── dashboard/        # Internal team dashboard
│   ├── contact/          # Contact form
│   └── login/            # Authentication
├── components/           # React components
├── lib/                  # Services and utilities
│   └── firebase/         # Firebase service layer
└── types/                # TypeScript definitions

functions/                # Cloud Functions
planning/                 # Project documentation
public/images/           # Static assets
scripts/                 # Helper scripts
```

## 🔐 Security

This project uses **Google Secret Manager** for all sensitive credentials:
- No API keys in codebase
- Secrets fetched at runtime
- Domain-restricted authentication (@tgmventures.com only)
- See [SECURITY.md](SECURITY.md) for detailed practices

## ✨ Features

### Public Features
- Professional homepage with minimal design
- Contact form with reCAPTCHA protection
- SendGrid email integration
- Responsive design
- Legal pages

### Internal Dashboard
- Google OAuth authentication
- Three business divisions with task management
- Drag-and-drop task reordering
- Click-to-edit task names
- Automatic monthly/annual resets
- Tax filing tracker
- Real-time Firestore sync

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + Poppins font
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth (Google OAuth)
- **Functions**: Firebase Cloud Functions
- **Email**: SendGrid
- **Hosting**: Firebase Hosting
- **Security**: reCAPTCHA v2, Google Secret Manager

## 📋 Development Guidelines

### ✅ Allowed Changes
- New dashboard features
- API endpoints
- Internal tools
- Performance optimizations
- Security enhancements

### ❌ Prohibited Without Permission
- Core page design/content
- Legal document content
- Public page UX changes
- Authentication restrictions

## 🔧 Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9  # Next.js
lsof -ti:4000,5001,8080,9099 | xargs kill -9  # Firebase
```

### Secret Manager Issues
```bash
gcloud auth login
gcloud auth application-default login
gcloud secrets versions access latest --secret="FIREBASE_API_KEY"
```

### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run dev
```

## 📞 Important Links

- **Production**: https://tgmventures.com
- **Firebase Console**: https://console.firebase.google.com/project/tgm-ventures-site
- **Implementation Tasks**: [planning/IMPLEMENTATION-CHECKLIST.md](planning/IMPLEMENTATION-CHECKLIST.md)
- **Security Guidelines**: [SECURITY.md](SECURITY.md)

---

*This project represents the digital presence of TGM Ventures, Inc. Maintain professionalism and simplicity in all modifications.*