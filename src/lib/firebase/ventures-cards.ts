import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
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
}

export interface VentureCard {
  id: string
  userId: string
  title: string
  createdAt: Timestamp
  updatedAt: Timestamp
  order: number
  objectives: VentureObjective[]
}

const VENTURES_CARDS_COLLECTION = 'ventures-objective-cards'

/**
 * Get all venture cards for a user
 */
export async function getVentureCards(userId: string): Promise<VentureCard[]> {
  try {
    const cardsRef = collection(db, VENTURES_CARDS_COLLECTION)
    const q = query(cardsRef, orderBy('order'))
    const snapshot = await getDocs(q)
    
    const cards: VentureCard[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data.userId === userId) {
        cards.push({
          id: doc.id,
          ...data
        } as VentureCard)
      }
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
export async function createVentureCard(userId: string, title: string): Promise<string> {
  try {
    const cardsRef = collection(db, VENTURES_CARDS_COLLECTION)
    
    // Get current cards to determine order
    const currentCards = await getVentureCards(userId)
    const maxOrder = currentCards.reduce((max, card) => Math.max(max, card.order), -1)
    
    const newCard = {
      userId,
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
    const cardDoc = await getDocs(query(collection(db, VENTURES_CARDS_COLLECTION)))
    
    let currentCard: VentureCard | null = null
    cardDoc.forEach((doc) => {
      if (doc.id === cardId) {
        currentCard = { id: doc.id, ...doc.data() } as VentureCard
      }
    })
    
    if (!currentCard) throw new Error('Card not found')
    
    const newObjective: VentureObjective = {
      id: Date.now().toString(),
      text,
      isChecked: false,
      order: currentCard.objectives.length
    }
    
    await updateDoc(cardRef, {
      objectives: [...currentCard.objectives, newObjective],
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error adding objective to card:', error)
    throw error
  }
}

/**
 * Update objective status
 */
export async function updateObjectiveStatus(
  cardId: string, 
  objectiveId: string, 
  isChecked: boolean
): Promise<void> {
  try {
    const cardRef = doc(db, VENTURES_CARDS_COLLECTION, cardId)
    const cardDoc = await getDocs(query(collection(db, VENTURES_CARDS_COLLECTION)))
    
    let currentCard: VentureCard | null = null
    cardDoc.forEach((doc) => {
      if (doc.id === cardId) {
        currentCard = { id: doc.id, ...doc.data() } as VentureCard
      }
    })
    
    if (!currentCard) throw new Error('Card not found')
    
    const updatedObjectives = currentCard.objectives.map(obj => 
      obj.id === objectiveId ? { ...obj, isChecked } : obj
    )
    
    await updateDoc(cardRef, {
      objectives: updatedObjectives,
      updatedAt: Timestamp.now()
    })
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
    const cardDoc = await getDocs(query(collection(db, VENTURES_CARDS_COLLECTION)))
    
    let currentCard: VentureCard | null = null
    cardDoc.forEach((doc) => {
      if (doc.id === cardId) {
        currentCard = { id: doc.id, ...doc.data() } as VentureCard
      }
    })
    
    if (!currentCard) throw new Error('Card not found')
    
    const updatedObjectives = currentCard.objectives
      .filter(obj => obj.id !== objectiveId)
      .map((obj, index) => ({ ...obj, order: index }))
    
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
  userId: string,
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
  userId: string,
  callback: (cards: VentureCard[]) => void
): () => void {
  const cardsRef = collection(db, VENTURES_CARDS_COLLECTION)
  const q = query(cardsRef, orderBy('order'))
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const cards: VentureCard[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data.userId === userId) {
        cards.push({
          id: doc.id,
          ...data
        } as VentureCard)
      }
    })
    callback(cards)
  })
  
  return unsubscribe
}
