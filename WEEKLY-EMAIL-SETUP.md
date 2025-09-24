# Weekly Email Automation Setup Guide

## Overview
The TGM Ventures weekly progress email system is now fully implemented and ready for deployment. The system will automatically send a beautifully designed progress report every Saturday at 11 AM PST to all @tgmventures.com team members.

## Email Features
- **Team Member Accomplishments**: Shows profile photos, achievement counts, and key objectives completed
- **Outstanding Objectives**: Lists uncompleted tasks organized by project/card
- **Professional Design**: Matches the web UI with TGM blue color scheme
- **Reply-to**: team@tgmventures.com for easy team communication

## Deployment Steps

### 1. Authenticate with Firebase
```bash
# Open a new terminal window (not in VS Code)
firebase login
```

### 2. Deploy the Cloud Functions
```bash
cd /Users/antoniomandarano/Coding\ Projects/tgmventures-site
firebase deploy --only functions:weeklyReportEmailEnhanced,functions:sendWeeklyReportNowEnhanced
```

### 3. Verify Deployment
1. Go to [Firebase Console](https://console.firebase.google.com/project/tgm-ventures-site/functions)
2. Check that both functions appear:
   - `weeklyReportEmailEnhanced` (scheduled)
   - `sendWeeklyReportNowEnhanced` (callable)

### 4. Test the Email

#### Option A: Use the Web UI
1. Go to https://tgmventures.com/weekly-progress
2. Click "Preview Email" button
3. Review the email content
4. The preview shows the exact HTML that will be sent

#### Option B: Send a Test Email
1. Go to https://tgmventures.com/weekly-progress
2. Open browser console (F12)
3. Get your authentication token:
   ```javascript
   firebase.auth().currentUser.getIdToken().then(token => console.log(token))
   ```
4. Copy the token
5. Run the test script:
   ```bash
   node scripts/test-send-weekly-email.js <your-token-here>
   ```

## How It Works

### Automatic Weekly Emails
- **When**: Every Saturday at 11:00 AM PST
- **To**: All users with @tgmventures.com email addresses
- **Subject**: "TGM Ventures Weekly Progress Report - Week ending [date]"
- **From**: noreply@tgmventures.com
- **Reply-to**: team@tgmventures.com

### Data Collection
The system automatically collects:
- Completed objectives from all cards (Asset Management, Tax Filings, Ventures, custom cards)
- New objectives added during the week
- Team member attribution for each completion
- Outstanding objectives that need attention

### Email Logging
All sent emails are logged in Firestore under `email_logs` collection for audit trail.

## Manual Testing
If you need to send a test email immediately:
1. Ensure you're logged in with a @tgmventures.com account
2. The test function will send to your email address
3. Test emails have [TEST] prefix in subject line

## Monitoring
- Check Firebase Console > Functions > Logs for execution history
- Review `email_logs` collection in Firestore for send confirmations
- SendGrid dashboard shows delivery statistics

## Files Created
- `/functions/weekly-report-enhanced.js` - Main scheduled function
- `/functions/weekly-report-generator.js` - Data aggregation logic
- `/scripts/test-send-weekly-email.js` - Testing utility
- `/WEEKLY-EMAIL-SETUP.md` - This guide

## Support
If you encounter issues:
1. Check Firebase Functions logs for errors
2. Verify SendGrid API key is properly set in Secret Manager
3. Ensure user emails are @tgmventures.com domain
4. Check that objectives have proper timestamps

The system is designed to be maintenance-free once deployed. The scheduled function will run automatically every week without intervention.
