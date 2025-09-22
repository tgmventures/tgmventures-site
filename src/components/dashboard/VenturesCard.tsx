'use client'

import { DivisionTask } from '@/types/goal'

interface VenturesCardProps {
  venturesTasks: DivisionTask[]
  venturesTasksComplete: number
  handleTaskCheck: (taskId: string, isChecked: boolean, divisionId: string) => void
  handleDeleteTask: (taskId: string, divisionId: string) => void
  handleAddTask: (division: 'real-estate-development' | 'ventures') => void
  handleEditTask: (taskId: string, divisionId: string, newTitle: string) => void
  startEditingTask: (taskId: string, currentTitle: string) => void
  handleDragStart: (e: React.DragEvent, task: DivisionTask) => void
  handleDragOver: (e: React.DragEvent, index: number) => void
  handleDragEnd: () => void
  handleDrop: (e: React.DragEvent, dropIndex: number, tasks: DivisionTask[], divisionId: string) => void
  justCompletedTask: string | null
  editingTaskId: string | null
  editText: string
  setEditText: (text: string) => void
  setEditingTaskId: (id: string | null) => void
  draggedTask: DivisionTask | null
  dragOverIndex: number | null
  addingTask: string | null
  setAddingTask: (task: string | null) => void
  newText: string
  setNewText: (text: string) => void
}

export function VenturesCard({
  venturesTasks,
  venturesTasksComplete,
  handleTaskCheck,
  handleDeleteTask,
  handleAddTask,
  handleEditTask,
  startEditingTask,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  handleDrop,
  justCompletedTask,
  editingTaskId,
  editText,
  setEditText,
  setEditingTaskId,
  draggedTask,
  dragOverIndex,
  addingTask,
  setAddingTask,
  newText,
  setNewText
}: VenturesCardProps) {
  return (
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
  )
}
