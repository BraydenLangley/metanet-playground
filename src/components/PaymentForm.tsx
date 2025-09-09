import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { DisplayableIdentity } from '@/types/identity'
import { useToast } from '@/hooks/use-toast'
import { usePeerPay } from '@/contexts/PeerPayContext'

interface PaymentFormProps {
  recipient: DisplayableIdentity
  onPaymentSent?: () => void
  onBack?: () => void
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ recipient, onPaymentSent, onBack }) => {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { peerPayClient } = usePeerPay()

  const handleSendPayment = async () => {
    if (!amount || parseInt(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      })
      return
    }

    if (!peerPayClient) {
      toast({
        description: "Payment client not ready. Please try again.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const amountInSats = parseInt(amount)
      const finalRecipientKey = recipient.identityKey

      await peerPayClient.sendPayment({ 
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
    <div className="h-full flex flex-col overscroll-none overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2 rounded-full shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 text-center">
          <p className="text-sm text-muted-foreground">Send to</p>
          <p className="font-semibold truncate px-2">{recipient.name}</p>
        </div>
        <div className="w-9"></div> {/* Spacer for balance */}
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Amount</p>
          <Input
            type="number"
            step="1"
            min="1"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-4xl font-mono text-center h-20 border-0 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <p className="text-lg text-muted-foreground">sats</p>
        </div>

        <Button 
          onClick={handleSendPayment}
          disabled={isLoading || !amount || parseInt(amount) <= 0}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl touch-manipulation"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            `Send${amount ? ` ${amount} sats` : ''}`
          )}
        </Button>
      </div>
    </div>
  )
}