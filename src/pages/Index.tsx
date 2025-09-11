import React, { useState, useCallback } from 'react';
import { IdentitySearchField } from '@/components/IdentitySearchField';
import { PaymentForm } from '@/components/PaymentForm';
import ContactSelector from '@/components/ContactSelector';
import AddContactModal from '@/components/AddContactModal';
import { MentionTextArea } from '@/components/MentionTextArea';
import { DisplayableIdentity } from '@/types/identity';
import { User, Plus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [showAddContact, setShowAddContact] = useState(false);
  const [hasContacts, setHasContacts] = useState(false);
  const { toast } = useToast();
  
  const handleIdentitySelected = useCallback((identity: DisplayableIdentity) => {
    setSelectedIdentity(identity);
  }, []);

  const handleContactAdded = () => {
    setShowAddContact(false);
  };

  return <div className="h-dvh bg-gradient-background overflow-hidden overscroll-none touch-none relative">
      <main className="h-full flex flex-col px-4 py-4 max-w-sm w-full mx-auto relative z-10">
        {!selectedIdentity ? <div className="flex-1 flex flex-col justify-center space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold gradient-text mb-2">Pay a Friend</h1>
              <p className="text-muted-foreground">Search or select from contacts</p>
            </div>

            {/* Mention Text Area Proof of Concept */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Test @ Mentions (Proof of Concept)</h3>
              <MentionTextArea placeholder="Type @ to mention someone..." />
            </div>
            
            <Tabs defaultValue="search" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="contacts" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contacts
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="search" className="space-y-4">
                <IdentitySearchField onIdentitySelected={handleIdentitySelected} className="w-full" />
              </TabsContent>
              
              <TabsContent value="contacts" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Your Contacts</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddContact(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
                <ContactSelector
                  onContactSelected={handleIdentitySelected}
                  selectedContact={selectedIdentity}
                  onContactsLoaded={setHasContacts}
                />
              </TabsContent>
            </Tabs>
          </div> : <div className="flex-1 flex flex-col overflow-hidden">
            <PaymentForm recipient={selectedIdentity} onPaymentSent={() => {
          setSelectedIdentity(null);
          toast({
            description: "Payment sent successfully"
          });
        }} onBack={() => setSelectedIdentity(null)} />
          </div>}
      </main>

      {/* Add Contact Modal */}
      <AddContactModal
        open={showAddContact}
        onClose={() => setShowAddContact(false)}
        onContactAdded={handleContactAdded}
      />
    </div>;
};

export default Index;