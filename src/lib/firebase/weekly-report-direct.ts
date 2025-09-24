import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DivisionTask } from '@/types/goal'
import { generateEnhancedEmailHTML as generateEmailHTML } from './email-template-enhanced'

interface WeeklyReportData {
  divisions: {
    [key: string]: {
      name: string
      completedTasks: DivisionTask[]
      totalTasks: number
    }
  }
  totalCompleted: number
  totalTasks: number
  weekStart: Date
  weekEnd: Date
}

// Get division tasks for a specific date range
async function getDivisionTasksForDateRange(divisionId: string, startDate: Date, endDate: Date): Promise<DivisionTask[]> {
  try {
    const tasksRef = collection(db, 'divisions', divisionId, 'tasks')
    const q = query(
      tasksRef,
      where('completed', '==', true),
      where('completedAt', '>=', startDate),
      where('completedAt', '<=', endDate),
      orderBy('completedAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DivisionTask))
  } catch (error) {
    console.error(`Error fetching tasks for division ${divisionId}:`, error)
    return []
  }
}

// Get all divisions
async function getDivisions() {
  try {
    const divisionsSnapshot = await getDocs(collection(db, 'divisions'))
    return divisionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching divisions:', error)
    return []
  }
}

// Main function to get weekly report data directly from Firestore
export async function getWeeklyReportDataDirect(startDate: Date, endDate: Date): Promise<WeeklyReportData> {
  console.log('=== getWeeklyReportDataDirect called ===')
  console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString())
  
  try {
    // Get all divisions
    console.log('Getting divisions...')
    const divisions = await getDivisions()
    console.log('Found divisions:', divisions.length)
    
    const reportData: WeeklyReportData = {
      divisions: {},
      totalCompleted: 0,
      totalTasks: 0,
      weekStart: startDate,
      weekEnd: endDate
    }
    
    // For each division, get completed tasks
    for (const division of divisions) {
      const completedTasks = await getDivisionTasksForDateRange(division.id, startDate, endDate)
      
      if (completedTasks.length > 0) {
        reportData.divisions[division.id] = {
          name: division.name || division.id,
          completedTasks,
          totalTasks: completedTasks.length
        }
        
        reportData.totalCompleted += completedTasks.length
        reportData.totalTasks += completedTasks.length
      }
    }
    
    // Get completed objectives from Ventures cards
    console.log('Querying ventures cards...')
    const venturesSnapshot = await getDocs(collection(db, 'organizations/tgm-ventures/ventures-objective-cards'))
    console.log(`Found ${venturesSnapshot.size} venture cards`)
    
    venturesSnapshot.forEach(doc => {
      const card = doc.data()
      const cardName = card.title || 'Ventures'
      
      if (card.objectives && Array.isArray(card.objectives)) {
        console.log(`Card "${cardName}" has ${card.objectives.length} objectives`)
        
        const completedInWeek: any[] = []
        card.objectives.forEach((obj: any) => {
          if (obj.isChecked && obj.completedAt) {
            const completedDate = obj.completedAt.toDate ? obj.completedAt.toDate() : new Date(obj.completedAt)
            if (completedDate >= startDate && completedDate <= endDate) {
              console.log(`  Found completed objective: "${obj.text}"`)
              console.log(`    completedBy:`, obj.completedBy)
              console.log(`    completedByName:`, obj.completedByName)
              completedInWeek.push({
                task: obj.text || obj.title || obj.task,
                completedAt: completedDate,
                completedBy: obj.completedBy || { email: obj.completedByEmail || 'unknown@tgmventures.com', name: obj.completedByName || 'Team Member' }
              })
              reportData.totalCompleted++
            }
          }
        })
        
        if (completedInWeek.length > 0) {
          reportData.divisions[`venture-${doc.id}`] = {
            name: cardName,
            completedTasks: completedInWeek,
            totalTasks: completedInWeek.length
          }
        }
      }
    })
    
    // Get completed objectives from Asset Management cards
    console.log('Querying asset management cards...')
    const assetSnapshot = await getDocs(collection(db, 'organizations/tgm-ventures/asset-management-cards'))
    console.log(`Found ${assetSnapshot.size} asset management cards`)
    
    assetSnapshot.forEach(doc => {
      const card = doc.data()
      const cardName = card.title || 'Asset Management'
      
      if (card.objectives && Array.isArray(card.objectives)) {
        console.log(`Card "${cardName}" has ${card.objectives.length} objectives`)
        
        const completedInWeek: any[] = []
        card.objectives.forEach((obj: any) => {
          if (obj.isChecked && obj.completedAt) {
            const completedDate = obj.completedAt.toDate ? obj.completedAt.toDate() : new Date(obj.completedAt)
            if (completedDate >= startDate && completedDate <= endDate) {
              console.log(`  Found completed objective: "${obj.text}"`)
              console.log(`    completedBy:`, obj.completedBy)
              console.log(`    completedByName:`, obj.completedByName)
              completedInWeek.push({
                task: obj.text || obj.title || obj.task,
                completedAt: completedDate,
                completedBy: obj.completedBy || { email: obj.completedByEmail || 'unknown@tgmventures.com', name: obj.completedByName || 'Team Member' }
              })
              reportData.totalCompleted++
            }
          }
        })
        
        if (completedInWeek.length > 0) {
          reportData.divisions[`asset-${doc.id}`] = {
            name: cardName,
            completedTasks: completedInWeek,
            totalTasks: completedInWeek.length
          }
        }
      }
    })
    
    // Get Tax Filings (stored with prior year)
    console.log('Querying tax filings...')
    const priorYear = new Date().getFullYear() - 1
    const taxFilingsDoc = await getDoc(doc(db, 'taxes', `taxes-${priorYear}`))
    
    if (taxFilingsDoc.exists()) {
      console.log('Found tax filings document')
      const taxData = taxFilingsDoc.data()
      const completedTaxItems: any[] = []
      
      // Check tax returns
      if (taxData.returns && Array.isArray(taxData.returns)) {
        taxData.returns.forEach((taxReturn: any) => {
          if (taxReturn.isFiled && taxReturn.completedAt) {
            const completedDate = taxReturn.completedAt.toDate ? taxReturn.completedAt.toDate() : new Date(taxReturn.completedAt)
            if (completedDate >= startDate && completedDate <= endDate) {
              console.log(`  Found completed tax return: "${taxReturn.year} ${taxReturn.country} Tax Return Filed - ${taxReturn.entity}"`)
              console.log(`    completedBy:`, taxReturn.completedBy)
              console.log(`    completedByName:`, taxReturn.completedByName)
              completedTaxItems.push({
                task: `${taxReturn.year} ${taxReturn.country} Tax Return Filed - ${taxReturn.entity}`,
                completedAt: completedDate,
                completedBy: taxReturn.completedBy || { email: taxReturn.completedByEmail || 'unknown@tgmventures.com', name: taxReturn.completedByName || 'Team Member' }
              })
              reportData.totalCompleted++
            }
          }
        })
      }
      
      // Check property taxes
      if (taxData.propertyTaxH1Paid && taxData.propertyTaxH1CompletedAt) {
        const completedDate = taxData.propertyTaxH1CompletedAt.toDate ? taxData.propertyTaxH1CompletedAt.toDate() : new Date(taxData.propertyTaxH1CompletedAt)
        if (completedDate >= startDate && completedDate <= endDate) {
          console.log(`  Found completed property tax: "All ${new Date().getFullYear()} H1 Property Taxes Paid"`)
          console.log(`    completedBy:`, taxData.propertyTaxH1CompletedBy)
          completedTaxItems.push({
            task: `All ${new Date().getFullYear()} H1 Property Taxes Paid`,
            completedAt: completedDate,
            completedBy: taxData.propertyTaxH1CompletedBy || { email: taxData.propertyTaxH1CompletedByEmail || 'unknown@tgmventures.com', name: taxData.propertyTaxH1CompletedByName || 'Team Member' }
          })
          reportData.totalCompleted++
        }
      }
      
      if (taxData.propertyTaxH2Paid && taxData.propertyTaxH2CompletedAt) {
        const completedDate = taxData.propertyTaxH2CompletedAt.toDate ? taxData.propertyTaxH2CompletedAt.toDate() : new Date(taxData.propertyTaxH2CompletedAt)
        if (completedDate >= startDate && completedDate <= endDate) {
          console.log(`  Found completed property tax: "All ${new Date().getFullYear()} H2 Property Taxes Paid"`)
          console.log(`    completedBy:`, taxData.propertyTaxH2CompletedBy)
          completedTaxItems.push({
            task: `All ${new Date().getFullYear()} H2 Property Taxes Paid`,
            completedAt: completedDate,
            completedBy: taxData.propertyTaxH2CompletedBy || { email: taxData.propertyTaxH2CompletedByEmail || 'unknown@tgmventures.com', name: taxData.propertyTaxH2CompletedByName || 'Team Member' }
          })
          reportData.totalCompleted++
        }
      }
      
      if (completedTaxItems.length > 0) {
        reportData.divisions['tax-filings'] = {
          name: 'Tax Filings',
          completedTasks: completedTaxItems,
          totalTasks: completedTaxItems.length
        }
      }
    }
    
    console.log(`Total completed objectives: ${reportData.totalCompleted}`)
    return reportData
  } catch (error) {
    console.error('Error generating weekly report data:', error)
    throw error
  }
}

// Get outstanding objectives from all sources
export async function getOutstandingObjectives() {
  const outstanding: { [category: string]: Array<{ task: string; assignee?: string }> } = {}
  const currentYear = new Date().getFullYear()
  
  try {
    // Get Ventures cards
    const venturesSnapshot = await getDocs(collection(db, 'organizations/tgm-ventures/ventures-objective-cards'))
    venturesSnapshot.forEach(doc => {
      const card = doc.data()
      const cardName = card.title || 'Ventures'
      
      // Initialize array for this card if it doesn't exist
      if (!outstanding[cardName]) {
        outstanding[cardName] = []
      }
      
      if (card.objectives && Array.isArray(card.objectives)) {
        card.objectives.forEach((obj: any) => {
          if (!obj.isChecked) {
            outstanding[cardName].push({
              task: obj.text || obj.title || obj.task,
              assignee: obj.assignee
            })
          }
        })
      }
    })
    
    // Get Asset Management status using the same method as dashboard
    outstanding['Asset Management'] = []
    
    try {
      // Import the function to get asset status
      const { getAssetManagementStatusCompat } = await import('./compat-service')
      const assetStatus = await getAssetManagementStatusCompat()
      
      console.log('Asset Management Status:', assetStatus)
      
      // Get current month for dynamic task names
      const now = new Date()
      const priorMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'long' })
      const currentMonth = now.toLocaleDateString('en-US', { month: 'long' })
      
      // Check each asset management task
      if (!assetStatus.booksClosedOut) {
        outstanding['Asset Management'].push({
          task: `${priorMonth} books closed`,
          assignee: undefined
        })
      }
      if (!assetStatus.rentsCollected) {
        outstanding['Asset Management'].push({
          task: `All ${currentMonth} rents collected`,
          assignee: undefined
        })
      }
      if (!assetStatus.loansPaymentsMade) {
        outstanding['Asset Management'].push({
          task: 'All loans paid',
          assignee: undefined
        })
      }
      if (!assetStatus.vendorsPaymentsMade) {
        outstanding['Asset Management'].push({
          task: 'All vendors paid',
          assignee: undefined
        })
      }
      if (!assetStatus.propertyTaxesPaid) {
        outstanding['Asset Management'].push({
          task: 'All property taxes paid',
          assignee: undefined
        })
      }
      if (!assetStatus.insurancePoliciesActive) {
        outstanding['Asset Management'].push({
          task: 'All insurance policies active',
          assignee: undefined
        })
      }
      if (!assetStatus.entitiesRenewed) {
        outstanding['Asset Management'].push({
          task: 'All entities renewed',
          assignee: undefined
        })
      }
      
      console.log(`Found ${outstanding['Asset Management'].length} outstanding Asset Management tasks`)
    } catch (error) {
      console.error('Error fetching asset management status:', error)
    }
    
    // Also get custom Asset Management cards
    const assetSnapshot = await getDocs(collection(db, 'organizations/tgm-ventures/asset-management-cards'))
    console.log(`Found ${assetSnapshot.size} custom asset management cards for outstanding objectives`)
    
    assetSnapshot.forEach(doc => {
      const card = doc.data()
      const cardName = card.title || 'Asset Management'
      console.log(`Processing card: ${cardName}`)
      
      // Initialize array for this card
      if (!outstanding[cardName]) {
        outstanding[cardName] = []
      }
      
      if (card.objectives && Array.isArray(card.objectives)) {
        console.log(`  Card has ${card.objectives.length} objectives`)
        card.objectives.forEach((obj: any) => {
          if (!obj.isChecked) {
            console.log(`    Found unchecked objective: ${obj.text || obj.title || obj.task}`)
            outstanding[cardName].push({
              task: obj.text || obj.title || obj.task,
              assignee: obj.assignee
            })
          }
        })
        console.log(`  Total outstanding for ${cardName}: ${outstanding[cardName].length}`)
      }
    })
    
    // Get Tax Filings (stored with prior year)
    const priorYear = currentYear - 1
    const taxFilingsDoc = await getDoc(doc(db, 'taxes', `taxes-${priorYear}`))
    if (taxFilingsDoc.exists()) {
      const taxData = taxFilingsDoc.data()
      outstanding['Tax Filings'] = []
      
      // Check tax returns
      if (taxData.returns && Array.isArray(taxData.returns)) {
        taxData.returns.forEach((taxReturn: any) => {
          if (!taxReturn.isFiled) {
            outstanding['Tax Filings'].push({
              task: `${taxReturn.year} ${taxReturn.country} Tax Return - ${taxReturn.entity}`,
              assignee: taxReturn.assignee
            })
          }
        })
      }
      
      // Check property taxes
      if (!taxData.propertyTaxH1Paid) {
        outstanding['Tax Filings'].push({
          task: `All ${currentYear} H1 Property Taxes`,
          assignee: undefined
        })
      }
      
      if (!taxData.propertyTaxH2Paid) {
        outstanding['Tax Filings'].push({
          task: `All ${currentYear} H2 Property Taxes`,
          assignee: undefined
        })
      }
    }
    
    // Log all outstanding objectives before removing empty categories
    console.log('All outstanding objectives before filtering:')
    Object.entries(outstanding).forEach(([category, objectives]) => {
      console.log(`  ${category}: ${objectives.length} objectives`)
      if (objectives.length > 0) {
        objectives.forEach(obj => {
          console.log(`    - ${obj.task}`)
        })
      }
    })
    
    // Remove empty categories
    Object.keys(outstanding).forEach(key => {
      if (outstanding[key].length === 0) {
        delete outstanding[key]
      }
    })
    
    console.log('Outstanding objectives after filtering:', Object.keys(outstanding))
    
    return outstanding
  } catch (error) {
    console.error('Error fetching outstanding objectives:', error)
    return {}
  }
}

// Get new objectives added this week
export async function getNewObjectivesThisWeek(startDate: Date, endDate: Date) {
  const newObjectives: Array<{ task: string; category: string; createdBy?: string }> = []
  
  try {
    // Get Ventures cards
    const venturesSnapshot = await getDocs(collection(db, 'organizations/tgm-ventures/ventures-objective-cards'))
    venturesSnapshot.forEach(doc => {
      const card = doc.data()
      const cardName = card.title || 'Ventures'
      
      if (card.objectives && Array.isArray(card.objectives)) {
        card.objectives.forEach((obj: any) => {
          if (obj.createdAt) {
            const createdDate = obj.createdAt.toDate ? obj.createdAt.toDate() : new Date(obj.createdAt)
            if (createdDate >= startDate && createdDate <= endDate) {
              newObjectives.push({
                task: obj.text || obj.title || obj.task,
                category: cardName,
                createdBy: obj.createdBy
              })
            }
          }
        })
      }
    })
    
    // Get Asset Management cards
    const assetSnapshot = await getDocs(collection(db, 'organizations/tgm-ventures/asset-management-cards'))
    assetSnapshot.forEach(doc => {
      const card = doc.data()
      const cardName = card.title || 'Asset Management'
      
      if (card.objectives && Array.isArray(card.objectives)) {
        card.objectives.forEach((obj: any) => {
          if (obj.createdAt) {
            const createdDate = obj.createdAt.toDate ? obj.createdAt.toDate() : new Date(obj.createdAt)
            if (createdDate >= startDate && createdDate <= endDate) {
              newObjectives.push({
                task: obj.text || obj.title || obj.task,
                category: cardName,
                createdBy: obj.createdBy
              })
            }
          }
        })
      }
    })
    
    return newObjectives
  } catch (error) {
    console.error('Error fetching new objectives:', error)
    return []
  }
}

// Generate enhanced email HTML with team recognition
export async function generateEnhancedEmailHTML(data: WeeklyReportData): Promise<string> {
  console.log('=== generateEnhancedEmailHTML called with date range:', data.weekStart, 'to', data.weekEnd)
  
  // Get outstanding objectives
  const outstandingObjectives = await getOutstandingObjectives()
  
  // Get new objectives from this week
  const newObjectives = await getNewObjectivesThisWeek(data.weekStart, data.weekEnd)
  
  // First, get all completed tasks from divisions
  const allCompletedTasks: any[] = []
  if (data.divisions) {
    Object.entries(data.divisions).forEach(([divisionId, division]) => {
      division.completedTasks.forEach(task => {
        allCompletedTasks.push({
          ...task,
          divisionName: division.name
        })
      })
    })
  }
  
  // Note: We don't need to fetch completed objectives again here
  // They are already included in data.divisions from getWeeklyReportDataDirect
  
  // Group completed by card/category
  const completedByCard: { [cardName: string]: any[] } = {}
  
  // Add completed tasks from all sources to completedByCard
  allCompletedTasks.forEach(task => {
    const cardName = task.divisionName
    if (!completedByCard[cardName]) {
      completedByCard[cardName] = []
    }
    completedByCard[cardName].push({
      title: task.task,
      completedBy: task.completedBy?.name || task.completedBy?.email || task.completedByName || task.completedByEmail || 'Team Member',
      completedAt: task.completedAt
    })
  })
  
  // Group new objectives by card
  const addedByCard: { [cardName: string]: any[] } = {}
  newObjectives.forEach(obj => {
    const cardName = obj.category || 'Other'
    if (!addedByCard[cardName]) {
      addedByCard[cardName] = []
    }
    addedByCard[cardName].push({
      title: obj.task,
      createdBy: obj.createdBy,
      createdAt: new Date()
    })
  })
  
  // Group outstanding objectives by card
  const outstandingByCard: { [cardName: string]: any[] } = {}
  console.log('Processing outstanding objectives for email:')
  console.log('Outstanding objectives keys:', Object.keys(outstandingObjectives))
  Object.entries(outstandingObjectives).forEach(([category, objectives]) => {
    console.log(`  ${category}: ${objectives.length} objectives`)
    outstandingByCard[category] = objectives.map(obj => ({
      title: obj.task,
      assignee: obj.assignee
    }))
  })
  console.log('Outstanding by card keys:', Object.keys(outstandingByCard))
  
  // Create team members array for recognition
  const teamMembersMap: { [email: string]: any } = {}
  
  allCompletedTasks.forEach(task => {
    let email = 'unknown@tgmventures.com'
    let name = 'Team Member'
    
    if (typeof task.completedBy === 'string') {
      email = task.completedBy
      name = task.completedByName || task.completedBy
      // If it's an email, try to extract the name
      if (email.includes('@')) {
        const emailParts = email.split('@')[0].split('.')
        if (emailParts.length > 1) {
          name = emailParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
        } else {
          name = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1)
        }
      }
    } else if (task.completedBy && typeof task.completedBy === 'object') {
      email = task.completedBy.email || 'unknown@tgmventures.com'
      name = task.completedBy.name || task.completedBy.email || 'Team Member'
    }
    
    if (!teamMembersMap[email]) {
      teamMembersMap[email] = {
        name,
        email,
        completedCount: 0,
        objectives: []
      }
    }
    
    teamMembersMap[email].completedCount++
    teamMembersMap[email].objectives.push({
      title: task.task,
      division: task.divisionName
    })
  })
  
  // Fetch user photos from Firestore
  const teamMembersArray = Object.values(teamMembersMap)
  const teamMembers = await Promise.all(
    teamMembersArray.map(async (member) => {
      try {
        // Try to get user data from Firestore - users are stored by UID under organizations
        const usersSnapshot = await getDocs(collection(db, 'organizations/tgm-ventures/users'))
        const userDoc = usersSnapshot.docs.find(doc => {
          const userData = doc.data()
          return userData.email === member.email
        })
        
        if (userDoc) {
          const userData = userDoc.data()
          console.log(`Found user data for ${member.email}:`, userData)
          return {
            ...member,
            photoURL: userData.photoURL || userData.photoUrl || undefined
          }
        }
        
        console.log(`No user doc found for ${member.email}`)
        return member
      } catch (error) {
        console.error(`Error fetching user data for ${member.email}:`, error)
        return member
      }
    })
  )
  
  // Sort by completed count
  teamMembers.sort((a, b) => b.completedCount - a.completedCount)
  
  // Create email data structure
  const emailData = {
    weekStart: data.weekStart,
    weekEnd: data.weekEnd,
    totalCompleted: allCompletedTasks.length,
    totalAdded: newObjectives.length,
    activeMembers: teamMembers.length,
    completedByCard,
    addedByCard,
    teamMembers,
    outstandingByCard
  }
  
  return generateEmailHTML(emailData)
}

// Generate email preview HTML (legacy function for compatibility)
export function generateEmailPreviewHTML(data: WeeklyReportData): string {
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  
  const weekStartStr = data.weekStart.toLocaleDateString('en-US', dateOptions)
  const weekEndStr = data.weekEnd.toLocaleDateString('en-US', dateOptions)

  let tasksHtml = ''
  Object.entries(data.divisions).forEach(([divisionId, division]) => {
    if (division.completedTasks.length > 0) {
      tasksHtml += `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
            ${division.name}
          </h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
      `
      
      division.completedTasks.forEach(task => {
        tasksHtml += `
          <li style="margin-bottom: 10px; padding-left: 20px; position: relative;">
            <span style="position: absolute; left: 0; color: #10B981;">✓</span>
            <span style="color: #374151;">${task.task}</span>
          </li>
        `
      })
      
      tasksHtml += `
          </ul>
        </div>
      `
    }
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Progress Report - TGM Ventures</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 style="color: #111827; font-size: 24px; margin-bottom: 10px;">
          Weekly Progress Report
        </h1>
        <p style="color: #6B7280; margin-bottom: 30px;">
          ${weekStartStr} - ${weekEndStr}
        </p>
        
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #111827; font-size: 20px; margin-bottom: 15px;">
            Summary
          </h2>
          <p style="color: #374151; margin: 0;">
            <strong>${data.totalCompleted}</strong> objectives completed across 
            <strong>${Object.keys(data.divisions).length}</strong> areas
          </p>
        </div>
        
        ${tasksHtml}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 14px; text-align: center;">
            © ${new Date().getFullYear()} TGM Ventures. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}