import { Timestamp } from 'firebase/firestore'
import { getAssetManagementCards, createAssetManagementCard } from './asset-management-cards'
import { getAssetManagementTasks } from './division-service'

/**
 * Initialize asset management tasks for current month if needed
 * This will automatically create monthly tasks if they don't exist
 */
export async function initializeAssetManagementTasks(): Promise<void> {
  try {
    // The getAssetManagementTasks function automatically creates tasks if they don't exist
    await getAssetManagementTasks()
  } catch (error) {
    console.error('Error initializing asset management tasks:', error)
  }
}

/**
 * Initialize asset management cards with defaults if none exist
 */
export async function initializeAssetManagementCards(): Promise<void> {
  try {
    const existingCards = await getAssetManagementCards()
    
    // If no cards exist, create the default Asset Management card
    if (existingCards.length === 0) {
      console.log('No asset management cards found, creating default card...')
      
      // Create default Asset Management card
      await createDefaultAssetManagementCard()
    }
  } catch (error) {
    console.error('Error initializing asset management cards:', error)
  }
}

/**
 * Create the default Asset Management card
 */
async function createDefaultAssetManagementCard(): Promise<void> {
  try {
    await createAssetManagementCard('Asset Management Monthly Tasks')
    console.log('Default asset management card created')
  } catch (error) {
    console.error('Error creating default asset management card:', error)
    throw error
  }
}