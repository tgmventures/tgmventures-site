'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { initializeUserData } from '@/lib/firebase/user-preferences'
import { getWeeklyReportDataDirect, generateEnhancedEmailHTML, getNewObjectivesThisWeek } from '@/lib/firebase/weekly-report-direct'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface WeeklyData {
  weekStart: string
  completed: number
  added: number
}

interface CompletedObjective {
  type: string
  division?: string
  card?: string
  title: string
  completedBy: string
  completedByEmail: string
  completedAt: any
}

interface AddedObjective {
  type: string
  division?: string
  title: string
  createdAt: any
  createdBy?: string
}

interface TeamMemberSummary {
  email: string
  name: string
  photoURL?: string
  completedCount: number
  objectives: CompletedObjective[]
}

export default function WeeklyProgressPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [completedObjectives, setCompletedObjectives] = useState<CompletedObjective[]>([])
  const [addedObjectives, setAddedObjectives] = useState<AddedObjective[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([])
  const [totalStats, setTotalStats] = useState({ completed: 0, added: 0, activeMembers: 0 })
  const [previousWeeksExpanded, setPreviousWeeksExpanded] = useState(false)
  const [loading_, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [emailPreview, setEmailPreview] = useState<string>('')
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyData[]>([])
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0) // 0 = current week, 1 = last week, etc.
  const [showWeekNavigation, setShowWeekNavigation] = useState(false)

  // Check if we're in development mode
  const isDevelopment = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || process.env.NODE_ENV === 'development')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      console.log('User authenticated:', user.email)
      console.log('Loading weekly progress data...')
      console.log('Is development mode?', isDevelopment)
      
      // Clear any previous errors when user changes
      setError(null)
      
      // Initialize user data in Firestore if needed
      const initializeAndLoad = async () => {
        try {
          if (user.email?.endsWith('@tgmventures.com')) {
            await initializeUserData(user.uid, user.email || '', user.displayName || '', user.photoURL || undefined)
            console.log('User data initialized in Firestore')
          }
          loadCurrentWeekData()
        } catch (error) {
          console.error('Error initializing user data:', error)
          setError('Failed to initialize user data')
        }
      }
      
      initializeAndLoad()
      // loadWeeklyHistory() // Removed for now, focusing on current week
    }
  }, [user])
  
  // Reload data when week offset changes
  useEffect(() => {
    if (user && currentWeekOffset !== undefined) {
      loadCurrentWeekData()
    }
  }, [currentWeekOffset, user])

  const getWeekDateRange = (weeksAgo: number = 0) => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    
    // Our week runs Saturday to Friday
    // Find the most recent Saturday
    let daysSinceSaturday = dayOfWeek === 6 ? 0 : (dayOfWeek + 1)
    
    const start = new Date(now)
    start.setDate(start.getDate() - daysSinceSaturday - (weeksAgo * 7))
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(start)
    end.setDate(end.getDate() + 6) // Friday is 6 days after Saturday
    end.setHours(23, 59, 59, 999)
    
    console.log('Week calculation:', {
      today: now.toDateString(),
      dayOfWeek,
      daysSinceSaturday,
      weeksAgo,
      calculatedStart: start.toDateString(),
      calculatedEnd: end.toDateString()
    })
    
    return { start, end }
  }

  const loadCurrentWeekData = async () => {
    console.log('=== loadCurrentWeekData called ===')
    
    setLoading(true)
    setError(null)
    try {
      const { start, end } = getWeekDateRange(currentWeekOffset)
      
      // Ensure user authentication token is fresh
      if (user) {
        try {
          const token = await user.getIdToken(true) // Force refresh token
          console.log('Authentication token refreshed successfully')
          console.log('User email:', user.email)
          console.log('Token exists:', !!token)
        } catch (tokenError) {
          console.error('Failed to refresh authentication token:', tokenError)
          setError('Authentication token expired. Please sign in again.')
          return
        }
      } else {
        console.error('No user found, redirecting to login')
        router.push('/login')
        return
      }
      
      // Get data directly from Firestore instead of using Firebase Functions
      try {
        const data = await getWeeklyReportDataDirect(start, end)
        
        console.log('Received data:', data)
        
        // Transform the data to match the expected format
        const completedTasks: CompletedObjective[] = []
        Object.entries(data.divisions).forEach(([divisionId, division]) => {
          division.completedTasks.forEach(task => {
            // Handle different data structures for completedBy
            let completedByName = 'Team Member'
            let completedByEmail = 'unknown@tgmventures.com'
            
            if (typeof task.completedBy === 'string') {
              // If completedBy is just an email string
              completedByEmail = task.completedBy
              completedByName = task.completedByName || task.completedBy
            } else if (task.completedBy && typeof task.completedBy === 'object') {
              // If completedBy is an object
              const completedByObj = task.completedBy as any
              completedByEmail = completedByObj.email || 'unknown@tgmventures.com'
              completedByName = completedByObj.name || completedByObj.email || 'Team Member'
            } else if ((task as any).completedByEmail) {
              // Fallback to separate fields
              completedByEmail = (task as any).completedByEmail
              completedByName = (task as any).completedByName || (task as any).completedByEmail
            }
            
            completedTasks.push({
              type: divisionId.startsWith('venture-') ? 'venture' : divisionId.startsWith('asset-') ? 'asset' : divisionId === 'tax-filings' ? 'tax' : 'division',
              division: division.name,
              card: division.name,
              title: task.title || (task as any).task || 'Untitled Task',
              completedBy: completedByName,
              completedByEmail: completedByEmail,
              completedAt: task.completedAt
            })
          })
        })
        
        // Set completed objectives
        setCompletedObjectives(completedTasks)
        
        // Get new objectives added this week
        const newObjectivesData = await getNewObjectivesThisWeek(start, end)
        const formattedNewObjectives: AddedObjective[] = newObjectivesData.map(obj => ({
          type: 'objective',
          division: obj.category,
          title: obj.task,
          createdAt: new Date(),
          createdBy: obj.createdBy
        }))
        setAddedObjectives(formattedNewObjectives)
        
        // Process team member summaries
        const membersByEmail = {} as { [email: string]: TeamMemberSummary }
        
        // Group completed objectives by team member
        completedTasks.forEach((obj: CompletedObjective) => {
          const email = obj.completedByEmail
          
          if (!membersByEmail[email]) {
            membersByEmail[email] = {
              email,
              name: obj.completedBy,
              photoURL: undefined, // We'll fetch this separately if needed
              completedCount: 0,
              objectives: []
            }
          }
          membersByEmail[email].completedCount++
          membersByEmail[email].objectives.push(obj)
        })
        
        const membersList = Object.values(membersByEmail).sort((a, b) => b.completedCount - a.completedCount)
        
        // Fetch user photos from Firestore users collection
        const membersWithPhotos = await Promise.all(
          membersList.map(async (member) => {
            try {
              // First check if this is the current user
              if (user && member.email === user.email) {
                console.log(`Current user (${user.email}) photoURL: ${user.photoURL}`)
                return {
                  ...member,
                  name: user.displayName || member.name,
                  photoURL: user.photoURL || undefined
                }
              }
              
              // Try to get user data from Firestore - users are stored by UID under organizations
              const usersSnapshot = await getDocs(collection(db, 'organizations/tgm-ventures/users'))
              const userDoc = usersSnapshot.docs.find(doc => {
                const userData = doc.data()
                return userData.email === member.email
              })
              
              if (userDoc) {
                const userData = userDoc.data()
                console.log(`Firestore data for ${member.email}:`, userData)
                return {
                  ...member,
                  photoURL: userData.photoURL || userData.photoUrl || undefined
                }
              }
              
              console.log(`No user doc found for ${member.email}`)
              return member
            } catch (error) {
              console.error(`Error fetching user data for ${member.email}:`, error)
              return member
            }
          })
        )
        
        console.log('Final team members with photos:', membersWithPhotos.map(m => ({
          name: m.name,
          email: m.email,
          photoURL: m.photoURL
        })))
        setTeamMembers(membersWithPhotos)
        
        // Set total stats
        setTotalStats({
          completed: completedTasks.length,
          added: formattedNewObjectives.length,
          activeMembers: membersList.length
        })
        
      } catch (directError: any) {
        console.error('Firestore access error:', directError)
        console.error('Error details:', {
          code: directError.code,
          message: directError.message
        })
        
        // Handle Firestore permission errors
        if (directError.code === 'permission-denied') {
          setError('Permission denied. Please make sure you are logged in with a @tgmventures.com email.')
        } else {
          throw directError
        }
      }
    } catch (error: any) {
      console.error('Error loading current week data:', error)
      setError(error.message || 'Failed to load weekly progress')
    } finally {
      setLoading(false)
    }
  }

  // Remove last week comparison - we're focusing on this week's achievements only
  /*
  const loadLastWeekComparison = async (currentMembers: TeamMember[]) => {
    try {
      const { start, end } = getWeekDateRange(1) // 1 week ago
      
      let data: any
      
      // In development, always use mock data
      if (window.location.hostname === 'localhost' || process.env.NODE_ENV === 'development') {
        data = {
          totalCompleted: 10,
          completedByUser: [
            { email: 'john@example.com', count: 4, completed: 4 },
            { email: 'jane@example.com', count: 3, completed: 3 },
            { email: 'bob@example.com', count: 3, completed: 3 }
          ]
        }
      } else {
        // In production, call the actual Firebase function
        const reportFunction = httpsCallable(functions, 'getWeeklyReport')
        const result = await reportFunction({ 
          startDate: start.toISOString(), 
          endDate: end.toISOString() 
        })
        data = result.data as any
      }
      
      // Update team members with last week's data
      const updatedMembers = currentMembers.map(member => {
        const lastWeekData = (data.completedByUser || []).find((u: any) => u.email === member.email)
        return {
          ...member,
          completedLastWeek: lastWeekData?.completed || lastWeekData?.count || 0
        }
      })
      
      setTeamMembers(updatedMembers)
      
      // Calculate weekly growth
      if (currentWeekData) {
        const growth = data.totalCompleted > 0 
          ? Math.round(((currentWeekData.totalCompleted - data.totalCompleted) / data.totalCompleted) * 100)
          : 0
        setCurrentWeekData((prev: any) => ({ ...prev, weeklyGrowth: growth }))
      }
    } catch (error) {
      console.error('Error loading last week comparison:', error)
    }
  }
  */

  const loadWeeklyHistory = async () => {
    const history: WeeklyData[] = []
    
    // Load last 12 weeks
    for (let i = 11; i >= 0; i--) {
      try {
        const { start, end } = getWeekDateRange(i)
        
        // In development, always use mock data
        if (window.location.hostname === 'localhost' || process.env.NODE_ENV === 'development') {
          history.push({
            weekStart: start.toLocaleDateString(),
            completed: Math.floor(Math.random() * 15) + 5,
            added: Math.floor(Math.random() * 10) + 2
          })
        } else {
          // In production, use actual data
          history.push({
            weekStart: start.toLocaleDateString(),
            completed: 0,
            added: 0
          })
        }
      } catch (error) {
        console.error(`Error loading week ${i} data:`, error)
      }
    }
    
    setWeeklyHistory(history)
  }

  const handleSignOutAndRetry = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('tgm_user')
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const fetchEmailPreview = async () => {
    try {
      const { start, end } = getWeekDateRange(currentWeekOffset)
      
      // Get weekly report data
      const reportData = await getWeeklyReportDataDirect(start, end)
      
      // Generate the enhanced email HTML
      // This function will fetch outstanding objectives, new objectives, etc.
      const html = await generateEnhancedEmailHTML(reportData)
      
      setEmailPreview(html)
      setShowEmailPreview(true)
    } catch (error: any) {
      console.error('Error fetching email preview:', error)
      setError(error.message || 'Failed to fetch email preview')
    }
  }


  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4">
                <Image
                  src="/images/tgm-logo-icon.png"
                  alt="TGM"
                  width={32}
                  height={32}
                  className="hover:opacity-80 transition-opacity"
                />
              </Link>
              <Link href="/weekly-progress" className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors">
                Weekly Progress
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchEmailPreview}
                className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Preview Email
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">

        {/* Loading State */}
        {loading_ && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error: {error}</p>
            {error.includes('Authentication') && (
              <button
                onClick={handleSignOutAndRetry}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Sign Out and Try Again
              </button>
            )}
          </div>
        )}
        
        {/* Current Week Content */}
        {!loading_ && !error && (
          <>
            {/* Week Navigation */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentWeekOffset === 0 ? 'Current Week' : `${currentWeekOffset} Week${currentWeekOffset > 1 ? 's' : ''} Ago`}
                </h2>
                <button
                  onClick={() => setShowWeekNavigation(!showWeekNavigation)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span className="text-sm">Other Weeks</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform ${showWeekNavigation ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {/* Week Selection Grid */}
              {showWeekNavigation && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    {[0, 1, 2, 3, 4].map((offset) => {
                      const { start, end } = getWeekDateRange(offset)
                      const isSelected = currentWeekOffset === offset
                      return (
                        <button
                          key={offset}
                          onClick={() => {
                            setCurrentWeekOffset(offset)
                            setShowWeekNavigation(false)
                          }}
                          className={`p-4 rounded-lg text-center transition-all ${
                            isSelected 
                              ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="font-semibold text-sm mb-1">
                            {offset === 0 ? 'Current Week' : offset === 1 ? 'Last Week' : `${offset} Weeks Ago`}
                          </div>
                          <div className="text-xs opacity-80">
                            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                            {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  
                  {/* Navigation Arrows for older weeks */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t">
                    <button
                      onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 1))}
                      disabled={currentWeekOffset === 0}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-600">
                      Navigate to {currentWeekOffset > 5 ? 'older' : 'other'} weeks
                    </span>
                    <button
                      onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* This Week's Summary */}
            <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl shadow-lg p-8 mb-8 text-white">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {currentWeekOffset === 0 ? "This Week's Progress" : `Week of ${new Date(getWeekDateRange(currentWeekOffset).start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
                </h2>
                <p className="text-blue-100">
                  {new Date(getWeekDateRange(currentWeekOffset).start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
                  {new Date(getWeekDateRange(currentWeekOffset).end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm text-center">
                  <p className="text-5xl font-bold mb-2">{totalStats.completed}</p>
                  <p className="text-blue-100">Objectives Completed</p>
                </div>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm text-center">
                  <p className="text-5xl font-bold mb-2">{totalStats.added}</p>
                  <p className="text-blue-100">New Objectives</p>
                </div>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm text-center">
                  <p className="text-5xl font-bold mb-2">{totalStats.activeMembers}</p>
                  <p className="text-blue-100">Active Team Members</p>
                </div>
              </div>
            </div>

            {/* Weekly Activity by Card */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Weekly Activity {currentWeekOffset === 0 ? '' : currentWeekOffset === 1 ? '(Last Week)' : `(${currentWeekOffset} Weeks Ago)`}
              </h2>
              {(() => {
                // Combine all activities by card
                const activityByCard: { [cardName: string]: { completed: any[], added: any[] } } = {}
                
                // Add completed objectives
                completedObjectives.forEach(obj => {
                  const cardName = obj.division || obj.card || 'Other'
                  if (!activityByCard[cardName]) {
                    activityByCard[cardName] = { completed: [], added: [] }
                  }
                  activityByCard[cardName].completed.push(obj)
                })
                
                // Add new objectives
                addedObjectives.forEach(obj => {
                  const cardName = obj.division || 'Other'
                  if (!activityByCard[cardName]) {
                    activityByCard[cardName] = { completed: [], added: [] }
                  }
                  activityByCard[cardName].added.push(obj)
                })
                
                const hasActivity = Object.keys(activityByCard).length > 0
                
                return hasActivity ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(activityByCard).map(([cardName, activities]) => (
                      <div key={cardName} className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{cardName}</h3>
                        <ul className="space-y-2">
                          {/* Show completed objectives first */}
                          {activities.completed.map((obj, index) => (
                            <li key={`completed-${index}`} className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-gray-700">{obj.title}</span>
                            </li>
                          ))}
                          {/* Then show new objectives */}
                          {activities.added.map((obj, index) => (
                            <li key={`added-${index}`} className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span className="text-gray-700">{obj.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No activity recorded this week.</p>
                )
              })()}
            </div>

            {/* Team Member Accomplishments */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Member Accomplishments</h2>
              {teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teamMembers.map((member) => {
                    // Format name as First L.
                    const nameParts = member.name.split(' ')
                    const displayName = nameParts.length > 1 
                      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
                      : member.name
                    
                    return (
                      <div key={member.email} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                        {/* Gradient Header */}
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                        
                        <div className="p-6">
                          {/* Two Column Layout */}
                          <div className="flex items-center gap-6 mb-6">
                            {/* Left Column: Profile and Name */}
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                                  {member.photoURL ? (
                                    <Image
                                      src={member.photoURL}
                                      alt={member.name}
                                      width={64}
                                      height={64}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        const fallback = parent?.querySelector('.fallback-initials');
                                        if (fallback) fallback.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <div className={`fallback-initials w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ${member.photoURL ? 'hidden' : ''}`}>
                                    <span className="text-xl font-bold text-white">
                                      {member.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                </div>
                                {/* Achievement Badge */}
                                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </div>
                              </div>
                              <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
                            </div>
                            
                            {/* Right Column: Achievement Count */}
                            <div className="ml-auto bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl px-4 py-3 text-center" style={{ minWidth: '140px', maxWidth: '140px' }}>
                              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                {member.completedCount}
                              </p>
                              <p className="text-xs font-medium text-blue-700">
                                Objective{member.completedCount !== 1 ? 's' : ''} Completed This Week
                              </p>
                            </div>
                          </div>
                          
                          {/* Achievements List */}
                          {member.objectives.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Key Achievements
                              </h4>
                              <div className="space-y-2">
                                {member.objectives.slice(0, 3).map((obj, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 leading-relaxed">
                                      {obj.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {member.objectives.length > 3 && (
                                <p className="text-xs text-gray-500 text-center mt-3">
                                  +{member.objectives.length - 3} more achievement{member.objectives.length - 3 !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic">No team activity this week yet.</p>
              )}
            </div>

          </>
        )}
        
        {/* Email Preview Modal - Styled like an email client */}
        {showEmailPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEmailPreview(false)}>
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Email Client Header */}
              <div className="bg-gray-50 border-b border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Email Preview</h3>
                  <button
                    onClick={() => setShowEmailPreview(false)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Email metadata */}
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="text-gray-500 font-medium w-20">From:</span>
                    <span className="text-gray-900">TGM Ventures &lt;progress@tgmventures.com&gt;</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 font-medium w-20">To:</span>
                    <span className="text-gray-900">team@tgmventures.com</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 font-medium w-20">Subject:</span>
                    <span className="text-gray-900 font-medium">
                      Weekly Progress Report - {new Date(getWeekDateRange(currentWeekOffset).end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 font-medium w-20">Date:</span>
                    <span className="text-gray-900">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at 11:00 AM
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Email Body */}
              <div className="flex-1 overflow-auto bg-gray-100 p-8">
                <div className="max-w-4xl mx-auto">
                  <div 
                    className="bg-white rounded-lg"
                    dangerouslySetInnerHTML={{ __html: emailPreview }}
                    style={{ 
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                      minHeight: '600px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}