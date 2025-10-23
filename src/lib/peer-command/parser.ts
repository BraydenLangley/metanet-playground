import type { ParsedCommand, PeerProfile, PeerCommand } from './types'

const COMMAND_PATTERN = /^\/(pay|message|chat)\s+@([\w.-]+)(?:\s+(.+))?$/i

export interface ParseCommandOptions {
  peers: PeerProfile[]
}

export const formatCommandHint = (command: PeerCommand, handle = 'alice'): string => {
  switch (command) {
    case 'pay':
      return `/pay @${handle} 500`
    case 'message':
      return `/message @${handle} Let's build!`
    case 'chat':
      return `/chat @${handle}`
    default:
      return ''
  }
}

export function parseCommand (input: string, { peers }: ParseCommandOptions): { result?: ParsedCommand, error?: string } {
  const trimmed = input.trim()

  if (trimmed.length === 0) {
    return { error: 'Type a command like /pay @handle 100' }
  }

  const match = COMMAND_PATTERN.exec(trimmed)
  if (match == null) {
    return { error: 'Commands must start with /pay, /message or /chat and include a @handle' }
  }

  const [, commandRaw, handleRaw, remainderRaw] = match
  const command = commandRaw.toLowerCase() as PeerCommand
  const handle = handleRaw.toLowerCase()

  const peer = peers.find(candidate => candidate.handle.toLowerCase() === handle || candidate.identityKey.toLowerCase() === handle)

  if (peer == null) {
    return { error: `No peer found for @${handle}` }
  }

  const remainder = remainderRaw?.trim() ?? ''
  const parsed: ParsedCommand = {
    command,
    peer,
    rawInput: trimmed
  }

  if (command === 'pay') {
    if (remainder.length > 0) {
      const [amountToken, ...noteTokens] = remainder.split(/\s+/)
      const amount = Number.parseInt(amountToken, 10)
      if (Number.isNaN(amount) || amount <= 0) {
        return { error: 'Payment amount must be a positive integer number of sats' }
      }
      parsed.amount = amount
      if (noteTokens.length > 0) {
        parsed.text = noteTokens.join(' ')
      }
    }
  } else {
    if (remainder.length > 0) {
      parsed.text = remainder
    }
  }

  return { result: parsed }
}
