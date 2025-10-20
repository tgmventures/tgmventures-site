const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const sgMail = require('@sendgrid/mail');

const client = new SecretManagerServiceClient();

// Get SendGrid API key from Secret Manager
async function getSendGridApiKey() {
  const [version] = await client.accessSecretVersion({
    name: 'projects/tgm-ventures-site/secrets/SENDGRID_API_KEY/versions/latest',
  });
  return version.payload.data.toString('utf8');
}

// Import the email generation functions from weekly-report-generator
const { getWeeklyReportDataDirect, generateEnhancedEmailHTML: generateEmailFromData } = require('./weekly-report-generator');

// Wrapper function for email generation
async function generateEnhancedEmailHTML(weekRange) {
  try {
    // Get the data for the week
    const reportData = await getWeeklyReportDataDirect(weekRange.start, weekRange.end);
    
    // Generate the HTML email
    const html = await generateEmailFromData(reportData);
    
    return html;
  } catch (error) {
    console.error('Error generating enhanced email:', error);
    throw error;
  }
}

// Scheduled function to run every Saturday at 11 AM PST
const { onSchedule } = require('firebase-functions/v2/scheduler');

exports.weeklyReportEmailEnhanced = onSchedule({
  schedule: '0 11 * * 6',
  timeZone: 'America/Los_Angeles',
  memory: '512MiB',
  timeoutSeconds: 300
}, async (event) => {
  try {
    console.log('Starting enhanced weekly report email send...');
    
    // Get SendGrid API key
    const apiKey = await getSendGridApiKey();
    sgMail.setApiKey(apiKey);
    
    // Calculate week range (Saturday to Friday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilLastSaturday = dayOfWeek === 6 ? 7 : (dayOfWeek + 1);
    
    const start = new Date(now);
    start.setDate(now.getDate() - daysUntilLastSaturday);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    const weekRange = { start, end };
    
    // Generate enhanced email HTML
    const html = await generateEnhancedEmailHTML(weekRange);
    
    // Get all @tgmventures.com users from the organization
    const db = admin.firestore();
    const usersSnapshot = await db.collection('organizations/tgm-ventures/users').get();
    const recipients = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.email && userData.email.endsWith('@tgmventures.com')) {
        recipients.push(userData.email);
      }
    });
    
    // If no users found, send to management
    if (recipients.length === 0) {
      recipients.push('management@tgmventures.com');
    }
    
    console.log(`Sending weekly report to ${recipients.length} recipients:`, recipients);
    
    // Format date for subject line
    const weekEndStr = end.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    // Send email to all recipients
    const msg = {
      to: recipients,
      from: 'noreply@tgmventures.com',
      replyTo: 'team@tgmventures.com',
      subject: `TGM Ventures Weekly Progress Report - Week ending ${weekEndStr}`,
      html: html
    };
    
    await sgMail.send(msg);
    console.log(`Enhanced weekly report email sent successfully to ${recipients.length} recipients`);
    
    // Log success
    await db.collection('email_logs').add({
      type: 'weekly_report_enhanced',
      recipients: recipients,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      weekRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      status: 'success'
    });
    
  } catch (error) {
    console.error('Error sending enhanced weekly report:', error);
    
    // Log error
    const db = admin.firestore();
    await db.collection('email_logs').add({
      type: 'weekly_report_enhanced',
      error: error.message,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'error'
    });
    
    throw error;
  }
});

// Manual trigger function for testing  
exports.sendWeeklyReportNowEnhanced = functions.https.onCall(async (data, context) => {
  // Check that the user is authenticated and is from tgmventures.com
  if (!context.auth || !context.auth.token.email?.endsWith('@tgmventures.com')) {
    throw new functions.https.HttpsError('permission-denied', 'Must be authenticated with @tgmventures.com email');
  }
  
  try {
    console.log('Manual trigger for enhanced weekly report by:', context.auth.token.email);
    
    // Get SendGrid API key
    const apiKey = await getSendGridApiKey();
    sgMail.setApiKey(apiKey);
    
    // Calculate week range (Saturday to Friday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilLastSaturday = dayOfWeek === 6 ? 7 : (dayOfWeek + 1);
    
    const start = new Date(now);
    start.setDate(now.getDate() - daysUntilLastSaturday);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    const weekRange = { start, end };
    
    // Generate enhanced email HTML
    const html = await generateEnhancedEmailHTML(weekRange);
    
    // Format date for subject line
    const weekEndStr = end.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    // Send to specified email or the requester
    const recipient = data.email || context.auth.token.email;
    
    const msg = {
      to: recipient,
      from: 'noreply@tgmventures.com',
      replyTo: 'team@tgmventures.com',
      subject: `[TEST] TGM Ventures Weekly Progress Report - Week ending ${weekEndStr}`,
      html: html
    };
    
    await sgMail.send(msg);
    
    console.log(`Test email sent successfully to ${recipient}`);
    
    return { 
      success: true, 
      message: `Test weekly report sent successfully to ${recipient}`,
      weekRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error sending test weekly report:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to send report');
  }
});
