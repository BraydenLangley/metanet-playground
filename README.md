# Peer Actions Command Kit

The Peer Actions Command Kit packages a production-ready React component that searches MetaNet identities with `@` mentions and executes familiar slash commands against the live MessageBox overlay. It ships with a full demo that connects to [http://messagebox.babbage.systems](http://messagebox.babbage.systems), relays messages over WebSockets, and drives the [`@bsv/message-box-client`](https://www.npmjs.com/package/@bsv/message-box-client) plus `PeerPayClient` without mocks.

## ✨ Highlights

- **Real infrastructure** – Uses `PeerPayClient` + a wallet substrate to reach the public MessageBox host. No simulated responses.
- **Command parsing** – Built-in parser for `/pay`, `/message`, and `/chat` with amount/message defaults and mention resolution.
- **Automatic identity resolution** – Commands fetch MetaNet identity records on-the-fly when a handle hasn't been added yet.
- **WebSocket listeners** – Subscribes to `direct_messages`, `live_chat`, and `payment_inbox` for inbound activity tracking.
- **Identity search** – Demo integrates the `@bsv/identity-react` search API so you can add verified peers on the fly.
- **Reusable component** – Drop `PeerCommandPalette` into any React 18 + Tailwind project and wire it to your own wallet client.

## 📦 Getting started

```bash
# install dependencies
npm install

# run the interactive demo
npm run dev
```

### Prerequisites

- A wallet capable of serving the `@bsv/sdk` `WalletClient('auto')` substrate (e.g. Project Babbage's CWI, Cicada, etc.).
- Network access to [http://messagebox.babbage.systems](http://messagebox.babbage.systems).

Open the Vite dev server (default <http://localhost:5173>) in a browser with a compatible wallet extension. Use the identity search panel to add peers, then trigger commands in the palette to perform live payments, direct messages, and chats.

## 🧱 Component usage

```tsx
import { PeerCommandPalette, type PeerProfile } from 'peer-actions-command-kit'
import { PeerPayClient } from '@bsv/message-box-client'
import { WalletClient } from '@bsv/sdk'

const peers: PeerProfile[] = [
  {
    identityKey: '02abc123…',
    handle: 'satoshi',
    displayName: 'Satoshi Nakamoto'
  }
]

const client = new PeerPayClient({
  walletClient: new WalletClient('auto'),
  messageBoxHost: 'http://messagebox.babbage.systems'
})

export function App () {
  return (
    <PeerCommandPalette
      peers={peers}
      client={client}
      messageBoxHost="http://messagebox.babbage.systems"
      onCommandComplete={entry => console.log(entry)}
    />
  )
}
```

### Supported commands

| Command            | Description                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `/pay @alice 500`  | Generates a live payment token via `PeerPayClient.sendPayment`. Optional trailing text is logged. |
| `/message @bob hi` | Sends a WebSocket message through the `direct_messages` box.                                      |
| `/chat @ty`        | Broadcasts live chat text to the `live_chat` room with socket acknowledgements.                   |

When an amount or message body is omitted, the component falls back to configurable defaults (`defaultPaymentAmount`, `defaultMessageText`, and `defaultChatText`).

### Props

| Prop                   | Type                                                | Default                               | Description                                                                                           |
| ---------------------- | --------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `peers`                | `PeerProfile[]`                                     | —                                     | Directory records displayed in mention suggestions. Unknown handles are resolved automatically.       |
| `client`               | `PeerActionClient`                                  | —                                     | Object implementing `PeerPayClient` methods (`init`, `sendPayment`, `sendMessage`, `sendLiveMessage`). |
| `messageBoxHost`       | `string`                                            | `http://messagebox.babbage.systems`   | Host passed to `init`, message sends, and listener subscriptions.                                     |
| `enableLiveListeners`  | `boolean`                                           | `true`                                | Toggle automatic subscription to `direct_messages`, `live_chat`, and `payment_inbox`.                 |
| `defaultPaymentAmount` | `number`                                            | `500`                                 | Amount of sats used when `/pay` does not specify a value.                                             |
| `defaultMessageText`   | `string`                                            | `Hey there! Let's build something on BSV together.` | Fallback text for `/message`.                                                  |
| `defaultChatText`      | `string`                                            | `Live chat initiated – say hello!`    | Fallback text for `/chat`.                                                     |
| `onCommandComplete`    | `(result: CommandHistoryEntry) => void`             | —                                     | Callback fired after each outbound/inbound event recorded by the component.                           |
| `className`            | `string`                                            | —                                     | Optional additional styles for the root container.                                                    |

## 🧪 Demo front-end

The real demo in `src/App.tsx` provides:

- Live identity search powered by `@bsv/identity-react` with peer management.
- Outbound command and inbound WebSocket activity metrics.
- Real `PeerPayClient` initialised against the public MessageBox host (no stubs or mocks).
- Detailed activity feed showing direction, payload summaries, and timestamps.

Bring your own wallet + peers and the app will execute commands end-to-end.

## 🗂️ Project structure

```
src/
├── App.tsx                  # Demo application wiring, identity search, metrics
├── index.css                # Tailwind theme + component styling helpers
├── lib/
│   ├── index.ts             # Public exports
│   └── peer-command/
│       ├── parser.ts        # Slash command parser utilities
│       ├── PeerCommandPalette.tsx  # Reusable command component with live sockets
│       └── types.ts         # Shared types for peers, history, and client contract
└── main.tsx                 # Vite entry point
```

## 📝 License

Open BSV License
