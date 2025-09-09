import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { IdentityClient, VerifiableCertificate, Transaction, PushDrop, Utils, ProtoWallet } from '@bsv/sdk'
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

// Memoized certificate parser for better performance
const certificateParser = (() => {
  const parseCache = new Map<string, VerifiableCertificate>()
  
  return {
    async parse(output: any): Promise<VerifiableCertificate | null> {
      try {
        const cacheKey = `${output.beef}-${output.outputIndex}`
        
        if (parseCache.has(cacheKey)) {
          return parseCache.get(cacheKey)!
        }

        const tx = Transaction.fromBEEF(output.beef)
        const decodedOutput = PushDrop.decode(tx.outputs[output.outputIndex].lockingScript)
        const certificate: VerifiableCertificate = JSON.parse(Utils.toUTF8(decodedOutput.fields[0]))

        const verifiableCert = new VerifiableCertificate(
          certificate.type,
          certificate.serialNumber,
          certificate.subject,
          certificate.certifier,
          certificate.revocationOutpoint,
          certificate.fields,
          certificate.keyring,
          certificate.signature
        )

        // Optimize decryption and verification
        const [decryptedFields] = await Promise.all([
          verifiableCert.decryptFields(new ProtoWallet('anyone')),
          verifiableCert.verify()
        ])
        
        verifiableCert.decryptedFields = decryptedFields
        
        // Cache parsed certificate (limit cache size)
        if (parseCache.size > 50) {
          const firstKey = parseCache.keys().next().value
          parseCache.delete(firstKey)
        }
        parseCache.set(cacheKey, verifiableCert)
        
        return verifiableCert
      } catch (error) {
        console.warn('Certificate parsing failed:', error)
        return null
      }
    }
  }
})()

const parseResults = async (lookupResult: any): Promise<VerifiableCertificate[]> => {
  if (lookupResult.type !== 'output-list' || !lookupResult.outputs?.length) {
    return []
  }

  // Parse certificates in parallel for better performance
  const parsePromises = lookupResult.outputs.map((output: any) => 
    certificateParser.parse(output)
  )
  
  const parsedResults = await Promise.all(parsePromises)
  return parsedResults.filter((cert): cert is VerifiableCertificate => cert !== null)
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
      const lookupResults = await identityClient.resolveByAttributes({
        attributes: { any: query }
      })

      // Check if this request is still current
      if (requestId !== requestIdRef.current) return

      const parsedResults = await parseResults(lookupResults)
      const endTime = performance.now()
      const duration = endTime - startTime

      // Convert to DisplayableIdentity format with optimized processing
      const displayableIdentities: DisplayableIdentity[] = parsedResults
        .slice(0, maxResults) // Limit results early
        .map(cert => {
          const decryptedFields = cert.decryptedFields || {}
          const displayName = decryptedFields.userName || 
                            decryptedFields.email || 
                            cert.subject || 
                            'Unknown User'

          const identityKey = cert.subject
          const abbreviatedKey = identityKey.length > 10 
            ? `${identityKey.slice(0, 6)}...${identityKey.slice(-4)}` 
            : identityKey

          return {
            identityKey,
            name: displayName,
            avatarURL: decryptedFields.avatarUrl,
            abbreviatedKey,
            badgeLabel: 'Verified Identity'
          }
        })

      // Cache the results
      searchCache.set(query, displayableIdentities, duration)

      // Final check if request is still current
      if (requestId === requestIdRef.current) {
        setState(prev => ({
          ...prev,
          results: displayableIdentities,
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