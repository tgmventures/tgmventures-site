
interface TeamMember {
  name: string
  email: string
  photoURL?: string
  completedCount: number
  objectives: Array<{
    title: string
    division: string
  }>
}

interface EmailData {
  weekStart: Date
  weekEnd: Date
  totalCompleted: number
  totalAdded: number
  activeMembers: number
  completedByCard: {
    [cardName: string]: Array<{
      title: string
      completedBy: string
      completedAt: any
    }>
  }
  addedByCard: {
    [cardName: string]: Array<{
      title: string
      createdBy?: string
      createdAt: any
    }>
  }
  teamMembers: TeamMember[]
  outstandingByCard: {
    [cardName: string]: Array<{
      title: string
      assignee?: string
    }>
  }
}

// Helper to format date nicely
function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
  const startStr = start.toLocaleDateString('en-US', options)
  const endStr = end.toLocaleDateString('en-US', { ...options, year: 'numeric' })
  return `${startStr} - ${endStr}`
}

export function generateEnhancedEmailHTML(data: EmailData): string {
  console.log('=== Email Generation Debug ===')
  console.log('Email data received:')
  console.log('  Total completed:', data.totalCompleted)
  console.log('  Total added:', data.totalAdded)
  console.log('  Active members:', data.activeMembers)
  console.log('  Outstanding by card keys:', Object.keys(data.outstandingByCard || {}))
  if (data.outstandingByCard) {
    Object.entries(data.outstandingByCard).forEach(([card, objectives]) => {
      console.log(`    ${card}: ${objectives.length} objectives`)
    })
  }
  
  const dateRange = formatDateRange(data.weekStart, data.weekEnd)
  
  // Generate team member accomplishments (same design as web app)
  let teamAccomplishmentsHtml = ''
  if (data.teamMembers && data.teamMembers.length > 0) {
    teamAccomplishmentsHtml = data.teamMembers.map(member => {
      // Format name as First L.
      const nameParts = member.name.split(' ')
      const displayName = nameParts.length > 1 
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
        : member.name
        
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
                      ${member.objectives.slice(0, 3).map(obj => `
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
                      ${member.objectives.length > 3 ? `
                        <tr>
                          <td align="center" style="padding-top: 8px;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                              +${member.objectives.length - 3} more achievement${member.objectives.length - 3 !== 1 ? 's' : ''}
                            </p>
                          </td>
                        </tr>
                      ` : ''}
                    </table>
                  ` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
    }).join('')
  }
  
  // Generate outstanding objectives with checkboxes
  let outstandingHtml = ''
  const hasOutstanding = Object.keys(data.outstandingByCard || {}).some(key => data.outstandingByCard[key].length > 0)
  
  if (hasOutstanding) {
    let outstandingCards = ''
    Object.entries(data.outstandingByCard).forEach(([cardName, objectives]) => {
      if (objectives.length > 0) {
        outstandingCards += `
          <tr>
            <td style="padding: 12px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                      ${cardName}
                    </h3>
                    <ul style="margin: 0; padding: 0; list-style: none;">
                      ${objectives.map(obj => `
                        <li style="margin-bottom: 12px; color: #374151; font-size: 14px; line-height: 1.6; display: flex; align-items: center;">
                          <div style="width: 20px; height: 20px; border: 2px solid #d1d5db; border-radius: 4px; margin-right: 12px; flex-shrink: 0; background-color: #ffffff;"></div>
                          <span>${obj.title}${obj.assignee ? ` <span style="color: #6b7280; font-size: 12px;">(${obj.assignee})</span>` : ''}</span>
                        </li>
                      `).join('')}
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `
      }
    })
    
    outstandingHtml = `
      <tr>
        <td style="padding: 40px 0 0;">
          <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 600; text-align: center;">
            Outstanding Objectives for Next Week
          </h2>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${outstandingCards}
          </table>
        </td>
      </tr>
    `
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Progress Report - TGM Ventures</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background-color: #ffffff;
      cursor: default;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <img src="https://tgmventures.com/images/tgm-logo-icon.png" alt="TGM Ventures" width="56" height="56" style="display: block; margin: 0 auto 20px;">
              <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 32px; font-weight: 700; line-height: 1.2;">
                Weekly Progress Report
              </h1>
              <p style="margin: 0; color: #6b7280; font-size: 18px;">
                ${dateRange}
              </p>
            </td>
          </tr>
          
          <!-- Summary Stats -->
          <tr>
            <td style="padding-bottom: 40px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 32px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="color: white;">
                          <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; opacity: 0.95;">
                            This Week's Summary
                          </h2>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td align="center" style="width: 33.33%; padding: 0 8px;">
                                <div style="background-color: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 12px; backdrop-filter: blur(10px);">
                                  <div style="font-size: 40px; font-weight: 700; color: white; line-height: 1;">
                                    ${data.totalCompleted}
                                  </div>
                                  <div style="font-size: 13px; margin-top: 8px; color: rgba(255, 255, 255, 0.9);">
                                    Objectives<br>Completed
                                  </div>
                                </div>
                              </td>
                              <td align="center" style="width: 33.33%; padding: 0 8px;">
                                <div style="background-color: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 12px; backdrop-filter: blur(10px);">
                                  <div style="font-size: 40px; font-weight: 700; color: white; line-height: 1;">
                                    ${data.totalAdded}
                                  </div>
                                  <div style="font-size: 13px; margin-top: 8px; color: rgba(255, 255, 255, 0.9);">
                                    New<br>Objectives
                                  </div>
                                </div>
                              </td>
                              <td align="center" style="width: 33.33%; padding: 0 8px;">
                                <div style="background-color: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 12px; backdrop-filter: blur(10px);">
                                  <div style="font-size: 40px; font-weight: 700; color: white; line-height: 1;">
                                    ${data.activeMembers}
                                  </div>
                                  <div style="font-size: 13px; margin-top: 8px; color: rgba(255, 255, 255, 0.9);">
                                    Active Team<br>Members
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Team Member Accomplishments -->
          ${teamAccomplishmentsHtml ? `
            <tr>
              <td style="padding-bottom: 40px;">
                <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 600; text-align: center;">
                  Team Member Accomplishments
                </h2>
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${teamAccomplishmentsHtml}
                </table>
              </td>
            </tr>
          ` : ''}
          
          ${outstandingHtml}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 40px 0 0 0; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 32px 0;">
                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px;">
                      Keep up the great work, team! 🚀
                    </p>
                    <a href="https://tgmventures.com/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #111827; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View Dashboard →
                    </a>
                    <p style="margin: 32px 0 0 0; color: #9ca3af; font-size: 13px;">
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
  `
}