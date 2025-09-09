import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DisplayableIdentity, IdentityClient, WalletClient } from '@bsv/sdk';
import { User, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContactSelectorProps {
  onContactSelected: (contact: DisplayableIdentity) => void;
  selectedContact?: DisplayableIdentity | null;
  onContactsLoaded?: (hasContacts: boolean) => void;
}

const ContactSelector = ({ onContactSelected, selectedContact, onContactsLoaded }: ContactSelectorProps) => {
  const [contacts, setContacts] = useState<DisplayableIdentity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const identityClient = new IdentityClient(new WalletClient());

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const contactsData = await identityClient.getContacts();

      const displayableContacts: DisplayableIdentity[] = contactsData.map(contact => ({
        identityKey: contact.identityKey,
        name: contact.name || 'Unknown Contact',
        avatarURL: contact.avatarURL || '',
        abbreviatedKey: contact.identityKey.slice(0, 8) + '...',
        badgeIconURL: contact.badgeIconURL || '',
        badgeLabel: contact.badgeLabel || '',
        badgeClickURL: contact.badgeClickURL || '',
        ...contact.metadata
      }));

      setContacts(displayableContacts);
      onContactsLoaded?.(displayableContacts.length > 0);
    } catch (error) {
      console.error("Failed to load contacts:", error);
      onContactsLoaded?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveContact = async (contact: DisplayableIdentity, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await identityClient.removeContact(contact.identityKey);
      toast({
        title: "Contact removed",
        description: `${contact.name} has been removed from your contacts`,
      });
      loadContacts(); // Reload contacts
    } catch (error) {
      toast({
        title: "Failed to remove contact",
        description: "There was an error removing the contact",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  if (isLoading) {
    return <Card className="p-4"><div>Loading contacts...</div></Card>;
  }

  if (contacts.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted-foreground">
          No contacts yet. Add contacts by scanning QR codes!
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <ScrollArea className="h-48">
        <div className="space-y-2">
          {contacts.map((contact, index) => (
            <Button
              key={contact.identityKey || index}
              variant={selectedContact?.identityKey === contact.identityKey ? "default" : "ghost"}
              className="w-full justify-between h-auto p-3 group"
              onClick={() => onContactSelected(contact)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm text-primary">
                    {contact.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                  </span>
                </div>
                <div className="text-left">
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {contact.identityKey?.slice(0, 16)}...
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleRemoveContact(contact, e)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ContactSelector;