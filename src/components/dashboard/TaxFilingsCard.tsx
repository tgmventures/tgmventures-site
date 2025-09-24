'use client'

import { TaxReturn } from '@/types/goal'

interface TaxFilingsCardProps {
  taxReturns: TaxReturn[]
  propertyTaxH1Paid: boolean
  propertyTaxH2Paid: boolean
  handleTaxReturnChange: (taxReturnId: string, currentStatus: boolean) => void
  handlePropertyTaxChange: (period: 'H1' | 'H2') => void
  justCompletedTask: string | null
  currentDate: Date
}

export function TaxFilingsCard({
  taxReturns,
  propertyTaxH1Paid,
  propertyTaxH2Paid,
  handleTaxReturnChange,
  handlePropertyTaxChange,
  justCompletedTask,
  currentDate
}: TaxFilingsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex flex-col min-h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tax Filings</h3>
        <div className="text-xs text-gray-500">
          {taxReturns.filter(t => t.isFiled).length + (propertyTaxH1Paid ? 1 : 0) + (propertyTaxH2Paid ? 1 : 0)}/{taxReturns.length + 2}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: taxReturns.length + 2 > 0 
              ? `${((taxReturns.filter(t => t.isFiled).length + (propertyTaxH1Paid ? 1 : 0) + (propertyTaxH2Paid ? 1 : 0)) / (taxReturns.length + 2)) * 100}%` 
              : '0%' 
          }}
        />
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto px-2 -mx-2">
        {taxReturns.map(taxReturn => (
          <label key={taxReturn.id} className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 ${justCompletedTask === `tax-${taxReturn.id}` ? 'bg-purple-50' : ''}`}>
            <input
              type="checkbox"
              checked={taxReturn.isFiled}
              onChange={() => handleTaxReturnChange(taxReturn.id, taxReturn.isFiled)}
              className="h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 flex-shrink-0"
            />
            <span className={`text-sm transition-all duration-300 flex-1 ${taxReturn.isFiled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {taxReturn.year} {taxReturn.country} Tax Return Filed - {taxReturn.entity}
            </span>
            {justCompletedTask === `tax-${taxReturn.id}` && (
              <span className="text-purple-500 animate-ping">✓</span>
            )}
          </label>
        ))}
        
        {/* Property Tax Items */}
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-3">
          <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'property-tax-h1' ? 'bg-purple-50' : ''}`}>
            <input
              type="checkbox"
              checked={propertyTaxH1Paid}
              onChange={() => handlePropertyTaxChange('H1')}
              className="h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 flex-shrink-0"
            />
            <span className={`text-sm transition-all duration-300 flex-1 ${propertyTaxH1Paid ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              All {currentDate.getFullYear()} H1 Property Taxes Paid
            </span>
            {justCompletedTask === 'property-tax-h1' && (
              <span className="text-purple-500 animate-ping">✓</span>
            )}
          </label>
          
          <label className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 ${justCompletedTask === 'property-tax-h2' ? 'bg-purple-50' : ''}`}>
            <input
              type="checkbox"
              checked={propertyTaxH2Paid}
              onChange={() => handlePropertyTaxChange('H2')}
              className="h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 flex-shrink-0"
            />
            <span className={`text-sm transition-all duration-300 flex-1 ${propertyTaxH2Paid ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              All {currentDate.getFullYear()} H2 Property Taxes Paid
            </span>
            {justCompletedTask === 'property-tax-h2' && (
              <span className="text-purple-500 animate-ping">✓</span>
            )}
          </label>
        </div>
      </div>
    </div>
  )
}
