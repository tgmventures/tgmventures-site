import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DB_PATHS, User } from './structure'

export type BusinessUnit = 'asset-management' | 'ventures'

/**
 * Get user preferences including business unit selection
 */
export async function getUserPreferences(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, DB_PATHS.user(userId))
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      return userSnap.data() as User
    }
    
    return null
  } catch (error) {
    console.error('Error getting user preferences:', error)
    return null
  }
}

/**
 * Update user's business unit preference
 */
export async function updateBusinessUnit(userId: string, businessUnit: BusinessUnit): Promise<void> {
  try {
    const userRef = doc(db, DB_PATHS.user(userId))
    
    await updateDoc(userRef, {
      businessUnit,
      lastViewedUnit: new Date()
    })
  } catch (error) {
    console.error('Error updating business unit:', error)
    throw error
  }
}

/**
 * Initialize user data if it doesn't exist
 */
export async function initializeUserData(userId: string, email: string, name: string, photoURL?: string): Promise<void> {
  try {
    const userRef = doc(db, DB_PATHS.user(userId))
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      // Create new user with default business unit based on email or role
      const defaultUnit: BusinessUnit = 'asset-management' // Default to asset management
      
      await setDoc(userRef, {
        id: userId,
        email,
        name,
        photoURL: photoURL || undefined,
        role: 'member', // Default role
        businessUnit: defaultUnit,
        createdAt: new Date(),
        lastLogin: new Date()
      } as User)
    } else {
      // Update last login and photoURL if changed
      const updates: any = {
        lastLogin: new Date()
      }
      
      // Update photoURL if provided and different
      if (photoURL) {
        const userData = userSnap.data()
        if (userData.photoURL !== photoURL) {
          updates.photoURL = photoURL
        }
      }
      
      await updateDoc(userRef, updates)
    }
  } catch (error) {
    console.error('Error initializing user data:', error)
    throw error
  }
}
