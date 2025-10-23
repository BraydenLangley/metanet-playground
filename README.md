# Peer Actions Command Kit

The Peer Actions Command Kit packages a fully featured React component for searching MetaNet identities with `@` mentions and triggering familiar slash commands. It also ships with a demo front-end that showcases `/pay`, `/message`, and `/chat` flows wired to the [`@bsv/message-box-client`](https://www.npmjs.com/package/@bsv/message-box-client) API surface.

## ✨ Highlights

- **Installable component** – Import `PeerCommandPalette` and drop it into any React 18 + Tailwind project.
- **Command parsing** – Built-in parser for `/pay`, `/message`, and `/chat` including mention resolution and optional payloads.
- **Peer directory search** – Type `@` to filter peers by handle or display name, complete with keyboard-friendly quick inserts.
- **Action wiring** – Uses the `PeerPayClient` interface to send payments, direct messages, and live chat events.
- **Demo sandbox** – Explore the experience locally with mocked network calls that mimic the real client contract.

## 📦 Getting started

```bash
# install dependencies
npm install

# run the interactive demo
npm run dev
```

Open the dev server (Vite defaults to <http://localhost:5173>) to try the component. The demo uses a simulated `PeerPayClient` that returns success responses without touching the network, making it safe to explore.

## 🧱 Component usage

```tsx
import { PeerCommandPalette, type PeerProfile } from 'peer-actions-command-kit'
import { PeerPayClient } from '@bsv/message-box-client'
import { WalletClient } from '@bsv/sdk'

const peers: PeerProfile[] = [
  {
    identityKey: '0281cf5d2234chance',
    handle: 'chance',
    displayName: 'Chance',
    tagline: 'PeerPay pioneer and Metanet explorer'
  }
]

const client = new PeerPayClient({ walletClient: new WalletClient() })

export function App () {
  return (
    <PeerCommandPalette
      peers={peers}
      client={client}
      defaultPaymentAmount={750}
      onCommandComplete={result => console.log(result)}
    />
  )
}
```

### Supported commands

| Command            | Description                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `/pay @alice 500`  | Sends 500 sats to `@alice` using `PeerPayClient.sendPayment`. Optional trailing text is recorded. |
| `/message @bob hi` | Sends a direct message via `sendMessage` in the `direct_messages` box.                           |
| `/chat @ty`        | Starts a live chat room using `sendLiveMessage` against the `live_chat` box.                     |

When an amount or message body is omitted, the component falls back to configurable defaults (`defaultPaymentAmount`, `defaultMessageText`, and `defaultChatText`).

### Props

| Prop                   | Type                                      | Default | Description                                                                                       |
| ---------------------- | ----------------------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `peers`                | `PeerProfile[]`                           | —       | Directory records displayed in mention suggestions.                                               |
| `client`               | `PeerActionClient`                        | —       | Object implementing `PeerPayClient` methods (`init`, `sendPayment`, `sendMessage`, `sendLiveMessage`). |
| `defaultPaymentAmount` | `number`                                  | `500`   | Amount of sats used when `/pay` does not specify a value.                                         |
| `defaultMessageText`   | `string`                                  | `Hey there! Let's build something on BSV together.` | Fallback text for `/message`.                                                  |
| `defaultChatText`      | `string`                                  | `Live chat initiated – say hello!`         | Fallback text for `/chat`.                                                     |
| `onCommandComplete`    | `(result: CommandExecutionResult) => void`| —       | Callback fired after each action (success or failure).                                            |
| `className`            | `string`                                  | —       | Optional additional styles for the root container.                                                |

## 🧪 Demo front-end

The `src/App.tsx` implementation showcases a polished UX around the shared component:

- Live metrics for executed payments, messages, and chats
- Activity feed reusing `CommandExecutionResult` objects
- Mock `PeerPayClient` subclass that mimics payments/messages/chats with slight delays

Feel free to replace `DemoPeerActionClient` with a real `PeerPayClient` + configured wallet to connect to live infrastructure.

## 🗂️ Project structure

```
src/
├── App.tsx                  # Demo application wiring
├── index.css                # Tailwind theme + component styling helpers
├── lib/
│   ├── index.ts             # Public exports
│   └── peer-command/
│       ├── parser.ts        # Slash command parser utilities
│       ├── PeerCommandPalette.tsx  # Reusable command component
│       └── types.ts         # Shared types for peers, history, and client contract
└── main.tsx                 # Vite entry point
```

## 📝 License

Open BSV License
