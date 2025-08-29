import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react'
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
  const clientRef = useRef<PeerPayClient | null>(null)

  useEffect(() => {
    // Initialize the client once when the provider mounts
    const initializeClient = async () => {
      try {
        const walletClient = new WalletClient()
        clientRef.current = new PeerPayClient({
          walletClient
        })
      } catch (error) {
        console.error('Failed to initialize PeerPayClient:', error)
      }
    }

    initializeClient()

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        // PeerPayClient might have cleanup methods in the future
        clientRef.current = null
      }
    }
  }, [])

  return (
    <PeerPayContext.Provider value={{ peerPayClient: clientRef.current }}>
      {children}
    </PeerPayContext.Provider>
  )
}