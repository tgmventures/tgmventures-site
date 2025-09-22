const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const sgMail = require('@sendgrid/mail');

const client = new SecretManagerServiceClient();

// Get SendGrid API key from Secret Manager
async function getSendGridApiKey() {
  const [version] = await client.accessSecretVersion({
    name: 'projects/tgm-ventures/secrets/sendgrid-api-key/versions/latest',
  });
  return version.payload.data.toString('utf8');
}

// Calculate date ranges
function getWeekDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return { start, end };
}

// Get all completed objectives for the week
async function getWeeklyCompletedObjectives(start, end) {
  const db = admin.firestore();
  const objectives = [];
  
  // Get division objectives
  const divisionsRef = db.collection('organizations/tgm-ventures/divisions');
  const divisions = await divisionsRef.get();
  
  for (const divDoc of divisions.docs) {
    const objectivesRef = divDoc.ref.collection('objectives');
    const snapshot = await objectivesRef
      .where('isChecked', '==', true)
      .where('completedAt', '>=', start)
      .where('completedAt', '<=', end)
      .get();
      
    snapshot.forEach(doc => {
      const data = doc.data();
      objectives.push({
        type: 'Division Objective',
        division: divDoc.id,
        title: data.title,
        completedBy: data.completedByName || data.completedBy || 'Unknown',
        completedByEmail: data.completedBy || '',
        completedAt: data.completedAt
      });
    });
  }
  
  // Get venture objectives
  const ventureCardsRef = db.collection('organizations/tgm-ventures/ventures-objective-cards');
  const ventureCards = await ventureCardsRef.get();
  
  for (const cardDoc of ventureCards.docs) {
    const data = cardDoc.data();
    const objectives = data.objectives || [];
    
    objectives.forEach(obj => {
      if (obj.isChecked && obj.completedAt && 
          obj.completedAt.toDate() >= start && 
          obj.completedAt.toDate() <= end) {
        objectives.push({
          type: 'Venture Objective',
          card: data.title,
          title: obj.text,
          completedBy: obj.completedByName || obj.completedBy || 'Unknown',
          completedByEmail: obj.completedBy || '',
          completedAt: obj.completedAt
        });
      }
    });
  }
  
  return objectives;
}

// Get objectives added this week
async function getWeeklyAddedObjectives(start, end) {
  const db = admin.firestore();
  const objectives = [];
  
  // Get division objectives
  const divisionsRef = db.collection('organizations/tgm-ventures/divisions');
  const divisions = await divisionsRef.get();
  
  for (const divDoc of divisions.docs) {
    const objectivesRef = divDoc.ref.collection('objectives');
    const snapshot = await objectivesRef
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get();
      
    snapshot.forEach(doc => {
      const data = doc.data();
      objectives.push({
        type: 'Division Objective',
        division: divDoc.id,
        title: data.title,
        createdAt: data.createdAt
      });
    });
  }
  
  return objectives;
}

// Generate HTML email content
function generateEmailHTML(completedObjectives, addedObjectives, dateRange) {
  const completedByUser = {};
  const completedByCategory = {
    'asset-management': 0,
    'real-estate-development': 0,
    'ventures': 0,
    'taxes': 0
  };
  
  // Group completed objectives by user
  completedObjectives.forEach(objective => {
    const email = objective.completedByEmail || 'unknown';
    if (!completedByUser[email]) {
      completedByUser[email] = {
        name: objective.completedBy,
        count: 0,
        objectives: []
      };
    }
    completedByUser[email].count++;
    completedByUser[email].objectives.push(objective);
    
    // Count by category
    if (objective.division) {
      completedByCategory[objective.division] = (completedByCategory[objective.division] || 0) + 1;
    } else if (objective.type === 'Venture Objective') {
      completedByCategory['ventures'] = (completedByCategory['ventures'] || 0) + 1;
    } else if (objective.type === 'Tax Return') {
      completedByCategory['taxes'] = (completedByCategory['taxes'] || 0) + 1;
    }
  });
  
  // Sort users by completion count
  const sortedUsers = Object.entries(completedByUser).sort((a, b) => b[1].count - a[1].count);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f7;
          color: #1d1d1f;
          margin: 0;
          padding: 0;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .header {
          background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
          color: white;
          padding: 48px 32px;
          text-align: center;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+');
          opacity: 0.3;
        }
        .logo {
          width: 60px;
          height: 60px;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 32px;
          font-weight: 600;
          letter-spacing: -0.5px;
          position: relative;
          z-index: 1;
        }
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        .content {
          padding: 40px 32px;
        }
        .stats-grid {
          display: table;
          width: 100%;
          margin-bottom: 40px;
          border-collapse: separate;
          border-spacing: 12px;
        }
        .stat-card {
          display: table-cell;
          width: 33.33%;
          background: #f5f5f7;
          padding: 24px 16px;
          border-radius: 12px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .stat-card .number {
          font-size: 40px;
          font-weight: 700;
          letter-spacing: -1px;
          margin-bottom: 4px;
          background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .stat-card .label {
          font-size: 14px;
          color: #86868b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 32px 0 20px 0;
          letter-spacing: -0.3px;
        }
        .team-member {
          background: #f5f5f7;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .team-member-header {
          display: table;
          width: 100%;
          margin-bottom: 16px;
        }
        .team-member-info {
          display: table-cell;
          vertical-align: middle;
        }
        .team-member-stats {
          display: table-cell;
          vertical-align: middle;
          text-align: right;
        }
        .member-name {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 2px;
        }
        .member-email {
          font-size: 14px;
          color: #86868b;
        }
        .achievement-count {
          font-size: 32px;
          font-weight: 700;
          color: #9333ea;
          letter-spacing: -0.5px;
        }
        .achievement-label {
          font-size: 12px;
          color: #86868b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .objective-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .objective-item {
          color: #515154;
          font-size: 14px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .objective-item:last-child {
          border-bottom: none;
        }
        .objective-type {
          font-size: 12px;
          color: #86868b;
          font-style: normal;
        }
        .category-grid {
          display: table;
          width: 100%;
          margin: 24px 0;
          border-collapse: separate;
          border-spacing: 8px;
        }
        .category-item {
          display: table-cell;
          width: 25%;
          background: white;
          border: 2px solid #f5f5f7;
          padding: 16px 12px;
          border-radius: 8px;
          text-align: center;
        }
        .category-count {
          font-size: 24px;
          font-weight: 600;
          color: #1d1d1f;
          margin-bottom: 4px;
        }
        .category-name {
          font-size: 12px;
          color: #86868b;
        }
        .footer {
          text-align: center;
          padding: 32px;
          background-color: #f5f5f7;
          color: #86868b;
          font-size: 12px;
          line-height: 1.8;
        }
        .footer a {
          color: #0066cc;
          text-decoration: none;
        }
        .motivational {
          background: linear-gradient(135deg, #9333ea10 0%, #3b82f610 100%);
          border-radius: 12px;
          padding: 24px;
          margin: 32px 0;
          text-align: center;
        }
        .motivational p {
          margin: 0;
          font-size: 16px;
          font-style: italic;
          color: #515154;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          margin-top: 16px;
        }
        @media only screen and (max-width: 600px) {
          .stat-card {
            display: block;
            width: 100%;
            margin-bottom: 12px;
          }
          .category-item {
            display: block;
            width: 100%;
            margin-bottom: 8px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://tgmventures.com/images/tgm-logo-icon.png" alt="TGM Ventures" class="logo">
          <h1>Your Week at TGM Ventures</h1>
          <p>${dateRange}</p>
        </div>
        
        <div class="content">
          <table class="stats-grid">
            <tr>
              <td class="stat-card">
                <div class="number">${completedObjectives.length}</div>
                <div class="label">Completed</div>
              </td>
              <td class="stat-card">
                <div class="number">${addedObjectives.length}</div>
                <div class="label">Added</div>
              </td>
              <td class="stat-card">
                <div class="number">${Object.keys(completedByUser).length}</div>
                <div class="label">Active Team</div>
              </td>
            </tr>
          </table>
          
          ${sortedUsers.length > 0 ? `
            <h2 class="section-title">Team Achievements</h2>
            ${sortedUsers.slice(0, 5).map(([email, data]) => `
              <div class="team-member">
                <table class="team-member-header">
                  <tr>
                    <td class="team-member-info">
                      <div class="member-name">${data.name}</div>
                      <div class="member-email">${email}</div>
                    </td>
                    <td class="team-member-stats">
                      <div class="achievement-count">${data.count}</div>
                      <div class="achievement-label">Objectives</div>
                    </td>
                  </tr>
                </table>
                ${data.objectives.length > 0 ? `
                  <ul class="objective-list">
                    ${data.objectives.slice(0, 3).map(objective => `
                      <li class="objective-item">
                        ${objective.title} 
                        <span class="objective-type">${objective.type}</span>
                      </li>
                    `).join('')}
                    ${data.objectives.length > 3 ? `
                      <li class="objective-item">
                        <em>...and ${data.objectives.length - 3} more achievements</em>
                      </li>
                    ` : ''}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          ` : ''}
          
          <h2 class="section-title">Progress by Category</h2>
          <table class="category-grid">
            <tr>
              <td class="category-item">
                <div class="category-count">${completedByCategory['asset-management']}</div>
                <div class="category-name">Asset Mgmt</div>
              </td>
              <td class="category-item">
                <div class="category-count">${completedByCategory['real-estate-development']}</div>
                <div class="category-name">Real Estate</div>
              </td>
              <td class="category-item">
                <div class="category-count">${completedByCategory['ventures']}</div>
                <div class="category-name">Ventures</div>
              </td>
              <td class="category-item">
                <div class="category-count">${completedByCategory['taxes']}</div>
                <div class="category-name">Taxes</div>
              </td>
            </tr>
          </table>
          
          ${completedObjectives.length > 10 ? `
            <div class="motivational">
              <p>"Great things in business are never done by one person. They're done by a team of people."</p>
              <p style="margin-top: 8px; font-size: 14px; font-style: normal;">— Steve Jobs</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="https://tgmventures.com/weekly-progress" class="button">View Full Progress Report</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This weekly progress report is sent every Saturday to keep our team aligned and motivated.</p>
          <p>© ${new Date().getFullYear()} TGM Ventures. All rights reserved.</p>
          <p><a href="https://tgmventures.com/dashboard">Dashboard</a> | <a href="mailto:management@tgmventures.com">Contact Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

// Callable function to get report data
exports.getWeeklyReport = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth || !context.auth.token.email?.endsWith('@tgmventures.com')) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated with @tgmventures.com email');
  }
  
  const { startDate, endDate } = data;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Get completed and added objectives
  const completedObjectives = await getWeeklyCompletedObjectives(start, end);
  const addedObjectives = await getWeeklyAddedObjectives(start, end);
  const trainingModules = await getWeeklyTrainingModules(start, end);
  
  // Calculate summary stats
  const completedByUser = {};
  const addedByUser = {};
  const completedByCategory = {
    'asset-management': 0,
    'real-estate-development': 0,
    'ventures': 0,
    'taxes': 0
  };
  
  // Group completed objectives by user
  completedObjectives.forEach(objective => {
    const email = objective.completedByEmail || 'unknown';
    if (!completedByUser[email]) {
      completedByUser[email] = {
        name: objective.completedBy,
        email: email,
        count: 0
      };
    }
    completedByUser[email].count++;
    
    // Count by category
    if (objective.division) {
      completedByCategory[objective.division] = (completedByCategory[objective.division] || 0) + 1;
    } else if (objective.type === 'Venture Objective') {
      completedByCategory['ventures'] = (completedByCategory['ventures'] || 0) + 1;
    } else if (objective.type === 'Tax Return') {
      completedByCategory['taxes'] = (completedByCategory['taxes'] || 0) + 1;
    }
  });
  
  // Get unique users who completed objectives
  const activeUsers = new Set(completedObjectives.map(t => t.completedByEmail).filter(Boolean));
  
  return {
    totalCompleted: completedObjectives.length,
    totalAdded: addedObjectives.length,
    totalTrainingModules: trainingModules.length,
    activeUsers: activeUsers.size,
    completedByUser: Object.values(completedByUser),
    byCategory: {
      assetManagement: { completed: completedByCategory['asset-management'] || 0 },
      realEstate: { completed: completedByCategory['real-estate-development'] || 0 },
      ventures: { completed: completedByCategory['ventures'] || 0 },
      taxes: { completed: completedByCategory['taxes'] || 0 }
    },
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString()
    }
  };
});

// Callable function to get email preview
exports.getWeeklyReportEmailPreview = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth || !context.auth.token.email?.endsWith('@tgmventures.com')) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated with @tgmventures.com email');
  }
  
  const { startDate, endDate } = data;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Get completed and added objectives
  const completedObjectives = await getWeeklyCompletedObjectives(start, end);
  const addedObjectives = await getWeeklyAddedObjectives(start, end);
  
  // Generate HTML email
  const dateRange = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  const emailHTML = generateEmailHTML(completedObjectives, addedObjectives, dateRange);
  
  return { html: emailHTML };
});

// Get training modules created this week
async function getWeeklyTrainingModules(start, end) {
  const db = admin.firestore();
  const modulesRef = db.collection('training-modules');
  const snapshot = await modulesRef
    .where('createdAt', '>=', start)
    .where('createdAt', '<=', end)
    .get();
    
  const modules = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    modules.push({
      title: data.title,
      createdBy: data.createdBy,
      createdAt: data.createdAt
    });
  });
  
  return modules;
}

// Scheduled function to run every Saturday at 11 AM PST
exports.weeklyReportEmail = functions.pubsub
  .schedule('0 11 * * 6')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    try {
      // Get SendGrid API key
      const apiKey = await getSendGridApiKey();
      sgMail.setApiKey(apiKey);
      
      // Get date range
      const dateRange = getWeekDateRange();
      
      // Get weekly data
      const [completedObjectives, addedObjectives] = await Promise.all([
        getWeeklyCompletedObjectives(dateRange.start, dateRange.end),
        getWeeklyAddedObjectives(dateRange.start, dateRange.end)
      ]);
      
      // Generate email HTML  
      const dateRangeStr = `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`;
      const html = generateEmailHTML(completedObjectives, addedObjectives, dateRangeStr);
      
      // Get all @tgmventures.com users
      const db = admin.firestore();
      const usersSnapshot = await db.collection('users').get();
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
      
      // Send email to all recipients
      const msg = {
        to: recipients,
        from: 'noreply@tgmventures.com',
        subject: `Weekly Progress Report - ${dateRange.end.toLocaleDateString()}`,
        html: html
      };
      
      await sgMail.send(msg);
      console.log(`Weekly report email sent successfully to ${recipients.length} recipients`);
      
    } catch (error) {
      console.error('Error sending weekly report:', error);
      throw error;
    }
  });

// Manual trigger function for testing  
exports.sendWeeklyReportNow = functions.https.onCall(async (data, context) => {
  // Check that the user is authenticated and is antonio@tgmventures.com
  if (!context.auth || context.auth.token.email !== 'antonio@tgmventures.com') {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can trigger reports');
  }
  
  try {
    // Get SendGrid API key
    const apiKey = await getSendGridApiKey();
    sgMail.setApiKey(apiKey);
    
    // Get date range
    const dateRange = getWeekDateRange();
    
    // Get weekly data
    const [completedObjectives, addedObjectives] = await Promise.all([
      getWeeklyCompletedObjectives(dateRange.start, dateRange.end),
      getWeeklyAddedObjectives(dateRange.start, dateRange.end)
    ]);
    
    // Generate email HTML
    const html = generateEmailHTML(completedObjectives, addedObjectives, dateRange);
    
    // Send email
    const msg = {
      to: data.email || 'management@tgmventures.com',
      from: 'noreply@tgmventures.com',
      subject: `Weekly Report - ${dateRange.end.toDateString()}`,
      html: html
    };
    
    await sgMail.send(msg);
    
    return { 
      success: true, 
      message: 'Weekly report sent successfully',
      stats: {
        completed: completedObjectives.length,
        added: addedObjectives.length
      }
    };
    
  } catch (error) {
    console.error('Error sending weekly report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send report');
  }
});
