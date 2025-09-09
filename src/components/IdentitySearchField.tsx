import React, { useState, useEffect, useRef } from 'react'
import { Search, Clock, User, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { IdentityClient } from '@bsv/sdk'
import { DisplayableIdentity } from '@/types/identity'
import { cn } from '@/lib/utils'

interface IdentitySearchFieldProps {
  onIdentitySelected: (identity: DisplayableIdentity) => void
  className?: string
}


export const IdentitySearchField: React.FC<IdentitySearchFieldProps> = ({
  onIdentitySelected,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<DisplayableIdentity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [searchTime, setSearchTime] = useState<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Create identity client
  const identityClient = new IdentityClient()

  const performSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    const startTime = performance.now()

    try {
      const results = await identityClient.resolveByAttributes({
        attributes: {
          any: query
        }
      })

      const endTime = performance.now()
      const duration = endTime - startTime
      setSearchTime(duration)

      setResults(results)
      setShowResults(true)
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return
      }
      console.error('Search error:', error)
      setResults([])
      setShowResults(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  const handleSelectIdentity = (identity: DisplayableIdentity) => {
    onIdentitySelected(identity)
    setSearchTerm(identity.name || identity.identityKey)
    setShowResults(false)
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Name, email, or identity key..."
          className="pl-10 pr-4 h-12 text-base bg-card border-border/50 rounded-2xl focus:shadow-glow transition-smooth touch-manipulation w-full"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>


      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border/30 rounded-2xl shadow-lg overflow-hidden max-w-full">
          {results.length > 0 ? (
            <div className="max-h-60 overflow-auto">
              {results.map((identity, index) => (
                <div
                  key={`${identity.identityKey}-${index}`}
                  onClick={() => handleSelectIdentity(identity)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 cursor-pointer transition-colors border-b border-border/20 last:border-b-0 touch-manipulation min-h-[52px]"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {identity.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {identity.abbreviatedKey}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isLoading && searchTerm.length > 1 && (
              <div className="p-6 text-center text-muted-foreground">
                <p className="text-sm">No results found</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}