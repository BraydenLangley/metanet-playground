import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { DisplayableIdentity } from '@/types/identity'
import { useToast } from '@/hooks/use-toast'
import { PeerPayClient } from '@bsv/message-box-client'
import { WalletClient } from '@bsv/sdk'

interface PaymentFormProps {
  recipient: DisplayableIdentity
  onPaymentSent?: () => void
  onBack?: () => void
}

const constants = {
  messageboxURL: 'https://messagebox.babbage.systems' // Update with actual URL
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ recipient, onPaymentSent, onBack }) => {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSendPayment = async () => {
    if (!amount || parseInt(amount) <= 0) {
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

      const amountInSats = parseInt(amount)
      const finalRecipientKey = recipient.identityKey

      await peerPayClient.sendLivePayment({ 
        recipient: finalRecipientKey, 
        amount: amountInSats 
      })

      toast({ description: `Sent ${amount} sats to ${recipient.name}` })
      setAmount('')
      onPaymentSent?.()
    } catch (error) {
      console.error('Payment failed:', error)
      toast({
        description: error instanceof Error ? error.message : "Payment failed",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="lg" onClick={onBack} className="p-3 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-xl font-semibold">Send to {recipient.name}</h2>
      </div>

      <div className="space-y-6">
        <Input
          type="number"
          step="1"
          min="1"
          placeholder="Amount in sats"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-3xl font-mono text-center h-20 text-foreground bg-card border-border/50 rounded-3xl touch-manipulation"
          autoFocus
        />

        <Button 
          onClick={handleSendPayment}
          disabled={isLoading || !amount || parseInt(amount) <= 0}
          className="w-full h-16 text-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-3xl touch-manipulation"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            `Send ${amount || '0'} sats`
          )}
        </Button>
      </div>
    </div>
  )
}