import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DisplayableIdentity } from '@/types/identity'
import { Send, User, X } from 'lucide-react'

interface PaymentAmountDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: number) => void
  recipient: DisplayableIdentity | null
  isProcessing?: boolean
}

export const PaymentAmountDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  recipient, 
  isProcessing = false 
}: PaymentAmountDialogProps) => {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const numAmount = parseInt(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }
    
    setError('')
    onConfirm(numAmount)
  }

  /**
   * Resets state and closes dialog
   */
  const handleClose = () => {
    setAmount('')
    setError('')
    onClose()
  }

  /**
   * Handles amount input changes with numeric validation
   */
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value)
      setError('')
    }
  }

  // Quick amount buttons
  const quickAmounts = [100, 500, 1000, 5000]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              <Send className="h-5 w-5" />
            </div>
            Send Payment
          </DialogTitle>
        </DialogHeader>
        
        {recipient && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {recipient.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {recipient.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                @{recipient.abbreviatedKey}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount (sats)
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                placeholder="Enter amount in sats"
                value={amount}
                onChange={handleAmountChange}
                className={`text-lg h-12 pr-12 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                disabled={isProcessing}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                sats
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <X className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {/* Quick amount buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick amounts</Label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  {quickAmount}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !amount}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send {amount && `${amount} sats`}
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}