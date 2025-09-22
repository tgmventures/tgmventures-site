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
    'ventures': 0
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
    }
  });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
        .summary { background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
        .stat { text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; color: #4CAF50; }
        .user-section { margin: 20px 0; }
        .user-header { background-color: #e0e0e0; padding: 10px; font-weight: bold; }
        .objective-list { margin: 10px 0; padding-left: 20px; }
        .objective-item { margin: 5px 0; }
        .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TGM Ventures Weekly Report</h1>
          <p>${dateRange.start.toDateString()} - ${dateRange.end.toDateString()}</p>
        </div>
        
        <div class="summary">
          <h2>Weekly Summary</h2>
          <div class="summary-grid">
            <div class="stat">
              <div class="stat-number">${completedObjectives.length}</div>
              <div>Objectives Completed</div>
            </div>
            <div class="stat">
              <div class="stat-number">${addedObjectives.length}</div>
              <div>Objectives Added</div>
            </div>
          </div>
        </div>
        
        <h2>Completed by Team Member</h2>
        ${Object.entries(completedByUser).map(([email, data]) => `
          <div class="user-section">
            <div class="user-header">${data.name} (${data.count} objectives)</div>
            <ul class="objective-list">
              ${data.objectives.slice(0, 5).map(objective => `
                <li class="objective-item">${objective.title} <em>(${objective.type})</em></li>
              `).join('')}
              ${data.objectives.length > 5 ? `<li><em>...and ${data.objectives.length - 5} more</em></li>` : ''}
            </ul>
          </div>
        `).join('')}
        
        <h2>Activity by Category</h2>
        <ul>
          <li>Asset Management: ${completedByCategory['asset-management']} completed</li>
          <li>Real Estate: ${completedByCategory['real-estate-development']} completed</li>
          <li>Ventures: ${completedByCategory['ventures']} completed</li>
        </ul>
        
        <div class="footer">
          <p>This is an automated weekly report from TGM Ventures Dashboard</p>
          <p>To unsubscribe or modify report settings, please contact your administrator</p>
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

// Scheduled function to run every Saturday at 9 AM EST
exports.weeklyReportEmail = functions.pubsub
  .schedule('0 9 * * 6')
  .timeZone('America/New_York')
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
      const html = generateEmailHTML(completedObjectives, addedObjectives, dateRange);
      
      // Send email to management
      const msg = {
        to: 'management@tgmventures.com',
        from: 'noreply@tgmventures.com',
        subject: `Weekly Report - ${dateRange.end.toDateString()}`,
        html: html
      };
      
      await sgMail.send(msg);
      console.log('Weekly report email sent successfully');
      
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
