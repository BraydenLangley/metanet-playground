import React from 'react'
import { Clock, Zap, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface SearchPerformanceIndicatorProps {
  searchTime: number | null
  cacheHit: boolean
  totalResults: number
  className?: string
}

export const SearchPerformanceIndicator: React.FC<SearchPerformanceIndicatorProps> = React.memo(({
  searchTime,
  cacheHit,
  totalResults,
  className
}) => {
  if (searchTime === null) return null

  const getPerformanceLevel = (time: number) => {
    if (time < 100) return { level: 'excellent', color: 'text-green-400' }
    if (time < 300) return { level: 'good', color: 'text-blue-400' }
    if (time < 800) return { level: 'fair', color: 'text-yellow-400' }
    return { level: 'slow', color: 'text-red-400' }
  }

  const performance = cacheHit ? 
    { level: 'cached', color: 'text-primary' } : 
    getPerformanceLevel(searchTime)

  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
      <div className="flex items-center gap-1">
        {cacheHit ? (
          <Zap className="w-3 h-3 text-primary" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
        <span className={performance.color}>
          {cacheHit ? 'Instant (cached)' : `${searchTime.toFixed(0)}ms`}
        </span>
      </div>
      
      {totalResults > 0 && (
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
        </div>
      )}
      
      {cacheHit && (
        <Badge variant="outline" className="text-xs border-primary/20 text-primary">
          <Zap className="w-2 h-2 mr-1" />
          Cached
        </Badge>
      )}
    </div>
  )
})

SearchPerformanceIndicator.displayName = 'SearchPerformanceIndicator'