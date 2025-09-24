import { DivisionTask } from '@/types/goal'

interface EmailData {
  weekStart: Date
  weekEnd: Date
  totalCompleted: number
  completedByPerson: {
    [email: string]: {
      name: string
      tasks: Array<{
        task: string
        division: string
        completedAt: any
      }>
    }
  }
  completedByCategory: {
    [category: string]: Array<{
      task: string
      completedBy: string
      completedAt: any
    }>
  }
  newObjectives: Array<{
    task: string
    category: string
    createdBy?: string
  }>
  outstandingObjectives: {
    [category: string]: Array<{
      task: string
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

export function generateSimpleEmailHTML(data: EmailData): string {
  const dateRange = formatDateRange(data.weekStart, data.weekEnd)
  
  // Generate team accomplishments by category
  let categoryHtml = ''
  Object.entries(data.completedByCategory || {}).forEach(([category, tasks]) => {
    if (tasks.length > 0) {
      categoryHtml += `
        <tr>
          <td style="padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px; font-weight: 600;">
              ${category}
            </h3>
            <ul style="margin: 0; padding: 0; list-style: none;">
              ${tasks.map(task => `
                <li style="margin-bottom: 8px; color: #374151; font-size: 14px; line-height: 1.5;">
                  • ${task.task}
                  <span style="color: #6b7280; font-size: 12px;"> — ${task.completedBy}</span>
                </li>
              `).join('')}
            </ul>
          </td>
        </tr>
      `
    }
  })
  
  // Generate individual accomplishments
  let individualHtml = ''
  Object.entries(data.completedByPerson).forEach(([email, person]) => {
    if (person.tasks.length > 0) {
      individualHtml += `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
            <h4 style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
              ${person.name || email} <span style="color: #6b7280; font-weight: normal;">(${person.tasks.length} completed)</span>
            </h4>
            <ul style="margin: 0; padding: 0; list-style: none;">
              ${person.tasks.map(task => `
                <li style="margin-bottom: 4px; color: #4b5563; font-size: 13px;">
                  • ${task.task} <span style="color: #9ca3af; font-size: 12px;">- ${task.division}</span>
                </li>
              `).join('')}
            </ul>
          </td>
        </tr>
      `
    }
  })
  
  // Generate new objectives section
  let newObjectivesHtml = ''
  if (data.newObjectives && data.newObjectives.length > 0) {
    newObjectivesHtml = `
      <tr>
        <td style="padding: 32px 0;">
          <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
            Newly Added Objectives
          </h2>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${data.newObjectives.map(obj => `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #374151; font-size: 14px;">
                    • ${obj.task}
                    <span style="color: #6b7280; font-size: 12px;"> — ${obj.category}</span>
                  </p>
                </td>
              </tr>
            `).join('')}
          </table>
        </td>
      </tr>
    `
  }
  
  // Generate outstanding objectives section
  let outstandingHtml = ''
  const hasOutstanding = Object.keys(data.outstandingObjectives || {}).length > 0
  
  if (hasOutstanding) {
    let outstandingRows = ''
    Object.entries(data.outstandingObjectives).forEach(([category, objectives]) => {
      if (objectives.length > 0) {
        outstandingRows += `
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 15px; font-weight: 600;">
                ${category}
              </h3>
              <ul style="margin: 0; padding: 0; list-style: none;">
                ${objectives.map(obj => `
                  <li style="margin-bottom: 4px; color: #4b5563; font-size: 13px;">
                    • ${obj.task}
                    ${obj.assignee ? `<span style="color: #9ca3af; font-size: 12px;"> — ${obj.assignee}</span>` : ''}
                  </li>
                `).join('')}
              </ul>
            </td>
          </tr>
        `
      }
    })
    
    outstandingHtml = `
      <tr>
        <td style="padding: 32px 0;">
          <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
            Outstanding Objectives for Next Week
          </h2>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${outstandingRows}
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
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="padding: 0 0 32px; text-align: center;">
              <img src="https://tgmventures.com/images/tgm-logo-icon.png" alt="TGM" width="40" height="40" style="display: block; margin: 0 auto 16px;">
              <h1 style="margin: 0; color: #111827; font-size: 20px; font-weight: 600;">
                Weekly Progress Report
              </h1>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                ${dateRange}
              </p>
            </td>
          </tr>
          
          <!-- Summary -->
          <tr>
            <td style="padding: 24px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="font-size: 32px; font-weight: 600; color: #111827;">
                      ${data.totalCompleted}
                    </div>
                    <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">
                      objectives completed this week
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Team Accomplishments by Category -->
          <tr>
            <td style="padding: 32px 0;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                What We Accomplished This Week
              </h2>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${categoryHtml || '<tr><td style="padding: 16px 0; color: #6b7280; font-size: 14px;">No objectives completed this week.</td></tr>'}
              </table>
            </td>
          </tr>
          
          <!-- Individual Accomplishments -->
          <tr>
            <td style="padding: 32px 0; border-top: 1px solid #e5e7eb;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                Individual Contributions
              </h2>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${individualHtml || '<tr><td style="padding: 16px 0; color: #6b7280; font-size: 14px;">No individual contributions recorded.</td></tr>'}
              </table>
            </td>
          </tr>
          
          ${newObjectivesHtml}
          
          ${outstandingHtml}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px;">
                This report is sent to all team members at TGM Ventures.
              </p>
              <a href="https://tgmventures.com/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #111827; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                View Dashboard
              </a>
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
