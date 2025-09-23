'use client'

import { useState, useEffect } from 'react'
import { AssetManagementCard, AssetObjective } from '@/lib/firebase/asset-management-cards'
import {
  getAssetManagementCards,
  createAssetManagementCard,
  updateAssetManagementCardTitle,
  deleteAssetManagementCard,
  addObjectiveToAssetCard,
  updateAssetObjectiveStatus,
  updateAssetObjectiveText,
  deleteObjectiveFromAssetCard,
  reorderAssetManagementCards,
  subscribeToAssetManagementCards
} from '@/lib/firebase/asset-management-cards'

interface AssetManagementCardSystemProps {
  userEmail?: string;
  userName?: string;
  setShowSuccessToast?: (show: boolean) => void;
  setWeeklyCompletedCount?: (fn: (prev: number) => number) => void;
  incrementWeeklyCount?: () => Promise<void>;
  decrementWeeklyCount?: () => Promise<void>;
}

export function AssetManagementCardSystem({ 
  userEmail, 
  userName, 
  setShowSuccessToast, 
  setWeeklyCompletedCount, 
  incrementWeeklyCount, 
  decrementWeeklyCount 
}: AssetManagementCardSystemProps) {
  const [cards, setCards] = useState<AssetManagementCard[]>([])
  const [addingCard, setAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [addingObjective, setAddingObjective] = useState<string | null>(null)
  const [newObjectiveText, setNewObjectiveText] = useState('')
  const [editingObjective, setEditingObjective] = useState<{ cardId: string; objectiveId: string } | null>(null)
  const [editingObjectiveText, setEditingObjectiveText] = useState('')
  const [draggedCard, setDraggedCard] = useState<AssetManagementCard | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [justCompletedObjective, setJustCompletedObjective] = useState<string | null>(null)

  // Load cards and subscribe to changes
  useEffect(() => {
    const loadCards = async () => {
      const assetCards = await getAssetManagementCards()
      setCards(assetCards)
    }
    
    loadCards()
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToAssetManagementCards(setCards)
    
    return () => unsubscribe()
  }, [])

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

  const handleObjectiveCheck = async (cardId: string, objective: AssetObjective) => {
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, card: AssetManagementCard) => {
    setDraggedCard(card)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedCard(null)
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (!draggedCard || !cards.find(c => c.id === draggedCard.id)) {
      handleDragEnd()
      return
    }

    const draggedIndex = cards.findIndex(c => c.id === draggedCard.id)
    
    if (draggedIndex === dropIndex) {
      handleDragEnd()
      return
    }

    // Create a new array with the reordered cards
    const reorderedCards = [...cards]
    reorderedCards.splice(draggedIndex, 1)
    reorderedCards.splice(dropIndex, 0, draggedCard)
    
    // Assign new order values
    const cardIds = reorderedCards.map(c => c.id)
    const newOrders = reorderedCards.map((_, index) => index)
    
    // Update local state immediately for responsive UI
    setCards(reorderedCards.map((card, index) => ({ ...card, order: index })))
    
    // Update in Firestore
    try {
      await reorderAssetManagementCards(cardIds, newOrders)
    } catch (error) {
      console.error('Error reordering cards:', error)
      // Reload cards on error
      const freshCards = await getAssetManagementCards()
      setCards(freshCards)
    }
    
    handleDragEnd()
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Asset Management Objectives</h2>
        <button
          onClick={() => setAddingCard(true)}
          className="w-7 h-7 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all duration-200 flex items-center justify-center hover:scale-110"
          title="Add new card"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 ${
              card.isCustom ? 'cursor-move' : ''
            } ${
              dragOverIndex === index && draggedCard?.id !== card.id ? 'border-2 border-green-500' : ''
            } ${draggedCard?.id === card.id ? 'opacity-50' : ''}`}
            draggable={card.isCustom}
            onDragStart={(e) => card.isCustom && handleDragStart(e, card)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, index)}
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
              {!card.isCustom && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Default</span>
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
        ))}

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
    </div>
  )
}
