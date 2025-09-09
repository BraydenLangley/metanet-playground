import React, { useState, useEffect, useRef } from 'react'
import { Search, Clock, User, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LookupResolver, VerifiableCertificate, Transaction, PushDrop, Utils, ProtoWallet } from '@bsv/sdk'
import { DisplayableIdentity } from '@/types/identity'
import { cn } from '@/lib/utils'

interface IdentitySearchFieldProps {
  onIdentitySelected: (identity: DisplayableIdentity) => void
  className?: string
}

const parseResults = async (lookupResult: any): Promise<VerifiableCertificate[]> => {
  if (lookupResult.type === 'output-list') {
    const parsedResults: VerifiableCertificate[] = []

    for (const output of lookupResult.outputs) {
      try {
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

        const decryptedFields = await verifiableCert.decryptFields(new ProtoWallet('anyone'))
        await verifiableCert.verify()
        verifiableCert.decryptedFields = decryptedFields
        parsedResults.push(verifiableCert)
      } catch (error) {
        console.error('Error parsing certificate:', error)
      }
    }
    return parsedResults
  }
  return []
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

  // Create resolver with host overrides  
  const resolver = new LookupResolver({
    networkPreset: 'mainnet',
    hostOverrides: {
      'ls_identity': ['https://backend.f8ad4f88d28eff5fd4ab1411e2520a31.projects.babbage.systems']
    }
  })

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
      const lookupResults = await resolver.query({
        service: 'ls_identity',
        query: {
          attributes: {
            any: query
          },
          certifiers: ['02cf6cdf466951d8dfc9e7c9367511d0007ed6fba35ed42d425cc412fd6cfd4a17']
        }
      })

      const parsedResults = await parseResults(lookupResults)
      const endTime = performance.now()
      const duration = endTime - startTime

      setSearchTime(duration)

      // Convert to DisplayableIdentity format
      const displayableIdentities: DisplayableIdentity[] = parsedResults.map(cert => {
        const displayName = cert.decryptedFields?.userName ||
          cert.decryptedFields?.email ||
          cert.subject ||
          'Unknown User'

        const identityKey = cert.subject
        const abbreviatedKey = identityKey.length > 10 ?
          `${identityKey.slice(0, 6)}...${identityKey.slice(-4)}` : identityKey

        return {
          identityKey,
          name: displayName,
          avatarURL: cert.decryptedFields?.avatarUrl,
          abbreviatedKey,
          badgeLabel: 'Verified Identity'
        }
      })

      setResults(displayableIdentities)
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