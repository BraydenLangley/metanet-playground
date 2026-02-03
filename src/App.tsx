import { useCallback, useMemo, useState } from 'react'
import type { SyntheticEvent } from 'react'
import type { DisplayableIdentity } from '@bsv/sdk'
import { WalletClient } from '@bsv/sdk'
import { PeerPayClient } from '@bsv/message-box-client'
import { useIdentitySearch } from '@bsv/identity-react'
import type { CommandHistoryEntry, PeerProfile } from './lib'
import { PeerCommandPalette, CertificatePlayground } from './lib'

const MESSAGE_BOX_HOST = 'https://messagebox.babbage.systems'

const createClient = (): PeerPayClient => {
  const walletClient = new WalletClient('auto')
  return new PeerPayClient({
    walletClient,
    messageBoxHost: MESSAGE_BOX_HOST
  })
}

const sanitizeHandle = (base: string): string => {
  const normalized = base
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
  return normalized.length > 0 ? normalized : `peer_${Math.random().toString(36).slice(2, 8)}`
}

export default function App() {
  const [peers, setPeers] = useState<PeerProfile[]>([])
  const [activity, setActivity] = useState<CommandHistoryEntry[]>([])
  const [client] = useState<PeerPayClient>(() => createClient())

  const {
    inputValue: identitySearchValue,
    identities,
    isLoading: isSearching,
    handleInputChange
  } = useIdentitySearch()

  const counts = useMemo(() => {
    return activity.reduce(
      (summary, entry) => {
        summary.total += 1
        if (entry.status === 'success' && entry.direction !== 'inbound') {
          if (entry.command === 'pay') summary.pay += 1
          if (entry.command === 'message') summary.message += 1
          if (entry.command === 'chat') summary.chat += 1
        }
        if (entry.direction === 'inbound') {
          summary.inbound += 1
        }
        return summary
      },
      { total: 0, pay: 0, message: 0, chat: 0, inbound: 0 }
    )
  }, [activity])

  const updateSearchValue = useCallback((value: string) => {
    handleInputChange({} as unknown as SyntheticEvent, value, 'input')
  }, [handleInputChange])

  const ensureUniqueHandle = useCallback((candidate: string) => {
    let handle = candidate
    let suffix = 1
    const existingHandles = new Set(peers.map(peer => peer.handle))
    while (existingHandles.has(handle)) {
      handle = `${candidate}${suffix}`
      suffix += 1
    }
    return handle
  }, [peers])

  const handleIdentityAdd = useCallback((identity: DisplayableIdentity) => {
    const baseHandle = sanitizeHandle(identity.name ?? identity.identityKey.slice(0, 8))
    const uniqueHandle = ensureUniqueHandle(baseHandle)
    const newPeer: PeerProfile = {
      identityKey: identity.identityKey,
      handle: uniqueHandle,
      displayName: identity.name ?? `Peer ${identity.identityKey.slice(0, 8)}`,
      avatarUrl: identity.avatarURL,
      tagline: identity.badgeLabel
    }
    setPeers(previous => {
      const exists = previous.find(peer => peer.identityKey === identity.identityKey)
      if (exists != null) {
        return previous
      }
      return [...previous, newPeer]
    })
  }, [ensureUniqueHandle])

  const handlePeerRemove = useCallback((identityKey: string) => {
    setPeers(previous => previous.filter(peer => peer.identityKey !== identityKey))
  }, [])

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header className="glass-panel relative overflow-hidden px-8 py-10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-emerald-500/10" />
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-300/80">Live Demo</span>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
            Peer actions command kit
          </h1>
          <p className="mt-3 max-w-2xl text-slate-200">
            Connect your wallet, add peers from the MetaNet directory, and trigger <code className="rounded bg-slate-800/80 px-1 py-0.5 text-xs">/pay</code>, <code className="rounded bg-slate-800/80 px-1 py-0.5 text-xs">/message</code>, and <code className="rounded bg-slate-800/80 px-1 py-0.5 text-xs">/chat</code> against the live MessageBox infrastructure at
            {' '}
            <span className="font-semibold text-indigo-200">{MESSAGE_BOX_HOST}</span>.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Total activity</p>
              <p className="mt-2 text-3xl font-semibold text-white">{counts.total}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Outbound payments</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-300">{counts.pay}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Outbound messages &amp; chats</p>
              <p className="mt-2 text-3xl font-semibold text-sky-300">{counts.message + counts.chat}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Inbound events</p>
              <p className="mt-2 text-3xl font-semibold text-indigo-200">{counts.inbound}</p>
            </div>
          </div>
        </header>

        <section className="glass-panel px-8 py-8">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1 space-y-4">
              <h2 className="text-lg font-semibold text-white">Add peers from the identity network</h2>
              <p className="text-sm text-slate-300">
                Search for verified identities to populate the directory used by the command palette. Selecting an identity stores the
                handle locally so you can quickly address them with the <code className="rounded bg-slate-900/80 px-1 py-0.5 text-xs">@</code> mention syntax.
              </p>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400" htmlFor="identity-search-input">
                Identity search
              </label>
              <input
                id="identity-search-input"
                value={identitySearchValue}
                onChange={event => updateSearchValue(event.target.value)}
                placeholder="Search for peers by name, handle, or identity key"
                className="command-input"
              />
              <div className="space-y-2">
                {isSearching && (
                  <div className="text-xs text-slate-400">Searching directory…</div>
                )}
                {!isSearching && identitySearchValue.length > 0 && identities.length === 0 && (
                  <div className="text-xs text-slate-400">No identities match "{identitySearchValue}" yet.</div>
                )}
                {identities.slice(0, 5).map(identity => (
                  <button
                    key={identity.identityKey}
                    type="button"
                    onClick={() => handleIdentityAdd(identity)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 text-left transition hover:border-indigo-400/60 hover:bg-slate-900/80"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{identity.name}</span>
                      <span className="text-xs text-slate-400">{identity.identityKey}</span>
                    </div>
                    <span className="rounded-full border border-indigo-400/60 px-3 py-1 text-xs font-semibold text-indigo-200">
                      Add peer
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <h2 className="text-lg font-semibold text-white">Active peer directory</h2>
              <p className="text-sm text-slate-300">
                These peers appear in the mention suggestions. Remove entries with the <code className="rounded bg-slate-900/80 px-1 py-0.5 text-xs">×</code> button if they are no longer needed.
              </p>
              {peers.length === 0 ? (
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 text-sm text-slate-400">
                  Use the search panel to add your first peer. Commands require a mapped handle to resolve the correct identity key.
                </div>
              ) : (
                <ul className="space-y-3">
                  {peers.map(peer => (
                    <li key={peer.identityKey} className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {peer.displayName}
                          <span className="ml-2 text-xs font-medium text-indigo-300">@{peer.handle}</span>
                        </p>
                        <p className="text-xs text-slate-400">{peer.identityKey}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePeerRemove(peer.identityKey)}
                        className="rounded-full border border-rose-500/50 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10"
                        aria-label={`Remove ${peer.displayName}`}
                      >
                        × Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <PeerCommandPalette
          peers={peers}
          client={client}
          onCommandComplete={result => setActivity(previous => [result, ...previous])}
          messageBoxHost={MESSAGE_BOX_HOST}
        />

        <CertificatePlayground />

        <section className="glass-panel px-8 py-8">
          <h2 className="text-xl font-semibold text-white">Command and live activity</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Every outbound command and inbound live event is captured below. Use this feed to verify socket connectivity, payment token delivery, and direct message flows.
          </p>
          {activity.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
              Add at least one peer, then try <span className="font-semibold text-indigo-200">/pay @handle 1000</span>, <span className="font-semibold text-indigo-200">/message @handle Hello!</span> or <span className="font-semibold text-indigo-200">/chat @handle</span>.
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {activity.slice(0, 10).map((entry, index) => (
                <li key={`${entry.command}-${entry.timestamp}-${index}`} className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-white">
                    <span>
                      /{entry.command} @{entry.peer.handle}
                      <span className="ml-2 text-xs font-medium text-slate-400">{entry.direction === 'inbound' ? 'Inbound' : 'Outbound'}</span>
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(entry.timestamp ?? Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-100">{entry.summary}</p>
                  {entry.details != null && (
                    <p className="mt-1 break-words text-xs text-slate-300">{entry.details}</p>
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
