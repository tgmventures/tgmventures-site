export type GoalCategory = 
  | 'asset-management'
  | 'real-estate-development' 
  | 'ventures'
  | 'operations'
  | 'finance'
  | 'compliance'
  | 'other';

export type GoalFrequency = 
  | 'one-time'
  | 'monthly'
  | 'quarterly'
  | 'annually';

export type BusinessDivision = 
  | 'asset-management'
  | 'real-estate-development'
  | 'ventures'
  | 'all';

export interface ProjectTag {
  id: string;
  name: string;
  color: string; // Hex color code
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  division: BusinessDivision;
  projectTag?: ProjectTag;
  assignedTo?: string; // User ID of responsible team member
  isTeamGoal: boolean; // true = team goal, false = individual goal
  dueDate: Date; // "On or before" date
  status: 'pending' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
  isChecked: boolean; // For easy checkbox tracking
  priority?: 'low' | 'medium' | 'high';
  
  // For recurring goals
  frequency: GoalFrequency;
  recurrenceRule?: {
    frequency: GoalFrequency;
    dayOfMonth?: number; // For monthly goals (e.g., 15th of each month)
    monthOfYear?: number; // For annual goals (e.g., April = 4)
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4'; // For quarterly goals
  };
  parentGoalId?: string; // For recurring goals, reference to the template
  
  // Integration
  asanaTaskId?: string;
  asanaProjectId?: string;
  
  // Tracking
  createdBy: string; // User ID who created the goal
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface GoalUpdate {
  id: string;
  goalId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'ceo' | 'admin' | 'member';
  division?: BusinessDivision;
}

export interface GoalWithDetails extends Goal {
  assignedToUser?: TeamMember;
  updates?: GoalUpdate[];
}

export interface AssetManagementStatus {
  booksClosedOut: boolean;
  rentsCollected: boolean;
  loansPaymentsMade: boolean;
  vendorsPaymentsMade: boolean;
  propertyTaxesPaid: boolean;
  insurancePoliciesActive: boolean;
  entitiesRenewed: boolean;
  lastUpdated: Date;
  completedDates?: {
    booksClosedOut?: Date;
    rentsCollected?: Date;
    loansPaymentsMade?: Date;
    vendorsPaymentsMade?: Date;
    propertyTaxesPaid?: Date;
    insurancePoliciesActive?: Date;
    entitiesRenewed?: Date;
  };
}

export interface DivisionTask {
  id: string;
  division: 'real-estate-development' | 'ventures';
  title: string;
  isChecked: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TaxReturn {
  id: string;
  entity: string;
  country: '🇺🇸' | '🇨🇴';
  year: number;
  isFiled: boolean;
  lastUpdated: Date;
  completedAt?: Date;
}