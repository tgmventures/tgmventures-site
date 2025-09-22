import { db } from './firebase';
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
  deleteDoc,
  addDoc,
  getDocs
} from 'firebase/firestore';

export interface DivisionTask {
  id: string;
  division: 'real-estate-development' | 'ventures';
  title: string;
  isChecked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tasksCollection = collection(db, 'division_tasks');

// Get tasks for a division
export async function getDivisionTasks(
  division: 'real-estate-development' | 'ventures'
): Promise<DivisionTask[]> {
  const q = query(
    tasksCollection,
    where('division', '==', division),
    orderBy('createdAt', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
  } as DivisionTask));
}

// Add new task
export async function addDivisionTask(
  division: 'real-estate-development' | 'ventures',
  title: string
): Promise<string> {
  const newTask = {
    division,
    title,
    isChecked: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const docRef = await addDoc(tasksCollection, newTask);
  return docRef.id;
}

// Update task checked status
export async function updateTaskStatus(taskId: string, isChecked: boolean): Promise<void> {
  const docRef = doc(tasksCollection, taskId);
  await updateDoc(docRef, {
    isChecked,
    updatedAt: new Date()
  });
}

// Delete task
export async function deleteTask(taskId: string): Promise<void> {
  const docRef = doc(tasksCollection, taskId);
  await deleteDoc(docRef);
}

// Subscribe to division tasks
export function subscribeToDivisionTasks(
  division: 'real-estate-development' | 'ventures',
  callback: (tasks: DivisionTask[]) => void
): () => void {
  const q = query(
    tasksCollection,
    where('division', '==', division),
    orderBy('createdAt', 'asc')
  );
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tasks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as DivisionTask));
    callback(tasks);
  });
  
  return unsubscribe;
}
