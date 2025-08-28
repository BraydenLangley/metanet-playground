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
    <div className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search identities..."
          className="pl-10 pr-4 transition-smooth focus:shadow-glow bg-card border-border"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {searchTime !== null && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Search completed in {searchTime.toFixed(0)}ms</span>
        </div>
      )}

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-0 overflow-hidden card-elevated border-border/50">
          {results.length > 0 ? (
            <div className="max-h-80 overflow-auto">
              {results.map((identity, index) => (
                <div
                  key={`${identity.identityKey}-${index}`}
                  onClick={() => handleSelectIdentity(identity)}
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
              ))}
            </div>
          ) : (
            !isLoading && searchTerm.length > 1 && (
              <div className="p-8 text-center text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No identities found for "{searchTerm}"</p>
              </div>
            )
          )}
        </Card>
      )}
    </div>
  )
}