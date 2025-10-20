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

# 3. Setup reCAPTCHA (one-time)
echo "NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY=your_site_key" >> .env.local

# 4. Start Firebase emulators (in one terminal)
firebase emulators:start --only firestore,auth,functions

# 5. Start development server (in another terminal)
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
NEXT_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret="FIREBASE_API_KEY") \
NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY=your_recaptcha_site_key \
firebase deploy

# Deploy only hosting (for UI changes)
NEXT_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret="FIREBASE_API_KEY") \
NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY=your_recaptcha_site_key \
firebase deploy --only hosting

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

## 📧 Weekly Email System

### Automatic Weekly Reports
The system automatically sends a weekly progress report every **Saturday at 11:00 AM Pacific Time** to all team members with @tgmventures.com email addresses.

**What's included in the email:**
- Team member accomplishments with profile photos
- **Complete list of ALL objectives completed** by each member (no limits)
- Outstanding objectives for the upcoming week
- Professional TGM Ventures branding

### Manual Testing
To test the email system before Saturday:
1. Navigate to `/weekly-progress` in the dashboard
2. Click **"Preview Email"** to see the email content in-browser
3. Click **"Send Test Email"** to send a test to your email address
4. Check your inbox within 1-2 minutes (arrives from `noreply@tgmventures.com`)

### Email System Architecture
- **Scheduler**: Firebase Functions v2 Cloud Scheduler (runs every Saturday 11 AM PT)
- **Email Service**: SendGrid (API key stored in Google Secret Manager)
- **Data Source**: Firestore collections
  - `organizations/tgm-ventures/ventures-objective-cards` - Ventures objectives
  - `organizations/tgm-ventures/asset-management-cards` - Asset management objectives
  - `organizations/tgm-ventures/divisions/{divisionId}/tasks` - Division tasks
  - `taxes/taxes-{year}` - Tax filing data
- **Recipients**: All users in `organizations/tgm-ventures/users` with @tgmventures.com emails

### Key Features
- **No Achievement Limits**: Displays ALL completed objectives (previously limited to 3)
- **Automatic Weekly Cadence**: Sends every Saturday without manual intervention
- **Team Member Photos**: Pulls profile photos from Firestore user data
- **Outstanding Tasks**: Shows what's pending for next week
- **Mobile Responsive**: Email renders perfectly on desktop and mobile devices

### Troubleshooting
If emails aren't sending:
1. **Check Firebase Console**: Functions > Logs for errors
2. **Verify SendGrid API Key**: 
   ```bash
   gcloud secrets versions access latest --secret="SENDGRID_API_KEY"
   ```
3. **Check Cloud Scheduler**: Google Cloud Console > Cloud Scheduler
   - Job: `firebase-schedule-weeklyReportEmailEnhanced-us-central1`
   - Should show as "ENABLED"
4. **Verify Sender Authentication**: SendGrid dashboard > Settings > Sender Authentication
   - `noreply@tgmventures.com` must be verified
5. **Check Email Logs**: Firestore collection `email_logs` for execution history
6. **Manual Trigger Test**:
   ```bash
   gcloud scheduler jobs run firebase-schedule-weeklyReportEmailEnhanced-us-central1 \
     --location=us-central1 \
     --project=tgm-ventures-site
   ```

### Adding Team Members
To ensure someone receives weekly emails:
1. Go to Firebase Console > Firestore
2. Navigate to: `organizations/tgm-ventures/users`
3. Add user document with fields:
   - `email`: user@tgmventures.com (must end in @tgmventures.com)
   - `name`: "First Last"
   - `photoURL`: "https://..." (optional)
   - `role`: "member" (or "admin"/"ceo")

For detailed deployment and verification steps, see [DEPLOYMENT-VERIFICATION.md](DEPLOYMENT-VERIFICATION.md).

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