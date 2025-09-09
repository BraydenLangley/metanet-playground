import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { IdentityClient, WalletClient, DisplayableIdentity } from '@bsv/sdk';
import QRScannerComponent from "./QRScanner";

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
  onContactAdded: () => void;
}

const AddContactModal = ({ open, onClose, onContactAdded }: AddContactModalProps) => {
  const [contactName, setContactName] = useState("");
  const [scannedKey, setScannedKey] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const identityClient = new IdentityClient(new WalletClient());

  const handleScanSuccess = (data: string) => {
    // Handle different QR code formats
    let identityKey = data;
    try {
      const parsed = JSON.parse(data);
      if (parsed.publicKey) {
        identityKey = parsed.publicKey;
      }
    } catch {
      // Use raw data if not JSON
      identityKey = data;
    }
    
    setScannedKey(identityKey);
    setIsScanning(false);
  };

  const handleSaveContact = async () => {
    if (!contactName.trim() || !scannedKey.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a name and scan an identity key",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const displayableIdentity: DisplayableIdentity = {
        name: contactName.trim(),
        identityKey: scannedKey,
        avatarURL: "",
        abbreviatedKey: scannedKey.substring(0, 8) + "...",
        badgeIconURL: "",
        badgeLabel: "",
        badgeClickURL: ""
      };

      await identityClient.saveContact(displayableIdentity);

      toast({
        title: "Contact saved!",
        description: `${contactName} has been added to your contacts`,
      });

      onContactAdded();
      handleClose();
    } catch (error) {
      toast({
        title: "Failed to save contact",
        description: "There was an error saving the contact",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsScanning(false);
    setContactName("");
    setScannedKey("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!scannedKey ? (
            <QRScannerComponent
              onScanSuccess={handleScanSuccess}
              isScanning={isScanning}
              onStartScanning={() => setIsScanning(true)}
              onStopScanning={() => setIsScanning(false)}
            />
          ) : (
            <div className="space-y-4">
              {/* Show scanned key confirmation */}
              <div className="p-3 bg-accent rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Identity key scanned!</span>
                </div>
              </div>

              {/* Contact name input */}
              <div className="space-y-2">
                <Label htmlFor="contact-name">Contact Name</Label>
                <Input
                  id="contact-name"
                  placeholder="Enter contact name..."
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setScannedKey("")}
                  className="flex-1"
                >
                  Scan Again
                </Button>
                <Button
                  onClick={handleSaveContact}
                  disabled={isSaving || !contactName.trim()}
                  className="flex-1"
                >
                  {isSaving ? "Saving..." : "Save Contact"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddContactModal;