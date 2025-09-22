/**
 * Utility functions for task visibility based on completion date
 * Tasks completed before today at midnight should be hidden
 */

/**
 * Check if a task should be visible based on completion date
 * @param completedAt - The date when the task was completed
 * @param isChecked - Whether the task is marked as completed
 * @returns true if the task should be shown, false if it should be hidden
 */
export function shouldShowTask(completedAt?: Date | null, isChecked: boolean = false): boolean {
  // If not checked, always show
  if (!isChecked) return true;
  
  // If checked but no completion date, show it (legacy data)
  if (!completedAt) return true;
  
  // Get today at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // If completed today or after, show it
  const completionDate = new Date(completedAt);
  return completionDate >= today;
}

/**
 * Check if an asset management task should be visible
 * @param fieldName - The name of the asset management field
 * @param status - The asset management status object
 * @returns true if the task should be shown
 */
export function shouldShowAssetTask(
  fieldName: keyof Omit<import('@/types/goal').AssetManagementStatus, 'lastUpdated' | 'completedDates'>,
  status: import('@/types/goal').AssetManagementStatus
): boolean {
  const isChecked = status[fieldName];
  const completedAt = status.completedDates?.[fieldName];
  return shouldShowTask(completedAt, isChecked);
}

/**
 * Get the count of visible tasks from an array
 * @param tasks - Array of tasks with isChecked and completedAt properties
 * @returns Object with total and completed counts
 */
export function getVisibleTaskCounts<T extends { isChecked: boolean; completedAt?: Date | null }>(
  tasks: T[]
): { total: number; completed: number } {
  const visibleTasks = tasks.filter(task => shouldShowTask(task.completedAt, task.isChecked));
  const completedTasks = visibleTasks.filter(task => task.isChecked);
  
  return {
    total: visibleTasks.length,
    completed: completedTasks.length
  };
}
