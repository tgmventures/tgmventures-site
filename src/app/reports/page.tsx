'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const generateReport = async () => {
    setLoading(true)
    try {
      // TODO: Fetch report data from Firebase
      // This will aggregate:
      // - Tasks completed by user
      // - New tasks added
      // - Training modules completed
      // - Future: Asana tasks, Rent Manager data
      
      // For now, mock data
      setReportData({
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        summary: {
          tasksCompleted: 42,
          tasksAdded: 15,
          trainingCompleted: 3,
          activeUsers: 5
        },
        byUser: [
          {
            name: 'Antonio',
            email: 'antonio@tgmventures.com',
            completed: 18,
            added: 8
          }
        ],
        byCategory: {
          assetManagement: { completed: 12, added: 4 },
          realEstate: { completed: 8, added: 3 },
          ventures: { completed: 22, added: 8 }
        }
      })
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
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
              <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Date Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Report Period</h2>
          
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
            {loading_ ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Report Results */}
        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Tasks Completed</h3>
                <p className="text-3xl font-bold text-green-600">{reportData.summary.tasksCompleted}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Tasks Added</h3>
                <p className="text-3xl font-bold text-blue-600">{reportData.summary.tasksAdded}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Training Completed</h3>
                <p className="text-3xl font-bold text-purple-600">{reportData.summary.trainingCompleted}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Active Users</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.summary.activeUsers}</p>
              </div>
            </div>

            {/* By User */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Activity by Team Member</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Team Member</th>
                      <th className="text-center py-2 px-4">Tasks Completed</th>
                      <th className="text-center py-2 px-4">Tasks Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.byUser.map((user: any) => (
                      <tr key={user.email} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4 font-medium text-green-600">{user.completed}</td>
                        <td className="text-center py-3 px-4 font-medium text-blue-600">{user.added}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* By Category */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Activity by Category</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Asset Management</span>
                  <div className="flex gap-4">
                    <span className="text-green-600">{reportData.byCategory.assetManagement.completed} completed</span>
                    <span className="text-blue-600">{reportData.byCategory.assetManagement.added} added</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Real Estate</span>
                  <div className="flex gap-4">
                    <span className="text-green-600">{reportData.byCategory.realEstate.completed} completed</span>
                    <span className="text-blue-600">{reportData.byCategory.realEstate.added} added</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ventures</span>
                  <div className="flex gap-4">
                    <span className="text-green-600">{reportData.byCategory.ventures.completed} completed</span>
                    <span className="text-blue-600">{reportData.byCategory.ventures.added} added</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Report Button */}
            <div className="mt-6 text-center">
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
      </main>
    </div>
  )
}
