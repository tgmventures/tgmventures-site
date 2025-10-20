const admin = require('firebase-admin');

// Get the week date range (Saturday to Friday)
function getWeekDateRange(date = new Date()) {
  const dayOfWeek = date.getDay();
  const daysUntilLastSaturday = dayOfWeek === 6 ? 7 : (dayOfWeek + 1);
  
  const start = new Date(date);
  start.setDate(date.getDate() - daysUntilLastSaturday);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

// Get completed objectives for the week
async function getCompletedObjectives(startDate, endDate) {
  const db = admin.firestore();
  const completedTasks = [];
  
  // Get division tasks
  const divisionsSnapshot = await db.collection('organizations/tgm-ventures/divisions').get();
  
  for (const divDoc of divisionsSnapshot.docs) {
    const divData = divDoc.data();
    const objectivesSnapshot = await divDoc.ref.collection('objectives').get();
    
    objectivesSnapshot.forEach(objDoc => {
      const obj = objDoc.data();
      if (obj.isChecked && obj.completedAt) {
        const completedDate = obj.completedAt.toDate();
        if (completedDate >= startDate && completedDate <= endDate) {
          completedTasks.push({
            id: objDoc.id,
            title: obj.title,
            category: divData.name || divDoc.id,
            completedAt: completedDate,
            completedBy: obj.completedBy || '',
            completedByName: obj.completedByName || obj.completedBy || 'Unknown',
            completedByEmail: obj.completedBy || '',
            type: 'division'
          });
        }
      }
    });
  }
  
  // Get ventures cards
  const venturesSnapshot = await db.collection('organizations/tgm-ventures/ventures-objective-cards').get();
  
  venturesSnapshot.forEach(doc => {
    const card = doc.data();
    if (card.objectives && Array.isArray(card.objectives)) {
      card.objectives.forEach((obj, index) => {
        if (obj.isChecked && obj.completedAt) {
          const completedDate = obj.completedAt.toDate();
          if (completedDate >= startDate && completedDate <= endDate) {
            completedTasks.push({
              id: `${doc.id}_${index}`,
              title: obj.text || obj.title || obj.task,
              category: card.title || 'Ventures',
              completedAt: completedDate,
              completedBy: obj.completedBy || '',
              completedByName: obj.completedByName || obj.completedBy || 'Unknown',
              completedByEmail: obj.completedBy || '',
              type: 'venture'
            });
          }
        }
      });
    }
  });
  
  // Get asset management cards
  const assetSnapshot = await db.collection('organizations/tgm-ventures/asset-management-cards').get();
  
  assetSnapshot.forEach(doc => {
    const card = doc.data();
    if (card.objectives && Array.isArray(card.objectives)) {
      card.objectives.forEach((obj, index) => {
        if (obj.isChecked && obj.completedAt) {
          const completedDate = obj.completedAt.toDate();
          if (completedDate >= startDate && completedDate <= endDate) {
            completedTasks.push({
              id: `${doc.id}_${index}`,
              title: obj.text || obj.title || obj.task,
              category: card.title || 'Asset Management',
              completedAt: completedDate,
              completedBy: obj.completedBy || '',
              completedByName: obj.completedByName || obj.completedBy || 'Unknown',
              completedByEmail: obj.completedBy || '',
              type: 'asset'
            });
          }
        }
      });
    }
  });
  
  // Get tax filings
  const currentYear = new Date().getFullYear();
  const priorYear = currentYear - 1;
  const taxRef = db.collection(`taxes/taxes-${priorYear}`);
  const taxSnapshot = await taxRef.get();
  
  taxSnapshot.forEach(doc => {
    const entity = doc.data();
    const tasks = [
      { field: 'federalReturn', label: 'Federal Tax Return' },
      { field: 'stateReturn', label: 'State Tax Return' },
      { field: 'extensionFiled', label: 'Extension Filed' }
    ];
    
    tasks.forEach(task => {
      const taskData = entity[task.field];
      if (taskData?.completed && taskData.completedAt) {
        const completedDate = taskData.completedAt.toDate();
        if (completedDate >= startDate && completedDate <= endDate) {
          completedTasks.push({
            id: `${doc.id}_${task.field}`,
            title: `${task.label} - ${entity.name}`,
            category: 'Tax Filings',
            completedAt: completedDate,
            completedBy: taskData.completedBy || '',
            completedByName: taskData.completedByName || taskData.completedBy || 'Unknown',
            completedByEmail: taskData.completedBy || '',
            type: 'tax'
          });
        }
      }
    });
  });
  
  return completedTasks;
}

// Get new objectives added this week
async function getNewObjectivesThisWeek(startDate, endDate) {
  const db = admin.firestore();
  const newObjectives = [];
  
  // Get ventures cards
  const venturesSnapshot = await db.collection('organizations/tgm-ventures/ventures-objective-cards').get();
  
  venturesSnapshot.forEach(doc => {
    const card = doc.data();
    if (card.objectives && Array.isArray(card.objectives)) {
      card.objectives.forEach((obj, index) => {
        if (obj.createdAt) {
          const createdDate = obj.createdAt.toDate();
          if (createdDate >= startDate && createdDate <= endDate) {
            newObjectives.push({
              id: `${doc.id}_${index}`,
              title: obj.text || obj.title || obj.task,
              category: card.title || 'Ventures',
              createdAt: createdDate,
              type: 'venture'
            });
          }
        }
      });
    }
  });
  
  // Get asset management cards
  const assetSnapshot = await db.collection('organizations/tgm-ventures/asset-management-cards').get();
  
  assetSnapshot.forEach(doc => {
    const card = doc.data();
    if (card.objectives && Array.isArray(card.objectives)) {
      card.objectives.forEach((obj, index) => {
        if (obj.createdAt) {
          const createdDate = obj.createdAt.toDate();
          if (createdDate >= startDate && createdDate <= endDate) {
            newObjectives.push({
              id: `${doc.id}_${index}`,
              title: obj.text || obj.title || obj.task,
              category: card.title || 'Asset Management',
              createdAt: createdDate,
              type: 'asset'
            });
          }
        }
      });
    }
  });
  
  return newObjectives;
}

// Get outstanding objectives
async function getOutstandingObjectives() {
  const db = admin.firestore();
  const outstanding = {};
  const currentYear = new Date().getFullYear();
  
  // Get ventures cards
  const venturesSnapshot = await db.collection('organizations/tgm-ventures/ventures-objective-cards').get();
  
  venturesSnapshot.forEach(doc => {
    const card = doc.data();
    const cardName = card.title || 'Ventures';
    
    if (!outstanding[cardName]) {
      outstanding[cardName] = [];
    }
    
    if (card.objectives && Array.isArray(card.objectives)) {
      card.objectives.forEach((obj) => {
        if (!obj.isChecked) {
          outstanding[cardName].push({
            task: obj.text || obj.title || obj.task,
            assignee: obj.assignee
          });
        }
      });
    }
  });
  
  // Get Asset Management status - using the same logic as the dashboard
  outstanding['Asset Management'] = [];
  
  try {
    // Get the latest status from divisions
    const divisionsSnapshot = await db.collection('organizations/tgm-ventures/divisions').get();
    let assetStatus = null;
    
    divisionsSnapshot.forEach(doc => {
      if (doc.id === 'asset-management') {
        assetStatus = doc.data();
      }
    });
    
    if (assetStatus) {
      const now = new Date();
      const priorMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'long' });
      const currentMonth = now.toLocaleDateString('en-US', { month: 'long' });
      
      // Check each asset management task
      if (!assetStatus.booksClosedOut) {
        outstanding['Asset Management'].push({
          task: `${priorMonth} books closed`,
          assignee: undefined
        });
      }
      if (!assetStatus.rentsCollected) {
        outstanding['Asset Management'].push({
          task: `All ${currentMonth} rents collected`,
          assignee: undefined
        });
      }
      if (!assetStatus.loansPaymentsMade) {
        outstanding['Asset Management'].push({
          task: 'All loans paid',
          assignee: undefined
        });
      }
      if (!assetStatus.vendorsPaymentsMade) {
        outstanding['Asset Management'].push({
          task: 'All vendors paid',
          assignee: undefined
        });
      }
      if (!assetStatus.propertyTaxesPaid) {
        outstanding['Asset Management'].push({
          task: 'All property taxes paid',
          assignee: undefined
        });
      }
      if (!assetStatus.insurancePoliciesActive) {
        outstanding['Asset Management'].push({
          task: 'All insurance policies active',
          assignee: undefined
        });
      }
      if (!assetStatus.entitiesRenewed) {
        outstanding['Asset Management'].push({
          task: 'All entities renewed',
          assignee: undefined
        });
      }
    }
  } catch (error) {
    console.error('Error fetching asset management status:', error);
  }
  
  // Get custom Asset Management cards
  const assetSnapshot = await db.collection('organizations/tgm-ventures/asset-management-cards').get();
  
  assetSnapshot.forEach(doc => {
    const card = doc.data();
    const cardName = card.title || 'Asset Management';
    
    if (!outstanding[cardName]) {
      outstanding[cardName] = [];
    }
    
    if (card.objectives && Array.isArray(card.objectives)) {
      card.objectives.forEach((obj) => {
        if (!obj.isChecked) {
          outstanding[cardName].push({
            task: obj.text || obj.title || obj.task,
            assignee: obj.assignee
          });
        }
      });
    }
  });
  
  // Get Tax Filings
  const priorYear = currentYear - 1;
  const taxSnapshot = await db.collection(`taxes/taxes-${priorYear}`).get();
  
  outstanding['Tax Filings'] = [];
  
  taxSnapshot.forEach(doc => {
    const entity = doc.data();
    
    if (!entity.federalReturn?.completed) {
      outstanding['Tax Filings'].push({
        task: `${entity.name} - Federal Return`,
        assignee: undefined
      });
    }
    
    if (!entity.stateReturn?.completed && entity.requiresStateReturn) {
      outstanding['Tax Filings'].push({
        task: `${entity.name} - State Return`,
        assignee: undefined
      });
    }
    
    if (!entity.extensionFiled?.completed && !entity.federalReturn?.completed) {
      outstanding['Tax Filings'].push({
        task: `${entity.name} - Extension`,
        assignee: undefined
      });
    }
    
    if (!entity.propertyTaxH1?.paid) {
      outstanding['Tax Filings'].push({
        task: `All ${currentYear} H1 Property Taxes`,
        assignee: undefined
      });
    }
    
    if (!entity.propertyTaxH2?.paid) {
      outstanding['Tax Filings'].push({
        task: `All ${currentYear} H2 Property Taxes`,
        assignee: undefined
      });
    }
  });
  
  // Remove empty categories
  Object.keys(outstanding).forEach(key => {
    if (outstanding[key].length === 0) {
      delete outstanding[key];
    }
  });
  
  return outstanding;
}

// Get weekly report data
async function getWeeklyReportDataDirect(startDate, endDate) {
  const [completedTasks, newObjectives, outstandingObjectives] = await Promise.all([
    getCompletedObjectives(startDate, endDate),
    getNewObjectivesThisWeek(startDate, endDate),
    getOutstandingObjectives()
  ]);
  
  // Group by division/category
  const divisions = {};
  
  // Process completed tasks
  completedTasks.forEach(task => {
    if (!divisions[task.category]) {
      divisions[task.category] = {
        name: task.category,
        completedObjectives: [],
        addedObjectives: []
      };
    }
    divisions[task.category].completedObjectives.push(task);
  });
  
  // Process new objectives
  newObjectives.forEach(obj => {
    if (!divisions[obj.category]) {
      divisions[obj.category] = {
        name: obj.category,
        completedObjectives: [],
        addedObjectives: []
      };
    }
    divisions[obj.category].addedObjectives.push(obj);
  });
  
  return {
    divisions,
    outstandingObjectives,
    completedObjectives: completedTasks,
    addedObjectives: newObjectives,
    dateRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }
  };
}

// Generate enhanced email HTML
async function generateEnhancedEmailHTML(data) {
  // Build team members data
  const teamMembersMap = {};
  
  if (data.completedObjectives) {
    data.completedObjectives.forEach(obj => {
      const email = obj.completedByEmail || 'unknown';
      const name = obj.completedByName || obj.completedBy || 'Unknown';
      
      if (!teamMembersMap[email]) {
        teamMembersMap[email] = {
          email: email,
          name: name,
          completedCount: 0,
          objectives: []
        };
      }
      
      teamMembersMap[email].completedCount++;
      teamMembersMap[email].objectives.push({
        title: obj.title,
        category: obj.category
      });
    });
  }
  
  // Fetch user photos from Firestore
  const db = admin.firestore();
  const teamMembersArray = Object.values(teamMembersMap);
  const teamMembers = await Promise.all(
    teamMembersArray.map(async (member) => {
      try {
        // Try to get user data from Firestore
        const usersSnapshot = await db.collection('organizations/tgm-ventures/users').get();
        const userDoc = usersSnapshot.docs.find(doc => {
          const userData = doc.data();
          return userData.email === member.email;
        });
        
        if (userDoc) {
          const userData = userDoc.data();
          return {
            ...member,
            photoURL: userData.photoURL || userData.photoUrl || undefined
          };
        }
        
        return member;
      } catch (error) {
        console.error(`Error fetching user data for ${member.email}:`, error);
        return member;
      }
    })
  );
  
  // Sort by completion count
  teamMembers.sort((a, b) => b.completedCount - a.completedCount);
  
  // Generate team member accomplishments HTML
  const teamMemberAccomplishmentsHTML = teamMembers.map(member => {
    const displayName = member.name.includes('@') ? 
      member.name.split('@')[0].split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ') : 
      member.name.split(' ').length > 1 ? 
        `${member.name.split(' ')[0]} ${member.name.split(' ')[1].charAt(0)}.` : 
        member.name;
    
    return `
      <tr>
        <td style="padding: 12px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
            <!-- Gradient Header Bar -->
            <tr>
              <td style="height: 8px; background: linear-gradient(to right, #3b82f6, #2563eb);"></td>
            </tr>
            <tr>
              <td style="padding: 24px;">
                <!-- Two Column Layout -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                  <tr>
                    <!-- Left Column: Profile and Name -->
                    <td style="vertical-align: middle;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding-right: 12px;">
                            <!-- Profile Photo with Star Badge -->
                            <table cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="position: relative; padding-right: 8px; padding-bottom: 8px;">
                                  ${member.photoURL ? 
                                    `<img src="${member.photoURL}" alt="${member.name}" width="64" height="64" style="border-radius: 50%; object-fit: cover; display: block; border: 4px solid white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">` :
                                    `<table cellpadding="0" cellspacing="0" border="0" style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #60a5fa, #2563eb); border: 4px solid white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                                      <tr>
                                        <td align="center" valign="middle" style="font-weight: 700; color: #ffffff; font-size: 24px;">
                                          ${member.name.split(' ').map(n => n[0]).join('')}
                                        </td>
                                      </tr>
                                    </table>`
                                  }
                                </td>
                                <td style="vertical-align: bottom; margin-left: -20px;">
                                  <!-- Green Star Badge -->
                                  <table cellpadding="0" cellspacing="0" border="0" style="width: 32px; height: 32px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-left: -20px; margin-bottom: -4px;">
                                    <tr>
                                      <td align="center" valign="middle" style="color: white; font-size: 16px; font-weight: bold;">★</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align: middle;">
                            <h3 style="margin: 0; color: #111827; font-size: 18px; font-weight: 700;">
                              ${displayName}
                            </h3>
                          </td>
                        </tr>
                      </table>
                    </td>
                    
                    <!-- Right Column: Achievement Count -->
                    <td style="vertical-align: middle; padding-left: 20px;">
                      <table cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(to right, #eff6ff, #dbeafe); border-radius: 12px; margin-left: auto;">
                        <tr>
                          <td style="padding: 12px 20px; text-align: center;">
                            <div style="font-size: 32px; font-weight: 700; color: #2563eb;">
                              ${member.completedCount}
                            </div>
                            <p style="margin: 4px 0 0 0; color: #1e40af; font-size: 12px; font-weight: 500; white-space: nowrap;">
                              Objective${member.completedCount !== 1 ? 's' : ''} Completed This Week
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Key Achievements -->
                ${member.objectives.length > 0 ? `
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td>
                        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                          Key Achievements
                        </p>
                      </td>
                    </tr>
                    ${member.objectives.map(obj => `
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px;">
                            <tr>
                              <td style="padding: 12px;">
                                <table cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="vertical-align: top; padding-right: 12px;">
                                      <table cellpadding="0" cellspacing="0" border="0" style="width: 24px; height: 24px; background-color: #dcfce7; border-radius: 50%;">
                                        <tr>
                                          <td align="center" valign="middle" style="color: #16a34a; font-weight: 700;">✓</td>
                                        </tr>
                                      </table>
                                    </td>
                                    <td style="color: #374151; font-size: 14px; font-weight: 500; line-height: 1.5;">
                                      ${obj.title}
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    `).join('')}
                  </table>
                ` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join('');
  
  // Generate outstanding objectives HTML
  const outstandingObjectivesHTML = data.outstandingObjectives && Object.keys(data.outstandingObjectives).length > 0 ? `
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      ${Object.entries(data.outstandingObjectives).map(([category, objectives]) => `
        <tr>
          <td style="padding: 12px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 20px;">
                  <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                    ${category}
                  </h3>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    ${objectives.map(obj => `
                      <tr>
                        <td style="padding: 8px 0;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="vertical-align: top; padding-right: 12px;">
                                <input type="checkbox" style="width: 16px; height: 16px; margin: 2px 0 0 0;" disabled>
                              </td>
                              <td style="color: #4b5563; font-size: 14px; line-height: 1.5;">
                                ${obj.task}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    `).join('')}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('')}
    </table>
  ` : '';
  
  // Format date range
  const startDate = new Date(data.dateRange.start);
  const endDate = new Date(data.dateRange.end);
  const dateRangeStr = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  
  // Generate complete email HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TGM Ventures Weekly Progress Report</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; color: #1f2937;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px;">
              <!-- Header -->
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <img src="https://tgmventures.com/images/tgm-logo-icon.png" alt="TGM Ventures" width="60" height="60" style="display: block;">
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 16px;">
                        <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 700;">
                          Weekly Progress Report
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 8px;">
                        <p style="margin: 0; color: #6b7280; font-size: 16px;">
                          ${dateRangeStr}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Team Member Accomplishments -->
              ${teamMembers.length > 0 ? `
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 24px;">
                          <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 700;">
                            Team Member Accomplishments
                          </h2>
                        </td>
                      </tr>
                      ${teamMemberAccomplishmentsHTML}
                    </table>
                  </td>
                </tr>
              ` : ''}
              
              <!-- Outstanding Objectives -->
              ${outstandingObjectivesHTML ? `
                <tr>
                  <td style="padding-top: 32px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 24px;">
                          <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 700;">
                            Outstanding Objectives for Next Week
                          </h2>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          ${outstandingObjectivesHTML}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              ` : ''}
              
              <!-- Footer -->
              <tr>
                <td style="padding-top: 48px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 24px; background-color: #ffffff; border-radius: 12px;">
                        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
                          This weekly progress report is sent every Saturday to keep our team aligned and motivated.
                        </p>
                        <a href="https://tgmventures.com/weekly-progress" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                          View Full Report
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 24px;">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          © ${new Date().getFullYear()} TGM Ventures. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  return html;
}

module.exports = {
  getWeekDateRange,
  getWeeklyReportDataDirect,
  generateEnhancedEmailHTML
};
