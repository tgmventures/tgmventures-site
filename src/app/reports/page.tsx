'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, functions } from '@/lib/firebase'
import { httpsCallable } from 'firebase/functions'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ReportsPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('week')
  const [startDate, setStartDate] = useState<Date>(() => {
    // Default to last week
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date
  })
  const [endDate, setEndDate] = useState<Date>(() => new Date())
  const [reportData, setReportData] = useState<any>(null)
  const [loading_, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [emailPreview, setEmailPreview] = useState<string>('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const generateReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const reportFunction = httpsCallable(functions, 'getWeeklyReport')
      const result = await reportFunction({ 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      })
      
      const data = result.data as any
      setReportData({
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        summary: {
          objectivesCompleted: data.totalCompleted || 0,
          objectivesAdded: data.totalAdded || 0,
          trainingCompleted: data.totalTrainingModules || 0,
          activeUsers: data.activeUsers || 0
        },
        byUser: data.completedByUser || [],
        byCategory: data.byCategory || {
          assetManagement: { completed: 0, added: 0 },
          realEstate: { completed: 0, added: 0 },
          ventures: { completed: 0, added: 0 },
          taxes: { completed: 0, added: 0 }
        }
      })
    } catch (error: any) {
      console.error('Error generating report:', error)
      setError(error.message || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmailPreview = async () => {
    try {
      const previewFunction = httpsCallable(functions, 'getWeeklyReportEmailPreview')
      const result = await previewFunction({ 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      })
      
      const data = result.data as any
      setEmailPreview(data.html)
      setShowEmailPreview(true)
    } catch (error: any) {
      console.error('Error fetching email preview:', error)
      setError(error.message || 'Failed to fetch email preview')
    }
  }

  const handlePeriodChange = (period: typeof selectedPeriod) => {
    setSelectedPeriod(period)
    const now = new Date()
    
    switch (period) {
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - 7)
        setStartDate(weekStart)
        setEndDate(now)
        break
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        setStartDate(monthStart)
        setEndDate(now)
        break
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
        setStartDate(quarterStart)
        setEndDate(now)
        break
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1)
        setStartDate(yearStart)
        setEndDate(now)
        break
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
              <h1 className="text-xl font-semibold text-gray-900">Weekly Progress</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Weekly Progress Tracker</h2>
          <p className="text-gray-600">Monitor your team's objectives completion and progress</p>
        </div>

        {/* Date Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Time Period</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={loading_}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
          >
            {loading_ ? 'Loading Progress...' : 'View Progress'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}
        
        {/* Report Results */}
        {reportData && (
          <>
            {/* Weekly Progress Overview */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">This Week's Progress</h3>
                <p className="text-purple-100">{reportData.period}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-4xl font-bold mb-1">{reportData.summary.objectivesCompleted}</p>
                    <p className="text-sm text-purple-100">Completed</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-4xl font-bold mb-1">{reportData.summary.objectivesAdded}</p>
                    <p className="text-sm text-purple-100">Added</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-4xl font-bold mb-1">{reportData.summary.activeUsers}</p>
                    <p className="text-sm text-purple-100">Active Team</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-4xl font-bold mb-1">
                      {reportData.summary.objectivesCompleted > 0 
                        ? Math.round((reportData.summary.objectivesCompleted / (reportData.summary.objectivesCompleted + reportData.summary.objectivesAdded)) * 100)
                        : 0}%
                    </p>
                    <p className="text-sm text-purple-100">Completion</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Team Member Progress</h2>
              <div className="space-y-4">
                {reportData.byUser.map((user: any) => {
                  const completed = user.completed || user.count || 0;
                  const added = user.added || 0;
                  const total = completed + added;
                  const completionRate = total > 0 ? (completed / total) * 100 : 0;
                  
                  return (
                    <div key={user.email} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{completed}</p>
                            <p className="text-gray-500">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{added}</p>
                            <p className="text-gray-500">Added</p>
                          </div>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(completionRate)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress by Category */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Progress by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Asset Management', data: reportData.byCategory.assetManagement, icon: '💼' },
                  { name: 'Real Estate', data: reportData.byCategory.realEstate, icon: '🏢' },
                  { name: 'Ventures', data: reportData.byCategory.ventures, icon: '🚀' },
                  { name: 'Taxes', data: reportData.byCategory.taxes || { completed: 0, added: 0 }, icon: '📊' }
                ].map((category) => {
                  const total = category.data.completed + category.data.added;
                  const completionRate = total > 0 ? (category.data.completed / total) * 100 : 0;
                  
                  return (
                    <div key={category.name} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{category.icon}</span>
                          <h3 className="font-medium text-gray-900">{category.name}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold text-green-600">{category.data.completed}</span> / 
                            <span className="font-semibold text-gray-900"> {total}</span>
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{category.data.completed} completed</span>
                          <span>{category.data.added} added</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              category.name === 'Asset Management' ? 'bg-blue-500' :
                              category.name === 'Real Estate' ? 'bg-green-500' :
                              category.name === 'Ventures' ? 'bg-purple-500' :
                              'bg-orange-500'
                            }`}
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Email Report Buttons */}
            <div className="mt-6 text-center flex justify-center gap-4">
              <button
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                onClick={fetchEmailPreview}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Email
                </span>
              </button>
              <button
                className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors"
                onClick={async () => {
                  try {
                    const { getFunctions, httpsCallable } = await import('firebase/functions')
                    const functions = getFunctions()
                    const sendWeeklyReport = httpsCallable(functions, 'sendWeeklyReportNow')
                    const result = await sendWeeklyReport({ email: user?.email })
                    alert(`Report sent successfully! Completed: ${result.data.stats.completed}, Added: ${result.data.stats.added}`)
                  } catch (error) {
                    console.error('Error sending report:', error)
                    alert('Failed to send report. Please try again.')
                  }
                }}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email This Report
                </span>
              </button>
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
