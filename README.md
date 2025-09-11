# Metanet Playground

A simple web application for experimenting with identity mentions and instant payments on the BSV blockchain. Built with React and powered by the BSV SDK, this playground demonstrates the potential of blockchain-based social interactions and micropayments.

## 🚀 Features

- **Identity Mentions**: Type `@` to search and mention any identity on the BSV network
- **Instant Payments**: Use `/pay @user` to send BSV payments directly through the interface
- **Real-time Search**: Optimized identity search with intelligent caching
- **Beautiful UI**: Modern, responsive design with dark/light mode support
- **Blockchain Integration**: Direct integration with BSV blockchain through message box client

## 🛠 Technology Stack

This project is built with modern web technologies and BSV blockchain integration:

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Components**: shadcn/ui component library
- **Styling**: Tailwind CSS with custom design system
- **BSV Integration**: 
  - `@bsv/sdk` - Core BSV blockchain functionality
  - `@bsv/message-box-client` - Payment and messaging capabilities
  - `@bsv/identity-react` - Identity resolution and management
  - `@bsv/uhrp-react` - UHRP protocol support
- **State Management**: React Query for server state
- **Routing**: React Router for navigation

## 🎮 How to Use

1. **Mention Identities**: Type `@` followed by a name or key to search for BSV identities
2. **Send Payments**: Use the command `/pay @username` to initiate a payment
3. **Interactive UI**: Click on search results to select identities or confirm payments
4. **Amount Selection**: Choose from quick amounts (100, 500, 1000, 5000 sats) or enter custom amounts

## 🏃‍♂️ Development Setup

### Prerequisites
- Node.js (recommended: install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or yarn package manager

### Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd metanet-playground

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080` with hot-reloading enabled.

## 📦 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── MentionTextArea.tsx    # Main interaction component
│   ├── PaymentAmountDialog.tsx # Payment amount input
│   └── PaymentForm.tsx        # Payment processing form
├── contexts/           # React contexts
│   └── MetanetPlaygroundContext.tsx # BSV client management
├── hooks/              # Custom React hooks
│   ├── use-optimized-search.ts # Identity search with caching
│   └── use-toast.ts           # Toast notifications
├── lib/                # Utility libraries
│   ├── search-cache.ts # Search result caching
│   └── utils.ts        # General utilities
├── pages/              # Page components
│   ├── Index.tsx       # Main playground interface
│   └── NotFound.tsx    # 404 page
└── types/              # TypeScript type definitions
    └── identity.ts     # Identity-related types
```

## 🚀 Deployment

### Using Lovable Platform
1. Open the [Lovable Project](https://lovable.dev/projects/52ecab21-93f9-4951-9abc-3440768f2968)
2. Click **Share** → **Publish**
3. Your app will be deployed instantly with a shareable URL

### Custom Domain
To connect your own domain:
1. Navigate to **Project** → **Settings** → **Domains** in Lovable
2. Click **Connect Domain** and follow the setup instructions

Learn more: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 🔧 Development Options

### Option 1: Use Lovable (Recommended)
Visit the [Lovable Project](https://lovable.dev/projects/52ecab21-93f9-4951-9abc-3440768f2968) and start making changes through AI-powered prompting. All changes are automatically committed to the repository.

### Option 2: Local Development
Clone this repository and develop using your preferred IDE. Push changes to automatically sync with Lovable.

### Option 3: GitHub Integration
- **Direct Editing**: Edit files directly in GitHub's web interface
- **Codespaces**: Use GitHub Codespaces for a full cloud development environment

## 🔗 Links

- **Project URL**: https://lovable.dev/projects/52ecab21-93f9-4951-9abc-3440768f2968
- **BSV Documentation**: https://docs.bsv.tools/
- **Lovable Docs**: https://docs.lovable.dev/

## 📝 License

This project is part of the BSV blockchain ecosystem and demonstrates practical applications of blockchain technology for social interactions and micropayments.
