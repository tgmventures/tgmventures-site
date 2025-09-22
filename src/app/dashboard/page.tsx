'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState, lazy, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AssetManagementStatus, DivisionTask, TaxReturn } from '@/types/goal'
import {
  getDivisionTasksCompat,
  addDivisionTaskCompat,
  updateTaskStatusCompat,
  updateTaskTitleCompat,
  deleteTaskCompat,
  reorderTasksCompat,
  getAssetManagementStatusCompat,
  updateAssetManagementStatusCompat,
  subscribeToAssetStatusCompat,
  subscribeToDivisionTasksCompat
} from '@/lib/firebase/compat-service'
import { getTaxFilingsData, updateTaxReturnStatus, updatePropertyTaxStatus, getPriorTaxYear } from '@/lib/firebase/taxes'
import { initializeAssetManagementTasks } from '@/lib/firebase/asset-management-init'
import { getUserPreferences, updateBusinessUnit, initializeUserData, BusinessUnit } from '@/lib/firebase/user-preferences'

// Lazy load dashboard components for better performance
const AssetManagementCard = lazy(() => import('@/components/dashboard/BusinessDivisionCards').then(mod => ({ default: mod.AssetManagementCard })))
const RealEstateCard = lazy(() => import('@/components/dashboard/RealEstateCard').then(mod => ({ default: mod.RealEstateCard })))
const VenturesCard = lazy(() => import('@/components/dashboard/VenturesCard').then(mod => ({ default: mod.VenturesCard })))
const TaxFilingsCard = lazy(() => import('@/components/dashboard/TaxFilingsCard').then(mod => ({ default: mod.TaxFilingsCard })))

// Import loading skeleton
import { CardSkeleton } from '@/components/dashboard/CardSkeleton'
import { VentureCardSystem } from '@/components/dashboard/VentureCardSystem'
import { getVentureCards, subscribeToVentureCards } from '@/lib/firebase/ventures-cards'
import type { VentureCard } from '@/lib/firebase/ventures-cards'
import { shouldShowTask, shouldShowAssetTask, getVisibleTaskCounts } from '@/lib/utils/task-visibility'
import { getWeeklyCompletionCount, incrementWeeklyCompletionCount, decrementWeeklyCompletionCount } from '@/lib/firebase/weekly-progress'

interface Project {
  id: string;
  name: string;
  division: 'real-estate-development' | 'ventures';
}

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [currentDate] = useState(new Date())
  const [assetStatus, setAssetStatus] = useState<AssetManagementStatus>({
    booksClosedOut: false,
    rentsCollected: false,
    loansPaymentsMade: false,
    vendorsPaymentsMade: false,
    propertyTaxesPaid: false,
    insurancePoliciesActive: false,
    entitiesRenewed: false,
    lastUpdated: new Date()
  })
  const [realEstateTasks, setRealEstateTasks] = useState<DivisionTask[]>([])
  const [venturesTasks, setVenturesTasks] = useState<DivisionTask[]>([])
  const [ventureCards, setVentureCards] = useState<VentureCard[]>([])
  const [realEstateProjects, setRealEstateProjects] = useState<Project[]>([
    { id: '1', name: 'Finca El Tablazo', division: 'real-estate-development' }
  ])
  const [venturesProjects, setVenturesProjects] = useState<Project[]>([
    { id: '1', name: 'LivePFS', division: 'ventures' },
    { id: '2', name: 'RefiHub', division: 'ventures' }
  ])
  const [addingProject, setAddingProject] = useState<string | null>(null)
  const [addingTask, setAddingTask] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const [justCompletedTask, setJustCompletedTask] = useState<string | null>(null)
  const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([])
  const [propertyTaxH1Paid, setPropertyTaxH1Paid] = useState(false)
  const [propertyTaxH2Paid, setPropertyTaxH2Paid] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [draggedTask, setDraggedTask] = useState<DivisionTask | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit>('asset-management')
  const [loadingBusinessUnit, setLoadingBusinessUnit] = useState(true)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [weeklyCompletedCount, setWeeklyCompletedCount] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Load weekly completion count
  useEffect(() => {
    const loadWeeklyCount = async () => {
      if (user) {
        const count = await getWeeklyCompletionCount(user.uid)
        setWeeklyCompletedCount(count)
      }
    }
    loadWeeklyCount()
  }, [user])

  // Load user preferences and business unit
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (user) {
        try {
          // Initialize user data if needed
          await initializeUserData(user.uid, user.email || '', user.displayName || '')
          
          // Get user preferences
          const preferences = await getUserPreferences(user.uid)
          if (preferences?.businessUnit) {
            setBusinessUnit(preferences.businessUnit)
          } else {
            // If no preference, default to asset-management
            setBusinessUnit('asset-management')
          }
        } catch (error) {
          console.error('Error loading user preferences:', error)
        } finally {
          setLoadingBusinessUnit(false)
        }
      }
    }
    
    loadUserPreferences()
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showProfileDropdown])


  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialize Asset Management tasks for current month if needed
        await initializeAssetManagementTasks()
        
        const status = await getAssetManagementStatusCompat()
        setAssetStatus(status)
        
        const realEstateTasks = await getDivisionTasksCompat('real-estate-development')
        setRealEstateTasks(realEstateTasks)
        
        const venturesTasks = await getDivisionTasksCompat('ventures')
        setVenturesTasks(venturesTasks)
        
        const ventureCards = await getVentureCards()
        setVentureCards(ventureCards)
        
        const taxFilingsData = await getTaxFilingsData()
        setTaxReturns(taxFilingsData.returns)
        setPropertyTaxH1Paid(taxFilingsData.propertyTaxH1Paid)
        setPropertyTaxH2Paid(taxFilingsData.propertyTaxH2Paid)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    if (user) {
      loadData()
      
      const unsubAssetStatus = subscribeToAssetStatusCompat(setAssetStatus)
      const unsubRealEstateTasks = subscribeToDivisionTasksCompat('real-estate-development', setRealEstateTasks)
      const unsubVenturesTasks = subscribeToDivisionTasksCompat('ventures', setVenturesTasks)
      const unsubVentureCards = subscribeToVentureCards(setVentureCards)
      
      return () => {
        unsubAssetStatus()
        unsubRealEstateTasks()
        unsubVenturesTasks()
        unsubVentureCards()
      }
    }
  }, [user])

  // Clear celebration animation after delay
  useEffect(() => {
    if (justCompletedTask) {
      const timer = setTimeout(() => setJustCompletedTask(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [justCompletedTask])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleBusinessUnitChange = async (newUnit: BusinessUnit) => {
    if (user && newUnit !== businessUnit) {
      try {
        setBusinessUnit(newUnit)
        await updateBusinessUnit(user.uid, newUnit)
      } catch (error) {
        console.error('Error updating business unit:', error)
        // Revert on error
        setBusinessUnit(businessUnit)
      }
    }
  }

  const handleAssetStatusChange = async (field: keyof Omit<AssetManagementStatus, 'lastUpdated' | 'completedDates' | 'completedBy'>) => {
    try {
      await updateAssetManagementStatusCompat(field, !assetStatus[field], user?.email || '', user?.displayName || '')
      if (!assetStatus[field]) {
        setJustCompletedTask(`asset-${field}`)
        setShowSuccessToast(true)
        setWeeklyCompletedCount(prev => prev + 1)
        if (user) await incrementWeeklyCompletionCount(user.uid)
        
        // Hide toast after 3 seconds
        setTimeout(() => setShowSuccessToast(false), 3000)
      } else {
        // Decrement counter when unchecking
        setWeeklyCompletedCount(prev => Math.max(0, prev - 1))
        if (user) await decrementWeeklyCompletionCount(user.uid)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }
  
  const handleTaxReturnChange = async (taxReturnId: string, currentStatus: boolean) => {
    try {
      await updateTaxReturnStatus(taxReturnId, !currentStatus, user?.email || '', user?.displayName || '')
      const updatedData = await getTaxFilingsData()
      setTaxReturns(updatedData.returns)
      if (!currentStatus) {
        setJustCompletedTask(`tax-${taxReturnId}`)
        setShowSuccessToast(true)
        setWeeklyCompletedCount(prev => prev + 1)
        if (user) await incrementWeeklyCompletionCount(user.uid)
        
        // Hide toast after 3 seconds
        setTimeout(() => setShowSuccessToast(false), 3000)
      } else {
        // Decrement counter when unchecking
        setWeeklyCompletedCount(prev => Math.max(0, prev - 1))
        if (user) await decrementWeeklyCompletionCount(user.uid)
      }
    } catch (error) {
      console.error('Error updating tax return status:', error)
    }
  }

  const handlePropertyTaxChange = async (period: 'H1' | 'H2') => {
    const newValue = period === 'H1' ? !propertyTaxH1Paid : !propertyTaxH2Paid
    
    try {
      // Update local state immediately for responsive UI
      if (period === 'H1') {
        setPropertyTaxH1Paid(newValue)
      } else {
        setPropertyTaxH2Paid(newValue)
      }
      
      // Show completion animation
      if (newValue) {
        setJustCompletedTask(`property-tax-${period.toLowerCase()}`)
        setShowSuccessToast(true)
        setWeeklyCompletedCount(prev => prev + 1)
        if (user) await incrementWeeklyCompletionCount(user.uid)
        
        // Hide toast after 3 seconds
        setTimeout(() => setShowSuccessToast(false), 3000)
      } else {
        // Decrement counter when unchecking
        setWeeklyCompletedCount(prev => Math.max(0, prev - 1))
        if (user) await decrementWeeklyCompletionCount(user.uid)
      }
      
      // Update in Firestore
      await updatePropertyTaxStatus(period, newValue, user?.email || '', user?.displayName || '')
    } catch (error) {
      console.error('Error updating property tax status:', error)
      // Revert on error
      if (period === 'H1') {
        setPropertyTaxH1Paid(!newValue)
      } else {
        setPropertyTaxH2Paid(!newValue)
      }
    }
  }


  const handleAddProject = (division: 'real-estate-development' | 'ventures') => {
    if (!newText.trim()) return
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: newText.trim(),
      division
    }
    
    if (division === 'real-estate-development') {
      setRealEstateProjects([...realEstateProjects, newProject])
    } else {
      setVenturesProjects([...venturesProjects, newProject])
    }
    
    setNewText('')
    setAddingProject(null)
  }

  const handleDeleteProject = (projectId: string, division: 'real-estate-development' | 'ventures') => {
    if (division === 'real-estate-development') {
      setRealEstateProjects(realEstateProjects.filter(p => p.id !== projectId))
    } else {
      setVenturesProjects(venturesProjects.filter(p => p.id !== projectId))
    }
  }

  const handleTaskCheck = async (taskId: string, isChecked: boolean, divisionId: string) => {
    try {
      await updateTaskStatusCompat(divisionId, taskId, !isChecked, user?.email || '', user?.displayName || '')
      if (!isChecked) {
        setJustCompletedTask(taskId)
        setShowSuccessToast(true)
        setWeeklyCompletedCount(prev => prev + 1)
        if (user) await incrementWeeklyCompletionCount(user.uid)
        
        // Hide toast after 3 seconds
        setTimeout(() => setShowSuccessToast(false), 3000)
      } else {
        // Decrement counter when unchecking
        setWeeklyCompletedCount(prev => Math.max(0, prev - 1))
        if (user) await decrementWeeklyCompletionCount(user.uid)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string, divisionId: string) => {
    try {
      await deleteTaskCompat(divisionId, taskId)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleAddTask = async (division: 'real-estate-development' | 'ventures') => {
    if (!newText.trim()) return
    
    try {
      await addDivisionTaskCompat(division, newText.trim())
      setNewText('')
      setAddingTask(null)
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleEditTask = async (taskId: string, divisionId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    
    try {
      await updateTaskTitleCompat(divisionId, taskId, newTitle.trim())
      setEditingTaskId(null)
      setEditText('')
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const startEditingTask = (taskId: string, currentTitle: string) => {
    setEditingTaskId(taskId)
    setEditText(currentTitle)
  }

  const handleDragStart = (e: React.DragEvent, task: DivisionTask) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number, tasks: DivisionTask[], divisionId: string) => {
    e.preventDefault()
    
    if (!draggedTask || !tasks.find(t => t.id === draggedTask.id)) {
      handleDragEnd()
      return
    }

    const draggedIndex = tasks.findIndex(t => t.id === draggedTask.id)
    
    if (draggedIndex === dropIndex) {
      handleDragEnd()
      return
    }

    // Create a new array with the reordered tasks
    const reorderedTasks = [...tasks]
    reorderedTasks.splice(draggedIndex, 1)
    reorderedTasks.splice(dropIndex, 0, draggedTask)
    
    // Assign new order values
    const taskIds = reorderedTasks.map(t => t.id)
    const newOrders = reorderedTasks.map((_, index) => index)
    
    // Update local state immediately for responsive UI
    if (divisionId === 'real-estate-development') {
      setRealEstateTasks(reorderedTasks.map((task, index) => ({ ...task, order: index })))
    } else if (divisionId === 'ventures') {
      setVenturesTasks(reorderedTasks.map((task, index) => ({ ...task, order: index })))
    }
    
    // Update in Firestore
    try {
      await reorderTasksCompat(divisionId, taskIds, newOrders)
    } catch (error) {
      console.error('Error reordering tasks:', error)
      // Reload tasks on error
      const freshTasks = await getDivisionTasksCompat(divisionId)
      if (divisionId === 'real-estate-development') {
        setRealEstateTasks(freshTasks)
      } else {
        setVenturesTasks(freshTasks)
      }
    }
    
    handleDragEnd()
  }


  if (loading || loadingBusinessUnit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-gray-200 mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading your command center...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Date calculations
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' })
  const priorMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1).toLocaleDateString('en-US', { month: 'long' })
  const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' })
  const dateString = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Calculate progress
  const assetChecklistComplete = [
    assetStatus.booksClosedOut,
    assetStatus.rentsCollected, 
    assetStatus.loansPaymentsMade,
    assetStatus.vendorsPaymentsMade,
    assetStatus.propertyTaxesPaid,
    assetStatus.insurancePoliciesActive,
    assetStatus.entitiesRenewed
  ].filter(Boolean).length
  
  // Calculate visible task counts
  const realEstateVisibleCounts = getVisibleTaskCounts(realEstateTasks)
  const venturesVisibleCounts = getVisibleTaskCounts(venturesTasks)
  
  // Calculate venture objectives from venture cards
  const allVentureObjectives = ventureCards.flatMap(card => card.objectives || [])
  const visibleVentureObjectives = allVentureObjectives.filter(obj => shouldShowTask(obj.completedAt, obj.isChecked))
  const completedVentureObjectives = visibleVentureObjectives.filter(obj => obj.isChecked).length
  const totalVentureObjectives = visibleVentureObjectives.length

  // Define apps for each business unit
  const assetManagementApps = [
    {
      name: 'Gemini',
      icon: '/images/gemini-icon.png',
      href: 'https://gemini.google.com/app',
      external: true,
      color: 'hover:bg-gray-50 border-gray-200'
    },
    {
      name: 'Gmail',
      icon: '/images/gmail-icon.png',
      href: 'https://mail.google.com',
      external: true,
      color: 'hover:bg-gray-50 border-gray-200'
    },
    {
      name: 'Google Drive',
      icon: '/images/google-drive-icon.png',
      href: 'https://drive.google.com',
      external: true,
      color: 'hover:bg-gray-50 border-gray-200'
    },
    {
      name: 'Rent Manager',
      icon: '🏠',
      href: 'https://tgm.rmx.rentmanager.com/#/welcome/myworkspace',
      external: true,
      color: 'hover:bg-gray-50 border-gray-200'
    },
    {
      name: 'Asana',
      icon: '/images/asana-icon.png',
      href: 'https://app.asana.com/0/1200134672573905/1200139775097871',
      external: true,
      color: 'hover:bg-gray-50 border-gray-200'
    },
    {
      name: 'Training',
      icon: '🎓',
      href: '/training',
      external: false,
      color: 'hover:bg-gray-50 border-gray-200'
    },
    {
      name: 'Reports',
      icon: '📊',
      href: '/reports',
      external: false,
      color: 'hover:bg-gray-50 border-gray-200'
    }
  ]

  const venturesApps = [
    {
      name: 'Gemini',
      icon: '/images/gemini-icon.png',
      href: 'https://gemini.google.com/app',
      external: true,
      color: 'hover:bg-gray-50 border-gray-200'
    },
    {
      name: 'Firebase',
      icon: '/images/firebase-icon.png',
      href: 'https://console.firebase.google.com',
      external: true,
      color: 'hover:bg-gray-50 border-gray-200'
    },
    {
      name: 'GitHub',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="currentColor">
          <path d="M24 4C12.954 4 4 12.954 4 24c0 8.837 5.731 16.335 13.68 18.978.999.184 1.368-.433 1.368-.962 0-.475-.018-2.055-.027-3.725-5.562 1.209-6.735-2.36-6.735-2.36-.909-2.31-2.219-2.924-2.219-2.924-1.815-1.24.137-1.215.137-1.215 2.007.141 3.065 2.061 3.065 2.061 1.783 3.054 4.676 2.172 5.815 1.661.18-1.291.698-2.173 1.27-2.671-4.44-.505-9.11-2.22-9.11-9.881 0-2.182.779-3.966 2.058-5.365-.207-.504-.892-2.538.194-5.292 0 0 1.677-.537 5.495 2.049A19.164 19.164 0 0124 13.524c1.7.008 3.413.23 5.01.674 3.815-2.586 5.49-2.049 5.49-2.049 1.088 2.754.403 4.788.197 5.292 1.281 1.399 2.055 3.183 2.055 5.365 0 7.68-4.678 9.372-9.13 9.864.718.62 1.355 1.838 1.355 3.704 0 2.672-.024 4.826-.024 5.484 0 .533.361 1.156 1.374.96C38.271 40.33 44 32.835 44 24c0-11.046-8.954-20-20-20z"/>
        </svg>
      ),
      href: 'https://github.com/orgs/TGM-Ventures/repositories',
      external: true,
      color: 'hover:bg-gray-100 border-gray-300'
    },
    {
      name: 'Google Cloud',
      icon: '/images/google-cloud-icon.png',
      href: 'https://console.cloud.google.com',
      external: true,
      color: 'hover:bg-gray-50 border-gray-200'
    },
    {
      name: 'Gmail',
      icon: '/images/gmail-icon.png',
      href: 'https://mail.google.com',
      external: true,
      color: 'hover:bg-gray-50 border-gray-200'
    }
  ]

  // Select apps based on business unit
  const apps = businessUnit === 'asset-management' ? assetManagementApps : venturesApps


  const renderProjects = (
    projects: Project[],
    division: 'real-estate-development' | 'ventures'
  ) => (
    <div className="space-y-2">
      {projects.map((project) => (
        <div key={project.id} className="flex items-center gap-2 group transition-all duration-200">
          <span className="text-sm text-gray-700">• {project.name}</span>
          <button
            onClick={() => handleDeleteProject(project.id, division)}
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-200 transform hover:scale-110 ml-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      {addingProject === division ? (
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            handleAddProject(division)
          }}
          className="flex items-center gap-2 mt-2 animate-fadeIn"
        >
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Project name..."
            className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            autoFocus
          />
          <button
            type="submit"
            className="text-green-600 hover:text-green-700 transform hover:scale-110 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingProject(null)
              setNewText('')
            }}
            className="text-gray-400 hover:text-gray-600 transform hover:scale-110 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAddingProject(division)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-all duration-200 mt-2"
        >
          + Add project
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 z-50 animate-fadeIn">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium">Great job! Objective completed</p>
              <p className="text-sm text-green-100">This will clear at midnight</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Weekly completion count header */}
      {weeklyCompletedCount > 0 && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2">
          <p className="text-sm text-green-800 text-center">
            🎉 You've completed {weeklyCompletedCount} objective{weeklyCompletedCount !== 1 ? 's' : ''} this week!
          </p>
        </div>
      )}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(20px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-fadeOut {
          animation: fadeOut 0.3s ease-out forwards;
        }
        .dragging {
          opacity: 0.5;
        }
        @keyframes dropdownSlideIn {
          from { 
            opacity: 0; 
            transform: translateY(-10px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        .dropdown-animate {
          animation: dropdownSlideIn 0.2s ease-out;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <Image
                  src="/images/tgm-logo-icon.png"
                  alt="TGM"
                  width={32}
                  height={32}
                  className="mr-3 transition-transform group-hover:scale-110"
                  priority
                />
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-gray-900">
                Welcome back{user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
              </span>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-500 hidden sm:inline">{dayOfWeek}, {dateString}</span>
              
              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-gray-200 hover:ring-2 hover:ring-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all cursor-pointer ${
                    showProfileDropdown ? 'ring-2 ring-gray-300' : ''
                  }`}
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'Profile'}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </button>
                
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 dropdown-animate">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {user.photoURL ? (
                            <Image
                              src={user.photoURL}
                              alt={user.displayName || 'Profile'}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || 'User'}</p>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" viewBox="0 0 24 24">
                              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Business Unit Toggle */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Dashboard View</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBusinessUnitChange('asset-management')}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                            businessUnit === 'asset-management'
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Asset Management
                        </button>
                        <button
                          onClick={() => handleBusinessUnitChange('ventures')}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                            businessUnit === 'ventures'
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Ventures
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Outstanding Objectives Section */}
        <div className="text-center mb-12">
          <div className="">
            <p className="text-base font-bold text-gray-900 mb-4">Outstanding Objectives:</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
              {businessUnit === 'asset-management' && (
                <>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                <div className="text-gray-600">
                  <span className="whitespace-nowrap">{taxReturns.filter(t => !t.isFiled).length + (propertyTaxH1Paid ? 0 : 1) + (propertyTaxH2Paid ? 0 : 1)}/{taxReturns.length + 2}</span>{' '}
                  <span>Tax</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div className="text-gray-600">
                  <span className="whitespace-nowrap">{7 - assetChecklistComplete}/7</span>{' '}
                  <span className="whitespace-nowrap">Asset Management</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <div className="text-gray-600">
                      <span className="whitespace-nowrap">{realEstateVisibleCounts.total - realEstateVisibleCounts.completed}/{realEstateVisibleCounts.total}</span>{' '}
                  <span className="whitespace-nowrap">Real Estate</span>
                </div>
              </div>
                </>
              )}
              {businessUnit === 'ventures' && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <div className="text-gray-600">
                    <span className="whitespace-nowrap">{totalVentureObjectives - completedVentureObjectives}/{totalVentureObjectives}</span>{' '}
                    <span>Venture Objectives</span>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* App Grid */}
        <div className="flex flex-wrap justify-center gap-6 mb-12 max-w-6xl mx-auto">
          {apps.map((app) => (
            app.external ? (
              <a
                key={app.name}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`bg-white rounded-xl shadow-sm border-2 p-6 flex flex-col items-center justify-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 w-40 h-40 ${app.color}`}
              >
                <div className="mb-3 transition-transform duration-300 hover:scale-110">
                  {typeof app.icon === 'string' ? (
                    app.icon.startsWith('/') ? (
                      <Image
                        src={app.icon}
                        alt={`${app.name} icon`}
                        width={48}
                        height={48}
                        className={
                          app.name === 'Asana' ? "w-14 h-10 object-contain" :
                          app.name === 'Gmail' ? "w-10 h-9 object-contain" :
                          app.name === 'Google Drive' ? "w-10 h-10" :
                          app.name === 'Firebase' ? "w-10 h-12 object-contain" :
                          app.name === 'Google Cloud' ? "w-12 h-11 object-contain" :
                          "w-12 h-12"
                        }
                      />
                    ) : (
                      <span className="text-4xl">{app.icon}</span>
                    )
                  ) : (
                    app.icon
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900">{app.name}</span>
              </a>
            ) : (
              <Link
                key={app.name}
                href={app.href}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 flex flex-col items-center justify-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 w-40 h-40 ${app.color}`}
              >
                <div className="mb-3 transition-transform duration-300 hover:scale-110">
                  {typeof app.icon === 'string' ? (
                    app.icon.startsWith('/') ? (
                      <Image
                        src={app.icon}
                        alt={`${app.name} icon`}
                        width={48}
                        height={48}
                        className={
                          app.name === 'Asana' ? "w-14 h-10 object-contain" :
                          app.name === 'Gmail' ? "w-10 h-9 object-contain" :
                          app.name === 'Google Drive' ? "w-10 h-10" :
                          app.name === 'Firebase' ? "w-10 h-12 object-contain" :
                          app.name === 'Google Cloud' ? "w-12 h-11 object-contain" :
                          "w-12 h-12"
                        }
                      />
                    ) : (
                      <span className="text-4xl">{app.icon}</span>
                    )
                  ) : (
                    app.icon
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900">{app.name}</span>
              </Link>
            )
          ))}
                  </div>

        {/* Business Division Status - First Row */}
        {businessUnit === 'asset-management' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Asset Management */}
          <Suspense fallback={<CardSkeleton />}>
            <AssetManagementCard
              assetStatus={assetStatus}
              handleAssetStatusChange={handleAssetStatusChange}
              justCompletedTask={justCompletedTask}
              assetChecklistComplete={assetChecklistComplete}
              priorMonth={priorMonth}
              currentMonth={currentMonth}
            />
          </Suspense>

          {/* Real Estate */}
          <Suspense fallback={<CardSkeleton />}>
            <RealEstateCard
              realEstateTasks={realEstateTasks}
              realEstateTasksComplete={realEstateVisibleCounts.completed}
              handleTaskCheck={handleTaskCheck}
              handleDeleteTask={handleDeleteTask}
              handleAddTask={handleAddTask}
              handleEditTask={handleEditTask}
              startEditingTask={startEditingTask}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragEnd={handleDragEnd}
              handleDrop={handleDrop}
              justCompletedTask={justCompletedTask}
              editingTaskId={editingTaskId}
              editText={editText}
              setEditText={setEditText}
              setEditingTaskId={setEditingTaskId}
              draggedTask={draggedTask}
              dragOverIndex={dragOverIndex}
              addingTask={addingTask}
              setAddingTask={setAddingTask}
              newText={newText}
              setNewText={setNewText}
            />
          </Suspense>
            
          {/* Tax Filings */}
          <Suspense fallback={<CardSkeleton />}>
            <TaxFilingsCard
              taxReturns={taxReturns}
              propertyTaxH1Paid={propertyTaxH1Paid}
              propertyTaxH2Paid={propertyTaxH2Paid}
              handleTaxReturnChange={handleTaxReturnChange}
              handlePropertyTaxChange={handlePropertyTaxChange}
              justCompletedTask={justCompletedTask}
              currentDate={currentDate}
            />
          </Suspense>
            </div>
      ) : (
        /* Ventures View - Dynamic Cards */
        <div className="mb-8">
          {user && <VentureCardSystem 
            userEmail={user.email || ''} 
            userName={user.displayName || ''} 
            setShowSuccessToast={setShowSuccessToast}
            setWeeklyCompletedCount={setWeeklyCompletedCount}
            incrementWeeklyCount={user ? () => incrementWeeklyCompletionCount(user.uid) : undefined}
            decrementWeeklyCount={user ? () => decrementWeeklyCompletionCount(user.uid) : undefined}
          />}
                </div>
      )}

      </main>
    </div>
  )
}