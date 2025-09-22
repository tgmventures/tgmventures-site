'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

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
      
      return () => {
        unsubAssetStatus()
        unsubRealEstateTasks()
        unsubVenturesTasks()
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

  const handleAssetStatusChange = async (field: keyof Omit<AssetManagementStatus, 'lastUpdated'>) => {
    try {
      await updateAssetManagementStatusCompat(field, !assetStatus[field])
      if (!assetStatus[field]) {
        setJustCompletedTask(`asset-${field}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }
  
  const handleTaxReturnChange = async (taxReturnId: string, currentStatus: boolean) => {
    try {
      await updateTaxReturnStatus(taxReturnId, !currentStatus)
      const updatedData = await getTaxFilingsData()
      setTaxReturns(updatedData.returns)
      if (!currentStatus) {
        setJustCompletedTask(`tax-${taxReturnId}`)
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
      }
      
      // Update in Firestore
      await updatePropertyTaxStatus(period, newValue)
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
      await updateTaskStatusCompat(divisionId, taskId, !isChecked)
      if (!isChecked) {
        setJustCompletedTask(taskId)
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


  if (loading) {
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
  
  const realEstateTasksComplete = realEstateTasks.filter(t => t.isChecked).length
  const venturesTasksComplete = venturesTasks.filter(t => t.isChecked).length

  const apps = [
    {
      name: 'Gmail',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
          <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
          <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
          <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
        </svg>
      ),
      href: 'https://mail.google.com',
      external: true,
      color: 'hover:bg-red-50 border-red-200'
    },
    {
      name: 'Google Drive',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <path d="M19.35 4L30.65 4L44 28L38.35 38L24.65 38L11.35 14L19.35 4Z" fill="#1EA362"/>
          <path d="M11.35 38L17 48L30.35 48L36 38L11.35 38Z" fill="#4688F1"/>
          <path d="M4 28L11.35 38L24.65 38L17.35 28L4 28Z" fill="#4688F1"/>
          <path d="M19.35 4L11.35 14L24.65 38L17.35 28L30.65 4L19.35 4Z" fill="#1EA362"/>
          <path d="M30.65 4L44 28L30.65 28L17.35 4L30.65 4Z" fill="#FFD04A"/>
          <path d="M24.65 38L30.65 28L44 28L38.35 38L24.65 38Z" fill="#FFD04A"/>
        </svg>
      ),
      href: 'https://drive.google.com',
      external: true,
      color: 'hover:bg-blue-50 border-blue-200'
    },
    {
      name: 'Rent Manager',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="12" width="32" height="28" rx="2" fill="#2E7D32" stroke="#2E7D32" strokeWidth="2"/>
          <rect x="12" y="8" width="24" height="4" rx="1" fill="#66BB6A"/>
          <rect x="14" y="18" width="8" height="6" fill="white"/>
          <rect x="26" y="18" width="8" height="6" fill="white"/>
          <rect x="14" y="28" width="8" height="6" fill="white"/>
          <rect x="26" y="28" width="8" height="6" fill="white"/>
        </svg>
      ),
      href: 'https://rentmanager.com',
      external: true,
      color: 'hover:bg-green-50 border-green-200'
    },
    {
      name: 'Asana',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="10" fill="#F06A6A"/>
          <circle cx="14" cy="14" r="6" fill="#F06A6A"/>
          <circle cx="34" cy="14" r="6" fill="#F06A6A"/>
          <circle cx="14" cy="34" r="6" fill="#F06A6A"/>
          <circle cx="34" cy="34" r="6" fill="#F06A6A"/>
        </svg>
      ),
      href: 'https://app.asana.com',
      external: true,
      color: 'hover:bg-pink-50 border-pink-200'
    }
  ]


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
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
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
                  <span className="whitespace-nowrap">{realEstateTasks.filter(t => !t.isChecked).length}/{realEstateTasks.length}</span>{' '}
                  <span className="whitespace-nowrap">Real Estate</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <div className="text-gray-600">
                  <span className="whitespace-nowrap">{venturesTasks.filter(t => !t.isChecked).length}/{venturesTasks.length}</span>{' '}
                  <span>Venture</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-3xl mx-auto">
          {apps.map((app) => (
            app.external ? (
              <a
                key={app.name}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`bg-white rounded-xl shadow-sm border-2 p-6 flex flex-col items-center justify-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${app.color}`}
              >
                <div className="mb-3 transition-transform duration-300 hover:scale-110">{app.icon}</div>
                <span className="text-sm font-medium text-gray-900">{app.name}</span>
              </a>
            ) : (
              <Link
                key={app.name}
                href={app.href}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 flex flex-col items-center justify-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${app.color}`}
              >
                <div className="mb-3 transition-transform duration-300 hover:scale-110">{app.icon}</div>
                <span className="text-sm font-medium text-gray-900">{app.name}</span>
              </Link>
            )
          ))}
                  </div>

        {/* Business Division Status - First Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Asset Management */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Asset Management</h3>
              <div className="text-xs text-gray-500">{assetChecklistComplete}/7</div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(assetChecklistComplete / 7) * 100}%` }}
              />
          </div>

            <div className="space-y-3">
              <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-booksClosedOut' ? 'bg-green-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={assetStatus.booksClosedOut}
                  onChange={() => handleAssetStatusChange('booksClosedOut')}
                  className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
                />
                <span className={`text-sm transition-all duration-300 ${assetStatus.booksClosedOut ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  <strong>{priorMonth}</strong> books closed
                </span>
                {justCompletedTask === 'asset-booksClosedOut' && (
                  <span className="text-green-500 ml-auto animate-ping">✓</span>
                )}
              </label>
              
              <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-rentsCollected' ? 'bg-green-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={assetStatus.rentsCollected}
                  onChange={() => handleAssetStatusChange('rentsCollected')}
                  className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
                />
                <span className={`text-sm transition-all duration-300 ${assetStatus.rentsCollected ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  All <strong>{currentMonth}</strong> rents collected
                </span>
                {justCompletedTask === 'asset-rentsCollected' && (
                  <span className="text-green-500 ml-auto animate-ping">✓</span>
                )}
              </label>
              
              <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-loansPaymentsMade' ? 'bg-green-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={assetStatus.loansPaymentsMade}
                  onChange={() => handleAssetStatusChange('loansPaymentsMade')}
                  className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
                />
                <span className={`text-sm transition-all duration-300 ${assetStatus.loansPaymentsMade ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  All loans paid
                </span>
                {justCompletedTask === 'asset-loansPaymentsMade' && (
                  <span className="text-green-500 ml-auto animate-ping">✓</span>
                )}
              </label>
              
              <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-vendorsPaymentsMade' ? 'bg-green-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={assetStatus.vendorsPaymentsMade}
                  onChange={() => handleAssetStatusChange('vendorsPaymentsMade')}
                  className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
                />
                <span className={`text-sm transition-all duration-300 ${assetStatus.vendorsPaymentsMade ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  All vendors paid
                </span>
                {justCompletedTask === 'asset-vendorsPaymentsMade' && (
                  <span className="text-green-500 ml-auto animate-ping">✓</span>
                )}
              </label>
              
              <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-propertyTaxesPaid' ? 'bg-green-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={assetStatus.propertyTaxesPaid}
                  onChange={() => handleAssetStatusChange('propertyTaxesPaid')}
                  className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
                />
                <span className={`text-sm transition-all duration-300 ${assetStatus.propertyTaxesPaid ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  All property taxes paid
                </span>
                {justCompletedTask === 'asset-propertyTaxesPaid' && (
                  <span className="text-green-500 ml-auto animate-ping">✓</span>
                )}
              </label>
              
              <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-insurancePoliciesActive' ? 'bg-green-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={assetStatus.insurancePoliciesActive}
                  onChange={() => handleAssetStatusChange('insurancePoliciesActive')}
                  className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
                />
                <span className={`text-sm transition-all duration-300 ${assetStatus.insurancePoliciesActive ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  All{' '}
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1rD7CuJ6RqhSPBdROHhYxVjO386wdDWLVRvMDq5pItck/edit?gid=1798179087#gid=1798179087"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    insurance policies
                  </a>
                  {' '}active
                </span>
                {justCompletedTask === 'asset-insurancePoliciesActive' && (
                  <span className="text-green-500 ml-auto animate-ping">✓</span>
                )}
              </label>
              
              <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-entitiesRenewed' ? 'bg-green-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={assetStatus.entitiesRenewed}
                  onChange={() => handleAssetStatusChange('entitiesRenewed')}
                  className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
                />
                <span className={`text-sm transition-all duration-300 ${assetStatus.entitiesRenewed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  All{' '}
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1rD7CuJ6RqhSPBdROHhYxVjO386wdDWLVRvMDq5pItck/edit?gid=0#gid=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    entities
                  </a>
                  {' '}renewed
                </span>
                {justCompletedTask === 'asset-entitiesRenewed' && (
                  <span className="text-green-500 ml-auto animate-ping">✓</span>
                )}
              </label>
            </div>
          </div>

          {/* Real Estate */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Real Estate</h3>
              <div className="text-xs text-gray-500">{realEstateTasksComplete}/{realEstateTasks.length}</div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: realEstateTasks.length > 0 ? `${(realEstateTasksComplete / realEstateTasks.length) * 100}%` : '0%' }}
              />
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {realEstateTasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 group cursor-move ${
                    justCompletedTask === task.id ? 'bg-blue-50' : ''
                  } ${
                    dragOverIndex === index && draggedTask?.division === 'real-estate-development' ? 'border-t-2 border-blue-500' : ''
                  } ${
                    draggedTask?.id === task.id ? 'dragging' : ''
                  }`}
                  draggable={editingTaskId !== task.id}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index, realEstateTasks, 'real-estate-development')}>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                    <circle cx="4" cy="4" r="1.5" />
                    <circle cx="4" cy="8" r="1.5" />
                    <circle cx="4" cy="12" r="1.5" />
                    <circle cx="12" cy="4" r="1.5" />
                    <circle cx="12" cy="8" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                  </svg>
                  <input
                    type="checkbox"
                    checked={task.isChecked}
                    onChange={() => handleTaskCheck(task.id, task.isChecked, 'real-estate-development')}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 transition-transform hover:scale-110 cursor-pointer"
                  />
                  {editingTaskId === task.id ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleEditTask(task.id, 'real-estate-development', editText)
                      }}
                      className="flex-1 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 text-sm px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                        onBlur={() => handleEditTask(task.id, 'real-estate-development', editText)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setEditingTaskId(null)
                            setEditText('')
                          }
                        }}
                      />
                    </form>
                  ) : (
                    <span 
                      onClick={() => startEditingTask(task.id, task.title)}
                      className={`text-sm transition-all duration-300 flex-1 cursor-pointer hover:text-blue-600 ${task.isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                    >
                      {task.title}
                    </span>
                  )}
                  {justCompletedTask === task.id && (
                    <span className="text-blue-500 animate-ping">✓</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeleteTask(task.id, 'real-estate-development')
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {realEstateTasks.length < 10 && (
                addingTask === 'real-estate-development' ? (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAddTask('real-estate-development')
                    }}
                    className="flex items-center gap-2 mt-2"
                  >
                    <input
                      type="text"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Add objective..."
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="text-green-600 hover:text-green-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingTask(null)
                        setNewText('')
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingTask('real-estate-development')}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-all duration-200 mt-2"
                  >
                    + Add objective
                  </button>
                )
              )}
            </div>
          </div>

          {/* Ventures */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ventures</h3>
              <div className="text-xs text-gray-500">{venturesTasksComplete}/{venturesTasks.length}</div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: venturesTasks.length > 0 ? `${(venturesTasksComplete / venturesTasks.length) * 100}%` : '0%' }}
              />
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {venturesTasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 group cursor-move ${
                    justCompletedTask === task.id ? 'bg-purple-50' : ''
                  } ${
                    dragOverIndex === index && draggedTask?.division === 'ventures' ? 'border-t-2 border-purple-500' : ''
                  } ${
                    draggedTask?.id === task.id ? 'dragging' : ''
                  }`}
                  draggable={editingTaskId !== task.id}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index, venturesTasks, 'ventures')}>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                    <circle cx="4" cy="4" r="1.5" />
                    <circle cx="4" cy="8" r="1.5" />
                    <circle cx="4" cy="12" r="1.5" />
                    <circle cx="12" cy="4" r="1.5" />
                    <circle cx="12" cy="8" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                  </svg>
                  <input
                    type="checkbox"
                    checked={task.isChecked}
                    onChange={() => handleTaskCheck(task.id, task.isChecked, 'ventures')}
                    className="h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 transition-transform hover:scale-110 cursor-pointer"
                  />
                  {editingTaskId === task.id ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleEditTask(task.id, 'ventures', editText)
                      }}
                      className="flex-1 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 text-sm px-2 py-1 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        autoFocus
                        onBlur={() => handleEditTask(task.id, 'ventures', editText)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setEditingTaskId(null)
                            setEditText('')
                          }
                        }}
                      />
                    </form>
                  ) : (
                    <span 
                      onClick={() => startEditingTask(task.id, task.title)}
                      className={`text-sm transition-all duration-300 flex-1 cursor-pointer hover:text-purple-600 ${task.isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                    >
                      {task.title}
                    </span>
                  )}
                  {justCompletedTask === task.id && (
                    <span className="text-purple-500 animate-ping">✓</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeleteTask(task.id, 'ventures')
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {venturesTasks.length < 10 && (
                addingTask === 'ventures' ? (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAddTask('ventures')
                    }}
                    className="flex items-center gap-2 mt-2"
                  >
                    <input
                      type="text"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Add objective..."
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="text-green-600 hover:text-green-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingTask(null)
                        setNewText('')
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingTask('ventures')}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-all duration-200 mt-2"
                  >
                    + Add objective
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Business Division Status - Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tax Filings */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tax Filings</h3>
              <div className="text-xs text-gray-500">
                {taxReturns.filter(t => t.isFiled).length + (propertyTaxH1Paid ? 1 : 0) + (propertyTaxH2Paid ? 1 : 0)}/{taxReturns.length + 2}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: taxReturns.length + 2 > 0 
                    ? `${((taxReturns.filter(t => t.isFiled).length + (propertyTaxH1Paid ? 1 : 0) + (propertyTaxH2Paid ? 1 : 0)) / (taxReturns.length + 2)) * 100}%` 
                    : '0%' 
                }}
              />
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {taxReturns.map(taxReturn => (
                <label key={taxReturn.id} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === `tax-${taxReturn.id}` ? 'bg-indigo-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={taxReturn.isFiled}
                    onChange={() => handleTaxReturnChange(taxReturn.id, taxReturn.isFiled)}
                    className="h-5 w-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 transition-transform hover:scale-110"
                  />
                  <span className={`text-sm transition-all duration-300 flex-1 ${taxReturn.isFiled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {taxReturn.year} {taxReturn.country} Tax Return Filed - {taxReturn.entity}
                  </span>
                  {justCompletedTask === `tax-${taxReturn.id}` && (
                    <span className="text-indigo-500 animate-ping">✓</span>
                  )}
                </label>
              ))}
              
              {/* Property Tax Items */}
              <div className="border-t border-gray-100 mt-4 pt-4">
                <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'property-tax-h1' ? 'bg-indigo-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={propertyTaxH1Paid}
                    onChange={() => handlePropertyTaxChange('H1')}
                    className="h-5 w-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 transition-transform hover:scale-110"
                  />
                  <span className={`text-sm transition-all duration-300 flex-1 ${propertyTaxH1Paid ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    All {currentDate.getFullYear()} H1 Property Taxes Paid
                  </span>
                  {justCompletedTask === 'property-tax-h1' && (
                    <span className="text-indigo-500 animate-ping">✓</span>
                  )}
                </label>
                
                <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'property-tax-h2' ? 'bg-indigo-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={propertyTaxH2Paid}
                    onChange={() => handlePropertyTaxChange('H2')}
                    className="h-5 w-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 transition-transform hover:scale-110"
                  />
                  <span className={`text-sm transition-all duration-300 flex-1 ${propertyTaxH2Paid ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    All {currentDate.getFullYear()} H2 Property Taxes Paid
                  </span>
                  {justCompletedTask === 'property-tax-h2' && (
                    <span className="text-indigo-500 animate-ping">✓</span>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}