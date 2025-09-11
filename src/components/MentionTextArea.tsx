import { useState, useRef, useCallback, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useOptimizedSearch } from '@/hooks/use-optimized-search'
import { DisplayableIdentity } from '@/types/identity'
import { useMetanetPlayground } from '@/contexts/MetanetPlaygroundContext'
import { useToast } from '@/hooks/use-toast'
import { PaymentAmountDialog } from '@/components/PaymentAmountDialog'
import { User, Send } from 'lucide-react'

interface DropdownPosition {
  top: number
  left: number
}

interface MentionTextAreaProps {
  placeholder?: string
  className?: string
}

export const MentionTextArea = ({ placeholder, className }: MentionTextAreaProps) => {
  const [text, setText] = useState('')
  const [mentionQuery, setMentionQuery] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionStart, setMentionStart] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0 })
  const [isPaymentMode, setIsPaymentMode] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<DisplayableIdentity | null>(null)
  
  // Hooks for state management and Metanet functionality
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { results, search, isLoading } = useOptimizedSearch({ maxResults: 5 })
  const { metanetClient } = useMetanetPlayground()
  const { toast } = useToast()

  // Calculate cursor position in pixels
  const getCaretCoordinates = useCallback((element: HTMLTextAreaElement, position: number) => {
    const div = document.createElement('div')
    const span = document.createElement('span')
    
    const style = div.style
    const computed = getComputedStyle(element)
    
    // Copy the styling from the textarea
    style.whiteSpace = 'pre-wrap'
    style.wordWrap = 'break-word'
    style.position = 'absolute'
    style.visibility = 'hidden'
    style.top = '0'
    style.left = '0'
    style.width = computed.width
    style.height = computed.height
    style.padding = computed.padding
    style.margin = computed.margin
    style.border = computed.border
    style.fontFamily = computed.fontFamily
    style.fontSize = computed.fontSize
    style.fontWeight = computed.fontWeight
    style.lineHeight = computed.lineHeight
    style.letterSpacing = computed.letterSpacing
    
    div.textContent = element.value.substring(0, position)
    span.textContent = element.value.substring(position) || '.'
    
    div.appendChild(span)
    document.body.appendChild(div)
    
    const coordinates = {
      top: span.offsetTop + parseInt(computed.borderTopWidth),
      left: span.offsetLeft + parseInt(computed.borderLeftWidth)
    }
    
    document.body.removeChild(div)
    return coordinates
  }, [])

  // Check for /pay @user pattern
  const detectPaymentCommand = useCallback((text: string, cursorPosition: number) => {
    const beforeCursor = text.substring(0, cursorPosition)
    const payPattern = /\/pay\s+@([^@\s]*)?$/
    const match = beforeCursor.match(payPattern)
    
    if (match) {
      setIsPaymentMode(true)
      return {
        isPayCommand: true,
        query: match[1] || '',
        startIndex: beforeCursor.lastIndexOf('@') + 1
      }
    }
    
    setIsPaymentMode(false)
    return { isPayCommand: false, query: '', startIndex: -1 }
  }, [])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart
    
    setText(value)
    
    // Check for payment command first
    const payCommand = detectPaymentCommand(value, cursorPosition)
    
    if (payCommand.isPayCommand) {
      const query = payCommand.query
      setMentionQuery(query)
      setMentionStart(payCommand.startIndex - 1) // -1 to include @
      setShowMentions(true)
      setSelectedIndex(0)
      
      // Calculate position of @ symbol
      if (textareaRef.current) {
        const textareaRect = textareaRef.current.getBoundingClientRect()
        const caretCoords = getCaretCoordinates(textareaRef.current, payCommand.startIndex)
        
        setDropdownPosition({
          top: textareaRect.top + caretCoords.top + 20,
          left: textareaRect.left + caretCoords.left
        })
      }
      
      if (query.length > 0) {
        search(query)
      }
      return
    }
    
    // Regular @ mention detection
    const beforeCursor = value.substring(0, cursorPosition)
    const lastAtIndex = beforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      // Check if there's a space or newline after the @ (which would end the mention)
      const afterAt = beforeCursor.substring(lastAtIndex + 1)
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        const query = afterAt
        setMentionQuery(query)
        setMentionStart(lastAtIndex)
        setShowMentions(true)
        setSelectedIndex(0)
        
        // Calculate position of @ symbol
        if (textareaRef.current) {
          const textareaRect = textareaRef.current.getBoundingClientRect()
          const caretCoords = getCaretCoordinates(textareaRef.current, lastAtIndex + 1)
          
          setDropdownPosition({
            top: textareaRect.top + caretCoords.top + 20, // Offset below the line
            left: textareaRect.left + caretCoords.left
          })
        }
        
        if (query.length > 0) {
          search(query)
        }
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }, [search, getCaretCoordinates, detectPaymentCommand])

  /**
   * Processes payment with specified amount using Metanet client
   */
  const processPaymentWithAmount = useCallback(async (amount: number) => {
    if (!selectedRecipient || !metanetClient) {
      toast({
        title: "Payment Error",
        description: "Payment client not ready. Please try again.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    
    try {
      await metanetClient.sendPayment({
        recipient: selectedRecipient.identityKey, 
        amount: amount 
      })

      toast({ 
        title: "Payment Sent!",
        description: `Sent ${amount} sats to ${selectedRecipient.name}` 
      })
      
      setText('')
      setShowMentions(false)
      setShowPaymentDialog(false)
      setSelectedRecipient(null)
    } catch (error) {
      console.error('Payment failed:', error)
      toast({
        title: "Payment Failed",
        description: "Failed to send payment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }, [selectedRecipient, metanetClient, toast])

  const processPayment = useCallback(async (identity: DisplayableIdentity) => {
    if (!metanetClient) {
      toast({
        title: "Payment Error",
        description: "Payment client not ready. Please try again.",
        variant: "destructive"
      })
      return
    }

    // Extract amount from the command (look for numbers)
    const payCommandMatch = text.match(/\/pay\s+@[^@\s]*\s+(\d+)/i)
    const amount = payCommandMatch ? parseInt(payCommandMatch[1]) : null

    if (amount && amount > 0) {
      // If amount is specified in command, use it directly
      setIsProcessing(true)
      
      try {
        await metanetClient.sendPayment({ 
          recipient: identity.identityKey, 
          amount: amount 
        })

        toast({ 
          title: "Payment Sent!",
          description: `Sent ${amount} sats to ${identity.name}` 
        })
        
        setText('')
        setShowMentions(false)
      } catch (error) {
        console.error('Payment failed:', error)
        toast({
          title: "Payment Failed",
          description: "Failed to send payment. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsProcessing(false)
      }
    } else {
      // If no amount specified, show dialog
      setSelectedRecipient(identity)
      setShowPaymentDialog(true)
      setShowMentions(false)
    }
  }, [text, metanetClient, toast])

  const insertMention = useCallback((identity: DisplayableIdentity) => {
    if (!textareaRef.current) return
    
    // If in payment mode, process payment instead of just inserting mention
    if (isPaymentMode) {
      processPayment(identity)
      return
    }
    
    const beforeMention = text.substring(0, mentionStart)
    const afterMention = text.substring(mentionStart + mentionQuery.length + 1) // +1 for the @
    const mentionText = `@${identity.name}`
    
    const newText = beforeMention + mentionText + ' ' + afterMention
    setText(newText)
    setShowMentions(false)
    
    // Focus back to textarea and position cursor after the mention
    const newCursorPosition = beforeMention.length + mentionText.length + 1
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
  }, [text, mentionStart, mentionQuery, isPaymentMode, processPayment])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showMentions || results.length === 0) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      insertMention(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowMentions(false)
    }
  }, [showMentions, results, selectedIndex, insertMention])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Type @ to mention someone or /pay @user to send payment..."}
        className={className}
        disabled={isProcessing}
        rows={4}
      />
      
      {showMentions && (isLoading || results.length > 0) && (
        <div 
          className="fixed bg-white dark:bg-gray-800 border-0 shadow-xl rounded-lg z-[100] max-h-64 overflow-y-auto w-72 py-2 animate-fade-in"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          {isLoading && results.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Searching identities...
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Finding matches on the network
                </div>
              </div>
            </div>
          ) : (
            results.map((identity, index) => (
            <div
              key={identity.identityKey}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 ${
                index === selectedIndex 
                  ? 'bg-blue-50 dark:bg-blue-900/30' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => insertMention(identity)}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {identity.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                  {identity.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{identity.abbreviatedKey}
                </div>
              </div>
              {isPaymentMode && (
                <Send className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
            </div>
            ))
          )}
        </div>
      )}
      
      <PaymentAmountDialog
        isOpen={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false)
          setSelectedRecipient(null)
        }}
        onConfirm={processPaymentWithAmount}
        recipient={selectedRecipient}
        isProcessing={isProcessing}
      />
    </div>
  )
}