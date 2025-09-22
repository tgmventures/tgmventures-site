# TGM Ventures Website

A modern Next.js application for TGM Ventures, Inc., a Washington state corporation specializing in building, buying, and managing businesses and real estate.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server with secure secrets
./scripts/start-local.sh

# Or manually with Firebase emulators
firebase emulators:start --only firestore,auth,functions
NEXT_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret="FIREBASE_API_KEY") npm run dev
```

## 🔐 Security & Credentials

This project uses **Google Secret Manager** for all sensitive credentials:
- No API keys are stored in the codebase
- All secrets are fetched at runtime
- See [SECURITY.md](SECURITY.md) for detailed security practices

## 📦 Deployment

The site is deployed on Firebase Hosting at https://tgmventures.com

```bash
# Build and deploy everything (fetches API key from Secret Manager)
NEXT_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret="FIREBASE_API_KEY") firebase deploy

# Deploy only hosting
NEXT_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret="FIREBASE_API_KEY") firebase deploy --only hosting

# Deploy only functions (no API key needed)
firebase deploy --only functions
```

## 🚨 CRITICAL PRESERVATION RULES

### Core Pages - DO NOT MODIFY WITHOUT EXPLICIT PERMISSION
The following pages must maintain their simple, elegant design and content:

- **Homepage** (`/src/app/page.tsx`) - Simple black background with warehouse image, TGM logo, and tagline
- **Privacy Policy** (`/src/app/privacy-policy/page.tsx`) - Comprehensive legal document 
- **Terms of Service** (`/src/app/terms-of-service/page.tsx`) - Comprehensive legal document

**⚠️ IMPORTANT**: These pages are intentionally minimal and professional. Any changes to their design, content, or functionality require explicit user approval before implementation.

## Project Structure

```
/
├── src/                    # Next.js source code
│   ├── app/               # App router pages
│   │   ├── api/          # API routes
│   │   │   └── contact/  # Contact form API endpoint
│   │   ├── contact/      # Contact form page
│   │   ├── dashboard/    # Internal team dashboard
│   │   ├── goals/        # Goals tracking page
│   │   ├── login/        # Authentication page
│   │   ├── page.tsx      # Homepage
│   │   ├── privacy-policy/
│   │   ├── terms-of-service/
│   │   └── (icons)       # App icons (favicon, apple-icon)
│   ├── components/        # React components
│   │   └── ui/           # UI components
│   ├── lib/              # Utilities and services
│   │   ├── firebase/     # Firebase service layer
│   │   │   ├── asset-management-init.ts
│   │   │   ├── compat-service.ts
│   │   │   ├── division-service.ts
│   │   │   └── structure.ts
│   │   └── firebase*.ts  # Firebase utilities
│   └── types/            # TypeScript types
├── public/                # Static assets
│   └── images/           # Images and logos
├── functions/            # Firebase Cloud Functions
│   └── index.js          # Contact form handler
├── planning/             # Project planning documents
│   └── IMPLEMENTATION-CHECKLIST.md
├── scripts/              # Helper scripts
│   └── start-local.sh    # Local dev startup script
├── firebase.json         # Firebase configuration
├── firestore.rules       # Security rules
├── firestore.indexes.json # Database indexes
├── next.config.js        # Next.js configuration
└── package.json          # Dependencies and scripts
```

## Features

### ✅ Implemented

#### Public Features
- Professional homepage with elegant black design
- Contact form with multiple inquiry types
- reCAPTCHA v2 spam protection  
- SendGrid email integration (no direct email exposure)
- Responsive design across all devices
- Legal pages (Privacy Policy, Terms of Service)

#### Internal Team Dashboard
- Google OAuth authentication with @tgmventures.com domain restriction
- Three business divisions:
  - **Asset Management**: Monthly task tracking with automatic reset
  - **Real Estate**: Dynamic task management
  - **Ventures**: Dynamic task management
- **Tax Filings**: Annual tax return tracking with property tax management
- Task features:
  - Click to edit task text inline
  - Drag and drop to reorder tasks
  - Persistent state across sessions
  - Progress tracking and visual indicators
  - Automatic monthly/annual resets
- User profile dropdown with Google account integration
- **Goals Page**: Separate goal tracking interface with monthly view and filtering

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with Poppins font
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google OAuth)
- **Functions**: Firebase Cloud Functions
- **Email**: SendGrid integration
- **Hosting**: Firebase Hosting
- **Security**: reCAPTCHA v2, Google Secret Manager
- **State Management**: React hooks with real-time Firestore sync

## Development Guidelines

### What CAN be modified:
- Adding new features to the dashboard
- Creating new internal tools
- Improving build processes and tooling
- Adding new API endpoints
- Enhancing security measures

### What CANNOT be modified without permission:
- Visual design of core pages (homepage, privacy, terms)
- Content of legal documents
- User experience of existing public pages
- Authentication domain restrictions

## 🔗 Important Links

- **Production Site**: https://tgmventures.com
- **Firebase Console**: https://console.firebase.google.com/project/tgm-ventures-site
- **GitHub Repository**: https://github.com/tgmventures/tgmventures-site

## 📝 Documentation

- [LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md) - Local development setup guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment instructions
- [SECURITY.md](SECURITY.md) - Security best practices and guidelines

---

*This project represents the digital presence of TGM Ventures, Inc. Maintain professionalism and simplicity in all modifications.*