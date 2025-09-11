import { useState, useRef, useCallback, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useOptimizedSearch } from '@/hooks/use-optimized-search'
import { DisplayableIdentity } from '@/types/identity'
import { User } from 'lucide-react'

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
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { results, search } = useOptimizedSearch({ maxResults: 5 })

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

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart
    
    setText(value)
    
    // Find the last @ before cursor position
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
  }, [search, getCaretCoordinates])

  const insertMention = useCallback((identity: DisplayableIdentity) => {
    if (!textareaRef.current) return
    
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
  }, [text, mentionStart, mentionQuery])

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
        placeholder={placeholder || "Type @ to mention someone..."}
        className={className}
        rows={4}
      />
      
      {showMentions && results.length > 0 && (
        <Card 
          className="fixed bg-background border border-border shadow-lg rounded-lg z-[100] max-h-48 overflow-y-auto w-64"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div className="p-1">
            {results.map((identity, index) => (
              <div
                key={identity.identityKey}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                  index === selectedIndex 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => insertMention(identity)}
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm text-primary-foreground">
                    {identity.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{identity.name}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {identity.abbreviatedKey}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}