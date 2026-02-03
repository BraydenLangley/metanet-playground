import type { PaymentParams, PeerMessage, SendMessageParams, SendMessageResponse } from '@bsv/message-box-client'

export type PeerCommand = 'pay' | 'message' | 'chat'

export interface PeerProfile {
  /** Unique identifier for the peer */
  identityKey: string
  /** Short handle used after the @ symbol */
  handle: string
  /** Friendly display name shown in the UI */
  displayName: string
  /** Optional description rendered under the peer entry */
  tagline?: string
  /** Optional URL pointing to an avatar image */
  avatarUrl?: string
  /** Common tags or capabilities for filtering */
  tags?: string[]
}

export interface ParsedCommand {
  command: PeerCommand
  /** Handle extracted from the command */
  handle: string
  /** Resolved peer when available in the local directory */
  peer?: PeerProfile
  /** Optional sats amount parsed from the command for `/pay` */
  amount?: number
  /** Optional free-form text parsed from `/message` or `/chat` */
  text?: string
  rawInput: string
}

export interface CommandExecutionResult {
  status: 'success' | 'error'
  command: PeerCommand
  peer: PeerProfile
  summary: string
  details?: string
  metadata?: Record<string, unknown>
  direction?: 'outbound' | 'inbound'
}

export type CommandHistoryEntry = CommandExecutionResult & {
  id: string
  timestamp: number
}

export interface PeerActionClient {
  /** Optionally initialise the underlying client */
  init?: (host?: string) => Promise<void>
  sendPayment: (payment: PaymentParams, hostOverride?: string) => Promise<unknown>
  sendMessage: (params: SendMessageParams, hostOverride?: string) => Promise<SendMessageResponse>
  sendLiveMessage: (params: SendMessageParams, hostOverride?: string) => Promise<SendMessageResponse>
  listenForLiveMessages?: (config: { messageBox: string, onMessage: (message: PeerMessage) => void, overrideHost?: string }) => Promise<void>
  leaveRoom?: (messageBox: string) => Promise<void>
  disconnectWebSocket?: () => Promise<void>
}
