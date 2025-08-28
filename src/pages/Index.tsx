import React, { useState, useCallback } from 'react';
import { IdentitySearchField } from '@/components/IdentitySearchField';
import { PaymentForm } from '@/components/PaymentForm';
import { DisplayableIdentity } from '@/types/identity';
import { User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Simplified identity display
const IdentityDisplay = React.memo<{
  identity: DisplayableIdentity;
}>(({
  identity
}) => <div className="flex items-center gap-4 p-5 bg-card rounded-3xl border border-border/30">
    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
      <User className="w-7 h-7 text-primary" />
    </div>
    <div>
      <h3 className="font-semibold text-foreground text-lg">{identity.name}</h3>
      <p className="text-base text-muted-foreground font-mono">{identity.abbreviatedKey}</p>
    </div>
  </div>);
IdentityDisplay.displayName = 'IdentityDisplay';
const Index = () => {
  const [selectedIdentity, setSelectedIdentity] = useState<DisplayableIdentity | null>(null);
  const {
    toast
  } = useToast();
  const handleIdentitySelected = useCallback((identity: DisplayableIdentity) => {
    setSelectedIdentity(identity);
  }, []);
  return <div className="min-h-screen bg-gradient-background">
      <main className="container mx-auto px-6 py-6 max-w-sm">
        {!selectedIdentity ? <div className="space-y-6">
            <div className="text-center pt-8">
              <h1 className="text-3xl font-bold gradient-text mb-3">Pay a Friend</h1>
              <p className="text-muted-foreground text-lg">Search for someone to pay</p>
            </div>
            
            <IdentitySearchField onIdentitySelected={handleIdentitySelected} className="w-full" />
          </div> : <div className="space-y-6 pt-2">
            <IdentityDisplay identity={selectedIdentity} />
            <PaymentForm recipient={selectedIdentity} onPaymentSent={() => {
          setSelectedIdentity(null);
          toast({
            description: "Payment sent successfully"
          });
        }} onBack={() => setSelectedIdentity(null)} />
          </div>}
      </main>
    </div>;
};
export default Index;