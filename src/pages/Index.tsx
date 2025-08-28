import React, { useState, useCallback } from 'react'
import { IdentitySearchField } from '@/components/IdentitySearchField'
import { SearchPerformanceIndicator } from '@/components/SearchPerformanceIndicator'
import { PaymentForm } from '@/components/PaymentForm'
import { DisplayableIdentity } from '@/types/identity'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Copy, ExternalLink, User, Zap, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

// Memoized identity display component
const IdentityDisplay = React.memo<{
  identity: DisplayableIdentity
  onCopy: (text: string, label: string) => void
}>(({ identity, onCopy }) => (
  <Card className="card-elevated border-border/50 bg-card/80 backdrop-blur-sm">
    <CardContent className="p-8">
      <div className="flex items-start gap-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src={identity.avatarURL} alt={identity.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl">
            <User className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-2xl font-bold text-foreground">
              {identity.name}
            </h3>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Database className="w-3 h-3 mr-1" />
              Verified Identity
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Identity Key:</span>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {identity.abbreviatedKey}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(identity.identityKey, 'Identity key')}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(identity.identityKey, 'Full identity key')}
                className="border-primary/20 hover:bg-primary/10"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Full Key
              </Button>
              
              {identity.badgeClickURL && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(identity.badgeClickURL, '_blank')}
                  className="border-primary/20 hover:bg-primary/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Learn More
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
))

IdentityDisplay.displayName = 'IdentityDisplay'

const Index = () => {
  const [selectedIdentity, setSelectedIdentity] = useState<DisplayableIdentity | null>(null)
  const { toast } = useToast()

  const handleIdentitySelected = useCallback((identity: DisplayableIdentity) => {
    setSelectedIdentity(identity)
    toast({
      title: "Identity Selected",
      description: `Selected ${identity.name}`,
    })
  }, [toast])

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }, [toast])

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">BSV Identity Search</h1>
              <p className="text-sm text-muted-foreground">Discover and verify blockchain identities</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 gradient-text">
              Find Verified Identities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Search the BSV blockchain for verified identities. Discover users by name, email, or identity key with real-time certificate verification.
            </p>
          </div>

          {/* Search Section */}
          <div className="flex justify-center mb-12">
            <IdentitySearchField 
              onIdentitySelected={handleIdentitySelected}
              className="w-full max-w-lg"
            />
          </div>

          {/* Selected Identity Display */}
          {selectedIdentity && (
            <div className="space-y-6">
              <IdentityDisplay 
                identity={selectedIdentity}
                onCopy={copyToClipboard}
              />
              <PaymentForm 
                recipient={selectedIdentity}
                onPaymentSent={() => {
                  toast({
                    title: "Payment Complete",
                    description: "Transaction has been broadcasted to the network",
                  })
                }}
              />
            </div>
          )}

          {/* Info Section */}
          {!selectedIdentity && (
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center">
                <Database className="w-8 h-8 text-primary/50" />
              </div>
              <h3 className="text-lg font-medium mb-2">Ready to Search</h3>
              <p className="max-w-md mx-auto">
                Start typing to search for verified identities on the BSV blockchain. 
                Results are cached for ultra-fast repeated searches.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
