# TGM Ventures - Deployment Guide

## 🚀 Production Deployment

This guide covers deploying the TGM Ventures website to Firebase Hosting.

### Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Google Cloud CLI installed and authenticated
3. Access to `tgm-ventures-site` Firebase project
4. Access to Google Secret Manager

### Deployment Steps

#### 1. Ensure Latest Code
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install
cd functions && npm install && cd ..
```

#### 2. Test Locally
```bash
# Start with secure secrets
./scripts/start-local.sh

# Test all critical features:
# - Homepage loads
# - Contact form submits
# - Dashboard authentication works
# - All dashboard features function
```

#### 3. Deploy to Production
```bash
# Full deployment (hosting + functions)
NEXT_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret="FIREBASE_API_KEY") firebase deploy

# Deploy only hosting (faster for UI changes)
NEXT_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret="FIREBASE_API_KEY") firebase deploy --only hosting

# Deploy only functions (for backend changes)
firebase deploy --only functions
```

### Post-Deployment Verification

1. **Check Production Site**: https://tgmventures.com
   - Homepage loads correctly
   - All images display
   - Navigation works

2. **Test Contact Form**:
   - Submit a test contact form
   - Verify email arrives at management@tgmventures.com

3. **Test Authentication**:
   - Login with @tgmventures.com Google account
   - Verify dashboard access
   - Check all dashboard features

4. **Monitor Firebase Console**:
   - Check for any errors in Functions logs
   - Verify Firestore operations
   - Monitor authentication events

## 🔐 Security Checklist

Before deploying, ensure:
- [ ] No hardcoded API keys in code
- [ ] All secrets use Google Secret Manager
- [ ] `.gitignore` excludes sensitive files
- [ ] Firebase security rules are properly configured
- [ ] Authentication domain restrictions are active

## 🚨 Rollback Procedure

If issues occur after deployment:

```bash
# View deployment history
firebase hosting:releases:list

# Rollback to previous version
firebase hosting:rollback
```

## 📊 Current Architecture

### Firebase Services Used:
- **Hosting**: Next.js SSR application
- **Firestore**: Database for dashboard data
- **Authentication**: Google OAuth with domain restriction
- **Cloud Functions**: Contact form handler
- **Secret Manager**: API key storage

### External Services:
- **SendGrid**: Email delivery
- **reCAPTCHA**: Spam protection
- **Google Workspace**: Email domain

## 🔧 Troubleshooting

### Common Issues:

**Build Failures:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Secret Manager Access:**
```bash
# Verify authentication
gcloud auth list
gcloud config get-value project

# Test secret access
gcloud secrets versions access latest --secret="FIREBASE_API_KEY"
```

**Function Deployment Errors:**
```bash
# Check function logs
firebase functions:log

# Test functions locally first
cd functions && npm test
```

### Environment Variables Required:
- `NEXT_PUBLIC_FIREBASE_API_KEY` - From Secret Manager
- `SENDGRID_API_KEY` - Stored in Firebase Functions config

## 📞 Support Contacts

- **Firebase Console**: https://console.firebase.google.com/project/tgm-ventures-site
- **GitHub Issues**: https://github.com/tgmventures/tgmventures-site/issues
- **Email Monitoring**: management@tgmventures.com

---

*Always test thoroughly before deploying to production. The website represents TGM Ventures' professional presence.*