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
    <div className="h-full flex flex-col space-y-6 overscroll-none overflow-hidden">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2 rounded-full shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold truncate">Send to {recipient.name}</h2>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        <Input
          type="number"
          step="1"
          min="1"
          placeholder="Amount in sats"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-xl font-mono text-center h-14 text-foreground bg-card border-border/50 rounded-2xl touch-manipulation"
          autoFocus
        />

        <Button 
          onClick={handleSendPayment}
          disabled={isLoading || !amount || parseInt(amount) <= 0}
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl touch-manipulation"
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