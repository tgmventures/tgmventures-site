import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  addDoc,
  getDocs
} from 'firebase/firestore';

export interface AssetManagementStatus {
  booksClosedOut: boolean;
  rentsCollected: boolean;
  loansPaymentsMade: boolean;
  vendorsPaymentsMade: boolean;
  propertyTaxesPaid: boolean;
  insurancePoliciesActive: boolean;
  entitiesRenewed: boolean;
  lastUpdated: Date;
}

export interface DivisionObjective {
  id: string;
  division: 'asset-management' | 'real-estate-development' | 'ventures';
  title: string;
  isChecked: boolean;
  order: number; // 0, 1, or 2 for top 3
  createdAt: Date;
  updatedAt: Date;
}

const statusCollection = collection(db, 'dashboard_status');
const objectivesCollection = collection(db, 'division_objectives');

// Get or create asset management status
export async function getAssetManagementStatus(): Promise<AssetManagementStatus> {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const docId = `asset-status-${currentYear}-${currentMonth}`;
  
  const docRef = doc(statusCollection, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      booksClosedOut: data.booksClosedOut || false,
      rentsCollected: data.rentsCollected || false,
      loansPaymentsMade: data.loansPaymentsMade || false,
      vendorsPaymentsMade: data.vendorsPaymentsMade || false,
      propertyTaxesPaid: data.propertyTaxesPaid || false,
      insurancePoliciesActive: data.insurancePoliciesActive || false,
      entitiesRenewed: data.entitiesRenewed || false,
      lastUpdated: data.lastUpdated?.toDate() || new Date()
    };
  } else {
    // Create default status
    const defaultStatus: AssetManagementStatus = {
      booksClosedOut: false,
      rentsCollected: false,
      loansPaymentsMade: false,
      vendorsPaymentsMade: false,
      propertyTaxesPaid: false,
      insurancePoliciesActive: false,
      entitiesRenewed: false,
      lastUpdated: new Date()
    };
    await setDoc(docRef, defaultStatus);
    return defaultStatus;
  }
}

// Update asset management status
export async function updateAssetManagementStatus(
  field: keyof Omit<AssetManagementStatus, 'lastUpdated'>,
  value: boolean
): Promise<void> {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const docId = `asset-status-${currentYear}-${currentMonth}`;
  
  const docRef = doc(statusCollection, docId);
  
  // First ensure the document exists
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    // Create it if it doesn't exist
    await setDoc(docRef, {
      booksClosedOut: false,
      rentsCollected: false,
      loansPaymentsMade: false,
      vendorsPaymentsMade: false,
      propertyTaxesPaid: false,
      insurancePoliciesActive: false,
      entitiesRenewed: false,
      [field]: value,
      lastUpdated: new Date()
    });
  } else {
    // Update existing document
    await updateDoc(docRef, {
      [field]: value,
      lastUpdated: new Date()
    });
  }
}

// Get objectives for a division
export async function getDivisionObjectives(
  division: 'asset-management' | 'real-estate-development' | 'ventures'
): Promise<DivisionObjective[]> {
  const q = query(
    objectivesCollection,
    where('division', '==', division),
    orderBy('order', 'asc'),
    limit(3)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
  } as DivisionObjective));
}

// Add new objective
export async function addDivisionObjective(
  division: 'asset-management' | 'real-estate-development' | 'ventures',
  title: string
): Promise<string> {
  // Get current objectives to determine order
  const currentObjectives = await getDivisionObjectives(division);
  
  if (currentObjectives.length >= 3) {
    throw new Error('Maximum 3 objectives per division');
  }
  
  const newObjective = {
    division,
    title,
    isChecked: false,
    order: currentObjectives.length,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const docRef = await addDoc(objectivesCollection, newObjective);
  return docRef.id;
}

// Update objective checked status
export async function updateObjectiveStatus(objectiveId: string, isChecked: boolean): Promise<void> {
  const docRef = doc(objectivesCollection, objectiveId);
  await updateDoc(docRef, {
    isChecked,
    updatedAt: new Date()
  });
}

// Delete objective
export async function deleteObjective(objectiveId: string): Promise<void> {
  const docRef = doc(objectivesCollection, objectiveId);
  await deleteDoc(docRef);
}

// Subscribe to asset management status changes
export function subscribeToAssetStatus(
  callback: (status: AssetManagementStatus) => void
): () => void {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const docId = `asset-status-${currentYear}-${currentMonth}`;
  
  const docRef = doc(statusCollection, docId);
  const unsubscribe = onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        booksClosedOut: data.booksClosedOut || false,
        rentsCollected: data.rentsCollected || false,
        loansPaymentsMade: data.loansPaymentsMade || false,
        vendorsPaymentsMade: data.vendorsPaymentsMade || false,
        propertyTaxesPaid: data.propertyTaxesPaid || false,
        insurancePoliciesActive: data.insurancePoliciesActive || false,
        entitiesRenewed: data.entitiesRenewed || false,
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      });
    }
  });
  
  return unsubscribe;
}

// Subscribe to division objectives
export function subscribeToDivisionObjectives(
  division: 'asset-management' | 'real-estate-development' | 'ventures',
  callback: (objectives: DivisionObjective[]) => void
): () => void {
  const q = query(
    objectivesCollection,
    where('division', '==', division),
    orderBy('order', 'asc'),
    limit(3)
  );
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const objectives = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as DivisionObjective));
    callback(objectives);
  });
  
  return unsubscribe;
}