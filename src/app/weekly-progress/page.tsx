'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, functions } from '@/lib/firebase'
import { httpsCallable } from 'firebase/functions'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface WeeklyData {
  weekStart: string
  completed: number
  added: number
}

interface TeamMember {
  email: string
  name: string
  completedThisWeek: number
  addedThisWeek: number
  completedLastWeek: number
  topAchievements: string[]
}

export default function WeeklyProgressPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [currentWeekData, setCurrentWeekData] = useState<any>(null)
  const [previousWeeksExpanded, setPreviousWeeksExpanded] = useState(false)
  const [loading_, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [emailPreview, setEmailPreview] = useState<string>('')
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyData[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadCurrentWeekData()
      loadWeeklyHistory()
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
    setLoading(true)
    setError(null)
    try {
      const { start, end } = getWeekDateRange()
      const reportFunction = httpsCallable(functions, 'getWeeklyReport')
      const result = await reportFunction({ 
        startDate: start.toISOString(), 
        endDate: end.toISOString() 
      })
      
      const data = result.data as any
      
      // Process team member data
      const members: TeamMember[] = (data.completedByUser || []).map((user: any) => ({
        email: user.email,
        name: user.name,
        completedThisWeek: user.completed || user.count || 0,
        addedThisWeek: user.added || 0,
        completedLastWeek: 0, // Will be populated from last week's data
        topAchievements: [] // Could be populated with actual objective titles
      }))
      
      setTeamMembers(members)
      setCurrentWeekData({
        period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
        totalCompleted: data.totalCompleted || 0,
        totalAdded: data.totalAdded || 0,
        activeUsers: data.activeUsers || 0,
        weeklyGrowth: 0 // Will calculate after loading last week
      })
      
      // Load last week's data for comparison
      loadLastWeekComparison(members)
    } catch (error: any) {
      console.error('Error loading current week data:', error)
      setError(error.message || 'Failed to load weekly progress')
    } finally {
      setLoading(false)
    }
  }

  const loadLastWeekComparison = async (currentMembers: TeamMember[]) => {
    try {
      const { start, end } = getWeekDateRange(1) // 1 week ago
      const reportFunction = httpsCallable(functions, 'getWeeklyReport')
      const result = await reportFunction({ 
        startDate: start.toISOString(), 
        endDate: end.toISOString() 
      })
      
      const data = result.data as any
      
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

  const loadWeeklyHistory = async () => {
    const history: WeeklyData[] = []
    
    // Load last 12 weeks
    for (let i = 11; i >= 0; i--) {
      try {
        const { start, end } = getWeekDateRange(i)
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

  const chartData = {
    labels: weeklyHistory.map(w => w.weekStart),
    datasets: [
      {
        label: 'Objectives Completed',
        data: weeklyHistory.map(w => w.completed),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Objectives Added',
        data: weeklyHistory.map(w => w.added),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
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
        
        {/* Current Week Overview */}
        {currentWeekData && (
          <>
            {/* This Week's Collective Progress */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">This Week's Progress</h2>
                  <p className="text-purple-100">{currentWeekData.period}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-100">Weekly Growth</p>
                  <p className="text-3xl font-bold">
                    {currentWeekData.weeklyGrowth > 0 ? '+' : ''}{currentWeekData.weeklyGrowth}%
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm text-center">
                  <p className="text-5xl font-bold mb-2">{currentWeekData.totalCompleted}</p>
                  <p className="text-purple-100">Objectives Completed</p>
                </div>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm text-center">
                  <p className="text-5xl font-bold mb-2">{currentWeekData.totalAdded}</p>
                  <p className="text-purple-100">New Objectives</p>
                </div>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm text-center">
                  <p className="text-5xl font-bold mb-2">{currentWeekData.activeUsers}</p>
                  <p className="text-purple-100">Active Team Members</p>
                </div>
              </div>
            </div>

            {/* Team Member Cards */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => {
                  const progress = member.completedLastWeek > 0 
                    ? Math.round(((member.completedThisWeek - member.completedLastWeek) / member.completedLastWeek) * 100)
                    : 0
                  
                  return (
                    <div key={member.email} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
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
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-3xl font-bold text-green-600">{member.completedThisWeek}</p>
                          <p className="text-sm text-gray-600">Completed</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-blue-600">{member.addedThisWeek}</p>
                          <p className="text-sm text-gray-600">Added</p>
                        </div>
                      </div>
                      
                      {/* Progress Indicator */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">vs Last Week</span>
                          <span className={`font-semibold ${progress >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {progress > 0 ? '+' : ''}{progress}%
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              progress >= 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(Math.abs(progress), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Progress Charts */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">12-Week Trend</h2>
              <div className="h-80">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Previous Weeks Accordion */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setPreviousWeeksExpanded(!previousWeeksExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900">Previous Weeks</h2>
                <svg 
                  className={`w-5 h-5 text-gray-500 transition-transform ${previousWeeksExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {previousWeeksExpanded && (
                <div className="border-t border-gray-200 p-6">
                  <div className="space-y-4">
                    {weeklyHistory.slice(-5, -1).reverse().map((week, index) => (
                      <div key={week.weekStart} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Week of {week.weekStart}</p>
                            <p className="text-sm text-gray-500">{index + 1} week{index !== 0 ? 's' : ''} ago</p>
                          </div>
                          <div className="flex gap-8 text-center">
                            <div>
                              <p className="text-2xl font-bold text-green-600">{week.completed}</p>
                              <p className="text-sm text-gray-500">Completed</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{week.added}</p>
                              <p className="text-sm text-gray-500">Added</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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