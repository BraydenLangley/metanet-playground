import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { PeerPayClient } from '@bsv/message-box-client'
import { WalletClient } from '@bsv/sdk'

/**
 * Context type for Metanet Playground functionality
 * Provides access to the BSV message box client for payments and identity resolution
 */
interface MetanetPlaygroundContextType {
  metanetClient: PeerPayClient | null
}

// Create context with default values
const MetanetPlaygroundContext = createContext<MetanetPlaygroundContextType>({ metanetClient: null })

/**
 * Hook to access Metanet Playground context
 * Must be used within a MetanetPlaygroundProvider
 */
export const useMetanetPlayground = () => {
  const context = useContext(MetanetPlaygroundContext)
  if (!context) {
    throw new Error('useMetanetPlayground must be used within a MetanetPlaygroundProvider')
  }
  return context
}

interface MetanetPlaygroundProviderProps {
  children: ReactNode
}

/**
 * Provider component for Metanet Playground functionality
 * Initializes the BSV message box client for blockchain interactions
 */
export const MetanetPlaygroundProvider: React.FC<MetanetPlaygroundProviderProps> = ({ children }) => {
  const [metanetClient, setMetanetClient] = useState<PeerPayClient | null>(null)

  useEffect(() => {
    // Initialize the BSV message box client when the provider mounts
    const initializeClient = async () => {
      try {
        const walletClient = new WalletClient()
        const client = new PeerPayClient({
          walletClient
        })
        setMetanetClient(client)
      } catch (error) {
        console.error('Failed to initialize Metanet client:', error)
      }
    }

    initializeClient()

    // Cleanup client on component unmount
    return () => {
      setMetanetClient(null)
    }
  }, [])

  return (
    <MetanetPlaygroundContext.Provider value={{ metanetClient }}>
      {children}
    </MetanetPlaygroundContext.Provider>
  )
}