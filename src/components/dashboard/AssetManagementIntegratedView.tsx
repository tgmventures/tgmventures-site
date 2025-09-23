'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { AssetManagementCard as AssetCard } from '@/lib/firebase/asset-management-cards'
import {
  createAssetManagementCard,
  updateAssetManagementCardTitle,
  deleteAssetManagementCard,
  addObjectiveToAssetCard,
  updateAssetObjectiveStatus,
  updateAssetObjectiveText,
  deleteObjectiveFromAssetCard,
} from '@/lib/firebase/asset-management-cards'
import { CardSkeleton } from './CardSkeleton'
import { AssetManagementStatus, DivisionTask, TaxReturn } from '@/types/goal'

const AssetManagementCard = lazy(() => import('./BusinessDivisionCards').then(mod => ({ default: mod.AssetManagementCard })))
const RealEstateCard = lazy(() => import('./RealEstateCard').then(mod => ({ default: mod.RealEstateCard })))
const TaxFilingsCard = lazy(() => import('./TaxFilingsCard').then(mod => ({ default: mod.TaxFilingsCard })))

interface AssetManagementIntegratedViewProps {
  // Fixed cards props
  assetStatus: AssetManagementStatus
  handleAssetStatusChange: (field: string, value: boolean) => void
  realEstateTasks: DivisionTask[]
  realEstateTasksComplete: number
  handleTaskCheck: (divisionId: string, taskId: string, isChecked: boolean) => void
  handleDeleteTask: (divisionId: string, taskId: string) => void
  handleAddTask: (divisionId: string) => void
  handleEditTask: (divisionId: string, taskId: string, newTitle: string) => void
  startEditingTask: (taskId: string, currentTitle: string) => void
  handleDragStart: (e: React.DragEvent, task: DivisionTask) => void
  handleDragOver: (e: React.DragEvent, index: number) => void
  handleDragEnd: () => void
  handleDrop: (e: React.DragEvent, divisionId: string, dropIndex: number) => void
  taxReturns: TaxReturn[]
  propertyTaxH1Paid: boolean
  propertyTaxH2Paid: boolean
  handleTaxReturnChange: (returnId: string, isFiled: boolean) => void
  handlePropertyTaxChange: (half: 'H1' | 'H2', isPaid: boolean) => void
  justCompletedTask: string | null
  assetChecklistComplete: number
  priorMonth: string
  currentMonth: string
  editingTaskId: string | null
  editText: string
  setEditText: (text: string) => void
  setEditingTaskId: (id: string | null) => void
  draggedTask: DivisionTask | null
  dragOverIndex: number | null
  addingTask: string | null
  setAddingTask: (id: string | null) => void
  newText: string
  setNewText: (text: string) => void
  currentDate: Date
  // Custom cards props
  assetCards: AssetCard[]
  userEmail?: string
  userName?: string
  setShowSuccessToast?: (show: boolean) => void
  setWeeklyCompletedCount?: (fn: (prev: number) => number) => void
  incrementWeeklyCount?: () => Promise<void>
  decrementWeeklyCount?: () => Promise<void>
}

export function AssetManagementIntegratedView({
  assetStatus,
  handleAssetStatusChange,
  realEstateTasks,
  realEstateTasksComplete,
  handleTaskCheck,
  handleDeleteTask,
  handleAddTask,
  handleEditTask,
  startEditingTask,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  handleDrop,
  taxReturns,
  propertyTaxH1Paid,
  propertyTaxH2Paid,
  handleTaxReturnChange,
  handlePropertyTaxChange,
  justCompletedTask,
  assetChecklistComplete,
  priorMonth,
  currentMonth,
  editingTaskId,
  editText,
  setEditText,
  setEditingTaskId,
  draggedTask,
  dragOverIndex,
  addingTask,
  setAddingTask,
  newText,
  setNewText,
  currentDate,
  assetCards,
  userEmail,
  userName,
  setShowSuccessToast,
  setWeeklyCompletedCount,
  incrementWeeklyCount,
  decrementWeeklyCount
}: AssetManagementIntegratedViewProps) {
  const [addingCard, setAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [addingObjective, setAddingObjective] = useState<string | null>(null)
  const [newObjectiveText, setNewObjectiveText] = useState('')
  const [editingObjective, setEditingObjective] = useState<{ cardId: string; objectiveId: string } | null>(null)
  const [editingObjectiveText, setEditingObjectiveText] = useState('')
  const [justCompletedObjective, setJustCompletedObjective] = useState<string | null>(null)

  // Clear celebration animation after delay
  useEffect(() => {
    if (justCompletedObjective) {
      const timer = setTimeout(() => setJustCompletedObjective(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [justCompletedObjective])

  const handleCreateCard = async () => {
    if (!newCardTitle.trim()) return
    
    try {
      await createAssetManagementCard(newCardTitle.trim())
      setNewCardTitle('')
      setAddingCard(false)
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const handleUpdateCardTitle = async (cardId: string) => {
    if (!editingTitle.trim()) return
    
    try {
      await updateAssetManagementCardTitle(cardId, editingTitle.trim())
      setEditingCardId(null)
      setEditingTitle('')
    } catch (error) {
      console.error('Error updating card title:', error)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card and all its objectives?')) return
    
    try {
      await deleteAssetManagementCard(cardId)
    } catch (error) {
      console.error('Error deleting card:', error)
      alert(error.message || 'Failed to delete card')
    }
  }

  const handleAddObjective = async (cardId: string) => {
    if (!newObjectiveText.trim()) return
    
    try {
      await addObjectiveToAssetCard(cardId, newObjectiveText.trim())
      setNewObjectiveText('')
      setAddingObjective(null)
    } catch (error) {
      console.error('Error adding objective:', error)
    }
  }

  const handleObjectiveCheck = async (cardId: string, objective: any) => {
    try {
      await updateAssetObjectiveStatus(cardId, objective.id, !objective.isChecked, userEmail, userName)
      if (!objective.isChecked) {
        setJustCompletedObjective(`${cardId}-${objective.id}`)
        if (setShowSuccessToast) setShowSuccessToast(true)
        if (setWeeklyCompletedCount) setWeeklyCompletedCount(prev => prev + 1)
        if (incrementWeeklyCount) await incrementWeeklyCount()
        
        // Hide toast after 3 seconds
        if (setShowSuccessToast) {
          setTimeout(() => setShowSuccessToast(false), 3000)
        }
      } else {
        // Decrement counter when unchecking
        if (setWeeklyCompletedCount) setWeeklyCompletedCount(prev => Math.max(0, prev - 1))
        if (decrementWeeklyCount) await decrementWeeklyCount()
      }
    } catch (error) {
      console.error('Error updating objective:', error)
    }
  }

  const handleDeleteObjective = async (cardId: string, objectiveId: string) => {
    try {
      await deleteObjectiveFromAssetCard(cardId, objectiveId)
    } catch (error) {
      console.error('Error deleting objective:', error)
    }
  }

  const handleUpdateObjectiveText = async (cardId: string, objectiveId: string) => {
    if (!editingObjectiveText.trim()) return
    
    try {
      await updateAssetObjectiveText(cardId, objectiveId, editingObjectiveText.trim())
      setEditingObjective(null)
      setEditingObjectiveText('')
    } catch (error) {
      console.error('Error updating objective text:', error)
    }
  }

  const renderCustomCard = (card: AssetCard) => (
    <div
      key={card.id}
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        {editingCardId === card.id && card.isCustom ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              handleUpdateCardTitle(card.id)
            }}
            className="flex-1 flex items-center gap-2"
          >
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              className="flex-1 text-lg font-semibold border-b-2 border-green-500 focus:outline-none"
              autoFocus
              onBlur={() => handleUpdateCardTitle(card.id)}
            />
          </form>
        ) : (
          <h3 
            onClick={() => {
              if (card.isCustom) {
                setEditingCardId(card.id)
                setEditingTitle(card.title)
              }
            }}
            className={`text-lg font-semibold text-gray-900 flex-1 ${
              card.isCustom ? 'cursor-pointer hover:text-green-600' : ''
            }`}
            title={card.isCustom ? "Click to edit title" : ""}
          >
            {card.title}
          </h3>
        )}
        {editingCardId === card.id && card.isCustom && (
          <button
            onClick={() => handleDeleteCard(card.id)}
            className="text-red-400 hover:text-red-600 transition-colors ml-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{card.objectives.filter(o => o.isChecked).length}/{card.objectives.length}</span>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: card.objectives.length > 0 
                ? `${(card.objectives.filter(o => o.isChecked).length / card.objectives.length) * 100}%` 
                : '0%' 
            }}
          />
        </div>
      </div>

      {/* Objectives */}
      <div className="space-y-2 mb-4">
        {card.objectives.map((objective) => (
          <div
            key={objective.id}
            className={`flex items-center gap-2 group ${
              justCompletedObjective === `${card.id}-${objective.id}` ? 'bg-green-50 rounded-lg' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={objective.isChecked}
              onChange={() => handleObjectiveCheck(card.id, objective)}
              className="h-4 w-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            {editingObjective?.cardId === card.id && editingObjective?.objectiveId === objective.id ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  handleUpdateObjectiveText(card.id, objective.id)
                }}
                className="flex-1 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={editingObjectiveText}
                  onChange={(e) => setEditingObjectiveText(e.target.value)}
                  className="flex-1 text-sm px-1 py-0.5 border-b-2 border-green-500 focus:outline-none"
                  autoFocus
                  onBlur={() => handleUpdateObjectiveText(card.id, objective.id)}
                />
              </form>
            ) : (
              <span 
                onClick={() => {
                  setEditingObjective({ cardId: card.id, objectiveId: objective.id })
                  setEditingObjectiveText(objective.text)
                }}
                className={`flex-1 text-sm cursor-pointer hover:text-green-600 ${objective.isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                title="Click to edit"
              >
                {objective.text}
              </span>
            )}
            {justCompletedObjective === `${card.id}-${objective.id}` && (
              <span className="text-green-500 animate-ping">✓</span>
            )}
            <button
              onClick={() => handleDeleteObjective(card.id, objective.id)}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add Objective */}
      {addingObjective === card.id ? (
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            handleAddObjective(card.id)
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={newObjectiveText}
            onChange={(e) => setNewObjectiveText(e.target.value)}
            placeholder="Add objective..."
            className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              setAddingObjective(null)
              setNewObjectiveText('')
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
          onClick={() => setAddingObjective(card.id)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-all duration-200"
        >
          + Add objective
        </button>
      )}
    </div>
  )

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Key Objectives & Deliverables</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Fixed Card 1: Asset Management */}
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

        {/* Fixed Card 2: Real Estate */}
        <Suspense fallback={<CardSkeleton />}>
          <RealEstateCard
            realEstateTasks={realEstateTasks}
            realEstateTasksComplete={realEstateTasksComplete}
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

        {/* Fixed Card 3: Tax Filings */}
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

        {/* Custom Cards */}
        {assetCards.map((card) => renderCustomCard(card))}

        {/* New Card Form */}
        {addingCard && (
          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-300">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateCard()
              }}
            >
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="Card title..."
                className="w-full text-lg font-semibold border-b-2 border-green-500 focus:outline-none mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddingCard(false)
                    setNewCardTitle('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Card
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Create New Card Button */}
      {!addingCard && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setAddingCard(true)}
            className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
          >
            Create New Card
          </button>
        </div>
      )}
    </>
  )
}
