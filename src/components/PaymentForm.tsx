import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Send, Loader2 } from 'lucide-react'
import { DisplayableIdentity } from '@/types/identity'
import { useToast } from '@/hooks/use-toast'
import { PeerPayClient } from '@bsv/message-box-client'
import { WalletClient } from '@bsv/sdk'

interface PaymentFormProps {
  recipient: DisplayableIdentity
  onPaymentSent?: () => void
}

const constants = {
  messageboxURL: 'https://messageboxhost.example.com' // Update with actual URL
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ recipient, onPaymentSent }) => {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSendPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const walletClient = new WalletClient()
      const peerPayClient = new PeerPayClient({
        messageBoxHost: constants.messageboxURL,
        walletClient
      })

      const amountInSats = Math.floor(parseFloat(amount) * 100000000) // Convert to satoshis
      const finalRecipientKey = recipient.identityKey

      await peerPayClient.sendLivePayment({ 
        recipient: finalRecipientKey, 
        amount: amountInSats 
      })

      toast({
        title: "Payment Sent!",
        description: `Successfully sent ${amount} BSV to ${recipient.name}`,
      })

      setAmount('')
      onPaymentSent?.()
    } catch (error) {
      console.error('Payment failed:', error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border border-border/50 bg-card">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            Send Payment to {recipient.name}
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm text-muted-foreground">
              Amount (BSV)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.00000001"
              min="0"
              placeholder="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-mono bg-background border-border h-12"
            />
          </div>
          
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><span className="font-medium">Recipient:</span> {recipient.name}</p>
            <p><span className="font-medium">Identity Key:</span> <code className="text-xs font-mono">{recipient.abbreviatedKey}</code></p>
          </div>

          <Button 
            onClick={handleSendPayment}
            disabled={isLoading || !amount}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-base font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Payment...
              </>
            ) : (
              'Send Payment'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}