import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { DB_PATHS, DIVISIONS } from './structure';

// Standard Asset Management tasks that should exist every month
const STANDARD_ASSET_TASKS = [
  { title: 'August books closed', order: 0 }, // Will be dynamically updated with prior month
  { title: 'All rents collected', order: 1 },
  { title: 'All loans paid', order: 2 },
  { title: 'All vendors paid', order: 3 },
  { title: 'All property taxes paid', order: 4 },
  { title: 'All insurance policies active', order: 5 },
  { title: 'All entities renewed', order: 6 }
];

// Get the prior month name
function getPriorMonthName(): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const currentDate = new Date();
  const priorMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
  return months[priorMonth];
}

// Check and create Asset Management tasks for the current month if they don't exist
export async function initializeAssetManagementTasks(): Promise<void> {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthYear = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  try {
    // First check if we're using the new structure
    const orgDoc = await getDoc(doc(db, 'organizations/tgm-ventures'));
    if (!orgDoc.exists()) {
      // Old structure - Asset Management tasks are handled differently
      return;
    }
    
    // Check if tasks already exist for this month
    const tasksRef = collection(db, DB_PATHS.divisionTasks(DIVISIONS.ASSET_MANAGEMENT));
    const q = query(tasksRef, where('monthYear', '==', monthYear));
    const snapshot = await getDocs(q);
    
    // If no tasks exist for this month, create them
    if (snapshot.empty) {
      console.log(`Creating Asset Management tasks for ${monthYear}`);
      
      // Update the first task with the prior month name
      const tasksToCreate = [...STANDARD_ASSET_TASKS];
      tasksToCreate[0] = { 
        title: `${getPriorMonthName()} books closed`, 
        order: 0 
      };
      
      // Create all tasks
      for (const task of tasksToCreate) {
        const newTaskRef = doc(collection(db, DB_PATHS.divisionTasks(DIVISIONS.ASSET_MANAGEMENT)));
        await setDoc(newTaskRef, {
          id: newTaskRef.id,
          divisionId: DIVISIONS.ASSET_MANAGEMENT,
          division: DIVISIONS.ASSET_MANAGEMENT,
          title: task.title,
          order: task.order,
          isChecked: false,
          monthYear: monthYear,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log(`Created ${tasksToCreate.length} Asset Management tasks for ${monthYear}`);
    }
  } catch (error) {
    console.error('Error initializing Asset Management tasks:', error);
  }
}
