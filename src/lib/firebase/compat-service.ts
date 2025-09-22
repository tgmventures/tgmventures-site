/**
 * Compatibility Service
 * 
 * This service provides a compatibility layer that works with both
 * the old flat structure and the new organized structure.
 * It will automatically detect which structure exists and use it.
 */

import { db } from '../firebase';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { DB_PATHS, DIVISIONS } from './structure';
import { AssetManagementStatus, DivisionTask } from '@/types/goal';

// Check if new structure exists
let useNewStructure: boolean | null = null;
let structureCheckPromise: Promise<boolean> | null = null;

export async function checkDatabaseStructure(): Promise<boolean> {
  // If we've already checked, return cached result
  if (useNewStructure !== null) {
    return useNewStructure;
  }
  
  // If a check is in progress, wait for it
  if (structureCheckPromise) {
    return structureCheckPromise;
  }
  
  // Start a new check
  structureCheckPromise = (async () => {
    try {
      const orgDoc = await getDoc(doc(db, 'organizations/tgm-ventures'));
      useNewStructure = orgDoc.exists();
      // Using appropriate database structure
      return useNewStructure;
    } catch (error: any) {
      // If it's a permission error, we'll default to old structure
      if (error?.code === 'permission-denied') {
        // Permission check deferred - defaulting to OLD structure
      } else {
        // Using OLD database structure (fallback)
      }
      useNewStructure = false;
      return false;
    } finally {
      structureCheckPromise = null;
    }
  })();
  
  return structureCheckPromise;
}

// Division Tasks - Compatible with both structures
export async function getDivisionTasksCompat(divisionId: string): Promise<DivisionTask[]> {
  try {
    await checkDatabaseStructure();
    
    if (useNewStructure) {
      const tasksRef = collection(db, DB_PATHS.divisionTasks(divisionId));
      const snapshot = await getDocs(tasksRef);
      const tasks = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        order: doc.data().order ?? 999,
        ...doc.data()
      })) as DivisionTask[];
      // Sort by order, then by createdAt for tasks without order
      return tasks.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        // Handle both Timestamp objects and Date objects
        const aCreatedAt = a.createdAt as any;
        const bCreatedAt = b.createdAt as any;
        const aTime = aCreatedAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
        const bTime = bCreatedAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
        return aTime - bTime;
      });
    } else {
      // Old structure
      const tasksRef = collection(db, 'division_tasks');
      const q = query(tasksRef, where('division', '==', divisionId), orderBy('createdAt'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc, index) => ({
        id: doc.id,
        order: doc.data().order ?? index,
        ...doc.data()
      })) as DivisionTask[];
    }
  } catch (error: any) {
    // If it's an index error, return empty array while index is building
    if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
      // Index is building for division_tasks
      return [];
    }
    console.error('Error getting division tasks:', error);
    return [];
  }
}

export async function addDivisionTaskCompat(divisionId: string, title: string) {
  await checkDatabaseStructure();
  
  // Get current tasks to determine the next order
  const currentTasks = await getDivisionTasksCompat(divisionId);
  const maxOrder = currentTasks.length > 0 
    ? Math.max(...currentTasks.map(t => t.order ?? 0))
    : -1;
  
  const taskData = {
    divisionId,
    division: divisionId, // For old structure compatibility
    title,
    isChecked: false,
    order: maxOrder + 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  if (useNewStructure) {
    const tasksRef = collection(db, DB_PATHS.divisionTasks(divisionId));
    const newDoc = doc(tasksRef);
    await setDoc(newDoc, { ...taskData, id: newDoc.id });
    return newDoc.id;
  } else {
    // Old structure
    const tasksRef = collection(db, 'division_tasks');
    const newDoc = doc(tasksRef);
    await setDoc(newDoc, { ...taskData, id: newDoc.id });
    return newDoc.id;
  }
}

export async function updateTaskStatusCompat(divisionId: string, taskId: string, isChecked: boolean) {
  await checkDatabaseStructure();
  
  const updates = {
    isChecked,
    updatedAt: serverTimestamp(),
  };
  
  if (useNewStructure) {
    const taskRef = doc(db, DB_PATHS.divisionTask(divisionId, taskId));
    await updateDoc(taskRef, updates);
  } else {
    // Old structure - we need to find the task first
    const taskRef = doc(db, 'division_tasks', taskId);
    await updateDoc(taskRef, updates);
  }
}

export async function updateTaskTitleCompat(divisionId: string, taskId: string, title: string) {
  await checkDatabaseStructure();
  
  const updates = {
    title,
    updatedAt: serverTimestamp(),
  };
  
  if (useNewStructure) {
    const taskRef = doc(db, DB_PATHS.divisionTask(divisionId, taskId));
    await updateDoc(taskRef, updates);
  } else {
    // Old structure - we need to find the task first
    const taskRef = doc(db, 'division_tasks', taskId);
    await updateDoc(taskRef, updates);
  }
}

export async function deleteTaskCompat(divisionId: string, taskId: string) {
  await checkDatabaseStructure();
  
  if (useNewStructure) {
    const taskRef = doc(db, DB_PATHS.divisionTask(divisionId, taskId));
    await deleteDoc(taskRef);
  } else {
    // Old structure
    const taskRef = doc(db, 'division_tasks', taskId);
    await deleteDoc(taskRef);
  }
}

export async function updateTaskOrderCompat(divisionId: string, taskId: string, newOrder: number) {
  await checkDatabaseStructure();
  
  const updates = {
    order: newOrder,
    updatedAt: serverTimestamp(),
  };
  
  if (useNewStructure) {
    const taskRef = doc(db, DB_PATHS.divisionTask(divisionId, taskId));
    await updateDoc(taskRef, updates);
  } else {
    // Old structure
    const taskRef = doc(db, 'division_tasks', taskId);
    await updateDoc(taskRef, updates);
  }
}

export async function reorderTasksCompat(divisionId: string, taskIds: string[], newOrders: number[]) {
  await checkDatabaseStructure();
  
  // Update all tasks in a batch
  const batch = writeBatch(db);
  
  taskIds.forEach((taskId, index) => {
    let taskRef;
    if (useNewStructure) {
      taskRef = doc(db, DB_PATHS.divisionTask(divisionId, taskId));
    } else {
      taskRef = doc(db, 'division_tasks', taskId);
    }
    
    batch.update(taskRef, {
      order: newOrders[index],
      updatedAt: serverTimestamp(),
    });
  });
  
  await batch.commit();
}

// Asset Management Status - Compatible with both structures
export async function getAssetManagementStatusCompat(): Promise<AssetManagementStatus> {
  try {
    await checkDatabaseStructure();
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const docId = `asset-status-${currentYear}-${currentMonth + 1}`; // Use 1-based month for clarity
    
    if (useNewStructure) {
      // In new structure, we use individual tasks
      const monthYear = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const tasksRef = collection(db, DB_PATHS.divisionTasks(DIVISIONS.ASSET_MANAGEMENT));
      const q = query(tasksRef, where('monthYear', '==', monthYear));
      const snapshot = await getDocs(q);
      
      // Convert tasks to status object
      const status = {
        booksClosedOut: false,
        rentsCollected: false,
        loansPaymentsMade: false,
        vendorsPaymentsMade: false,
        propertyTaxesPaid: false,
        insurancePoliciesActive: false,
        entitiesRenewed: false,
        lastUpdated: new Date(),
      };
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Map task titles to status fields
        if (data.title.includes('books closed')) status.booksClosedOut = data.isChecked;
        if (data.title.includes('rents collected')) status.rentsCollected = data.isChecked;
        if (data.title.includes('loans paid')) status.loansPaymentsMade = data.isChecked;
        if (data.title.includes('vendors paid')) status.vendorsPaymentsMade = data.isChecked;
        if (data.title.includes('property taxes')) status.propertyTaxesPaid = data.isChecked;
        if (data.title.includes('insurance policies')) status.insurancePoliciesActive = data.isChecked;
        if (data.title.includes('entities renewed')) status.entitiesRenewed = data.isChecked;
      });
      
      return status;
    } else {
      // Old structure
      const docRef = doc(db, 'dashboard_status', docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as AssetManagementStatus;
      } else {
        // Initialize with default values
        const defaultStatus = {
          rentsCollected: false,
          loansPaymentsMade: false,
          vendorsPaymentsMade: false,
        propertyTaxesPaid: false,
        insurancePoliciesActive: false,
        entitiesRenewed: false,
        booksClosedOut: false,
        lastUpdated: new Date(),
      };
      await setDoc(docRef, defaultStatus);
      return defaultStatus;
    }
  }
  } catch (error: any) {
    console.error('Error getting asset management status:', error);
    // Return default status on error
    return {
      rentsCollected: false,
      loansPaymentsMade: false,
      vendorsPaymentsMade: false,
      propertyTaxesPaid: false,
      insurancePoliciesActive: false,
      entitiesRenewed: false,
      booksClosedOut: false,
      lastUpdated: new Date(),
    };
  }
}

export async function updateAssetManagementStatusCompat(
  field: string,
  value: boolean
) {
  await checkDatabaseStructure();
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  if (useNewStructure) {
    // In new structure, find and update the specific task
    const monthYear = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const tasksRef = collection(db, DB_PATHS.divisionTasks(DIVISIONS.ASSET_MANAGEMENT));
    const q = query(tasksRef, where('monthYear', '==', monthYear));
    const snapshot = await getDocs(q);
    
    // Find the task that matches this field
    for (const taskDoc of snapshot.docs) {
      const data = taskDoc.data();
      let shouldUpdate = false;
      
      if (field === 'booksClosedOut' && data.title.includes('books closed')) shouldUpdate = true;
      if (field === 'rentsCollected' && data.title.includes('rents collected')) shouldUpdate = true;
      if (field === 'loansPaymentsMade' && data.title.includes('loans paid')) shouldUpdate = true;
      if (field === 'vendorsPaymentsMade' && data.title.includes('vendors paid')) shouldUpdate = true;
      if (field === 'propertyTaxesPaid' && data.title.includes('property taxes')) shouldUpdate = true;
      if (field === 'insurancePoliciesActive' && data.title.includes('insurance policies')) shouldUpdate = true;
      if (field === 'entitiesRenewed' && data.title.includes('entities renewed')) shouldUpdate = true;
      
      if (shouldUpdate) {
        await updateDoc(taskDoc.ref, {
          isChecked: value,
          updatedAt: serverTimestamp()
        });
        break;
      }
    }
  } else {
    // Old structure
    const docId = `asset-status-${currentYear}-${currentMonth + 1}`; // Use 1-based month for clarity
    const docRef = doc(db, 'dashboard_status', docId);
    
    // First ensure the document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        rentsCollected: false,
        loansPaymentsMade: false,
        vendorsPaymentsMade: false,
        propertyTaxesPaid: false,
        insurancePoliciesActive: false,
        entitiesRenewed: false,
        booksClosedOut: false,
        [field]: value,
        lastUpdated: serverTimestamp()
      });
    } else {
      await updateDoc(docRef, {
        [field]: value,
        lastUpdated: serverTimestamp()
      });
    }
  }
}

// Subscribe functions
export function subscribeToDivisionTasksCompat(
  divisionId: string,
  callback: (tasks: any[]) => void
): () => void {
  // Check structure on subscription
  checkDatabaseStructure().then(() => {
    // Subscribing to division tasks
  });
  
  let q: any;
  if (useNewStructure) {
    const tasksRef = collection(db, DB_PATHS.divisionTasks(divisionId));
    q = query(tasksRef, orderBy('order'), orderBy('createdAt'));
  } else {
    const tasksRef = collection(db, 'division_tasks');
    q = query(tasksRef, where('division', '==', divisionId), orderBy('createdAt'));
  }
  
  const unsubscribe = onSnapshot(q, 
    (snapshot: any) => {
      const tasks = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(tasks);
    },
    (error) => {
      // Handle index building errors gracefully
      if (error.code === 'failed-precondition' && error.message?.includes('index')) {
        // Index is building, waiting...
        callback([]); // Return empty array while index builds
      } else {
        console.error(`Error subscribing to ${divisionId} tasks:`, error);
        callback([]); // Return empty array on other errors
      }
    }
  );
  
  return unsubscribe;
}

export function subscribeToAssetStatusCompat(
  callback: (status: any) => void
): () => void {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // For old structure, subscribe to dashboard_status
  const docId = `asset-status-${currentYear}-${currentMonth + 1}`; // Use 1-based month for clarity
  const docRef = doc(db, 'dashboard_status', docId);
  
  const unsubscribe = onSnapshot(docRef, async (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      // Initialize if doesn't exist
      const defaultStatus = {
        rentsCollected: false,
        loansPaymentsMade: false,
        vendorsPaymentsMade: false,
        propertyTaxesPaid: false,
        insurancePoliciesActive: false,
        entitiesRenewed: false,
        booksClosedOut: false,
        lastUpdated: new Date(),
      };
      await setDoc(docRef, defaultStatus);
      callback(defaultStatus);
    }
  });
  
  return unsubscribe;
}
