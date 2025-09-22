export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col min-h-[500px] animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-8"></div>
      </div>
      
      {/* Progress Bar Skeleton */}
      <div className="h-1 bg-gray-200 rounded-full mb-4 overflow-hidden"></div>

      <div className="space-y-3 flex-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
