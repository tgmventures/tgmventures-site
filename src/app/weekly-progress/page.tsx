'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, functions } from '@/lib/firebase'
import { httpsCallable } from 'firebase/functions'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
      
      loadCurrentWeekData()
      // loadWeeklyHistory() // Removed for now, focusing on current week
    }
  }, [user])

  const getWeekDateRange = (weeksAgo: number = 0) => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysFromSaturday = (dayOfWeek + 1) % 7
    
    const end = new Date(now)
    end.setDate(end.getDate() - daysFromSaturday - (weeksAgo * 7))
    end.setHours(23, 59, 59, 999)
    
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    
    return { start, end }
  }

  const loadCurrentWeekData = async () => {
    console.log('=== loadCurrentWeekData called ===')
    
    setLoading(true)
    setError(null)
    try {
      const { start, end } = getWeekDateRange()
      
      // Always try to get real data first
      const reportFunction = httpsCallable(functions, 'getWeeklyReportData')
      try {
        const result = await reportFunction({ 
          startDate: start.toISOString(), 
          endDate: end.toISOString() 
        })
        const data = result.data as any
        
        console.log('Received data:', data)
        
        // Set completed objectives
        setCompletedObjectives(data.completedObjectives || [])
        
        // Set added objectives
        setAddedObjectives(data.addedObjectives || [])
        
        // Process team member summaries
        const membersByEmail = {} as { [email: string]: TeamMemberSummary }
        
        // Group completed objectives by team member
        ;(data.completedObjectives || []).forEach((obj: CompletedObjective) => {
          const email = obj.completedByEmail
          if (!membersByEmail[email]) {
            membersByEmail[email] = {
              email,
              name: obj.completedBy,
              completedCount: 0,
              objectives: []
            }
          }
          membersByEmail[email].completedCount++
          membersByEmail[email].objectives.push(obj)
        })
        
        const membersList = Object.values(membersByEmail).sort((a, b) => b.completedCount - a.completedCount)
        setTeamMembers(membersList)
        
        // Set total stats
        setTotalStats({
          completed: data.completedObjectives?.length || 0,
          added: data.addedObjectives?.length || 0,
          activeMembers: membersList.length
        })
        
      } catch (funcError: any) {
        console.error('Firebase function error:', funcError)
        
        // If auth error, show a helpful message
        if (funcError.message?.includes('@tgmventures.com')) {
          setError('Access restricted to @tgmventures.com email addresses')
        } else {
          throw funcError
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
          // In production, call the actual Firebase function
          const reportFunction = httpsCallable(functions, 'getWeeklyReport')
          const result = await reportFunction({ 
            startDate: start.toISOString(), 
            endDate: end.toISOString() 
          })
          
          const data = result.data as any
          history.push({
            weekStart: start.toLocaleDateString(),
            completed: data.totalCompleted || 0,
            added: data.totalAdded || 0
          })
        }
      } catch (error) {
        console.error(`Error loading week ${i} data:`, error)
      }
    }
    
    setWeeklyHistory(history)
  }

  const fetchEmailPreview = async () => {
    try {
      const { start, end } = getWeekDateRange()
      
      const previewFunction = httpsCallable(functions, 'getWeeklyReportEmailPreview')
      const result = await previewFunction({ 
        startDate: start.toISOString(), 
        endDate: end.toISOString() 
      })
      
      const data = result.data as any
      setEmailPreview(data.html)
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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Your Week at TGM Ventures</h1>
          <p className="text-lg text-gray-600">Track progress, celebrate wins, and stay aligned as a team</p>
        </div>

        {/* Loading State */}
        {loading_ && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}
        
        {/* Current Week Content */}
        {!loading_ && !error && (
          <>
            {/* This Week's Summary */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">This Week's Progress</h2>
                <p className="text-purple-100">
                  {new Date(getWeekDateRange().start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
                  {new Date(getWeekDateRange().end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm text-center">
                  <p className="text-5xl font-bold mb-2">{totalStats.completed}</p>
                  <p className="text-purple-100">Objectives Completed</p>
                </div>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm text-center">
                  <p className="text-5xl font-bold mb-2">{totalStats.added}</p>
                  <p className="text-purple-100">New Objectives</p>
                </div>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm text-center">
                  <p className="text-5xl font-bold mb-2">{totalStats.activeMembers}</p>
                  <p className="text-purple-100">Active Team Members</p>
                </div>
              </div>
            </div>

            {/* Completed Objectives */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Objectives Completed This Week</h2>
              {completedObjectives.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="space-y-4">
                    {completedObjectives.map((obj, index) => (
                      <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{obj.title}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {obj.completedBy}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {obj.division ? obj.division.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : obj.type}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(obj.completedAt.seconds ? obj.completedAt.seconds * 1000 : obj.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No objectives completed this week yet.</p>
              )}
            </div>

            {/* Newly Added Objectives */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">New Objectives Added This Week</h2>
              {addedObjectives.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="space-y-4">
                    {addedObjectives.map((obj, index) => (
                      <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{obj.title}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {obj.division ? obj.division.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : obj.type}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(obj.createdAt.seconds ? obj.createdAt.seconds * 1000 : obj.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No new objectives added this week.</p>
              )}
            </div>

            {/* Team Recognition */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Recognition</h2>
              {teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teamMembers.map((member) => (
                    <div key={member.email} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-purple-600">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{member.name}</h3>
                          <p className="text-sm text-gray-500">{member.email.split('@')[0]}</p>
                        </div>
                      </div>
                      <div className="text-center mb-4">
                        <p className="text-3xl font-bold text-purple-600">{member.completedCount}</p>
                        <p className="text-sm text-gray-600">Objectives Completed</p>
                      </div>
                      {member.objectives.length > 0 && (
                        <div className="border-t pt-4">
                          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Recent Achievements</p>
                          <ul className="space-y-1">
                            {member.objectives.slice(0, 3).map((obj, idx) => (
                              <li key={idx} className="text-sm text-gray-600 truncate">• {obj.title}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No team activity this week yet.</p>
              )}
            </div>

          </>
        )}
        
        {/* Email Preview Modal */}
        {showEmailPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEmailPreview(false)}>
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Email Preview</h3>
                <button
                  onClick={() => setShowEmailPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <div 
                  className="border border-gray-200 rounded-lg" 
                  dangerouslySetInnerHTML={{ __html: emailPreview }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}