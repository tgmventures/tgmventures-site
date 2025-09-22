'use client'

import { AssetManagementStatus, DivisionTask, TaxReturn } from '@/types/goal'
import { useState, Suspense, lazy } from 'react'

// Props interfaces
interface AssetManagementCardProps {
  assetStatus: AssetManagementStatus
  handleAssetStatusChange: (field: keyof Omit<AssetManagementStatus, 'lastUpdated'>) => void
  justCompletedTask: string | null
  assetChecklistComplete: number
  priorMonth: string
  currentMonth: string
}

interface RealEstateCardProps {
  realEstateTasks: DivisionTask[]
  realEstateTasksComplete: number
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

interface VenturesCardProps extends RealEstateCardProps {
  venturesTasks: DivisionTask[]
  venturesTasksComplete: number
}

interface TaxFilingsCardProps {
  taxReturns: TaxReturn[]
  propertyTaxH1Paid: boolean
  propertyTaxH2Paid: boolean
  handleTaxReturnChange: (taxReturnId: string, currentStatus: boolean) => void
  handlePropertyTaxChange: (period: 'H1' | 'H2') => void
  justCompletedTask: string | null
  currentDate: Date
}

// Asset Management Card Component
export function AssetManagementCard({
  assetStatus,
  handleAssetStatusChange,
  justCompletedTask,
  assetChecklistComplete,
  priorMonth,
  currentMonth
}: AssetManagementCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex flex-col min-h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Asset Management</h3>
        <div className="text-xs text-gray-500">{assetChecklistComplete}/7</div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(assetChecklistComplete / 7) * 100}%` }}
        />
      </div>

      <div className="space-y-3">
        <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-booksClosedOut' ? 'bg-green-50' : ''}`}>
          <input
            type="checkbox"
            checked={assetStatus.booksClosedOut}
            onChange={() => handleAssetStatusChange('booksClosedOut')}
            className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
          />
          <span className={`text-sm transition-all duration-300 ${assetStatus.booksClosedOut ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            <strong>{priorMonth}</strong> books closed
          </span>
          {justCompletedTask === 'asset-booksClosedOut' && (
            <span className="text-green-500 ml-auto animate-ping">✓</span>
          )}
        </label>
        
        <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-rentsCollected' ? 'bg-green-50' : ''}`}>
          <input
            type="checkbox"
            checked={assetStatus.rentsCollected}
            onChange={() => handleAssetStatusChange('rentsCollected')}
            className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
          />
          <span className={`text-sm transition-all duration-300 ${assetStatus.rentsCollected ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            All <strong>{currentMonth}</strong> rents collected
          </span>
          {justCompletedTask === 'asset-rentsCollected' && (
            <span className="text-green-500 ml-auto animate-ping">✓</span>
          )}
        </label>
        
        <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-loansPaymentsMade' ? 'bg-green-50' : ''}`}>
          <input
            type="checkbox"
            checked={assetStatus.loansPaymentsMade}
            onChange={() => handleAssetStatusChange('loansPaymentsMade')}
            className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
          />
          <span className={`text-sm transition-all duration-300 ${assetStatus.loansPaymentsMade ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            All loans paid
          </span>
          {justCompletedTask === 'asset-loansPaymentsMade' && (
            <span className="text-green-500 ml-auto animate-ping">✓</span>
          )}
        </label>
        
        <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-vendorsPaymentsMade' ? 'bg-green-50' : ''}`}>
          <input
            type="checkbox"
            checked={assetStatus.vendorsPaymentsMade}
            onChange={() => handleAssetStatusChange('vendorsPaymentsMade')}
            className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
          />
          <span className={`text-sm transition-all duration-300 ${assetStatus.vendorsPaymentsMade ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            All vendors paid
          </span>
          {justCompletedTask === 'asset-vendorsPaymentsMade' && (
            <span className="text-green-500 ml-auto animate-ping">✓</span>
          )}
        </label>
        
        <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-propertyTaxesPaid' ? 'bg-green-50' : ''}`}>
          <input
            type="checkbox"
            checked={assetStatus.propertyTaxesPaid}
            onChange={() => handleAssetStatusChange('propertyTaxesPaid')}
            className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
          />
          <span className={`text-sm transition-all duration-300 ${assetStatus.propertyTaxesPaid ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            All property taxes paid
          </span>
          {justCompletedTask === 'asset-propertyTaxesPaid' && (
            <span className="text-green-500 ml-auto animate-ping">✓</span>
          )}
        </label>
        
        <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-insurancePoliciesActive' ? 'bg-green-50' : ''}`}>
          <input
            type="checkbox"
            checked={assetStatus.insurancePoliciesActive}
            onChange={() => handleAssetStatusChange('insurancePoliciesActive')}
            className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
          />
          <span className={`text-sm transition-all duration-300 ${assetStatus.insurancePoliciesActive ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            All{' '}
            <a 
              href="https://docs.google.com/spreadsheets/d/1rD7CuJ6RqhSPBdROHhYxVjO386wdDWLVRvMDq5pItck/edit?gid=1798179087#gid=1798179087"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-600"
              onClick={(e) => e.stopPropagation()}
            >
              insurance policies
            </a>
            {' '}active
          </span>
          {justCompletedTask === 'asset-insurancePoliciesActive' && (
            <span className="text-green-500 ml-auto animate-ping">✓</span>
          )}
        </label>
        
        <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'asset-entitiesRenewed' ? 'bg-green-50' : ''}`}>
          <input
            type="checkbox"
            checked={assetStatus.entitiesRenewed}
            onChange={() => handleAssetStatusChange('entitiesRenewed')}
            className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 transition-transform hover:scale-110"
          />
          <span className={`text-sm transition-all duration-300 ${assetStatus.entitiesRenewed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            All{' '}
            <a 
              href="https://docs.google.com/spreadsheets/d/1rD7CuJ6RqhSPBdROHhYxVjO386wdDWLVRvMDq5pItck/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-600"
              onClick={(e) => e.stopPropagation()}
            >
              entities
            </a>
            {' '}renewed
          </span>
          {justCompletedTask === 'asset-entitiesRenewed' && (
            <span className="text-green-500 ml-auto animate-ping">✓</span>
          )}
        </label>
      </div>
    </div>
  )
}

// Export other card components as well
export { RealEstateCard } from './RealEstateCard'
export { VenturesCard } from './VenturesCard'
export { TaxFilingsCard } from './TaxFilingsCard'
