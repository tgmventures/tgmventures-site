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
  reorderObjectivesInAssetCard,
  reorderAssetManagementCards,
} from '@/lib/firebase/asset-management-cards'
import { CardSkeleton } from './CardSkeleton'
import { AssetManagementStatus, DivisionTask, TaxReturn } from '@/types/goal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getDashboardCardOrder, saveDashboardCardOrder } from '@/lib/firebase/dashboard-preferences'

const AssetManagementCard = lazy(() => import('./BusinessDivisionCards').then(mod => ({ default: mod.AssetManagementCard })))
const TaxFilingsCard = lazy(() => import('./TaxFilingsCard').then(mod => ({ default: mod.TaxFilingsCard })))

interface AssetManagementIntegratedViewProps {
  // Fixed cards props
  assetStatus: AssetManagementStatus
  handleAssetStatusChange: (field: string, value: boolean) => void
  taxReturns: TaxReturn[]
  propertyTaxH1Paid: boolean
  propertyTaxH2Paid: boolean
  handleTaxReturnChange: (returnId: string, isFiled: boolean) => void
  handlePropertyTaxChange: (half: 'H1' | 'H2', isPaid: boolean) => void
  justCompletedTask: string | null
  assetChecklistComplete: number
  priorMonth: string
  currentMonth: string
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
  taxReturns,
  propertyTaxH1Paid,
  propertyTaxH2Paid,
  handleTaxReturnChange,
  handlePropertyTaxChange,
  justCompletedTask,
  assetChecklistComplete,
  priorMonth,
  currentMonth,
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
  const [draggedObjective, setDraggedObjective] = useState<{ cardId: string; objective: any } | null>(null)
  const [dragOverObjectiveIndex, setDragOverObjectiveIndex] = useState<number | null>(null)
  const [draggedCard, setDraggedCard] = useState<{ id: string; type: 'fixed' | 'custom' } | null>(null)
  const [dragOverCardIndex, setDragOverCardIndex] = useState<number | null>(null)
  const [cardOrder, setCardOrder] = useState<string[]>(['asset-management', 'tax-filings'])
  const [justCompletedObjective, setJustCompletedObjective] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; cardId: string | null }>({ isOpen: false, cardId: null })
  const [hasInitializedOrder, setHasInitializedOrder] = useState(false)

  // Clear celebration animation after delay
  useEffect(() => {
    if (justCompletedObjective) {
      const timer = setTimeout(() => setJustCompletedObjective(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [justCompletedObjective])

  // Load saved card order on mount
  useEffect(() => {
    const loadCardOrder = async () => {
      const savedOrder = await getDashboardCardOrder()
      if (savedOrder) {
        setCardOrder(savedOrder)
        setHasInitializedOrder(true)
      } else {
        // If no saved order, initialize with default
        const customCardIds = assetCards.map(c => c.id)
        const defaultOrder = ['asset-management', ...customCardIds, 'tax-filings']
        setCardOrder(defaultOrder)
        setHasInitializedOrder(true)
      }
    }
    
    if (!hasInitializedOrder) {
      loadCardOrder()
    }
  }, [hasInitializedOrder, assetCards])

  // Handle new/deleted cards and update saved order
  useEffect(() => {
    if (!hasInitializedOrder) return
    
    const customCardIds = assetCards.map(c => c.id)
    const currentIds = new Set(cardOrder)
    const newCardIds = customCardIds.filter(id => !currentIds.has(id))
    
    let orderChanged = false
    let newOrder = [...cardOrder]
    
    // Add new cards
    if (newCardIds.length > 0) {
      const taxFilingsIndex = newOrder.indexOf('tax-filings')
      
      if (taxFilingsIndex === newOrder.length - 1) {
        // Insert new cards before Tax Filings
        newOrder.splice(taxFilingsIndex, 0, ...newCardIds)
      } else {
        // Add new cards at the end
        newOrder.push(...newCardIds)
      }
      orderChanged = true
    }
    
    // Remove deleted cards
    const existingCardIds = new Set(['asset-management', 'tax-filings', ...customCardIds])
    const filteredOrder = newOrder.filter(id => existingCardIds.has(id))
    
    if (filteredOrder.length !== newOrder.length) {
      newOrder = filteredOrder
      orderChanged = true
    }
    
    // Update state and save if changed
    if (orderChanged) {
      setCardOrder(newOrder)
      saveDashboardCardOrder(newOrder)
    }
  }, [assetCards, cardOrder, hasInitializedOrder])

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
    try {
      await deleteAssetManagementCard(cardId)
      setDeleteConfirm({ isOpen: false, cardId: null })
    } catch (error: any) {
      console.error('Error deleting card:', error)
      // Show error in console instead of alert
      console.error('Failed to delete card:', error.message || 'Unknown error')
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

  // Objective drag and drop handlers
  const handleObjectiveDragStart = (e: React.DragEvent, cardId: string, objective: any) => {
    e.stopPropagation() // Prevent card from being dragged
    setDraggedObjective({ cardId, objective })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleObjectiveDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    
    // Only update if we're actually dragging an objective
    if (!draggedObjective) return
    
    // Get the bounding rectangle of the current element
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    
    // If mouse is in top half of the element, show indicator above (at current index)
    // If mouse is in bottom half, show indicator below (at next index)
    const newIndex = y < height / 2 ? index : index + 1
    
    // Only update if the index actually changed to reduce re-renders
    if (dragOverObjectiveIndex !== newIndex) {
      setDragOverObjectiveIndex(newIndex)
    }
  }
  
  const handleObjectiveDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if we're leaving the entire objectives container
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      // Only clear if we're not entering another objective
      const isEnteringAnotherObjective = relatedTarget?.closest('[data-objective-item]')
      if (!isEnteringAnotherObjective) {
        setDragOverObjectiveIndex(null)
      }
    }
  }

  const handleObjectiveDragEnd = () => {
    // Add a small delay before clearing to ensure drop events complete
    setTimeout(() => {
      setDraggedObjective(null)
      setDragOverObjectiveIndex(null)
    }, 50)
  }

  const handleObjectiveDrop = async (e: React.DragEvent, cardId: string, objectives: any[]) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedObjective || draggedObjective.cardId !== cardId || dragOverObjectiveIndex === null) {
      handleObjectiveDragEnd()
      return
    }

    const draggedIndex = objectives.findIndex(o => o.id === draggedObjective.objective.id)
    let dropIndex = dragOverObjectiveIndex
    
    // Adjust drop index if dragging from a position before the drop position
    if (draggedIndex < dropIndex) {
      dropIndex = dropIndex - 1
    }
    
    if (draggedIndex === dropIndex) {
      handleObjectiveDragEnd()
      return
    }

    // Create a new array with the reordered objectives
    const reorderedObjectives = [...objectives]
    reorderedObjectives.splice(draggedIndex, 1)
    reorderedObjectives.splice(dropIndex, 0, draggedObjective.objective)
    
    // Assign new order values
    const objectiveIds = reorderedObjectives.map(o => o.id)
    const newOrders = reorderedObjectives.map((_, index) => index)
    
    // Update in Firestore
    try {
      await reorderObjectivesInAssetCard(cardId, objectiveIds, newOrders)
    } catch (error) {
      console.error('Error reordering objectives:', error)
    }
    
    // Clear immediately after drop to avoid race conditions
    setDraggedObjective(null)
    setDragOverObjectiveIndex(null)
  }

  // Card drag and drop handlers
  const handleCardDragStart = (e: React.DragEvent, cardId: string, cardType: 'fixed' | 'custom') => {
    e.stopPropagation()
    setDraggedCard({ id: cardId, type: cardType })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    
    if (!draggedCard) return
    
    // Only update if the index actually changed to reduce re-renders
    if (dragOverCardIndex !== index) {
      setDragOverCardIndex(index)
    }
  }

  const handleCardDragEnd = () => {
    // Add a small delay before clearing to ensure drop events complete
    setTimeout(() => {
      setDraggedCard(null)
      setDragOverCardIndex(null)
    }, 50)
  }

  const handleCardDrop = async (e: React.DragEvent, dropIndex: number, allCards: Array<{ id: string; type: 'fixed' | 'custom'; title: string }>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedCard || dragOverCardIndex === null) {
      handleCardDragEnd()
      return
    }

    const draggedIndex = allCards.findIndex(c => c.id === draggedCard.id)
    
    if (draggedIndex === dropIndex) {
      handleCardDragEnd()
      return
    }

    // Create a new array with the reordered cards
    const reorderedCards = [...allCards]
    const [movedCard] = reorderedCards.splice(draggedIndex, 1)
    reorderedCards.splice(dropIndex, 0, movedCard)
    
    // Update card order state
    const newCardOrder = reorderedCards.map(c => c.id)
    setCardOrder(newCardOrder)
    
    // Save the new card order to Firestore for persistence
    try {
      await saveDashboardCardOrder(newCardOrder)
      
      // Update custom cards order in Firebase
      const customCardsInNewOrder = reorderedCards.filter(c => c.type === 'custom')
      
      if (customCardsInNewOrder.length > 0) {
        // Update order for all custom cards based on their position in the overall order
        const cardIds = customCardsInNewOrder.map(c => c.id)
        const newOrders = customCardsInNewOrder.map((c, index) => index)
        await reorderAssetManagementCards(cardIds, newOrders)
      }
    } catch (error) {
      console.error('Error reordering cards:', error)
    }
    
    // Clear immediately after drop
    setDraggedCard(null)
    setDragOverCardIndex(null)
  }

  const renderCustomCard = (card: AssetCard, index: number, isDragging: boolean) => (
    <div
      key={card.id}
      className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 ${
        isDragging ? 'opacity-50' : ''
      }`}
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
            draggable
            onDragStart={(e) => handleCardDragStart(e, card.id, 'custom')}
            onDragEnd={handleCardDragEnd}
            onDoubleClick={() => {
              if (card.isCustom) {
                setEditingCardId(card.id)
                setEditingTitle(card.title)
              }
            }}
            className={`text-lg font-semibold text-gray-900 flex-1 cursor-move ${
              card.isCustom ? 'hover:text-green-600' : ''
            }`}
            title={card.isCustom ? "Drag to reorder, double-click to edit" : "Drag to reorder"}
          >
            {card.title}
          </h3>
        )}
        {editingCardId === card.id && card.isCustom && (
          <button
            onClick={() => setDeleteConfirm({ isOpen: true, cardId: card.id })}
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
      <div 
        className="space-y-3 mb-4 min-h-[50px]"
        onDragOver={(e) => {
          // Handle drag over empty space at the end of the list
          if (draggedObjective && draggedObjective.cardId === card.id) {
            e.preventDefault()
            e.stopPropagation()
            
            if (card.objectives.length === 0) {
              // Empty list - drop at index 0
              setDragOverObjectiveIndex(0)
            } else {
              // Check if we're below all items
              const children = Array.from(e.currentTarget.children).filter(child => 
                child.hasAttribute('data-objective-wrapper')
              )
              
              if (children.length > 0) {
                const lastChild = children[children.length - 1] as HTMLElement
                const lastChildRect = lastChild.getBoundingClientRect()
                
                if (e.clientY > lastChildRect.bottom - 10) {
                  setDragOverObjectiveIndex(card.objectives.length)
                }
              }
            }
          }
        }}
        onDrop={(e) => {
          if (dragOverObjectiveIndex !== null && draggedObjective?.cardId === card.id) {
            handleObjectiveDrop(e, card.id, card.objectives)
          }
        }}
        onDragLeave={(e) => {
          // Only clear if we're leaving the entire container
          const relatedTarget = e.relatedTarget as HTMLElement
          if (!e.currentTarget.contains(relatedTarget)) {
            setDragOverObjectiveIndex(null)
          }
        }}
      >
        {card.objectives.map((objective, objIndex) => (
          <div key={objective.id} data-objective-wrapper className="relative">
            {/* Drop indicator line */}
            {dragOverObjectiveIndex === objIndex && draggedObjective?.cardId === card.id && draggedObjective?.objective.id !== objective.id && (
              <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-green-500 z-10 pointer-events-none"></div>
            )}
            <div
              data-objective-item
              className={`flex items-center gap-3 p-2 rounded-lg group transition-colors duration-200 hover:bg-gray-50 cursor-grab active:cursor-grabbing ${
                justCompletedObjective === `${card.id}-${objective.id}` ? 'bg-purple-50' : ''
              } ${
                draggedObjective?.objective.id === objective.id ? 'opacity-50' : ''
              }`}
              draggable
              onDragStart={(e) => handleObjectiveDragStart(e, card.id, objective)}
              onDragOver={(e) => handleObjectiveDragOver(e, objIndex)}
              onDragLeave={handleObjectiveDragLeave}
              onDragEnd={handleObjectiveDragEnd}
              onDrop={(e) => handleObjectiveDrop(e, card.id, card.objectives)}
            >
            <input
              type="checkbox"
              checked={objective.isChecked}
              onChange={() => handleObjectiveCheck(card.id, objective)}
              className="h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 flex-shrink-0"
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
                  className="flex-1 text-sm px-1 py-0.5 border-b-2 border-purple-500 focus:outline-none"
                  autoFocus
                  onBlur={() => handleUpdateObjectiveText(card.id, objective.id)}
                />
              </form>
            ) : (
              <span 
                onDoubleClick={() => {
                  setEditingObjective({ cardId: card.id, objectiveId: objective.id })
                  setEditingObjectiveText(objective.text)
                }}
                className={`flex-1 text-sm select-none ${objective.isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                title="Double-click to edit"
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
          </div>
        ))}
        {/* Drop indicator for end of list */}
        {dragOverObjectiveIndex === card.objectives.length && draggedObjective?.cardId === card.id && (
          <div className="h-0.5 bg-green-500 mt-1 pointer-events-none"></div>
        )}
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

  // Create a map of all cards with their metadata
  const cardMap = new Map<string, { id: string; type: 'fixed' | 'custom'; title: string; component?: JSX.Element }>()
  
  // Add Asset Management card
  cardMap.set('asset-management', {
    id: 'asset-management',
    type: 'fixed',
    title: 'Asset Management Checklist',
    component: (
      <div className="relative group">
        <div 
          draggable
          onDragStart={(e) => handleCardDragStart(e, 'asset-management', 'fixed')}
          onDragEnd={handleCardDragEnd}
          className="absolute top-0 left-0 right-0 h-20 z-10 cursor-grab active:cursor-grabbing hover:bg-gray-50/50 rounded-t-xl transition-colors"
          title="Drag to reorder card"
        />
        <AssetManagementCard
          assetStatus={assetStatus}
          handleAssetStatusChange={(field) => handleAssetStatusChange(field, !assetStatus[field as keyof AssetManagementStatus])}
          justCompletedTask={justCompletedTask}
          assetChecklistComplete={assetChecklistComplete}
          priorMonth={priorMonth}
          currentMonth={currentMonth}
        />
      </div>
    )
  })
  
  // Add custom cards
  assetCards.forEach(card => {
    cardMap.set(card.id, {
      id: card.id,
      type: 'custom',
      title: card.title
    })
  })
  
  // Add Tax Filings card
  cardMap.set('tax-filings', {
    id: 'tax-filings',
    type: 'fixed',
    title: 'Tax Filings',
    component: (
      <div className="relative group">
        <div 
          draggable
          onDragStart={(e) => handleCardDragStart(e, 'tax-filings', 'fixed')}
          onDragEnd={handleCardDragEnd}
          className="absolute top-0 left-0 right-0 h-20 z-10 cursor-grab active:cursor-grabbing hover:bg-gray-50/50 rounded-t-xl transition-colors"
          title="Drag to reorder card"
        />
        <TaxFilingsCard
          taxReturns={taxReturns}
          propertyTaxH1Paid={propertyTaxH1Paid}
          propertyTaxH2Paid={propertyTaxH2Paid}
          handleTaxReturnChange={handleTaxReturnChange}
          handlePropertyTaxChange={(period) => handlePropertyTaxChange(period, period === 'H1' ? !propertyTaxH1Paid : !propertyTaxH2Paid)}
          justCompletedTask={justCompletedTask}
          currentDate={currentDate}
        />
      </div>
    )
  })

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Key Objectives & Deliverables</h2>
      </div>

      <div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 relative"
        onDragOver={(e) => {
          if (draggedCard) {
            e.preventDefault()
            e.stopPropagation()
            
            // Check if we're at the end of the grid
            const gridRect = e.currentTarget.getBoundingClientRect()
            const children = Array.from(e.currentTarget.children).filter(child => 
              !child.classList.contains('drop-indicator')
            )
            
            if (children.length > 0) {
              const lastChild = children[children.length - 1] as HTMLElement
              const lastChildRect = lastChild.getBoundingClientRect()
              
              // Check if we're to the right of the last card (for horizontal layout)
              if (e.clientX > lastChildRect.right + 20 || e.clientY > lastChildRect.bottom + 20) {
                const allCards = cardOrder
                  .map(id => cardMap.get(id))
                  .filter((card): card is NonNullable<typeof card> => card !== undefined)
                setDragOverCardIndex(allCards.length)
              }
            }
          }
        }}
        onDrop={(e) => {
          if (draggedCard && dragOverCardIndex !== null) {
            const allCards = cardOrder
              .map(id => cardMap.get(id))
              .filter((card): card is NonNullable<typeof card> => card !== undefined)
            handleCardDrop(e, dragOverCardIndex, allCards)
          }
        }}
        onDragLeave={(e) => {
          // Only clear if we're leaving the entire grid
          const relatedTarget = e.relatedTarget as HTMLElement
          if (!e.currentTarget.contains(relatedTarget)) {
            setDragOverCardIndex(null)
          }
        }}
      >
        {(() => {
          
          // Create allCards array based on cardOrder
          const allCards = cardOrder
            .map(id => cardMap.get(id))
            .filter((card): card is NonNullable<typeof card> => card !== undefined)
          
          return allCards.map((cardInfo, index) => (
            <div
              key={cardInfo.id}
              className="relative"
              onDragOver={(e) => handleCardDragOver(e, index)}
              onDrop={(e) => handleCardDrop(e, index, allCards)}
            >
              {/* Drop indicator */}
              {dragOverCardIndex === index && draggedCard && draggedCard.id !== cardInfo.id && (
                <div className="absolute -top-3 left-0 right-0 h-1 bg-green-500 rounded pointer-events-none z-10"></div>
              )}
              
              <div className={`h-full ${draggedCard?.id === cardInfo.id ? 'opacity-50' : ''}`}>
                {cardInfo.type === 'fixed' ? (
                  <div>
                    <Suspense fallback={<CardSkeleton />}>
                      {cardInfo.component}
                    </Suspense>
                  </div>
                ) : (
                  renderCustomCard(
                    assetCards.find(c => c.id === cardInfo.id)!,
                    index,
                    draggedCard?.id === cardInfo.id
                  )
                )}
              </div>
            </div>
          ))
        })()}
        
        {/* Drop indicator for end of list */}
        {dragOverCardIndex === cardOrder.filter(id => cardMap.has(id)).length && draggedCard && (
          <div className="relative">
            <div className="absolute -top-3 left-0 right-0 h-1 bg-green-500 rounded pointer-events-none z-10"></div>
          </div>
        )}

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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, cardId: null })}
        onConfirm={() => deleteConfirm.cardId && handleDeleteCard(deleteConfirm.cardId)}
        title="Delete Card"
        message="Are you sure you want to delete this card and all its objectives? This action cannot be undone."
      />
    </>
  )
}
