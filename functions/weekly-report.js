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

// Get all completed tasks for the week
async function getWeeklyCompletedTasks(start, end) {
  const db = admin.firestore();
  const tasks = [];
  
  // Get division tasks
  const divisionsRef = db.collection('organizations/tgm-ventures/divisions');
  const divisions = await divisionsRef.get();
  
  for (const divDoc of divisions.docs) {
    const tasksRef = divDoc.ref.collection('tasks');
    const snapshot = await tasksRef
      .where('isChecked', '==', true)
      .where('completedAt', '>=', start)
      .where('completedAt', '<=', end)
      .get();
      
    snapshot.forEach(doc => {
      const data = doc.data();
      tasks.push({
        type: 'Division Task',
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
        tasks.push({
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
  
  return tasks;
}

// Get tasks added this week
async function getWeeklyAddedTasks(start, end) {
  const db = admin.firestore();
  const tasks = [];
  
  // Get division tasks
  const divisionsRef = db.collection('organizations/tgm-ventures/divisions');
  const divisions = await divisionsRef.get();
  
  for (const divDoc of divisions.docs) {
    const tasksRef = divDoc.ref.collection('tasks');
    const snapshot = await tasksRef
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get();
      
    snapshot.forEach(doc => {
      const data = doc.data();
      tasks.push({
        type: 'Division Task',
        division: divDoc.id,
        title: data.title,
        createdAt: data.createdAt
      });
    });
  }
  
  return tasks;
}

// Generate HTML email content
function generateEmailHTML(completedTasks, addedTasks, dateRange) {
  const completedByUser = {};
  const completedByCategory = {
    'asset-management': 0,
    'real-estate-development': 0,
    'ventures': 0
  };
  
  // Group completed tasks by user
  completedTasks.forEach(task => {
    const email = task.completedByEmail || 'unknown';
    if (!completedByUser[email]) {
      completedByUser[email] = {
        name: task.completedBy,
        count: 0,
        tasks: []
      };
    }
    completedByUser[email].count++;
    completedByUser[email].tasks.push(task);
    
    // Count by category
    if (task.division) {
      completedByCategory[task.division] = (completedByCategory[task.division] || 0) + 1;
    } else if (task.type === 'Venture Objective') {
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
        .task-list { margin: 10px 0; padding-left: 20px; }
        .task-item { margin: 5px 0; }
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
              <div class="stat-number">${completedTasks.length}</div>
              <div>Tasks Completed</div>
            </div>
            <div class="stat">
              <div class="stat-number">${addedTasks.length}</div>
              <div>Tasks Added</div>
            </div>
          </div>
        </div>
        
        <h2>Completed by Team Member</h2>
        ${Object.entries(completedByUser).map(([email, data]) => `
          <div class="user-section">
            <div class="user-header">${data.name} (${data.count} tasks)</div>
            <ul class="task-list">
              ${data.tasks.slice(0, 5).map(task => `
                <li class="task-item">${task.title} <em>(${task.type})</em></li>
              `).join('')}
              ${data.tasks.length > 5 ? `<li><em>...and ${data.tasks.length - 5} more</em></li>` : ''}
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
      const [completedTasks, addedTasks] = await Promise.all([
        getWeeklyCompletedTasks(dateRange.start, dateRange.end),
        getWeeklyAddedTasks(dateRange.start, dateRange.end)
      ]);
      
      // Generate email HTML
      const html = generateEmailHTML(completedTasks, addedTasks, dateRange);
      
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
    const [completedTasks, addedTasks] = await Promise.all([
      getWeeklyCompletedTasks(dateRange.start, dateRange.end),
      getWeeklyAddedTasks(dateRange.start, dateRange.end)
    ]);
    
    // Generate email HTML
    const html = generateEmailHTML(completedTasks, addedTasks, dateRange);
    
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
        completed: completedTasks.length,
        added: addedTasks.length
      }
    };
    
  } catch (error) {
    console.error('Error sending weekly report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send report');
  }
});
