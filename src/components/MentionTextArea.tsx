import { useState, useRef, useCallback, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useOptimizedSearch } from '@/hooks/use-optimized-search'
import { DisplayableIdentity } from '@/types/identity'
import { User } from 'lucide-react'

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
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { results, search } = useOptimizedSearch({ maxResults: 5 })

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
        
        if (query.length > 0) {
          search(query)
        }
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }, [search])

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
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-48 overflow-y-auto">
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