import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { PeerPayClient } from '@bsv/message-box-client'
import { WalletClient } from '@bsv/sdk'

interface PeerPayContextType {
  peerPayClient: PeerPayClient | null
}

const PeerPayContext = createContext<PeerPayContextType>({ peerPayClient: null })

export const usePeerPay = () => {
  const context = useContext(PeerPayContext)
  if (!context) {
    throw new Error('usePeerPay must be used within a PeerPayProvider')
  }
  return context
}

interface PeerPayProviderProps {
  children: ReactNode
}

export const PeerPayProvider: React.FC<PeerPayProviderProps> = ({ children }) => {
  const [peerPayClient, setPeerPayClient] = useState<PeerPayClient | null>(null)

  useEffect(() => {
    // Initialize the client once when the provider mounts
    const initializeClient = async () => {
      try {
        const walletClient = new WalletClient()
        const client = new PeerPayClient({
          walletClient
        })
        setPeerPayClient(client)
      } catch (error) {
        console.error('Failed to initialize PeerPayClient:', error)
      }
    }

    initializeClient()

    // Cleanup on unmount
    return () => {
      setPeerPayClient(null)
    }
  }, [])

  return (
    <PeerPayContext.Provider value={{ peerPayClient }}>
      {children}
    </PeerPayContext.Provider>
  )
}