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
}) => <div className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/30">
    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
      <User className="w-6 h-6 text-primary" />
    </div>
    <div className="min-w-0 flex-1">
      <h3 className="font-semibold text-foreground truncate">{identity.name}</h3>
      <p className="text-sm text-muted-foreground font-mono truncate">{identity.abbreviatedKey}</p>
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
  return <div className="h-dvh bg-gradient-background overflow-hidden overscroll-none touch-none relative">
      <main className="h-full flex flex-col px-4 py-4 max-w-sm w-full mx-auto relative z-10">
        {!selectedIdentity ? <div className="flex-1 flex flex-col justify-center space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold gradient-text mb-2">Pay a Friend</h1>
              <p className="text-muted-foreground">Search for someone to pay</p>
            </div>
            
            <IdentitySearchField onIdentitySelected={handleIdentitySelected} className="w-full" />
          </div> : <div className="flex-1 flex flex-col space-y-6 pt-2 overflow-hidden">
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