import type { CertificateResult } from '@bsv/sdk'

export interface CertificateSizeAnalysis {
  totalBytes: number
  fieldSizes: Record<string, number>
  signatureBytes: number
  metadataBytes: number
  keyringBytes: number
  breakdown: {
    label: string
    bytes: number
    percentage: number
  }[]
}

export interface TransportConstraints {
  name: string
  maxBytes: number
  description: string
  icon: string
}

export interface OptimizationSuggestion {
  type: 'warning' | 'info' | 'success'
  title: string
  description: string
  potentialSavings?: number
}

export interface CertificateWithAnalysis {
  certificate: CertificateResult
  analysis: CertificateSizeAnalysis
  transportFit: {
    transport: TransportConstraints
    fits: boolean
    overageBytes: number
  }[]
  optimizations: OptimizationSuggestion[]
}

export const TRANSPORT_CONSTRAINTS: TransportConstraints[] = [
  {
    name: 'NFC (NDEF)',
    maxBytes: 137, // Type 1 Tag
    description: 'NFC Forum Type 1 Tag - Minimal capacity',
    icon: '📱'
  },
  {
    name: 'NFC (Type 2)',
    maxBytes: 504, // Type 2 Tag typical
    description: 'NFC Forum Type 2 Tag - Standard NTAG213/215',
    icon: '📲'
  },
  {
    name: 'NFC (Type 4)',
    maxBytes: 4096, // Type 4 Tag
    description: 'NFC Forum Type 4 Tag - Higher capacity',
    icon: '💳'
  },
  {
    name: 'QR Code (L)',
    maxBytes: 2953, // Version 40-L binary
    description: 'QR Code Version 40 with Low error correction',
    icon: '📷'
  },
  {
    name: 'QR Code (M)',
    maxBytes: 2331, // Version 40-M binary
    description: 'QR Code Version 40 with Medium error correction',
    icon: '📷'
  },
  {
    name: 'Bluetooth LE',
    maxBytes: 512, // Typical BLE payload
    description: 'Bluetooth Low Energy single packet',
    icon: '📡'
  },
  {
    name: 'URL (Base64)',
    maxBytes: 2000, // Safe URL length
    description: 'URL-safe base64 encoded in query string',
    icon: '🔗'
  }
]
