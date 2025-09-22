/**
 * New Firestore Database Structure
 * 
 * This file defines the new organized structure for our Firestore database.
 * Everything is organized under organizations for better scalability and clarity.
 */

// Organization path: /organizations/tgm-ventures
export const ORGANIZATION_ID = 'tgm-ventures';

// Database paths
export const DB_PATHS = {
  // Root organization path
  organization: () => `organizations/${ORGANIZATION_ID}`,
  
  // Divisions
  divisions: () => `organizations/${ORGANIZATION_ID}/divisions`,
  division: (divisionId: string) => `organizations/${ORGANIZATION_ID}/divisions/${divisionId}`,
  divisionTasks: (divisionId: string) => `organizations/${ORGANIZATION_ID}/divisions/${divisionId}/tasks`,
  divisionTask: (divisionId: string, taskId: string) => `organizations/${ORGANIZATION_ID}/divisions/${divisionId}/tasks/${taskId}`,
  
  // Projects  
  projects: () => `organizations/${ORGANIZATION_ID}/projects`,
  project: (projectId: string) => `organizations/${ORGANIZATION_ID}/projects/${projectId}`,
  projectGoals: (projectId: string) => `organizations/${ORGANIZATION_ID}/projects/${projectId}/goals`,
  projectGoal: (projectId: string, goalId: string) => `organizations/${ORGANIZATION_ID}/projects/${projectId}/goals/${goalId}`,
  
  // Users
  users: () => `organizations/${ORGANIZATION_ID}/users`,
  user: (userId: string) => `organizations/${ORGANIZATION_ID}/users/${userId}`,
  
  // Settings (for future use)
  settings: () => `organizations/${ORGANIZATION_ID}/settings`,
};

// Division types
export type DivisionType = 'recurring-monthly' | 'persistent-tasks';

// Division IDs
export const DIVISIONS = {
  ASSET_MANAGEMENT: 'asset-management',
  REAL_ESTATE: 'real-estate-development',
  VENTURES: 'ventures',
} as const;

// Division configurations
export const DIVISION_CONFIG = {
  [DIVISIONS.ASSET_MANAGEMENT]: {
    name: 'Asset Management',
    type: 'recurring-monthly' as DivisionType,
    color: 'green',
    icon: '🏢',
  },
  [DIVISIONS.REAL_ESTATE]: {
    name: 'Real Estate Development',
    type: 'persistent-tasks' as DivisionType,
    color: 'blue',
    icon: '🏗️',
  },
  [DIVISIONS.VENTURES]: {
    name: 'Ventures',
    type: 'persistent-tasks' as DivisionType,
    color: 'purple',
    icon: '🚀',
  },
};

// Types for the new structure
export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  settings?: OrganizationSettings;
}

export interface OrganizationSettings {
  defaultTimezone?: string;
  fiscalYearStart?: number; // month (1-12)
}

export interface Division {
  id: string;
  name: string;
  type: DivisionType;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DivisionTask {
  id: string;
  divisionId: string;
  title: string;
  isChecked: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  // For recurring monthly tasks
  monthYear?: string; // e.g., "2025-09" for September 2025
  // For persistent tasks
  completedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  overview?: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  locked: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  externalLinks?: {
    website?: string;
    asana?: string;
    github?: string;
  };
}

export interface ProjectGoal {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string; // Firebase Auth UID
  email: string;
  name: string;
  role: 'ceo' | 'admin' | 'member';
  businessUnit?: 'asset-management' | 'ventures'; // User's selected view
  createdAt: Date;
  lastLogin?: Date;
  lastViewedUnit?: Date; // When they last switched views
}
