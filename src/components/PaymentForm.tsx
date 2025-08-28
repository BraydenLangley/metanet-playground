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
    <Card className="card-elevated border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Send className="w-5 h-5" />
          Send Payment to {recipient.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium text-muted-foreground">
            Amount (BSV)
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.00000001"
            min="0"
            placeholder="0.00000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-background/50 border-border/50"
          />
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p><strong>Recipient:</strong> {recipient.name}</p>
          <p><strong>Identity Key:</strong> <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">{recipient.abbreviatedKey}</code></p>
        </div>

        <Button 
          onClick={handleSendPayment}
          disabled={isLoading || !amount}
          className="w-full bg-gradient-primary hover:opacity-90 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending Payment...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Payment
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}