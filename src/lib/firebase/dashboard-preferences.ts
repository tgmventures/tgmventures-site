import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DB_PATHS } from './structure'

export interface DashboardPreferences {
  cardOrder: string[]
  lastUpdated: Date
}

/**
 * Get the dashboard card order preference for the organization
 * This is shared across all team members for consistency
 */
export async function getDashboardCardOrder(): Promise<string[] | null> {
  try {
    const prefsRef = doc(db, DB_PATHS.settings(), 'dashboard-preferences')
    const prefsSnap = await getDoc(prefsRef)
    
    if (prefsSnap.exists()) {
      const data = prefsSnap.data() as DashboardPreferences
      return data.cardOrder || null
    }
    
    return null
  } catch (error) {
    console.error('Error getting dashboard card order:', error)
    return null
  }
}

/**
 * Save the dashboard card order preference for the organization
 * This updates the card order for all team members
 */
export async function saveDashboardCardOrder(cardOrder: string[]): Promise<void> {
  try {
    const prefsRef = doc(db, DB_PATHS.settings(), 'dashboard-preferences')
    const prefsSnap = await getDoc(prefsRef)
    
    if (prefsSnap.exists()) {
      // Update existing preferences
      await updateDoc(prefsRef, {
        cardOrder,
        lastUpdated: new Date()
      })
    } else {
      // Create new preferences document
      await setDoc(prefsRef, {
        cardOrder,
        lastUpdated: new Date()
      } as DashboardPreferences)
    }
    
    console.log('Dashboard card order saved:', cardOrder)
  } catch (error) {
    console.error('Error saving dashboard card order:', error)
    throw error
  }
}
