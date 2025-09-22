import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Get the start of the current week (Saturday at midnight)
export function getWeekStart(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay()
  
  // Calculate days since last Saturday (Saturday = 6)
  // If today is Saturday, we want to go to today's midnight
  const daysSinceSaturday = dayOfWeek === 6 ? 0 : (dayOfWeek + 1) % 7
  
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - daysSinceSaturday)
  weekStart.setHours(0, 0, 0, 0)
  
  return weekStart
}

// Check if a date is in the current week
export function isInCurrentWeek(date: Date): boolean {
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  
  return date >= weekStart && date < weekEnd
}

// Get the weekly progress document ID for a user
function getWeeklyProgressDocId(userId: string): string {
  const weekStart = getWeekStart()
  const weekKey = weekStart.toISOString().split('T')[0] // YYYY-MM-DD format
  return `${userId}_week_${weekKey}`
}

// Get the current week's completion count for a user
export async function getWeeklyCompletionCount(userId: string): Promise<number> {
  try {
    const docId = getWeeklyProgressDocId(userId)
    const docRef = doc(db, 'weekly_progress', docId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data().completedCount || 0
    }
    
    // Initialize if doesn't exist
    await setDoc(docRef, {
      userId,
      weekStart: getWeekStart(),
      completedCount: 0,
      lastUpdated: new Date()
    })
    
    return 0
  } catch (error) {
    console.error('Error getting weekly completion count:', error)
    return 0
  }
}

// Increment the weekly completion count
export async function incrementWeeklyCompletionCount(userId: string): Promise<void> {
  try {
    const docId = getWeeklyProgressDocId(userId)
    const docRef = doc(db, 'weekly_progress', docId)
    
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        completedCount: increment(1),
        lastUpdated: new Date()
      })
    } else {
      await setDoc(docRef, {
        userId,
        weekStart: getWeekStart(),
        completedCount: 1,
        lastUpdated: new Date()
      })
    }
  } catch (error) {
    console.error('Error incrementing weekly completion count:', error)
  }
}

// Decrement the weekly completion count
export async function decrementWeeklyCompletionCount(userId: string): Promise<void> {
  try {
    const docId = getWeeklyProgressDocId(userId)
    const docRef = doc(db, 'weekly_progress', docId)
    
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const currentCount = docSnap.data().completedCount || 0
      if (currentCount > 0) {
        await updateDoc(docRef, {
          completedCount: increment(-1),
          lastUpdated: new Date()
        })
      }
    }
  } catch (error) {
    console.error('Error decrementing weekly completion count:', error)
  }
}
