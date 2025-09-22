/**
 * Division Service
 * 
 * Handles all operations for business divisions using the new organized structure.
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
  Timestamp
} from 'firebase/firestore';
import { DB_PATHS, DIVISIONS, DIVISION_CONFIG, DivisionTask } from './structure';

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: Timestamp | Date | undefined): Date => {
  if (!timestamp) return new Date();
  return timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
};

// Get the current month-year string (e.g., "2025-09")
function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

// Get previous month-year string
function getPreviousMonthYear(): string {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

// Asset Management specific functions
export async function getAssetManagementTasks(): Promise<DivisionTask[]> {
  const monthYear = getCurrentMonthYear();
  const tasksRef = collection(db, DB_PATHS.divisionTasks(DIVISIONS.ASSET_MANAGEMENT));
  const q = query(tasksRef, where('monthYear', '==', monthYear), orderBy('order'));
  
  const snapshot = await getDocs(q);
  
  // If no tasks exist for this month, create them
  if (snapshot.empty) {
    await createMonthlyAssetTasks(monthYear);
    // Fetch again after creation
    const newSnapshot = await getDocs(q);
    return newSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: timestampToDate(doc.data().createdAt),
      updatedAt: timestampToDate(doc.data().updatedAt),
    } as DivisionTask));
  }
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: timestampToDate(doc.data().createdAt),
    updatedAt: timestampToDate(doc.data().updatedAt),
  } as DivisionTask));
}

// Create monthly tasks for Asset Management
async function createMonthlyAssetTasks(monthYear: string) {
  const [year, month] = monthYear.split('-');
  const currentMonth = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' });
  const previousMonth = new Date(parseInt(year), parseInt(month) - 2).toLocaleDateString('en-US', { month: 'long' });
  
  const tasks = [
    { title: `${previousMonth} books closed`, order: 0 },
    { title: `All ${currentMonth} rents collected`, order: 1 },
    { title: 'All loans paid', order: 2 },
    { title: 'All vendors paid', order: 3 },
    { title: 'All property taxes paid', order: 4 },
    { title: 'All insurance policies active', order: 5 },
    { title: 'All entities renewed', order: 6 },
  ];
  
  for (const task of tasks) {
    const taskId = `${monthYear}-${task.order}`;
    const taskRef = doc(db, DB_PATHS.divisionTask(DIVISIONS.ASSET_MANAGEMENT, taskId));
    
    await setDoc(taskRef, {
      id: taskId,
      divisionId: DIVISIONS.ASSET_MANAGEMENT,
      title: task.title,
      isChecked: false,
      order: task.order,
      monthYear,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// Get tasks for Real Estate or Ventures (persistent tasks)
export async function getDivisionTasks(divisionId: string): Promise<DivisionTask[]> {
  const tasksRef = collection(db, DB_PATHS.divisionTasks(divisionId));
  const q = query(tasksRef, orderBy('order'), orderBy('createdAt'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: timestampToDate(doc.data().createdAt),
    updatedAt: timestampToDate(doc.data().updatedAt),
  } as DivisionTask));
}

// Add a new task
export async function addDivisionTask(
  divisionId: string,
  title: string
): Promise<string> {
  const tasksRef = collection(db, DB_PATHS.divisionTasks(divisionId));
  
  // Get current task count for ordering
  const snapshot = await getDocs(tasksRef);
  const order = snapshot.size;
  
  const newTaskRef = doc(tasksRef);
  const taskData: Partial<DivisionTask> = {
    id: newTaskRef.id,
    divisionId,
    title,
    isChecked: false,
    order,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Add monthYear for Asset Management tasks
  if (divisionId === DIVISIONS.ASSET_MANAGEMENT) {
    taskData.monthYear = getCurrentMonthYear();
  }
  
  await setDoc(newTaskRef, {
    ...taskData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return newTaskRef.id;
}

// Update task status
export async function updateTaskStatus(
  divisionId: string,
  taskId: string,
  isChecked: boolean
): Promise<void> {
  const taskRef = doc(db, DB_PATHS.divisionTask(divisionId, taskId));
  
  const updates: any = {
    isChecked,
    updatedAt: serverTimestamp(),
  };
  
  // Add completedAt for persistent tasks
  if (divisionId !== DIVISIONS.ASSET_MANAGEMENT) {
    updates.completedAt = isChecked ? serverTimestamp() : null;
  }
  
  await updateDoc(taskRef, updates);
}

// Delete a task
export async function deleteTask(
  divisionId: string,
  taskId: string
): Promise<void> {
  const taskRef = doc(db, DB_PATHS.divisionTask(divisionId, taskId));
  await deleteDoc(taskRef);
}

// Subscribe to Asset Management tasks
export function subscribeToAssetTasks(
  callback: (tasks: DivisionTask[]) => void
): () => void {
  const monthYear = getCurrentMonthYear();
  const tasksRef = collection(db, DB_PATHS.divisionTasks(DIVISIONS.ASSET_MANAGEMENT));
  const q = query(tasksRef, where('monthYear', '==', monthYear), orderBy('order'));
  
  const unsubscribe = onSnapshot(q, async (snapshot) => {
    if (snapshot.empty) {
      // Create tasks if they don't exist
      await createMonthlyAssetTasks(monthYear);
      return;
    }
    
    const tasks = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: timestampToDate(doc.data().createdAt),
      updatedAt: timestampToDate(doc.data().updatedAt),
    } as DivisionTask));
    
    callback(tasks);
  });
  
  return unsubscribe;
}

// Subscribe to division tasks (Real Estate or Ventures)
export function subscribeToDivisionTasks(
  divisionId: string,
  callback: (tasks: DivisionTask[]) => void
): () => void {
  const tasksRef = collection(db, DB_PATHS.divisionTasks(divisionId));
  const q = query(tasksRef, orderBy('order'), orderBy('createdAt'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: timestampToDate(doc.data().createdAt),
      updatedAt: timestampToDate(doc.data().updatedAt),
    } as DivisionTask));
    
    callback(tasks);
  });
  
  return unsubscribe;
}
