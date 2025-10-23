import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { formatCommandHint, parseCommand } from './parser'
import type {
  CommandExecutionResult,
  CommandHistoryEntry,
  ParsedCommand,
  PeerActionClient,
  PeerCommand,
  PeerProfile
} from './types'

const DIRECT_MESSAGE_BOX = 'direct_messages'
const CHAT_MESSAGE_BOX = 'live_chat'

const defaultMessages: Record<Exclude<PeerCommand, 'pay'>, string> = {
  message: "Hey there! Let's build something on BSV together.",
  chat: 'Live chat initiated – say hello!'
}

const DEFAULT_PAYMENT_AMOUNT = 500

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

export interface PeerCommandPaletteProps {
  peers: PeerProfile[]
  client: PeerActionClient
  /** Used when `/pay` does not contain an explicit amount */
  defaultPaymentAmount?: number
  /** Text injected when `/message` has no trailing text */
  defaultMessageText?: string
  /** Text injected when `/chat` has no trailing text */
  defaultChatText?: string
  /** Called whenever a command successfully executes */
  onCommandComplete?: (result: CommandExecutionResult) => void
  className?: string
}

export function PeerCommandPalette ({
  peers,
  client,
  defaultPaymentAmount = DEFAULT_PAYMENT_AMOUNT,
  defaultMessageText = defaultMessages.message,
  defaultChatText = defaultMessages.chat,
  onCommandComplete,
  className
}: PeerCommandPaletteProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<CommandHistoryEntry[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [hasInitialised, setHasInitialised] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const mentionQuery = useMemo(() => {
    const match = inputValue.match(/@([\w.-]*)$/)
    if (match == null) {
      return ''
    }
    return match[1].toLowerCase()
  }, [inputValue])

  const filteredPeers = useMemo(() => {
    if (mentionQuery.length === 0) {
      return peers
    }
    return peers.filter(peer =>
      peer.handle.toLowerCase().includes(mentionQuery) ||
      peer.displayName.toLowerCase().includes(mentionQuery)
    )
  }, [mentionQuery, peers])

  useEffect(() => {
    if (inputRef.current != null && history.length === 0) {
      inputRef.current.focus()
    }
  }, [history.length])

  const ensureClientInitialised = useCallback(async () => {
    if (hasInitialised) return
    if (typeof client.init === 'function') {
      await client.init()
    }
    setHasInitialised(true)
  }, [client, hasInitialised])

  const appendHistory = useCallback((entry: CommandExecutionResult) => {
    const newEntry: CommandHistoryEntry = {
      ...entry,
      id: createId(),
      timestamp: Date.now()
    }

    setHistory(previous => [newEntry, ...previous].slice(0, 12))
    onCommandComplete?.(entry)
  }, [onCommandComplete])

  const executeCommand = useCallback(async () => {
    const { result, error: parseError } = parseCommand(inputValue, { peers })

    if (parseError != null) {
      setError(parseError)
      return
    }

    const parsed = result as ParsedCommand
    setError(null)
    setIsExecuting(true)

    try {
      await ensureClientInitialised()

      if (parsed.command === 'pay') {
        const amount = parsed.amount ?? defaultPaymentAmount
        if (amount == null || Number.isNaN(amount) || amount <= 0) {
          throw new Error('Provide a positive amount of sats to send')
        }

        const response = await client.sendPayment({
          recipient: parsed.peer.identityKey,
          amount
        })

        const summary = `Sent ${amount} sats to ${parsed.peer.displayName}`
        const details = typeof parsed.text === 'string' ? parsed.text : undefined

        appendHistory({
          status: 'success',
          command: parsed.command,
          peer: parsed.peer,
          summary,
          details,
          metadata: {
            amount,
            response
          }
        })
      } else if (parsed.command === 'message') {
        const body = parsed.text ?? defaultMessageText
        const response = await client.sendMessage({
          recipient: parsed.peer.identityKey,
          messageBox: DIRECT_MESSAGE_BOX,
          body,
          skipEncryption: true
        })

        appendHistory({
          status: 'success',
          command: parsed.command,
          peer: parsed.peer,
          summary: `Message delivered to ${parsed.peer.displayName}`,
          details: body,
          metadata: { response }
        })
      } else {
        const body = parsed.text ?? defaultChatText
        const response = await client.sendLiveMessage({
          recipient: parsed.peer.identityKey,
          messageBox: CHAT_MESSAGE_BOX,
          body,
          skipEncryption: true
        })

        appendHistory({
          status: 'success',
          command: parsed.command,
          peer: parsed.peer,
          summary: `Started live chat with ${parsed.peer.displayName}`,
          details: body,
          metadata: { response }
        })
      }

      setInputValue('')
    } catch (commandError) {
      const message = commandError instanceof Error ? commandError.message : 'Unknown error'
      setError(message)
      appendHistory({
        status: 'error',
        command: parsed.command,
        peer: parsed.peer,
        summary: message,
        details: parsed.rawInput
      })
    } finally {
      setIsExecuting(false)
    }
  }, [appendHistory, client, defaultChatText, defaultMessageText, defaultPaymentAmount, ensureClientInitialised, inputValue, peers])

  const handlePeerInsert = useCallback((peer: PeerProfile) => {
    setInputValue(previous => {
      if (!previous.includes('@')) {
        return `/message @${peer.handle} `
      }

      return previous.replace(/@([\w.-]*)$/, `@${peer.handle} `)
    })
    setError(null)
    inputRef.current?.focus()
  }, [])

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void executeCommand()
  }, [executeCommand])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void executeCommand()
    }
  }, [executeCommand])

  return (
    <section className={clsx('glass-panel p-8 text-slate-100 shadow-slate-950/50', className)}>
      <header className="mb-6 flex flex-col gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300/80">
          MetaNet Actions
        </span>
        <h1 className="text-3xl font-semibold text-white">Interact with peers using commands</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Use the @ symbol to search the directory, then trigger actions with /pay, /message or /chat.
          Amounts default to {defaultPaymentAmount} sats when omitted.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="peer-command-input" className="sr-only">
          Peer command input
        </label>
        <input
          ref={inputRef}
          id="peer-command-input"
          value={inputValue}
          onChange={event => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="/pay @chance 250 or /message @bob Hey there!"
          className="command-input"
          autoComplete="off"
        />
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {(['pay', 'message', 'chat'] as PeerCommand[]).map(command => (
            <button
              key={command}
              type="button"
              onClick={() => setInputValue(formatCommandHint(command, peers[0]?.handle ?? 'alice'))}
              className="rounded-full border border-slate-700/80 bg-slate-900/60 px-3 py-1 font-medium text-slate-300 transition hover:border-indigo-400/70 hover:text-white"
            >
              {formatCommandHint(command, peers[0]?.handle ?? 'alice')}
            </button>
          ))}
        </div>
      </form>

      {mentionQuery.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Suggested peers</p>
          <div className="flex flex-col gap-3">
            {filteredPeers.length === 0 && (
              <p className="text-sm text-slate-400">No peers match "{mentionQuery}".</p>
            )}
            {filteredPeers.slice(0, 5).map(peer => (
              <button
                key={peer.identityKey}
                type="button"
                onClick={() => handlePeerInsert(peer)}
                className="flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 text-left transition hover:border-indigo-400/60 hover:bg-slate-900/80"
              >
                <div className="grid h-12 w-12 place-content-center rounded-2xl bg-indigo-500/20 text-lg font-semibold text-indigo-200">
                  {peer.avatarUrl != null ? (
                    <img
                      src={peer.avatarUrl}
                      alt={peer.displayName}
                      className="h-12 w-12 rounded-2xl object-cover"
                    />
                  ) : (
                    peer.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">
                    {peer.displayName}
                    <span className="ml-2 text-xs font-medium text-indigo-300">@{peer.handle}</span>
                  </span>
                  {peer.tagline != null && (
                    <span className="text-xs text-slate-400">{peer.tagline}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error != null && (
        <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent activity</h2>
          <span className="text-xs uppercase tracking-widest text-slate-500">
            {isExecuting ? 'Processing…' : 'Ready'}
          </span>
        </div>
        {history.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
            No activity yet. Try a command to see the log populate in real time.
          </div>
        ) : (
          <ul className="space-y-3">
            {history.map(entry => (
              <li
                key={entry.id}
                className={clsx(
                  'flex flex-col gap-1 rounded-2xl border px-4 py-3',
                  entry.status === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-rose-500/40 bg-rose-500/10'
                )}
              >
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>
                    /{entry.command} @{entry.peer.handle}
                  </span>
                  <span className="text-xs font-medium text-slate-200/70">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-slate-100">{entry.summary}</p>
                {entry.details != null && (
                  <p className="text-xs text-slate-200/80">{entry.details}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default PeerCommandPalette
