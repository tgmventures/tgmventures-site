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

// Generate initials for avatar
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// Generate avatar HTML
function generateAvatar(name: string, email: string): string {
  const initials = getInitials(name || email)
  const bgColors = ['#9333EA', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']
  const colorIndex = email.charCodeAt(0) % bgColors.length
  const bgColor = bgColors[colorIndex]
  
  return `
    <div style="width: 48px; height: 48px; border-radius: 50%; background-color: ${bgColor}; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; margin-right: 12px;">
      ${initials}
    </div>
  `
}

export function generateProfessionalEmailHTML(data: EmailData): string {
  const dateRange = formatDateRange(data.weekStart, data.weekEnd)
  const topPerformers = Object.entries(data.completedByPerson)
    .sort((a, b) => b[1].tasks.length - a[1].tasks.length)
    .slice(0, 3)
  
  // Generate individual recognition sections
  let recognitionHtml = ''
  Object.entries(data.completedByPerson).forEach(([email, person]) => {
    if (person.tasks.length > 0) {
      recognitionHtml += `
        <tr>
          <td style="padding: 20px 0; border-bottom: 1px solid #E5E7EB;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td valign="top" style="width: 60px;">
                  ${generateAvatar(person.name, email)}
                </td>
                <td valign="top">
                  <h3 style="margin: 0 0 4px 0; color: #111827; font-size: 18px; font-weight: 600;">
                    ${person.name || email}
                  </h3>
                  <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px;">
                    ${person.tasks.length} objective${person.tasks.length > 1 ? 's' : ''} completed
                  </p>
                  <ul style="margin: 0; padding: 0; list-style: none;">
                    ${person.tasks.slice(0, 3).map(task => `
                      <li style="margin-bottom: 8px; padding-left: 20px; position: relative; color: #374151; font-size: 14px;">
                        <span style="position: absolute; left: 0; color: #10B981;">✓</span>
                        ${task.task}
                        <span style="color: #9CA3AF; font-size: 12px;"> - ${task.division}</span>
                      </li>
                    `).join('')}
                    ${person.tasks.length > 3 ? `
                      <li style="color: #6B7280; font-size: 14px; font-style: italic; padding-left: 20px;">
                        ...and ${person.tasks.length - 3} more
                      </li>
                    ` : ''}
                  </ul>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
    }
  })
  
  // Generate outstanding objectives section
  let outstandingHtml = ''
  const hasOutstanding = Object.keys(data.outstandingObjectives || {}).length > 0
  
  if (hasOutstanding) {
    Object.entries(data.outstandingObjectives).forEach(([category, objectives]) => {
      if (objectives.length > 0) {
        outstandingHtml += `
          <tr>
            <td style="padding: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #4B5563; font-size: 16px; font-weight: 600;">
                ${category}
              </h3>
              <ul style="margin: 0; padding: 0; list-style: none;">
                ${objectives.map(obj => `
                  <li style="margin-bottom: 8px; padding: 8px 12px; background-color: #F9FAFB; border-radius: 6px; font-size: 14px; color: #374151;">
                    ${obj.task}
                    ${obj.assignee ? `<span style="color: #6B7280; font-size: 12px;"> - ${obj.assignee}</span>` : ''}
                  </li>
                `).join('')}
              </ul>
            </td>
          </tr>
        `
      }
    })
  }
  
  // Motivational quote if high performance
  const motivationalQuote = data.totalCompleted >= 10 
    ? `
      <tr>
        <td style="padding: 30px; background-color: #F3F4F6; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 18px; color: #4B5563; font-style: italic; line-height: 1.6;">
            "Excellence is not a skill, it's an attitude."
          </p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #6B7280;">
            Outstanding work this week, team! 🎉
          </p>
        </td>
      </tr>
    ` : ''
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Progress Report - TGM Ventures</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F9FAFB;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; border-bottom: 2px solid #E5E7EB;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 700;">
                      TGM Ventures
                    </h1>
                    <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 14px;">
                      Weekly Progress Report
                    </p>
                  </td>
                  <td align="right">
                    <img src="https://tgmventures.com/images/tgm-logo-icon.png" alt="TGM" width="48" height="48" style="display: block;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Hero Section -->
          <tr>
            <td style="padding: 40px; background: linear-gradient(135deg, #9333EA 0%, #3B82F6 100%); color: white;">
              <h2 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700;">
                Your Week at TGM
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; opacity: 0.9;">
                ${dateRange}
              </p>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 20px 32px; text-align: center;">
                    <div style="font-size: 48px; font-weight: 700; line-height: 1;">
                      ${data.totalCompleted}
                    </div>
                    <div style="font-size: 14px; margin-top: 4px; opacity: 0.9;">
                      Objectives Completed
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Team Recognition -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 24px; font-weight: 600;">
                Team Achievements
              </h2>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${recognitionHtml}
              </table>
            </td>
          </tr>
          
          ${motivationalQuote ? `
            <tr>
              <td style="padding: 0 40px 40px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${motivationalQuote}
                </table>
              </td>
            </tr>
          ` : ''}
          
          ${hasOutstanding ? `
            <!-- Outstanding Objectives -->
            <tr>
              <td style="padding: 0 40px 40px;">
                <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 24px; font-weight: 600;">
                  Planning for Next Week
                </h2>
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F9FAFB; border-radius: 8px; padding: 20px;">
                  ${outstandingHtml}
                </table>
              </td>
            </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px;">
                      Keep up the great work, team!
                    </p>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <a href="https://tgmventures.com/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #9333EA; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                            View Dashboard
                          </a>
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
  </table>
</body>
</html>
  `
}
