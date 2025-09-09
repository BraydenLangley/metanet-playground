import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { IdentityClient } from '@bsv/sdk'
import { DisplayableIdentity } from '@/types/identity'
import { searchCache } from '@/lib/search-cache'

interface UseOptimizedSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  maxResults?: number
}

interface SearchState {
  results: DisplayableIdentity[]
  isLoading: boolean
  searchTime: number | null
  error: string | null
  cacheHit: boolean
}


export const useOptimizedSearch = (options: UseOptimizedSearchOptions = {}) => {
  const {
    debounceMs = 150, // Reduced from 300ms for faster response
    minQueryLength = 2,
    maxResults = 50
  } = options

  const [state, setState] = useState<SearchState>({
    results: [],
    isLoading: false,
    searchTime: null,
    error: null,
    cacheHit: false
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const requestIdRef = useRef<number>(0)

  // Memoized identity client to prevent recreation
  const identityClient = useMemo(() => new IdentityClient(), [])

  const performSearch = useCallback(async (query: string, requestId: number) => {
    if (!query.trim() || query.length < minQueryLength) {
      setState(prev => ({
        ...prev,
        results: [],
        isLoading: false,
        searchTime: null,
        error: null,
        cacheHit: false
      }))
      return
    }

    // Check cache first
    const cachedResult = searchCache.get(query)
    if (cachedResult) {
      setState(prev => ({
        ...prev,
        results: cachedResult.results.slice(0, maxResults),
        isLoading: false,
        searchTime: cachedResult.searchTime,
        error: null,
        cacheHit: true
      }))
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setState(prev => ({ ...prev, isLoading: true, error: null, cacheHit: false }))
    
    const startTime = performance.now()

    try {
      const results = await identityClient.resolveByAttributes({
        attributes: { any: query }
      })

      // Check if this request is still current
      if (requestId !== requestIdRef.current) return

      const endTime = performance.now()
      const duration = endTime - startTime

      // Limit results and cache them
      const limitedResults = results.slice(0, maxResults)
      searchCache.set(query, limitedResults, duration)

      // Final check if request is still current
      if (requestId === requestIdRef.current) {
        setState(prev => ({
          ...prev,
          results: limitedResults,
          isLoading: false,
          searchTime: duration,
          error: null,
          cacheHit: false
        }))
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || requestId !== requestIdRef.current) {
        return
      }
      
      console.error('Search error:', error)
      setState(prev => ({
        ...prev,
        results: [],
        isLoading: false,
        searchTime: null,
        error: error.message || 'Search failed',
        cacheHit: false
      }))
    }
  }, [identityClient, minQueryLength, maxResults])

  const search = useCallback((query: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Increment request ID for race condition handling
    const requestId = ++requestIdRef.current

    // Immediate execution for cached results or short debounce for new searches
    const cachedResult = searchCache.get(query)
    const delay = cachedResult ? 0 : debounceMs

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query, requestId)
    }, delay)
  }, [performSearch, debounceMs])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    ...state,
    search,
    clearCache: searchCache.clear.bind(searchCache),
    getCacheStats: searchCache.getStats.bind(searchCache)
  }
}