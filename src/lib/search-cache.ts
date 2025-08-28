import { DisplayableIdentity } from '@/types/identity'

interface CacheEntry {
  results: DisplayableIdentity[]
  timestamp: number
  searchTime: number
}

class SearchCache {
  private cache = new Map<string, CacheEntry>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes cache
  private readonly MAX_ENTRIES = 100

  private cleanupExpired() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key)
      }
    }
  }

  private evictOldest() {
    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
  }

  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim()
  }

  set(query: string, results: DisplayableIdentity[], searchTime: number) {
    this.cleanupExpired()
    this.evictOldest()
    
    const normalizedQuery = this.normalizeQuery(query)
    this.cache.set(normalizedQuery, {
      results: [...results], // Deep copy to prevent mutations
      timestamp: Date.now(),
      searchTime
    })
  }

  get(query: string): CacheEntry | null {
    const normalizedQuery = this.normalizeQuery(query)
    const entry = this.cache.get(normalizedQuery)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(normalizedQuery)
      return null
    }
    
    return entry
  }

  clear() {
    this.cache.clear()
  }

  // Get cache stats for debugging
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

export const searchCache = new SearchCache()