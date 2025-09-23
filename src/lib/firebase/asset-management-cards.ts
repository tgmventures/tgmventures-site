import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  getDoc, 
  query, 
  orderBy, 
  onSnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface AssetObjective {
  id: string
  text: string
  isChecked: boolean
  order: number
  completedAt?: Date
  completedBy?: string
  completedByName?: string
}

export interface AssetManagementCard {
  id: string
  title: string
  createdAt: Timestamp
  updatedAt: Timestamp
  order: number
  objectives: AssetObjective[]
  isCustom: boolean  // To distinguish from the default fixed card
}

const ASSET_CARDS_COLLECTION = 'organizations/tgm-ventures/asset-management-cards'

/**
 * Get all asset management cards for the organization
 */
export async function getAssetManagementCards(): Promise<AssetManagementCard[]> {
  try {
    const cardsRef = collection(db, ASSET_CARDS_COLLECTION)
    const q = query(cardsRef, orderBy('order'))
    const snapshot = await getDocs(q)
    
    const cards: AssetManagementCard[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      cards.push({
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to Dates
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        // Convert objective timestamps
        objectives: (data.objectives || []).map((obj: any) => ({
          ...obj,
          completedAt: obj.completedAt?.toDate?.() || obj.completedAt
        }))
      } as AssetManagementCard)
    })
    
    return cards
  } catch (error) {
    console.error('Error getting asset management cards:', error)
    return []
  }
}

/**
 * Create a new asset management card
 */
export async function createAssetManagementCard(title: string): Promise<string> {
  try {
    const cardsRef = collection(db, ASSET_CARDS_COLLECTION)
    
    // Get current cards to determine order
    const currentCards = await getAssetManagementCards()
    const maxOrder = currentCards.reduce((max, card) => Math.max(max, card.order), -1)
    
    const newCard = {
      title,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      order: maxOrder + 1,
      objectives: [],
      isCustom: true
    }
    
    const docRef = await addDoc(cardsRef, newCard)
    return docRef.id
  } catch (error) {
    console.error('Error creating asset management card:', error)
    throw error
  }
}

/**
 * Update asset management card title
 */
export async function updateAssetManagementCardTitle(cardId: string, title: string): Promise<void> {
  try {
    const cardRef = doc(db, ASSET_CARDS_COLLECTION, cardId)
    await updateDoc(cardRef, {
      title,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating asset management card title:', error)
    throw error
  }
}

/**
 * Delete an asset management card (only custom cards can be deleted)
 */
export async function deleteAssetManagementCard(cardId: string): Promise<void> {
  try {
    const cardRef = doc(db, ASSET_CARDS_COLLECTION, cardId)
    const cardDoc = await getDoc(cardRef)
    
    if (!cardDoc.exists()) {
      throw new Error('Card not found')
    }
    
    const cardData = cardDoc.data()
    if (!cardData?.isCustom) {
      throw new Error('Cannot delete default asset management card')
    }
    
    await deleteDoc(cardRef)
  } catch (error) {
    console.error('Error deleting asset management card:', error)
    throw error
  }
}

/**
 * Add objective to an asset management card
 */
export async function addObjectiveToAssetCard(cardId: string, text: string): Promise<void> {
  try {
    const cardRef = doc(db, ASSET_CARDS_COLLECTION, cardId)
    const cardDoc = await getDoc(cardRef)
    
    if (!cardDoc.exists()) {
      throw new Error('Card not found')
    }
    
    const cardData = cardDoc.data()
    const currentObjectives = cardData?.objectives || []
    
    const newObjective: AssetObjective = {
      id: Date.now().toString(),
      text,
      isChecked: false,
      order: currentObjectives.length
    }
    
    await updateDoc(cardRef, {
      objectives: [...currentObjectives, newObjective],
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error adding objective to asset card:', error)
    throw error
  }
}

/**
 * Update objective text
 */
export async function updateAssetObjectiveText(
  cardId: string, 
  objectiveId: string, 
  text: string
): Promise<void> {
  try {
    const cardRef = doc(db, ASSET_CARDS_COLLECTION, cardId)
    const cardDoc = await getDoc(cardRef)
    
    if (!cardDoc.exists()) {
      throw new Error('Card not found')
    }
    
    const cardData = cardDoc.data()
    const currentObjectives = cardData?.objectives || []
    
    const updatedObjectives = currentObjectives.map((obj: AssetObjective) => 
      obj.id === objectiveId ? { ...obj, text } : obj
    )
    
    await updateDoc(cardRef, {
      objectives: updatedObjectives,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating asset objective text:', error)
    throw error
  }
}

/**
 * Update objective status
 */
export async function updateAssetObjectiveStatus(
  cardId: string, 
  objectiveId: string, 
  isChecked: boolean,
  userEmail?: string,
  userName?: string
): Promise<void> {
  try {
    const cardRef = doc(db, ASSET_CARDS_COLLECTION, cardId)
    const cardDoc = await getDoc(cardRef)
    
    if (!cardDoc.exists()) {
      throw new Error('Card not found')
    }
    
    const cardData = cardDoc.data()
    const currentObjectives = cardData?.objectives || []
    
    const updatedObjectives = currentObjectives.map((obj: AssetObjective) => {
      if (obj.id === objectiveId) {
        const updated: any = { ...obj, isChecked };
        if (isChecked) {
          updated.completedAt = new Date();
          if (userEmail) {
            updated.completedBy = userEmail;
            updated.completedByName = userName || userEmail;
          }
        } else {
          updated.completedAt = null;
          updated.completedBy = null;
          updated.completedByName = null;
        }
        return updated;
      }
      return obj;
    })
    
    await updateDoc(cardRef, {
      objectives: updatedObjectives,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating asset objective status:', error)
    throw error
  }
}

/**
 * Delete objective from card
 */
export async function deleteObjectiveFromAssetCard(
  cardId: string, 
  objectiveId: string
): Promise<void> {
  try {
    const cardRef = doc(db, ASSET_CARDS_COLLECTION, cardId)
    const cardDoc = await getDoc(cardRef)
    
    if (!cardDoc.exists()) {
      throw new Error('Card not found')
    }
    
    const cardData = cardDoc.data()
    const currentObjectives = cardData?.objectives || []
    
    const updatedObjectives = currentObjectives
      .filter((obj: AssetObjective) => obj.id !== objectiveId)
      .map((obj: AssetObjective, index: number) => ({ ...obj, order: index }))
    
    await updateDoc(cardRef, {
      objectives: updatedObjectives,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error deleting objective from asset card:', error)
    throw error
  }
}

/**
 * Reorder asset management cards
 */
export async function reorderAssetManagementCards(
  cardIds: string[], 
  newOrders: number[]
): Promise<void> {
  try {
    const batch = writeBatch(db)
    
    cardIds.forEach((cardId, index) => {
      const cardRef = doc(db, ASSET_CARDS_COLLECTION, cardId)
      batch.update(cardRef, { 
        order: newOrders[index],
        updatedAt: Timestamp.now()
      })
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error reordering asset management cards:', error)
    throw error
  }
}

/**
 * Subscribe to asset management cards changes
 */
export function subscribeToAssetManagementCards(
  callback: (cards: AssetManagementCard[]) => void
): () => void {
  const cardsRef = collection(db, ASSET_CARDS_COLLECTION)
  const q = query(cardsRef, orderBy('order'))
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const cards: AssetManagementCard[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      cards.push({
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to Dates
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        // Convert objective timestamps
        objectives: (data.objectives || []).map((obj: any) => ({
          ...obj,
          completedAt: obj.completedAt?.toDate?.() || obj.completedAt
        }))
      } as AssetManagementCard)
    })
    callback(cards)
  })
  
  return unsubscribe
}
