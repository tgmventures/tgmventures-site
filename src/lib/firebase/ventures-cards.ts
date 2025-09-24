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
import { DB_PATHS } from './structure'

export interface VentureObjective {
  id: string
  text: string
  isChecked: boolean
  order: number
  createdAt?: any
  completedAt?: Date
  completedBy?: string
  completedByName?: string
}

export interface VentureCard {
  id: string
  title: string
  createdAt: Timestamp
  updatedAt: Timestamp
  order: number
  objectives: VentureObjective[]
}

const VENTURES_CARDS_COLLECTION = 'organizations/tgm-ventures/ventures-objective-cards'

/**
 * Get all venture cards for the organization
 */
export async function getVentureCards(): Promise<VentureCard[]> {
  try {
    const cardsRef = collection(db, VENTURES_CARDS_COLLECTION)
    const q = query(cardsRef, orderBy('order'))
    const snapshot = await getDocs(q)
    
    const cards: VentureCard[] = []
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
      } as VentureCard)
    })
    
    return cards
  } catch (error) {
    console.error('Error getting venture cards:', error)
    return []
  }
}

/**
 * Create a new venture card
 */
export async function createVentureCard(title: string): Promise<string> {
  try {
    const cardsRef = collection(db, VENTURES_CARDS_COLLECTION)
    
    // Get current cards to determine order
    const currentCards = await getVentureCards()
    const maxOrder = currentCards.reduce((max, card) => Math.max(max, card.order), -1)
    
    const newCard = {
      title,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      order: maxOrder + 1,
      objectives: []
    }
    
    const docRef = await addDoc(cardsRef, newCard)
    return docRef.id
  } catch (error) {
    console.error('Error creating venture card:', error)
    throw error
  }
}

/**
 * Update venture card title
 */
export async function updateVentureCardTitle(cardId: string, title: string): Promise<void> {
  try {
    const cardRef = doc(db, VENTURES_CARDS_COLLECTION, cardId)
    await updateDoc(cardRef, {
      title,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating venture card title:', error)
    throw error
  }
}

/**
 * Delete a venture card
 */
export async function deleteVentureCard(cardId: string): Promise<void> {
  try {
    const cardRef = doc(db, VENTURES_CARDS_COLLECTION, cardId)
    await deleteDoc(cardRef)
  } catch (error) {
    console.error('Error deleting venture card:', error)
    throw error
  }
}

/**
 * Add objective to a venture card
 */
export async function addObjectiveToCard(cardId: string, text: string): Promise<void> {
  try {
    const cardRef = doc(db, VENTURES_CARDS_COLLECTION, cardId)
    const cardDoc = await getDoc(cardRef)
    
    if (!cardDoc.exists()) {
      throw new Error('Card not found')
    }
    
    const cardData = cardDoc.data()
    const currentObjectives = cardData?.objectives || []
    
    const newObjective: VentureObjective = {
      id: Date.now().toString(),
      text,
      isChecked: false,
      order: currentObjectives.length,
      createdAt: Timestamp.now()
    }
    
    await updateDoc(cardRef, {
      objectives: [...currentObjectives, newObjective],
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error adding objective to card:', error)
    throw error
  }
}

/**
 * Update objective text
 */
export async function updateObjectiveText(
  cardId: string, 
  objectiveId: string, 
  text: string
): Promise<void> {
  try {
    const cardRef = doc(db, VENTURES_CARDS_COLLECTION, cardId)
    const cardDoc = await getDoc(cardRef)
    
    if (!cardDoc.exists()) {
      throw new Error('Card not found')
    }
    
    const cardData = cardDoc.data()
    const currentObjectives = cardData?.objectives || []
    
    const updatedObjectives = currentObjectives.map((obj: VentureObjective) => 
      obj.id === objectiveId ? { ...obj, text } : obj
    )
    
    await updateDoc(cardRef, {
      objectives: updatedObjectives,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating objective text:', error)
    throw error
  }
}

/**
 * Update objective status
 */
export async function updateObjectiveStatus(
  cardId: string, 
  objectiveId: string, 
  isChecked: boolean,
  userEmail?: string,
  userName?: string
): Promise<void> {
  try {
    console.log('updateObjectiveStatus called:', {
      collection: VENTURES_CARDS_COLLECTION,
      cardId,
      objectiveId,
      isChecked,
      userEmail,
      userName
    })
    const cardRef = doc(db, VENTURES_CARDS_COLLECTION, cardId)
    const cardDoc = await getDoc(cardRef)
    
    if (!cardDoc.exists()) {
      throw new Error('Card not found')
    }
    
    const cardData = cardDoc.data()
    const currentObjectives = cardData?.objectives || []
    
    const updatedObjectives = currentObjectives.map((obj: VentureObjective) => {
      if (obj.id === objectiveId) {
        const updated: any = { ...obj, isChecked };
        if (isChecked) {
          updated.completedAt = Timestamp.now();
          if (userEmail) {
            updated.completedBy = userEmail;
            updated.completedByName = userName || userEmail;
          }
        } else {
          updated.completedAt = null;
          updated.completedBy = null;
          updated.completedByName = null;
        }
        console.log('Updated objective:', {
          id: updated.id,
          text: updated.text,
          isChecked: updated.isChecked,
          completedAt: updated.completedAt,
          completedBy: updated.completedBy,
          completedByName: updated.completedByName,
          userEmail,
          userName
        })
        return updated;
      }
      return obj;
    })
    
    console.log('Updating Firestore with objectives:', updatedObjectives.map(o => ({
      id: o.id,
      text: o.text,
      isChecked: o.isChecked,
      completedAt: o.completedAt
    })))
    await updateDoc(cardRef, {
      objectives: updatedObjectives,
      updatedAt: Timestamp.now()
    })
    console.log('Firestore update completed')
  } catch (error) {
    console.error('Error updating objective status:', error)
    throw error
  }
}

/**
 * Delete objective from card
 */
export async function deleteObjectiveFromCard(
  cardId: string, 
  objectiveId: string
): Promise<void> {
  try {
    const cardRef = doc(db, VENTURES_CARDS_COLLECTION, cardId)
    const cardDoc = await getDoc(cardRef)
    
    if (!cardDoc.exists()) {
      throw new Error('Card not found')
    }
    
    const cardData = cardDoc.data()
    const currentObjectives = cardData?.objectives || []
    
    const updatedObjectives = currentObjectives
      .filter((obj: VentureObjective) => obj.id !== objectiveId)
      .map((obj: VentureObjective, index: number) => ({ ...obj, order: index }))
    
    await updateDoc(cardRef, {
      objectives: updatedObjectives,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error deleting objective from card:', error)
    throw error
  }
}

/**
 * Reorder venture cards
 */
export async function reorderVentureCards(
  cardIds: string[], 
  newOrders: number[]
): Promise<void> {
  try {
    const batch = writeBatch(db)
    
    cardIds.forEach((cardId, index) => {
      const cardRef = doc(db, VENTURES_CARDS_COLLECTION, cardId)
      batch.update(cardRef, { 
        order: newOrders[index],
        updatedAt: Timestamp.now()
      })
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error reordering venture cards:', error)
    throw error
  }
}

/**
 * Subscribe to venture cards changes
 */
export function subscribeToVentureCards(
  callback: (cards: VentureCard[]) => void
): () => void {
  const cardsRef = collection(db, VENTURES_CARDS_COLLECTION)
  const q = query(cardsRef, orderBy('order'))
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const cards: VentureCard[] = []
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
      } as VentureCard)
    })
    callback(cards)
  })
  
  return unsubscribe
}
