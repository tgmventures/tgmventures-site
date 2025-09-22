'use client'

import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import Link from 'next/link'
import { 
  getDivisionObjectives, 
  subscribeToDivisionObjectives,
  DivisionObjective,
  updateObjectiveStatus,
  deleteObjective,
  addDivisionObjective
} from '@/lib/firebase/dashboard'

export default function GoalsPage() {
  const [user] = useAuthState(auth)
  const [loading, setLoading] = useState(true)
  const [assetObjectives, setAssetObjectives] = useState<DivisionObjective[]>([])
  const [realEstateObjectives, setRealEstateObjectives] = useState<DivisionObjective[]>([])
  const [venturesObjectives, setVenturesObjectives] = useState<DivisionObjective[]>([])
  const [selectedDivision, setSelectedDivision] = useState<'all' | 'asset-management' | 'real-estate-development' | 'ventures'>('all')
  const [addingGoal, setAddingGoal] = useState<string | null>(null)
  const [newGoalText, setNewGoalText] = useState('')

  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      const assetObjs = await getDivisionObjectives('asset-management')
      setAssetObjectives(assetObjs)
      
      const realEstateObjs = await getDivisionObjectives('real-estate-development')
      setRealEstateObjectives(realEstateObjs)
      
      const venturesObjs = await getDivisionObjectives('ventures')
      setVenturesObjectives(venturesObjs)
      
      setLoading(false)
    }
    
    loadData()
    
    // Subscribe to real-time updates
    const unsubAsset = subscribeToDivisionObjectives('asset-management', setAssetObjectives)
    const unsubRealEstate = subscribeToDivisionObjectives('real-estate-development', setRealEstateObjectives)
    const unsubVentures = subscribeToDivisionObjectives('ventures', setVenturesObjectives)
    
    return () => {
      unsubAsset()
      unsubRealEstate()
      unsubVentures()
    }
  }, [user])

  const handleToggleGoal = async (goalId: string, currentStatus: boolean) => {
    try {
      await updateObjectiveStatus(goalId, !currentStatus)
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteObjective(goalId)
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const handleAddGoal = async (division: 'asset-management' | 'real-estate-development' | 'ventures') => {
    if (!newGoalText.trim()) return
    
    try {
      await addDivisionObjective(division, newGoalText.trim())
      setNewGoalText('')
      setAddingGoal(null)
    } catch (error) {
      console.error('Error adding goal:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading goals...</div>
      </div>
    )
  }

  const divisionData = [
    {
      id: 'asset-management',
      name: 'Asset Management',
      description: 'Ensuring all assets are performing optimally, all rents collected, taxes paid, fully in compliance.',
      objectives: assetObjectives,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900'
    },
    {
      id: 'real-estate-development',
      name: 'Real Estate Development',
      description: 'Ground up construction projects.',
      objectives: realEstateObjectives,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900'
    },
    {
      id: 'ventures',
      name: 'Ventures',
      description: 'High growth technology startups.',
      objectives: venturesObjectives,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-900'
    }
  ]

  const filteredDivisions = selectedDivision === 'all' 
    ? divisionData 
    : divisionData.filter(d => d.id === selectedDivision)

  const totalGoals = assetObjectives.length + realEstateObjectives.length + venturesObjectives.length
  const completedGoals = [...assetObjectives, ...realEstateObjectives, ...venturesObjectives].filter(g => g.isChecked).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to dashboard
          </Link>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Strategic Goals</h1>
            <p className="mt-2 text-gray-600">Track key objectives across all business divisions</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-8">
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Divisions</option>
            <option value="asset-management">Asset Management</option>
            <option value="real-estate-development">Real Estate Development</option>
            <option value="ventures">Ventures</option>
          </select>
        </div>

        {/* Goals by Division */}
        <div className="space-y-8">
          {filteredDivisions.map(division => (
            <div key={division.id} className={`${division.bgColor} rounded-lg p-6 border ${division.borderColor}`}>
              <div className="mb-4">
                <h3 className={`text-xl font-semibold ${division.textColor}`}>{division.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{division.description}</p>
              </div>
              
              <div className="space-y-3">
                {division.objectives.map(goal => (
                  <div key={goal.id} className="flex items-center gap-3 group">
                    <input
                      type="checkbox"
                      checked={goal.isChecked}
                      onChange={() => handleToggleGoal(goal.id, goal.isChecked)}
                      className={`h-5 w-5 rounded focus:ring-2 focus:ring-${division.color}-500 text-${division.color}-600 cursor-pointer`}
                    />
                    <span className={`flex-1 ${goal.isChecked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {goal.title}
                    </span>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {division.objectives.length < 3 && (
                  addingGoal === division.id ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleAddGoal(division.id as any)
                      }}
                      className="flex items-center gap-2 mt-2"
                    >
                      <input
                        type="text"
                        value={newGoalText}
                        onChange={(e) => setNewGoalText(e.target.value)}
                        placeholder="Add new goal..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="text-green-600 hover:text-green-700"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingGoal(null)
                          setNewGoalText('')
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setAddingGoal(division.id)}
                      className="text-sm text-gray-600 hover:text-gray-800 transition mt-2"
                    >
                      + Add goal
                    </button>
                  )
                )}
                
                {division.objectives.length === 0 && addingGoal !== division.id && (
                  <p className="text-gray-500 text-center py-4">No goals set for this division</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-gray-900">{totalGoals}</div>
            <div className="text-sm text-gray-600">Total Goals</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{completedGoals}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalGoals - completedGoals}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Progress</div>
          </div>
        </div>
      </div>
    </div>
  )
}