import React, { useState, useCallback, useMemo } from 'react'
import { Search, User, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SearchPerformanceIndicator } from '@/components/SearchPerformanceIndicator'
import { DisplayableIdentity } from '@/types/identity'
import { useOptimizedSearch } from '@/hooks/use-optimized-search'
import { cn } from '@/lib/utils'

interface IdentitySearchFieldProps {
  onIdentitySelected: (identity: DisplayableIdentity) => void
  className?: string
}

// Memoized search result item for better performance
const SearchResultItem = React.memo<{
  identity: DisplayableIdentity
  index: number
  onSelect: (identity: DisplayableIdentity) => void
}>(({ identity, index, onSelect }) => (
  <div
    onClick={() => onSelect(identity)}
    className="flex items-center gap-3 p-4 hover:bg-accent cursor-pointer transition-smooth border-b border-border/30 last:border-b-0"
  >
    <Avatar className="w-10 h-10">
      <AvatarImage src={identity.avatarURL} alt={identity.name} />
      <AvatarFallback className="bg-primary/10 text-primary">
        <User className="w-4 h-4" />
      </AvatarFallback>
    </Avatar>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-medium text-foreground truncate">
          {identity.name}
        </p>
        {identity.badgeLabel && (
          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground font-mono truncate">
        {identity.abbreviatedKey}
      </p>
    </div>
  </div>
))

SearchResultItem.displayName = 'SearchResultItem'

export const IdentitySearchField: React.FC<IdentitySearchFieldProps> = React.memo(({
  onIdentitySelected,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showResults, setShowResults] = useState(false)
  
  const { results, isLoading, searchTime, error, cacheHit, search } = useOptimizedSearch({
    debounceMs: 100, // Very fast debounce
    minQueryLength: 2,
    maxResults: 30 // Limit results for better performance
  })

  // Memoized search handler
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
    search(value)
    setShowResults(value.length >= 2)
  }, [search])

  // Memoized selection handler
  const handleSelectIdentity = useCallback((identity: DisplayableIdentity) => {
    onIdentitySelected(identity)
    setSearchTerm(identity.name || identity.identityKey)
    setShowResults(false)
  }, [onIdentitySelected])

  // Memoized results list
  const resultsList = useMemo(() => {
    if (!showResults) return null

    if (results.length > 0) {
      return (
        <div className="max-h-80 overflow-auto">
          {results.map((identity, index) => (
            <SearchResultItem
              key={`${identity.identityKey}-${index}`}
              identity={identity}
              index={index}
              onSelect={handleSelectIdentity}
            />
          ))}
        </div>
      )
    }

    if (!isLoading && searchTerm.length > 1) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No identities found for "{searchTerm}"</p>
          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
        </div>
      )
    }

    return null
  }, [showResults, results, isLoading, searchTerm, error, handleSelectIdentity])

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search identities..."
          className="pl-10 pr-12 transition-smooth focus:shadow-glow bg-card border-border"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      <SearchPerformanceIndicator
        searchTime={searchTime}
        cacheHit={cacheHit}
        totalResults={results.length}
        className="mt-2"
      />

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-0 overflow-hidden card-elevated border-border/50 animate-fade-in">
          {resultsList}
        </Card>
      )}
    </div>
  )
})

IdentitySearchField.displayName = 'IdentitySearchField'