import { useMemo, useState } from 'react'
import type { CommandExecutionResult, PeerProfile } from './lib'
import { PeerCommandPalette } from './lib'
import { PeerPayClient, type PaymentParams, type SendMessageParams, type SendMessageResponse } from '@bsv/message-box-client'
import { WalletClient } from '@bsv/sdk'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

class DemoPeerActionClient extends PeerPayClient {
  constructor () {
    super({ walletClient: new WalletClient() })
  }

  override async init (): Promise<void> {
    // Skip remote initialization inside the demo while preserving the public API surface
    return
  }

  override async sendPayment (payment: PaymentParams): Promise<SendMessageResponse> {
    await delay(350)
    return {
      status: 'success',
      messageId: `demo-payment-${payment.recipient}-${Date.now()}`
    }
  }

  override async sendMessage (params: SendMessageParams): Promise<SendMessageResponse> {
    await delay(250)
    return {
      status: 'success',
      messageId: `demo-message-${params.recipient}-${Date.now()}`
    }
  }

  override async sendLiveMessage (params: SendMessageParams): Promise<SendMessageResponse> {
    await delay(250)
    return {
      status: 'success',
      messageId: `demo-chat-${params.recipient}-${Date.now()}`
    }
  }
}

const directory: PeerProfile[] = [
  {
    identityKey: '0281cf5d2234chance',
    handle: 'chance',
    displayName: 'Chance',
    tagline: 'PeerPay pioneer and Metanet explorer'
  },
  {
    identityKey: '03b0bff9a12bbob',
    handle: 'bob',
    displayName: 'Bob',
    tagline: 'Message box maintainer and community mod'
  },
  {
    identityKey: '0325aa71583etty',
    handle: 'ty',
    displayName: 'Ty',
    tagline: 'Live chat host who never sleeps'
  },
  {
    identityKey: '03f2c0ffee9aalice',
    handle: 'alice',
    displayName: 'Alice',
    tagline: 'Payment tester and QA legend'
  }
]

export default function App () {
  const client = useMemo(() => new DemoPeerActionClient(), [])
  const [activity, setActivity] = useState<CommandExecutionResult[]>([])

  const counts = useMemo(() => {
    return activity.reduce(
      (summary, entry) => {
        summary.total += 1
        if (entry.status === 'success') {
          if (entry.command === 'pay') summary.pay += 1
          if (entry.command === 'message') summary.message += 1
          if (entry.command === 'chat') summary.chat += 1
        }
        return summary
      },
      { total: 0, pay: 0, message: 0, chat: 0 }
    )
  }, [activity])

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header className="glass-panel relative overflow-hidden px-8 py-10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-emerald-500/10" />
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-300/80">Demo Experience</span>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
            Peer Actions command kit
          </h1>
          <p className="mt-3 max-w-2xl text-slate-200">
            This interactive sandbox showcases the reusable React component exported from this repository. Type <code className="rounded bg-slate-800/80 px-1 py-0.5 text-xs">@</code> to browse the peer directory and use <code className="rounded bg-slate-800/80 px-1 py-0.5 text-xs">/pay</code>, <code className="rounded bg-slate-800/80 px-1 py-0.5 text-xs">/message</code> or <code className="rounded bg-slate-800/80 px-1 py-0.5 text-xs">/chat</code> to trigger fully wired actions.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Total commands</p>
              <p className="mt-2 text-3xl font-semibold text-white">{counts.total}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Payments sent</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-300">{counts.pay}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Messages &amp; chats</p>
              <p className="mt-2 text-3xl font-semibold text-sky-300">{counts.message + counts.chat}</p>
            </div>
          </div>
        </header>

        <PeerCommandPalette
          peers={directory}
          client={client}
          onCommandComplete={result => setActivity(previous => [result, ...previous])}
        />

        <section className="glass-panel px-8 py-8">
          <h2 className="text-xl font-semibold text-white">Demo output</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            When you trigger commands above, the simulated client responds instantly. This panel mirrors the
            stream of <code className="rounded bg-slate-800/80 px-1 py-0.5 text-xs">CommandExecutionResult</code> objects that your application can consume to hook into analytics, notifications or any other workflow.
          </p>
          {activity.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
              Try <span className="font-semibold text-indigo-200">/pay @chance 1000</span>, <span className="font-semibold text-indigo-200">/message @bob Sup?</span> or <span className="font-semibold text-indigo-200">/chat @ty</span> to populate the feed.
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {activity.slice(0, 6).map(entry => (
                <li key={`${entry.command}-${entry.timestamp}`} className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-white">
                    <span>
                      /{entry.command} @{entry.peer.handle}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-100">{entry.summary}</p>
                  {entry.details != null && (
                    <p className="mt-1 text-xs text-slate-300">{entry.details}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
