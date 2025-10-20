# Weekly Email System Deployment Verification

## Pre-Deployment Checklist
- [ ] Achievement bug fixed (all achievements show, not just 3)
- [ ] Test email button added to UI
- [ ] Code changes reviewed
- [ ] All files committed to Git

## Deployment Steps

### 1. Authenticate
```bash
firebase login
firebase use tgm-ventures-site
gcloud auth login
gcloud config set project tgm-ventures-site
```

### 2. Deploy Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Post-Deployment Verification

### 1. Verify Functions Deployed
```bash
firebase functions:list
```
**Expected**: See `weeklyReportEmailEnhanced` and `sendWeeklyReportNowEnhanced` with status "Deployed"

### 2. Verify Scheduler Active
```bash
gcloud scheduler jobs list --location=us-central1 --project=tgm-ventures-site
```
**Expected**: See job `firebase-schedule-weeklyReportEmailEnhanced-us-central1` with STATE = `ENABLED`

### 3. Check Scheduler Details
```bash
gcloud scheduler jobs describe firebase-schedule-weeklyReportEmailEnhanced-us-central1 \
  --location=us-central1 \
  --project=tgm-ventures-site
```
**Expected**:
- Schedule: `0 11 * * 6` (every Saturday at 11 AM)
- Timezone: `America/Los_Angeles`
- State: `ENABLED`

### 4. Test Manually from Dashboard
1. Go to tgmventures.com/weekly-progress
2. Login with @tgmventures.com account
3. Click "Send Test Email" button
4. Check email inbox within 1-2 minutes

### 5. Check Function Logs
```bash
firebase functions:log --only weeklyReportEmailEnhanced
```
**Expected**: No error messages, successful executions logged

## SendGrid Configuration Checklist
- [ ] API key exists in Secret Manager: `SENDGRID_API_KEY`
  ```bash
  gcloud secrets versions access latest --secret="SENDGRID_API_KEY" --project=tgm-ventures-site
  ```
- [ ] Sender verified: `noreply@tgmventures.com` (check at app.sendgrid.com)
- [ ] Domain authenticated: `tgmventures.com` (Settings > Sender Authentication)

## Team Members Verification
- [ ] All team members in `organizations/tgm-ventures/users` collection
- [ ] Each user has required fields:
  - `email` (ending in @tgmventures.com)
  - `name`
  - `photoURL` (optional but recommended)

**Check via Firebase Console**:
1. Go to Firebase Console > Firestore
2. Navigate to: `organizations/tgm-ventures/users`
3. Verify all active team members are listed

## Testing Checklist

### Test Email Verification
- [ ] Email received from noreply@tgmventures.com
- [ ] ALL completed objectives visible (not truncated to 3)
- [ ] No "+X more achievements" text appears
- [ ] Profile photo displays correctly
- [ ] Email renders correctly on desktop
- [ ] Email renders correctly on mobile
- [ ] Links in email work correctly
- [ ] Outstanding objectives section shows correctly

### Production Email Verification (Next Saturday)
- [ ] Automatic email received Saturday after 11 AM PT
- [ ] All team members received the email
- [ ] Email contains correct weekly data
- [ ] No errors in function logs

## Troubleshooting

### If SendGrid API key access fails:
```bash
# Grant Cloud Functions access to the secret
gcloud secrets add-iam-policy-binding SENDGRID_API_KEY \
  --member="serviceAccount:tgm-ventures-site@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=tgm-ventures-site
```

### If function deployment fails:
```bash
# Check detailed error logs
gcloud functions logs read \
  --region=us-central1 \
  --project=tgm-ventures-site \
  --limit=50
```

### If test email doesn't arrive:
1. Check spam/junk folder
2. Check SendGrid activity: app.sendgrid.com > Settings > Activity
3. Check function logs: `firebase functions:log`
4. Verify your email is in Firestore users collection
5. Check SendGrid delivery status dashboard

### If scheduler doesn't trigger:
```bash
# Manually trigger the job to test
gcloud scheduler jobs run firebase-schedule-weeklyReportEmailEnhanced-us-central1 \
  --location=us-central1 \
  --project=tgm-ventures-site
```

## Success Criteria

All items checked = System fully operational ✅

The system will automatically:
1. Send emails every Saturday at 11:00 AM Pacific Time
2. Include ALL achievements for each team member
3. Send to all users with @tgmventures.com emails
4. Log execution to Firestore `email_logs` collection

## Next Steps

After successful verification:
1. Monitor first automatic send (next Saturday)
2. Verify all team members receive the email
3. Check for any errors in logs
4. Confirm email content is accurate

